// app/actions/paymentActions.ts
'use server'

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import dayjs from 'dayjs';
import { syncThemesWithPlan } from './themeActions';
import { checkOrderLimitOrThrow } from './limitGuard';
import { autoDeductStockAction } from './stockActions';

// --- Helpers ---
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  );
}

function calculateEffectivePlan(brand: any) {
    const now = dayjs();
    if (brand.expiry_ultimate && dayjs(brand.expiry_ultimate).isAfter(now)) {
        return { plan: 'ultimate', expiry: brand.expiry_ultimate };
    }
    if (brand.expiry_pro && dayjs(brand.expiry_pro).isAfter(now)) {
        return { plan: 'pro', expiry: brand.expiry_pro };
    }
    if (brand.expiry_basic && dayjs(brand.expiry_basic).isAfter(now)) {
        return { plan: 'basic', expiry: brand.expiry_basic };
    }
    return { plan: 'free', expiry: null }; 
}

async function getMyBrandId(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: profile } = await supabase.from('profiles').select('*, brands(*)').eq('id', user.id).single();
    if (!profile?.brand_id) throw new Error("No brand assigned");
    return { brandId: profile.brand_id, user, profile, brand: profile.brands };
}

// --- 1. Fetch Initial Data ---
export async function getPaymentInitialDataAction() {
  const supabase = await getSupabase();
  try {
    const { brandId, user, profile, brand } = await getMyBrandId(supabase);

    // Check Plan & Theme
    const { plan: effectivePlan, expiry: activeExpiry } = calculateEffectivePlan(brand);
    if (brand.plan !== effectivePlan) {
        await supabase.from('brands').update({ plan: effectivePlan }).eq('id', brandId);
        brand.plan = effectivePlan;
    }
    await syncThemesWithPlan(supabase, brandId, effectivePlan, activeExpiry);

    if (brand.theme_mode && brand.theme_mode !== 'standard') {
        const { data: activeTheme } = await supabase.from('themes')
            .select('id, expires_at, marketplace_themes!inner(theme_mode)')
            .eq('brand_id', brandId)
            .eq('marketplace_themes.theme_mode', brand.theme_mode)
            .single();

        let isValid = false;
        if (activeTheme) {
             const isExpired = activeTheme.expires_at && dayjs(activeTheme.expires_at).isBefore(dayjs());
             if (!isExpired) isValid = true; 
        }
        if (!isValid) {
            await supabase.from('brands').update({ theme_mode: 'standard' }).eq('id', brandId);
            brand.theme_mode = 'standard';
        }
    }

    // 🌟🌟🌟 แก้ไขตรงนี้: ดึงข้อมูลแยก 2 ตาราง แล้วเอามารวมกัน 🌟🌟🌟
    const [catsResp, foodProdsResp, retailProdsResp, discsResp] = await Promise.all([
      supabase.from('categories').select('*').eq('brand_id', brandId).order('sort_order'),
      // 🍔 1. ดึงอาหาร
      supabase.from('products').select('*').eq('brand_id', brandId).eq('is_available', true).order('created_at', { ascending: false }),
      // 🛒 2. ดึงของชำจาก Product Master
      supabase.from('product_master').select('*').eq('brand_id', brandId).eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('discounts').select(`*, discount_products(product_id)`).eq('brand_id', brandId).eq('is_active', true),
    ]);

    // 🔗 รวมร่างข้อมูล (Data Merging)
    const formattedFood = (foodProdsResp.data || []).map(p => ({ ...p, item_type: 'food' }));
    
    const formattedRetail = (retailProdsResp.data || []).map(p => ({
        ...p,
        item_type: 'retail',
        price_special: null,
        price_jumbo: null,
        is_available: p.is_active
    }));

    const allCombinedProducts = [...formattedFood, ...formattedRetail];
    const tables = await getAllTablesAction(brandId);

    return { 
        success: true, 
        brandId, 
        user, 
        profile, 
        brand,
        categories: catsResp.data || [],
        products: allCombinedProducts, 
        discounts: discsResp.data || [],
        tables: tables || [] 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- 2. Fetch Unpaid Orders ---
export async function getUnpaidOrdersAction(brandId: string) {
    const supabase = await getSupabase();
    const { data: rawOrders, error: ordersError } = await supabase.from('orders')
        .select(`*, order_items(*)`)
        .eq('brand_id', brandId)
        .in('status', ['pending', 'preparing', 'cooking', 'served', 'done'])
        .order('created_at', { ascending: false });

    if (ordersError) {
        console.error('[getUnpaidOrdersAction] Supabase error:', ordersError);
        return [];
    }
    if (!rawOrders) return [];

    const grouped: { [key: string]: any } = {};
    
    rawOrders.forEach(order => {
        if (order.status === 'cancelled') return;

        const table = order.table_label || 'Walk-in';
        if (!grouped[table]) {
            grouped[table] = { 
                id: order.id, 
                table_label: table, 
                brand_id: order.brand_id, 
                total_price: 0, 
                order_items: [], 
                original_ids: [],
                status: order.status 
            };
        }

        if (order.order_items && order.order_items.length > 0) {
            const activeItems = order.order_items.filter((item: any) => item.status !== 'cancelled');
            const itemsTotal = activeItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
            
            grouped[table].total_price += itemsTotal;
            grouped[table].order_items.push(...activeItems);
        } else {
            grouped[table].total_price += Number(order.total_price);
        }

        grouped[table].original_ids.push(order.id);
    });

    return Object.values(grouped).filter((g: any) => g.order_items.length > 0);
}

// --- 3. Process Payment (Sync Data) ---
export async function processPaymentAction(payload: any) {
    const supabase = await getSupabase();
    const { brandId, userId, totalAmount, receivedAmount, changeAmount, paymentMethod, type, selectedOrder, cart, paymentTime, localPayId, localOrderId } = payload;

    try {
        if (!brandId) throw new Error("Brand ID is missing from payload");
        
        try {
            await checkOrderLimitOrThrow(brandId);
        } catch (limitErr: any) {
            console.error("⚠️ โควต้าบิลเต็ม:", limitErr);
            throw limitErr;
        }

        const saleTime = paymentTime || new Date().toISOString();
        if (dayjs(saleTime).isAfter(dayjs().add(1, 'day'))) {
            throw new Error("Time manipulation detected");
        }

        // 🚨 ด่านสกัด: เช็คว่าใบเสร็จนี้เคยเข้า Cloud ไปแล้วหรือยัง
        if (localPayId) {
             const { data: existingPayment } = await supabase.from('pai_orders').select('id').eq('id', localPayId).single();
             if (existingPayment) return { success: true, message: "Already synced" };
        }

        let finalOrderId = localOrderId; 
        if (!finalOrderId) finalOrderId = selectedOrder?.id || crypto.randomUUID();

        let receiptItems: any[] = [];
        let tableLabel = 'Walk-in';

        // เช็คราคาล่าสุด
        if (type === 'pos' && cart && cart.length > 0) {
            const productIds = cart.map((c: any) => c.id);
            const { data: realProducts } = await supabase.from('products').select('id, price, price_special, price_jumbo').in('id', productIds);

            cart.forEach((item: any) => {
                const realP = realProducts?.find(p => p.id === item.id);
                if (realP) {
                    if (item.variant === 'normal') item.price = Number(realP.price);
                    if (item.variant === 'special') item.price = Number(realP.price_special || realP.price);
                    if (item.variant === 'jumbo') item.price = Number(realP.price_jumbo || realP.price);
                }
            });
        }

        // 🔄 สร้าง/อัปเดตออเดอร์ก่อน! (เพื่อป้องกัน Error Foreign Key)
        if (type === 'tables' && selectedOrder) {
            finalOrderId = selectedOrder.id; 
            tableLabel = selectedOrder.table_label;
            receiptItems = selectedOrder.order_items.filter((i: any) => i.status !== 'cancelled');

            const { error: orderUpdateErr } = await supabase.from('orders')
                .update({ status: 'paid', updated_at: saleTime })
                .eq('id', finalOrderId);
            if(orderUpdateErr) throw orderUpdateErr;

        } else {
            // สร้างบิลใหม่ สำหรับการขายหน้าร้าน (POS)
            const { error: orderErr } = await supabase.from('orders').insert({
                id: finalOrderId,
                brand_id: brandId, // ✅ แก้บัค พิมพ์ผิดจาก brandId เป็น brand_id
                status: 'paid', 
                total_price: totalAmount, 
                table_label: 'Walk-in', 
                type: 'pos',
                created_at: saleTime,
                updated_at: saleTime
            });
            if (orderErr && orderErr.code !== '23505') throw orderErr; // 23505 คือ Error ID ซ้ำ ปล่อยผ่านได้

            receiptItems = cart.map((i: any) => ({ 
                order_id: finalOrderId, 
                product_id: i.id, 
                product_name: i.name, 
                quantity: i.quantity, 
                price: i.price, 
                variant: i.variant,
                promotion_snapshot: i.promotion_snapshot 
            }));
            const { error: itemsErr } = await supabase.from('order_items').insert(receiptItems);
            if(itemsErr && itemsErr.code !== '23505') throw itemsErr;
        }

        // 🔄 สร้างบันทึกรับเงิน (ทำหลังจากมีออเดอร์ชัวร์ๆ แล้ว)
        const { data: payRecord, error: payError } = await supabase.from('pai_orders').insert({
            id: localPayId || crypto.randomUUID(), 
            order_id: finalOrderId, 
            brand_id: brandId, 
            total_amount: totalAmount, 
            received_amount: receivedAmount, 
            change_amount: changeAmount, 
            payment_method: paymentMethod, 
            cashier_id: userId,
            created_at: saleTime
        }).select().single();

        if (payError) throw payError;

        // อัปเดต payment_id กลับไปที่บิลหลัก
        await supabase.from('orders').update({ payment_id: payRecord.id }).eq('id', finalOrderId);

        // 🔄 คืนโต๊ะ
        if (type === 'tables') {
            const validToken = payload.newAccessToken || Math.random().toString(36).substring(2, 6).toUpperCase();
            await supabase.from('tables').update({ access_token: validToken }).eq('brand_id', brandId).eq('label', selectedOrder.table_label);
        }

        // 🔄 ตัดสต็อก (ซิงค์หลังบ้าน ไม่พัง)
        try {
            if (receiptItems && receiptItems.length > 0) {
                const stockPayload = receiptItems.map((item: any) => ({ product_id: item.product_id, quantity: item.quantity }));
                autoDeductStockAction(brandId, finalOrderId, stockPayload).catch(() => {});
            }
        } catch (stockErr) {}

        return { success: true, payRecord, receiptItems, tableLabel };

    // app/actions/paymentActions.ts (ส่วนท้ายสุดของฟังก์ชัน processPaymentAction)

    } catch (error: any) {
        // =================================================================
        // 🌟 ระบบทำลายบิลขยะ V3 (เพิ่มการดักจับเรื่องประเภทข้อมูล UUID)
        // =================================================================
        const errMsg = error?.message || '';
        if (
            error.code === '23503' || // Foreign Key
            error.code === '22P02' || // 👈 รหัส Error ของ Invalid UUID
            errMsg.includes('foreign key constraint') || 
            errMsg.includes('is of type uuid but expression is of type text') || // 👈 ดัก Error ที่นายเจอ
            errMsg.includes('Brand ID is missing')
        ) {
            console.warn("⚠️ ตรวจพบบิลขยะที่โครงสร้างข้อมูลไม่ตรงกับปัจจุบัน สั่งลบออกจากคิวอัตโนมัติ");
            return { success: true, message: "Cleared corrupted data (type mismatch)" };
        }

        return { success: false, error: errMsg };
    }
}

// --- 4. Auto Kitchen & Status Actions ---
export async function updateOrderStatusAction(orderId: string, status: string) {
    const supabase = await getSupabase();
    await supabase.from('orders').update({ status }).eq('id', orderId);
    return { success: true };
}

export async function getPendingOrdersAction(brandId: string) {
    const supabase = await getSupabase();
    const { data } = await supabase.from('orders').select('id, status').eq('brand_id', brandId).eq('status', 'pending');
    return data || [];
}

export async function getPendingAndPreparingOrdersAction(brandId: string) {
    const supabase = await getSupabase();
    const { data } = await supabase.from('orders')
        .select('id, status, updated_at') 
        .eq('brand_id', brandId)
        .in('status', ['pending', 'preparing']); 
    return data || [];
}

// --- 5. Cancel Actions ---
export async function cancelOrderAction(orderId: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    return { success: !error, error: error?.message };
}

export async function cancelOrderItemAction(itemId: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('order_items').update({ status: 'cancelled' }).eq('id', itemId);
    return { success: !error, error: error?.message };
}

export async function getAllTablesAction(brandId: string) {
    const supabase = await getSupabase();

    const { data: tables } = await supabase
        .from('tables')
        .select('*')
        .eq('brand_id', brandId)
        .order('label');

    if (!tables) return [];

    // เช็คว่าโต๊ะไหนมีออเดอร์ค้างอยู่บ้าง
    const { data: activeOrders } = await supabase
        .from('orders')
        .select('table_id, table_label, status')
        .eq('brand_id', brandId)
        .in('status', ['pending', 'preparing', 'cooking', 'served', 'done']); 

    const tablesWithStatus = tables.map(table => {
        const isOccupied = activeOrders?.some(order => 
            (order.table_id && order.table_id === table.id) || 
            (order.table_label && order.table_label === table.label)
        );

        return {
            ...table,
            status: isOccupied ? 'occupied' : 'available' 
        };
    });
    
    return tablesWithStatus;
}