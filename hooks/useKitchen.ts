import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// ลบ import { supabase } from '@/lib/supabase'; ออกเพราะเราไม่ใช้ Realtime แล้ว
import { 
    restoreOrderItemAction, 
    getKitchenOrdersAction, 
    updateOrderStatusAction, 
    cancelOrderAction,      
    cancelOrderItemAction   
} from '@/app/actions/kitchenActions';

export function useKitchen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    
    // State สำหรับ Auto Accept
    const [autoAccept, setAutoAccept] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // State เช็คว่าเสียงพร้อมใช้งานหรือยัง
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    
    const autoAcceptRef = useRef(autoAccept);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ✅ สร้าง Audio Object รอไว้
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/alert.mp3');
        }
    }, []);

    // ✅ ฟังก์ชันเล่นเสียง
    const playSound = useCallback(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        audio.volume = 1.0;
        audio.currentTime = 0;
        audio.play().catch(err => console.warn("Audio blocked:", err));
    }, []);

    // ✅ ฟังก์ชันปลดล็อกเสียง
    const unlockAudio = () => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        
        audio.volume = 0.0; 
        audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1.0; 
            setIsAudioUnlocked(true); 
        }).catch(err => {
            console.error("Unlock failed:", err);
        });
    };

    // ✅ Toggle Auto Accept
    const toggleAutoAccept = () => {
        setAutoAccept(prev => !prev);
    };

    // --- Init & LocalStorage ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('kitchen_auto_accept');
            if (saved === 'true') {
                setAutoAccept(true);
                autoAcceptRef.current = true;
            }
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (!isInitialized) return;
        autoAcceptRef.current = autoAccept;
        if (typeof window !== 'undefined') {
            localStorage.setItem('kitchen_auto_accept', String(autoAccept));
        }
    }, [autoAccept, isInitialized]);

    // --- โหลดข้อมูลออเดอร์ ---
    const fetchOrders = useCallback(async () => {
        const result = await getKitchenOrdersAction();
        if (result.success) setOrders(result.data || []);
        setLoading(false);
    }, []);

    // ตอนเปิดหน้าเว็บครั้งแรก ให้ดึงข้อมูล 1 ครั้ง (ลบ Realtime ทิ้งไปแล้ว)
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ==========================================================
    // 🌟 ฟังก์ชันหลักสำหรับ FCM (แทนที่ Realtime) มีด่านกักเสียง
    // ==========================================================
    const fetchAndProcessKitchenOrders = useCallback(async (payload?: any) => {
        console.log("⚡ [Kitchen] สัญญาณ FCM เข้า!", JSON.stringify(payload));

        const msgType = payload?.data?.type || payload?.type || '';
        const msgTitle = payload?.data?.title || payload?.notification?.title || '';
        const msgBody = payload?.data?.message || payload?.data?.body || '';

        // 🛑 ด่านกักเสียง: เช็คว่าเป็นคำสั่งเคลียร์โต๊ะ หรืออัปเดตสถานะเฉยๆ ไหม
        if (
            msgType === 'SILENT_UPDATE' || 
            msgType === 'ANDROID_REFRESH' || 
            msgTitle.includes('อัปเดต') || 
            msgBody.includes('อัปเดต')
        ) {
            console.log("🔄 [Kitchen] อัปเดตสถานะเงียบๆ: โหลดข้อมูลใหม่ (ไม่ส่งเสียง)");
            await fetchOrders(); // แค่รีเฟรชจอให้ข้อมูลอัปเดต
            return; // หยุดการทำงาน ไม่ให้ลงไปเปิดเสียง หรือ Auto Accept
        }

        // ==========================================================
        // 🔔 ถ้าเป็นออเดอร์ใหม่จริงๆ จะทำงานตรงนี้
        // ==========================================================
        console.log("🔔 [Kitchen] ออเดอร์ใหม่! เล่นเสียงและตรวจสอบ Auto Accept...");
        playSound();

        // โหลดข้อมูลล่าสุดจาก Cloud
        const result = await getKitchenOrdersAction();
        if (result.success && result.data) {
            const currentOrders = result.data;
            setOrders(currentOrders); // อัปเดตหน้าจอทันที

            // 🤖 ระบบ Auto Accept (รับออเดอร์อัตโนมัติ)
            if (autoAcceptRef.current) {
                let hasUpdated = false;
                for (const order of currentOrders) {
                    if (order.status === 'pending') {
                        await updateOrderStatusAction(order.id, 'preparing');
                        console.log(`✅ [Kitchen] Auto Accepted: ${order.id}`);
                        hasUpdated = true;
                    }
                }
                // ถ้าระบบจัดการรับออเดอร์ไปแล้ว ให้ดึงข้อมูลมาวาดใหม่อีกรอบ
                if (hasUpdated) {
                    await fetchOrders();
                }
            }
        }
    }, [fetchOrders, playSound]);

    // --- Handlers (เหมือนเดิม) ---
    const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
        if (nextStatus === 'done') {
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } else {
             setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
        }
        await updateOrderStatusAction(orderId, nextStatus);
        fetchOrders();
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("ต้องการยกเลิกออเดอร์นี้ทั้งหมดใช่หรือไม่?")) return;
        setOrders(prev => prev.filter(o => o.id !== orderId));
        await cancelOrderAction(orderId);
        fetchOrders();
    };

    const handleCancelItem = async (orderId: string, itemId: string) => {
        if (!confirm("ต้องการยกเลิกรายการสินค้านี้ใช่หรือไม่?")) return;
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return {
                    ...o,
                    order_items: o.order_items.map((i: any) => 
                        i.id === itemId ? { ...i, status: 'cancelled' } : i
                    )
                };
            }
            return o;
        }));
        await cancelOrderItemAction(itemId);
    };

    const handleRestoreItem = async (orderId: string, itemId: string) => {
        if (!confirm("ต้องการกู้คืนรายการนี้ใช่หรือไม่?")) return;
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return {
                    ...o,
                    order_items: o.order_items.map((i: any) => 
                        i.id === itemId ? { ...i, status: 'active' } : i
                    )
                };
            }
            return o;
        }));
        await restoreOrderItemAction(itemId);
    };

    const filteredOrders = useMemo(() => {
        return (orders || []).filter(o => {
            const statusMatch = o.status === activeTab;
            const tableLabel = o.table_label || '';
            const searchMatch = tableLabel.toLowerCase().includes(searchTerm.toLowerCase());
            return statusMatch && searchMatch;
        });
    }, [orders, activeTab, searchTerm]);

    return {
        orders, filteredOrders, loading, 
        activeTab, setActiveTab,
        searchTerm, setSearchTerm, 
        handleUpdateStatus, fetchOrders,
        autoAccept, toggleAutoAccept,
        handleCancelOrder, handleCancelItem, handleRestoreItem,
        unlockAudio, 
        isAudioUnlocked,
        fetchAndProcessKitchenOrders // ✅ โยนฟังก์ชันนี้ออกไปให้หน้า Page ใช้งาน
    };
}