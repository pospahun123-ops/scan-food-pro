'use client';

import { useState, useEffect } from 'react';
import { useKitchen } from '@/hooks/useKitchen';
import { useFcmToken } from '@/hooks/useFcmToken';
// 🌟 นำเข้า Module Modal ที่เราเพิ่งสร้าง
import KitchenTicketModal from './components/KitchenTicketModal'; 

// --- Icons ---
const IconChef = ({ size = 28 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20" /><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" /><path d="m4 8 16-4" /><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.55a2 2 0 0 1 2.43 1.46l.45 1.8" /></svg>;
const IconZap = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const IconVolume2 = ({ size = 24 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>;
const IconTrash = ({ size = 16 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconUndo = ({ size = 16 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>;
const IconNote = ({ size = 16, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconAlertTriangle = ({ size = 24 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconSearch = ({ size = 20 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconPrinter = ({ size = 20 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;

import { cancelOrderAction, cancelOrderItemAction, restoreOrderItemAction } from '@/app/actions/kitchenActions';
import { supabase } from '@/lib/supabase';

export default function KitchenPage() {
    const { 
        filteredOrders, orders, activeTab, setActiveTab, 
        searchTerm, setSearchTerm, handleUpdateStatus,
        autoAccept, toggleAutoAccept, 
        unlockAudio, isAudioUnlocked, fetchOrders,
        fetchAndProcessKitchenOrders 
    } = useKitchen();

    const [userId, setUserId] = useState<string | undefined>(undefined);
    // 🌟 State สำหรับเก็บออเดอร์ที่จะส่งไปให้ Modal ปริ้น
    const [printOrder, setPrintOrder] = useState<any>(null);
    
    useEffect(() => {
        const getProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) setUserId(session.user.id);
        };
        getProfile();
    }, []);

    useFcmToken(userId, (payload: any) => {
        console.log("📢 [Kitchen] สัญญาณ FCM เข้า!", payload);
        try {
            fetchAndProcessKitchenOrders(payload);
        } catch (e) {
            console.warn("Kitchen FCM Handler Error:", e);
        }
    });

    const [showSoundGuard, setShowSoundGuard] = useState(true);
    
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        type: 'cancel_order' | 'cancel_item' | 'restore_item';
        title: string;
        message: string;
        data: any;
    }>({ show: false, type: 'cancel_order', title: '', message: '', data: null });

    useEffect(() => {
        if (isAudioUnlocked) setShowSoundGuard(false);
        else setShowSoundGuard(true);
    }, [isAudioUnlocked]);

    const handleStartWork = () => {
        unlockAudio(); 
        setShowSoundGuard(false);
    };

    // ==========================================================
    // 🖨️ ฟังก์ชันสั่งพิมพ์ (แยกการทำงานระหว่าง Android กับ Web)
    // ==========================================================
    const handlePrintTicket = (order: any) => {
        if (typeof window !== 'undefined' && (window as any).AndroidBridge) {
            console.log("📱 [Android] สั่งปริ้นใบออเดอร์ครัว โต๊ะ:", order.table_label);
            try {
                // 🌟 ทำการ map ข้อมูลให้คลีนและปลอดภัยที่สุด ห้ามมี null หรือ undefined หลุดไป
                const safeItems = (order.order_items || []).map((item: any) => {
                    return {
                        name: String(item.product_name || "ไม่ระบุชื่ออาหาร"),
                        qty: Number(item.quantity || 1),
                        variant: String(item.variant || ""),
                        note: String(item.note || ""),
                        isCancelled: Boolean(item.status === 'cancelled')
                    };
                });

                const printData = {
                    tableName: String(order.table_label || "ไม่ระบุ"),
                    time: new Date().toLocaleString('th-TH', { 
                        hour: '2-digit', minute: '2-digit', second: '2-digit' 
                    }),
                    orderId: String((order.id || "").slice(0, 8)),
                    items: safeItems // โยน Array ที่คลีนแล้วเข้าไป
                };
                
                // ตรวจสอบข้อมูลก่อนยิงไป Android ว่าถูกต้องไหม
                console.log("Data to print:", JSON.stringify(printData));

                // สั่งพิมพ์ผ่าน Bridge
                (window as any).AndroidBridge.printKitchenTicket(JSON.stringify(printData));

            } catch (err) {
                console.error("❌ [Android] Print error:", err);
                alert("เกิดข้อผิดพลาดในการรวบรวมข้อมูลก่อนปริ้น");
            }

        } else {
            console.log("💻 [Web] เปิดหน้าต่างปริ้น โต๊ะ:", order.table_label);
            setPrintOrder(order); 
        }
    };
    const requestCancelOrder = (orderId: string) => {
        setConfirmModal({ show: true, type: 'cancel_order', title: 'ยกเลิกออเดอร์นี้?', message: 'คุณต้องการยกเลิกทั้งบิลนี้ใช่หรือไม่?', data: { orderId } });
    };

    const requestCancelItem = (orderId: string, itemId: string, productName: string) => {
        setConfirmModal({ show: true, type: 'cancel_item', title: 'ยกเลิกรายการอาหาร?', message: `ต้องการยกเลิกเมนู "${productName}" ใช่หรือไม่?`, data: { orderId, itemId } });
    };

    const requestRestoreItem = (orderId: string, itemId: string, productName: string) => {
        setConfirmModal({ show: true, type: 'restore_item', title: 'กู้คืนรายการ?', message: `ต้องการนำเมนู "${productName}" กลับมาใช่หรือไม่?`, data: { orderId, itemId } });
    };

    const onConfirmAction = async () => {
        const { type, data } = confirmModal;
        setConfirmModal({ ...confirmModal, show: false });

        if (type === 'cancel_order') {
            await cancelOrderAction(data.orderId);
        } else if (type === 'cancel_item') {
            await cancelOrderItemAction(data.itemId);
        } else if (type === 'restore_item') {
            await restoreOrderItemAction(data.itemId);
        }
        
        await fetchOrders(); 
        
        try {
            if (orders.length > 0) {
                const brandId = orders[0].brand_id;
                fetch('/api/send-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        brandId: brandId, 
                        message: 'อัปเดตสถานะจากครัว',
                        type: 'SILENT_UPDATE', 
                        title: 'อัปเดตหน้าจอ'
                    })
                });
            }
        } catch (e) {
            console.error("FCM Update Failed", e);
        }
    };

    const statusConfig: any = {
        pending: { label: 'รอรับออเดอร์', badge: 'bg-amber-100 text-amber-700', next: 'preparing', btn: 'bg-slate-900', btnText: 'รับออเดอร์' },
        preparing: { label: 'กำลังทำ', badge: 'bg-blue-100 text-blue-700', next: 'done', btn: 'bg-green-600', btnText: 'เสร็จแล้ว' }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-32 md:p-6">
            
            <style jsx>{`
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(249, 115, 22, 0); }
                    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
                }
                .pulse-btn { animation: pulse-ring 2s infinite; }
            `}</style>

            {/* Modal Sound Guard */}
            {showSoundGuard && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300 px-4">
                    <div className="flex flex-col items-center justify-center p-6 w-full max-w-sm text-center bg-slate-800 rounded-3xl border border-slate-700">
                        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-orange-500/50 pulse-btn">
                            <IconVolume2 size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">ระบบครัวพร้อมทำงาน</h2>
                        <p className="text-slate-400 mb-8 font-medium text-sm">กดปุ่มเพื่อเริ่มรับออเดอร์และเปิดเสียงแจ้งเตือน</p>
                        <button onClick={handleStartWork} className="w-full py-4 bg-white text-orange-600 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2">
                            <IconZap className="fill-orange-600 w-5 h-5" /> เริ่มทำงาน
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200 p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[320px] overflow-hidden">
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                confirmModal.type === 'restore_item' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {confirmModal.type === 'restore_item' ? <IconUndo size={32} /> : <IconAlertTriangle size={32} />}
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">{confirmModal.title}</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">{confirmModal.message}</p>
                        </div>
                        <div className="p-3 bg-slate-50 border-t flex gap-3">
                            <button onClick={() => setConfirmModal({ ...confirmModal, show: false })} className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm">
                                ยกเลิก
                            </button>
                            <button onClick={onConfirmAction} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 text-sm ${
                                confirmModal.type === 'restore_item' ? 'bg-blue-600' : 'bg-red-600'
                            }`}>
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800">
                            <IconChef size={24} className="md:w-8 md:h-8" /> 
                            <span>ครัว</span>
                        </h1>
                        <button onClick={toggleAutoAccept} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${autoAccept ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>
                            <div className={`w-8 h-5 rounded-full p-0.5 transition-colors flex items-center ${autoAccept ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${autoAccept ? 'translate-x-3' : 'translate-x-0'}`} />
                            </div>
                            <span className="font-bold text-xs flex items-center gap-1">
                                Auto <span className="hidden sm:inline">Accept</span>
                            </span>
                        </button>
                    </div>

                    <div className="relative w-full md:w-auto md:min-w-[300px]">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <IconSearch size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="ค้นหาเบอร์โต๊ะ..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-slate-900/10 outline-none text-base placeholder:text-slate-400" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6 md:flex md:gap-3">
                    {['pending', 'preparing'].map((tab) => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)} 
                            className={`flex flex-col items-center justify-center md:flex-row md:gap-2 px-2 py-3 rounded-xl text-sm font-black transition-all ${
                                activeTab === tab ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' : 'bg-white text-slate-500 border border-slate-100'
                            }`}
                        >
                            <span>{statusConfig[tab].label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 md:mt-0 ${
                                activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {orders.filter(o => o.status === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredOrders.length === 0 ? (
                        <div className="col-span-full py-12 md:py-20 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                <IconChef size={32} />
                            </div>
                            <p className="text-slate-400 font-bold">ไม่มีรายการในสถานะนี้</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order.id} className="bg-white rounded-[24px] border border-slate-200 flex flex-col overflow-hidden shadow-sm hover:shadow-xl transition-all relative group h-fit">
                                
                                {/* Card Header */}
                                <div className="p-4 bg-slate-50/80 border-b flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg md:text-xl shadow-md">
                                            {order.table_label}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">โต๊ะ (Table)</span>
                                            <span className={`text-[10px] font-black w-fit px-2 py-0.5 rounded ${statusConfig[order.status].badge}`}>
                                                {statusConfig[order.status].label}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handlePrintTicket(order)} 
                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 flex items-center justify-center transition-all shadow-sm active:scale-90"
                                            title="พิมพ์ใบสั่งอาหาร"
                                        >
                                            <IconPrinter size={18} />
                                        </button>
                                        <button 
                                            onClick={() => requestCancelOrder(order.id)} 
                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 flex items-center justify-center transition-all shadow-sm active:scale-90"
                                            title="ลบบิล"
                                        >
                                            <IconTrash size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Order Items List */}
                                <div className="p-4 flex-1 flex flex-col gap-2">
                                    {order.order_items?.length === 0 ? (
                                        <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                            <p className="text-slate-300 text-xs">รายการถูกยกเลิกหมดแล้ว</p>
                                        </div>
                                    ) : (
                                        order.order_items?.map((item: any) => (
                                            <div key={item.id} className={`flex justify-between items-start border-b border-dashed border-slate-100 last:border-0 pb-3 last:pb-0 transition-all ${
                                                item.status === 'cancelled' ? 'opacity-50 bg-slate-50 -mx-4 px-4 py-2' : ''
                                            }`}>
                                                <div className="flex flex-col w-full pr-2">
                                                    <div className="flex gap-2 font-bold text-slate-700 items-start">
                                                        <span className="text-slate-400 min-w-[20px] pt-0.5 text-sm">{item.quantity}x</span>
                                                        <div className="flex flex-col w-full">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className={`leading-tight text-sm ${item.status === 'cancelled' ? 'line-through decoration-2 decoration-rose-300' : ''}`}>
                                                                    {item.product_name}
                                                                </span>
                                                                {item.variant !== 'normal' && (
                                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">
                                                                        {item.variant}
                                                                    </span>
                                                                )}
                                                                {item.status === 'cancelled' && (
                                                                    <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold">
                                                                        ยกเลิก
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.note && (
                                                                <div className={`mt-1.5 text-xs font-medium p-2 rounded-lg flex items-start gap-1.5 ${
                                                                    item.status === 'cancelled' ? 'bg-slate-100 text-slate-400' : 'text-rose-700 bg-rose-50 border border-rose-100'
                                                                }`}>
                                                                    <IconNote size={14} className="mt-0.5 shrink-0 opacity-70" />
                                                                    <span className="break-words">{item.note}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {item.status === 'cancelled' ? (
                                                    <button onClick={() => requestRestoreItem(order.id, item.id, item.product_name)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all shrink-0 active:scale-90">
                                                        <IconUndo size={16} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => requestCancelItem(order.id, item.id, item.product_name)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-all shrink-0 active:scale-90 opacity-100">
                                                        <IconTrash size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 border-t mt-auto">
                                    {order.order_items?.filter((i: any) => i.status !== 'cancelled').length > 0 ? (
                                        <button onClick={async () => {
                                            await handleUpdateStatus(order.id, statusConfig[order.status].next);
                                            try {
                                                fetch('/api/send-notification', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ 
                                                        brandId: order.brand_id, 
                                                        message: 'อัปเดตสถานะจากครัว',
                                                        type: 'SILENT_UPDATE', 
                                                        title: 'อัปเดตหน้าจอ'
                                                    })
                                                });
                                            } catch (e) {
                                                console.error("Failed to notify POS:", e);
                                            }
                                        }} className={`w-full ${statusConfig[order.status].btn} text-white py-3.5 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2`}>
                                            <span>{statusConfig[order.status].btnText}</span>
                                            <IconZap className="w-5 h-5 fill-white/20" />
                                        </button>
                                    ) : (
                                        <button onClick={() => requestCancelOrder(order.id)} className="w-full bg-white border-2 border-slate-200 text-slate-400 py-3.5 rounded-xl font-bold hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95 text-sm">
                                            ปิดบิลนี้ (Empty)
                                        </button>
                                    )}
                                </div>

                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 🌟 เรียกใช้ Modal ปริ้นบิลตรงนี้ */}
            <KitchenTicketModal order={printOrder} onClose={() => setPrintOrder(null)} />

        </div>
    );
}