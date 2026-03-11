import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

    // 🌟 1. เพิ่มตัวนี้เพื่อคอยจำว่าออเดอร์ที่มีบนจอตอนนี้มีอะไรบ้าง จะได้เช็คได้ว่าอันไหนของใหม่
    const ordersRef = useRef<any[]>([]); 

    useEffect(() => {
        ordersRef.current = orders; // อัปเดตข้อมูลเก็บไว้ทุกครั้งที่หน้าจอเปลี่ยน
    }, [orders]);

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

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ==========================================================
    // 🌟 ฟังก์ชันหลักสำหรับ FCM มีด่านกักเสียง + 🖨️ Auto Print
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
            console.log("🔄 [Kitchen] อัปเดตสถานะเงียบๆ: โหลดข้อมูลใหม่ (ไม่ส่งเสียง ไม่ปริ้น)");
            await fetchOrders(); 
            return; 
        }

        console.log("🔔 [Kitchen] ออเดอร์ใหม่! เล่นเสียงและตรวจสอบ Auto Print & Auto Accept...");
        playSound();

        // โหลดข้อมูลล่าสุดจาก Cloud
        const result = await getKitchenOrdersAction();
        if (result.success && result.data) {
            const currentOrders = result.data;
            const previousOrders = ordersRef.current;

            // 🌟 หาว่าออเดอร์ไหนเป็น "ของใหม่" (มีใน current แต่ไม่มีใน previous)
            const newOrders = currentOrders.filter((newOrder: any) => 
                !previousOrders.some((oldOrder: any) => oldOrder.id === newOrder.id)
            );

            setOrders(currentOrders); // อัปเดตหน้าจอทันที

            // ==========================================================
            // 🖨️ ระบบ Auto Print (ปริ้นอัตโนมัติเฉพาะออเดอร์ใหม่)
            // ==========================================================
            newOrders.forEach(order => {
                if (typeof window !== 'undefined' && (window as any).AndroidBridge) {
                    console.log("🖨️ [Auto Print] กำลังสั่งปริ้นออเดอร์ใหม่ โต๊ะ:", order.table_label);
                    try {
                        const safeItems = (order.order_items || []).map((item: any) => ({
                            name: String(item.product_name || "ไม่ระบุชื่ออาหาร"),
                            qty: Number(item.quantity || 1),
                            variant: String(item.variant || ""),
                            note: String(item.note || ""),
                            isCancelled: Boolean(item.status === 'cancelled')
                        }));

                        const printData = {
                            tableName: String(order.table_label || "ไม่ระบุ"),
                            time: new Date().toLocaleString('th-TH', { 
                                hour: '2-digit', minute: '2-digit', second: '2-digit' 
                            }),
                            orderId: String((order.id || "").slice(0, 8)),
                            items: safeItems
                        };

                        // สั่งยิงไปที่ Android
                        (window as any).AndroidBridge.printKitchenTicket(JSON.stringify(printData));
                    } catch (err) {
                        console.error("❌ [Auto Print] Error:", err);
                    }
                }
            });

            // ==========================================================
            // 🤖 ระบบ Auto Accept (รับออเดอร์อัตโนมัติ)
            // ==========================================================
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