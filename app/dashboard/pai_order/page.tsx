//app/dashboard/pai_order/page.tsx
'use client';
import { useFcmToken } from '@/hooks/useFcmToken';
import React, { useState, useEffect, useRef } from 'react';
import { usePayment } from '@/hooks/usePayment';
import { 
    IconWallet, IconReceipt, IconGrid, IconTrash, 
    IconCheckCircle, IconAlertCircle, IconQrcode 
} from './components/Icons';
import ReceiptModal from './components/ReceiptModal';
import TableQrModal from '../(owner)/tables/TableQrModal'; 
import { useRouter } from 'next/navigation';
import KitchenTicketModal from './components/KitchenTicketModal';
// --- Icons (Styled) ---
const IconZap = ({ size = 20, className = "" }: any) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

const IconLock = ({ size = 20, className = "" }: any) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconPlusSmall = ({ size = 16, className = "" }: any) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const IconBackspace = ({ size = 24 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
);
// ✅ เพิ่มไอคอนลำโพง
const IconVolume2 = ({ size = 24 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);

export default function PaymentPage() {
    
    const {
        activeTab, setActiveTab, loading, 
        autoKitchen, setAutoKitchen,
        categories, products, unpaidOrders, allTables,
        selectedCategory, setSelectedCategory,
        calculatePrice,
        cart, selectedOrder, setSelectedOrder,
        receivedAmount, setReceivedAmount,
        paymentMethod, setPaymentMethod,
        payableAmount, rawTotal,
        variantModalProduct, setVariantModalProduct,
        statusModal, setStatusModal,
        completedReceipt, setCompletedReceipt,
        qrTableData, setQrTableData,
        
        showTableSelector, setShowTableSelector,
        currentBrand,
        getFullImageUrl, handleSelectTableForQR, handleProductClick,
        addToCart, removeFromCart, handlePayment, formatCurrency,
        limitStatus,
        refreshTables,

    toggleAutoKitchen, 
    isAudioUnlocked,
    unlockAudio,
    
    // ✅ เพิ่ม 3 ตัวนี้ต่อท้ายสุด เพื่อเอาไปให้ FCM สั่งงาน
    currentUser,
    
        fetchAndProcessOrders, // <--- ใช้ตัวนี้แทน
        playSound,
        kitchenOrder,
        setKitchenOrder
    } = usePayment();

    // ✅✅✅ [แทรกก้อนนี้เข้าไปตรงนี้เลยครับ!]
    // ✅✅✅ [แทรกก้อนนี้เข้าไปตรงนี้เลยครับ!]
    useFcmToken(currentUser?.id, (payload: any) => { // 🌟 1. รับ payload เข้ามา
        console.log("📢 สัญญาณ FCM เข้า! โหลดข้อมูลและเช็กออเดอร์...", payload);
        
        try {
            // ดึงประเภทของการแจ้งเตือนออกมาเช็ค
            const msgType = payload?.data?.type || payload?.type || '';
            const msgTitle = payload?.data?.title || payload?.notification?.title || '';

            // ส่ง payload ไปให้เครื่องจักรหลักเช็คด้วย
            fetchAndProcessOrders(payload); 
            refreshTables(); 

            // 🌟 2. ด่านกักเสียง: เช็คก่อนว่าใช่การอัปเดตเงียบไหม ค่อยสั่งเล่นเสียง
            if (msgType === 'SILENT_UPDATE' || msgType === 'ANDROID_REFRESH' || msgTitle.includes('อัปเดต')) {
                console.log("🔇 เงียบ: ไม่ส่งเสียงเพราะเป็นการเคลียร์โต๊ะ");
            } else {
                playSound(); // 🔔 เล่นเสียงเฉพาะกรณีที่เป็นออเดอร์ใหม่จริงๆ
            }

        } catch (e) {
            console.warn("FCM Handler Error (อาจเกิดจาก Autoplay blocked):", e);
        }
    });
    // ==========================================
    // ==========================================

    const [showMobileCart, setShowMobileCart] = useState(false);
    // --- State ---
    // --- State ---
    const [showCashModal, setShowCashModal] = useState(false);

    // ✅ State สำหรับ Popup ขออนุญาตเปิดเสียง (Sound Guard)
    // เริ่มต้นเป็น true เสมอ เพื่อบังคับให้กด
  
    
    // --- Refs for Auto Scroll ---
    const itemsRef = useRef<{[key: number]: HTMLDivElement | null}>({});
    const prevItemsRef = useRef<any[]>([]);

    const isLimitReached = limitStatus?.isLocked;
    // 🌟 ดึง Logic ตัวตึงมาใช้: สร้าง URL โลโก้แบบ Dynamic รองรับหลายสาขา
    const getCorrectQrLogo = () => {
        if (!currentBrand?.qr_image_url || !currentBrand?.id) return null;
        const CDN = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://img.pos-foodscan.com";
        let finalLogo = currentBrand.qr_image_url;

        if (finalLogo.includes('supabase.co')) {
            const fileName = finalLogo.split('/').pop();
            return `${CDN}/${currentBrand.id}/${fileName}`;
        } else if (!finalLogo.startsWith('http')) {
            const cleanPath = finalLogo.replace(/^\/+/, '');
            if (cleanPath.startsWith(currentBrand.id)) {
                return `${CDN}/${cleanPath}`;
            } else {
                return `${CDN}/${currentBrand.id}/${cleanPath}`;
            }
        }
        return finalLogo;
    };
    const usageText = limitStatus ? `${limitStatus.usage}/${limitStatus.limit}` : '';
    const router = useRouter();
    const showSoundGuard = autoKitchen && !isAudioUnlocked;

    // --- Effects ---

    // 1. Lock Body Scroll
    // ✅ เพิ่ม showSoundGuard เข้าไปในเงื่อนไขด้วย
    useEffect(() => {
        const isModalOpen = showTableSelector || showCashModal || variantModalProduct || statusModal.show || completedReceipt || qrTableData || showSoundGuard;

        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showTableSelector, showCashModal, variantModalProduct, statusModal.show, completedReceipt, qrTableData, showSoundGuard]);
    useEffect(() => {
        if (showTableSelector) {
            refreshTables();
        }
    }, [showTableSelector, refreshTables]);

    // 2. Auto Scroll & Bounce Logic (เหมือนเดิม)
useEffect(() => {
        // ✅ เพิ่มบรรทัดนี้: ถ้าหน้าจอกว้างน้อยกว่า 1024px (มือถือ/แท็บเล็ตแนวตั้ง) ให้ข้ามการทำงานไปเลย ไม่ต้อง Scroll
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return;

        const currentItems = activeTab === 'tables' ? (selectedOrder?.order_items || []) : cart;
        const prevItems = prevItemsRef.current;
        let changedIndex = -1;
        
        if (currentItems.length > prevItems.length) {
            changedIndex = currentItems.length - 1;
        } else if (currentItems.length === prevItems.length) {
            changedIndex = currentItems.findIndex((item: any, i: number) => 
                item.quantity !== prevItems[i]?.quantity
            );
        }

        if (changedIndex !== -1 && itemsRef.current[changedIndex]) {
            setTimeout(() => {
                // ✅ เพิ่ม option { block: 'nearest' } แทน center เพื่อลดการกระโดด ถ้าคุณยังอยากให้มันเลื่อนนิดหน่อยใน PC
                itemsRef.current[changedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 50);
        }
        prevItemsRef.current = currentItems;
    }, [cart, selectedOrder, activeTab]);
    

    // --- Handlers ---
    
    // ✅ ฟังก์ชันปลดล็อกเสียง


    const handleNumPad = (value: number | string) => {
        // ... (เหมือนเดิม)
        if (value === 'C') {
            setReceivedAmount(0);
        } else if (value === 'DEL') {
            const currentString = receivedAmount.toString();
            if (currentString.length > 1) {
                setReceivedAmount(parseInt(currentString.slice(0, -1)) || 0);
            } else {
                setReceivedAmount(0);
            }
        } else {
            if (receivedAmount === 0 && value === 0) return;
            const newValue = parseInt(`${receivedAmount}${value}`);
            setReceivedAmount(newValue);
        }
    };

    // แก้ไขฟังก์ชันนี้ใน PaymentPage.tsx

const onMainPaymentClick = () => {
        // ✅✅✅ [เพิ่มบรรทัดนี้ครับ] สั่งปิดตะกร้ามือถือก่อนเลย เพื่อให้เห็น Modal จ่ายเงิน
        setShowMobileCart(false);

        // ✅ 1. เช็คลิมิตก่อนเป็นอันดับแรก
        if (isLimitReached) {
            setStatusModal({
                show: true,
                type: 'alert',
                title: 'อัปเกรดเพื่อใช้งานต่อ',
                message: `แพ็กเกจฟรีจำกัด ${usageText} ออเดอร์ \nกรุณาอัปเกรดแพ็กเกจเพื่อรับออเดอร์เพิ่มครับ`,
            });
            return; // สั่งจบการทำงานตรงนี้ ไม่ให้ไปทำต่อ
        }

        // ✅ 2. ถ้าลิมิตยังไม่เต็ม ค่อยแยกทางไปจ่ายเงิน
        if (paymentMethod === 'promptpay') {
            // เปิด Modal QR Code สำหรับจ่ายเงิน (ไม่ใช่ Alert Upgrade)
            setStatusModal({
                show: true,
                type: 'qrcode', // ต้องเป็น type นี้เพื่อแสดง QR
                title: 'สแกนจ่ายเงิน',
                message: '',
            });
        } else {
            // เปิด Modal เงินสด
            setReceivedAmount(0); 
            setShowCashModal(true);
        }
    };
const confirmCashPayment = async () => {
    try {
        // 1. เช็คยอดเงินก่อน (แปลงเป็น Number เพื่อความชัวร์)
        if (Number(receivedAmount) < Number(payableAmount)) {
            alert("ยอดเงินที่รับมาไม่เพียงพอ");
            return;
        }

        // ✅ 2. บรรทัดนี้สำคัญที่สุด! ต้องเรียก handlePayment() เพื่อบันทึกลง Database
        // ฟังก์ชันนี้จะจัดการทุกอย่าง (ตัดสต็อก, บันทึกยอด, เคลียร์ตะกร้า)
        await handlePayment();

        // 3. ปิดหน้าต่างรับเงินสด
        setShowCashModal(false);
        
    } catch (error) {
        console.error("Cash Payment Error:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
};

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-4 md:p-6 font-sans pb-24 md:pb-6 text-slate-800 h-screen overflow-hidden">
            
            {/* CSS Animation */}
            <style jsx>{`
                @keyframes pop-bounce {
                    0% { transform: scale(0.9); opacity: 0; }
                    60% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pop-item {
                    animation: pop-bounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                /* Animation สำหรับ Sound Guard */
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(249, 115, 22, 0); }
                    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
                }
                .pulse-btn {
                    animation: pulse-ring 2s infinite;
                }
            `}</style>

            {/* ===================== SOUND GUARD MODAL ===================== */}
            {showSoundGuard && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex flex-col items-center justify-center p-8 max-w-md text-center">
                        <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-orange-500/50 pulse-btn">
                            <IconVolume2 size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">ระบบ Auto Kitchen</h2>
                        <p className="text-slate-300 mb-8 text-lg font-medium">
                            กดปุ่มเพื่อเริ่มทำงานและเปิดเสียงแจ้งเตือนอัตโนมัติ
                        </p>
                        <button 
                            onClick={unlockAudio} // ✅✅✅ แก้แล้วครับ ใช้ unlockAudio ตรงๆ เลย
                            className="px-10 py-4 bg-white text-orange-600 rounded-[24px] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-900/20 flex items-center gap-3"
                        >
                            <IconZap size={24} className="fill-orange-600" />
                            เริ่มทำงาน
                        </button>
                    </div>
                </div>
            )}
            {/* ========================================================== */}

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-3rem)]">
                
                {/* ... (เนื้อหาเดิมทั้งหมด ตั้งแต่ Left Side Menu ไปจนจบ) ... */}
                {/* ================= LEFT SIDE: MENU & TABLES ================= */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-5 h-full overflow-hidden pb-20 lg:pb-0">
                    
                    {/* Top Bar */}
                    <div className="flex gap-4 shrink-0 h-[4.5rem]">
                        <div className="bg-white p-1.5 rounded-[20px] shadow-sm border border-slate-100 flex flex-1 items-center">
                            <button 
                                onClick={() => { setActiveTab('tables'); setSelectedOrder(null); }} 
                                className={`flex-1 h-full rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm md:text-base ${activeTab === 'tables' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                <IconReceipt size={18} /> <span className="hidden sm:inline">โต๊ะ & รายการ</span> 
                                {unpaidOrders.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unpaidOrders.length}</span>}
                            </button>
                            <button 
                                onClick={() => { setActiveTab('pos'); setSelectedOrder(null); }} 
                                className={`flex-1 h-full rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm md:text-base ${activeTab === 'pos' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                <IconGrid size={18} /> POS 
                            </button>
                        </div>

                        <div className="flex gap-3 h-full">
                            <button 
    onClick={toggleAutoKitchen} // ✅ แก้ตรงนี้จุดเดียว
    className={`h-full aspect-square rounded-[20px] shadow-sm flex items-center justify-center transition-all border ${
        autoKitchen 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-100' 
        : 'bg-white border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-400'
    }`}
    title="Auto Kitchen Print"
>
    <IconZap size={22} className={autoKitchen ? 'fill-current' : ''} />
</button>

                            <button
                                onClick={() => {
                                    if (isLimitReached) {
                                        setStatusModal({
                                            show: true,
                                            type: 'alert', 
                                            title: 'อัปเกรดเพื่อใช้งานต่อ',
                                            message: `แพ็กเกจฟรีจำกัด ${usageText} ออเดอร์ \nกรุณาอัปเกรดแพ็กเกจเพื่อรับออเดอร์เพิ่มครับ`,
                                        });
                                        return;
                                    }
                                    setShowTableSelector(true);
                                }}
                                className={`
                                    h-full aspect-square rounded-[20px] shadow-sm flex flex-col items-center justify-center transition-all border relative group
                                    ${isLimitReached
                                        ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 cursor-pointer'
                                        : 'bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-md'
                                    }
                                `}
                            >
                                {isLimitReached ? <IconLock size={20} /> : <IconQrcode size={22} />}
                                {isLimitReached && (
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-bounce border border-white">!</span>
                                )}
                                {limitStatus?.plan === 'free' && (
                                    <span className="text-[9px] font-bold mt-0.5 opacity-60">
                                        {limitStatus.usage}/{limitStatus.limit}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                   {/* Content */}
<div className="bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-1 flex flex-col overflow-hidden relative">
    {activeTab === 'tables' ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FCFCFD]">
            {unpaidOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 opacity-50">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100"><IconReceipt size={40} /></div>
                    <p className="font-semibold text-sm uppercase tracking-wider">ไม่มีรายการค้างชำระ</p>
                </div>
            )}
            {unpaidOrders.map((o, i) => (
                <button 
                    key={i} 
                    onClick={() => { setSelectedOrder(o); setReceivedAmount(0); }} 
                    className={`w-full p-5 rounded-[24px] border flex justify-between items-center transition-all duration-200 group relative overflow-hidden
                    ${selectedOrder?.table_label === o.table_label 
                        ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-100 ring-1 ring-orange-500' 
                        : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center gap-4 z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-colors ${selectedOrder?.table_label === o.table_label ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {o.table_label.replace('โต๊ะ ', '')}
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-lg text-slate-800">โต๊ะ {o.table_label}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-wide">{o.order_items?.length || 0} ITEMS</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-xs text-slate-400">Waiting Payment</span>
                            </div>
                        </div>
                    </div>
                    <p className="font-black text-xl text-slate-700 group-hover:text-orange-600 transition-colors z-10">{formatCurrency(o.total_price)}</p>
                    {selectedOrder?.table_label === o.table_label && <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none"><IconReceipt size={120} /></div>}
                </button>
            ))}
        </div>
    ) : (
        <div className="flex flex-col h-full bg-[#FCFCFD]">
            
            {/* ✅ ส่วนที่แก้ไข: หมวดหมู่สินค้า (เพิ่มเงา Gradient) */}
            <div className="relative shrink-0 bg-white border-b border-slate-100 z-20">
                
                {/* เงาจางๆ ทางขวา (แสดงเฉพาะมือถือ) */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 lg:hidden" />

                <div className="flex gap-2 overflow-x-auto p-3 px-4 items-center no-scrollbar scroll-smooth">
                    <button onClick={() => setSelectedCategory('ALL')} className={`px-5 py-2.5 rounded-xl text-sm font-bold shrink-0 transition-all border ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white shadow-md border-slate-800' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>ทั้งหมด</button>
                    <div className="w-[1px] h-6 bg-slate-200 mx-1 shrink-0"></div>
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-5 py-2.5 rounded-xl text-sm font-bold shrink-0 transition-all border whitespace-nowrap ${selectedCategory === cat.id ? 'bg-slate-800 text-white shadow-md border-slate-800' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>{cat.name}</button>
                    ))}
                    
                    {/* Spacer ท้ายสุด (ดันเนื้อหาให้พ้นเงา) */}
                    <div className="w-8 shrink-0 lg:hidden"></div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 content-start">
                {products.map(p => {
                    const pricing = calculatePrice(p, 'normal');
                    const hasDiscount = pricing.discount > 0;
                    return (
                        <button 
                            key={p.id} 
                            onClick={() => handleProductClick(p)} 
                            className={`
                                relative bg-white rounded-2xl border transition-all flex flex-col justify-between 
                                p-2.5 min-h-[6.5rem] group overflow-hidden text-left
                                ${hasDiscount ? 'border-orange-200 shadow-orange-50' : 'border-slate-100 shadow-sm'}
                                hover:border-orange-400 hover:shadow-[0_4px_12px_rgb(251,146,60,0.15)] 
                                hover:-translate-y-0.5 active:scale-[0.96] duration-200
                            `}
                        >
                            {hasDiscount && (
                                <span className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg z-10 shadow-sm">SALE</span>
                            )}
                            <div className="w-full mb-1">
                                <h3 className="font-bold text-slate-700 text-xs leading-4 line-clamp-2 group-hover:text-orange-700 transition-colors">
                                    {p.name}
                                </h3>
                            </div>
                            <div className="w-full flex items-end justify-between mt-auto">
                                <div className="flex flex-col leading-none">
                                    {hasDiscount && <span className="text-[9px] text-slate-400 line-through font-medium opacity-80">{formatCurrency(pricing.original)}</span>}
                                    <span className={`font-black text-base tracking-tight ${hasDiscount ? 'text-rose-500' : 'text-slate-800'}`}>{formatCurrency(pricing.final)}</span>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white group-hover:border-slate-800 transition-all duration-200 shadow-sm">
                                    <IconPlusSmall size={14} />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    )}
</div></div>
               {/* ================= RIGHT SIDE: BILL & PAYMENT ================= */}
{/* ✅ แก้ไข Class: เพิ่ม Logic การ Slide Up เมื่อเป็นมือถือ และปุ่มปิด */}
<div className={`
    fixed inset-0 z-[200] bg-white p-4 pt-12 transition-transform duration-300 ease-in-out
    lg:static lg:bg-transparent lg:p-0 lg:col-span-5 lg:flex lg:flex-col lg:h-full lg:gap-5 lg:overflow-hidden lg:z-auto lg:translate-y-0
    ${showMobileCart ? 'translate-y-0' : 'translate-y-[110%] lg:translate-y-0'}
`}> 
    
    {/* ✅ ปุ่มปิด (กากบาท) สำหรับมือถือ */}
    <button 
        onClick={() => setShowMobileCart(false)}
        className="absolute top-4 right-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 lg:hidden z-50 hover:bg-slate-200 transition-colors"
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>

    <div className="bg-white rounded-[32px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden flex flex-col h-full relative z-10">
        
        {/* Bill Header */}
        <div className="p-6 border-b border-slate-50 shrink-0 bg-white flex justify-between items-center z-10">
            <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <IconWallet size={18}/>
                </div> 
                สรุปยอดชำระ
            </h2>
            {selectedOrder && activeTab === 'tables' && (
                <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">โต๊ะ {selectedOrder.table_label}</span>
            )}
        </div>

        {/* Order Items List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-3 bg-[#FCFCFD]">
                {(activeTab === 'tables' ? selectedOrder?.order_items : cart)?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3 opacity-60">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center opacity-50">
                            <IconReceipt size={32} /> 
                        </div>
                        <p className="font-medium text-sm">ยังไม่มีรายการอาหาร</p>
                    </div>
                ) : (
                    (activeTab === 'tables' ? selectedOrder?.order_items : cart)?.map((item: any, idx: number) => (
                    <div 
                        key={`${idx}-${item.quantity}`} 
                        ref={(el) => { itemsRef.current[idx] = el; }}
                        className="flex justify-between items-start py-3 px-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all animate-pop-item"
                    >
                        <div className="flex gap-4 items-start">
                            <div className="bg-slate-50 min-w-[2.5rem] h-10 rounded-lg flex items-center justify-center border border-slate-100 mt-0.5 shadow-sm">
                                <span className="text-sm font-black text-slate-700">x{item.quantity}</span>
                            </div>
                            <div className="pt-0.5">
                                <p className="text-base font-bold text-slate-700 leading-tight">{item.product_name || item.name}</p>
                                {item.variant !== 'normal' && <span className="inline-block mt-1 text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase tracking-wider">{item.variant}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-0.5">
                            <div className="text-right leading-tight">
                                {item.originalPrice && item.price < item.originalPrice && <p className="text-[10px] text-slate-400 line-through font-medium">{formatCurrency(item.originalPrice * item.quantity)}</p>}
                                <p className={`font-bold text-base ${item.price < item.originalPrice ? 'text-rose-500' : 'text-slate-800'}`}>{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                            {activeTab === 'pos' && (
                                <button onClick={() => removeFromCart(idx)} className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all">
                                    <IconTrash size={14}/>
                                </button>
                            )}
                        </div>
                    </div>
                )))}
            </div>

                        {/* Payment Footer */}
                        {(selectedOrder || cart.length > 0) && (
                            <div className="p-6 bg-white border-t border-slate-100 space-y-5 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 rounded-t-[32px]">
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-[20px]">
                                    <button onClick={() => setPaymentMethod('cash')} className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${paymentMethod === 'cash' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}><IconWallet size={18} /> เงินสด</button>
                                    <button onClick={() => setPaymentMethod('promptpay')} className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${paymentMethod === 'promptpay' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-slate-400 hover:text-slate-600'}`}><IconQrcode size={18} /> พร้อมเพย์</button>
                                </div>
                                <div className="flex justify-between items-end px-1">
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1.5">ยอดสุทธิ {paymentMethod === 'cash' && '(ปัดเศษ)'}</p>
                                    <div className="text-right">
                                        {rawTotal !== payableAmount && <p className="text-sm text-slate-400 line-through font-medium">{formatCurrency(rawTotal)}</p>}
                                        <p className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(payableAmount)}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={onMainPaymentClick} 
                                    className={`w-full py-5 rounded-[24px] font-black text-lg text-white shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2 ${paymentMethod === 'promptpay' ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-200 hover:shadow-blue-300' : 'bg-slate-800 shadow-slate-300 hover:bg-slate-900'}`}
                                >
                                    {paymentMethod === 'promptpay' ? <><IconQrcode /> แสดง QR รับเงิน</> : <><IconCheckCircle /> รับชำระเงิน</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* ✅ Mobile Floating Bar: แสดงเฉพาะในมือถือ (lg:hidden) */}
<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-[150] lg:hidden">
    <button 
        onClick={() => setShowMobileCart(true)}
        className="w-full bg-slate-800 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg active:scale-95 transition-transform"
    >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">
                {(activeTab === 'tables' ? selectedOrder?.order_items?.length : cart.length) || 0}
            </div>
            <span className="font-bold">ดูตะกร้าสินค้า</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm">รวม</span>
            <span className="text-xl font-black">{formatCurrency(payableAmount)}</span>
        </div>
    </button>
</div>

            {/* --- Modals --- */}
            {/* ... (Modals ส่วนอื่นๆ เหมือนเดิม: Cash Modal, Table Selector, etc.) ... */}
            
            {showCashModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[360px] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
                        <div className="py-4 border-b border-slate-100 bg-slate-50/50 text-center">
                            <h3 className="text-xl font-black text-slate-800">รับเงินสด</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                                <div className="flex justify-between items-center text-slate-500 text-sm font-bold">
                                    <span>ยอดรวม</span>
                                    <span className="text-slate-900 text-lg">{formatCurrency(payableAmount)}</span>
                                </div>
                                <div className={`flex items-center justify-between border-b-2 py-1 ${receivedAmount < payableAmount ? 'border-orange-500 text-orange-600' : 'border-emerald-500 text-emerald-600'}`}>
                                    <span className="text-xs font-bold text-slate-400 uppercase">รับเงิน</span>
                                    <span className="text-3xl font-black">{receivedAmount > 0 ? formatCurrency(receivedAmount).replace('฿', '') : '0'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-slate-500 text-sm font-bold">เงินทอน</span>
                                    <span className={`text-lg font-black ${receivedAmount >= payableAmount ? 'text-emerald-600' : 'text-slate-300'}`}>
                                        {receivedAmount >= payableAmount ? formatCurrency(receivedAmount - payableAmount) : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                                {[20, 50, 100, 500, 1000].map(v => (
                                    <button key={v} onClick={() => setReceivedAmount(prev => prev + v)} className="py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[10px] text-slate-600 hover:bg-white hover:border-orange-400 hover:text-orange-600 transition-all active:scale-95 shadow-sm">+{v}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button key={num} onClick={() => handleNumPad(num)} className="h-12 rounded-xl bg-white border border-slate-100 shadow-sm text-xl font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">{num}</button>
                                ))}
                                <button onClick={() => handleNumPad('C')} className="h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 font-bold hover:bg-rose-100 transition-colors">C</button>
                                <button onClick={() => handleNumPad(0)} className="h-12 rounded-xl bg-white border border-slate-100 shadow-sm text-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">0</button>
                                <button onClick={() => handleNumPad('DEL')} className="h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"><IconBackspace size={20} /></button>
                            </div>
                            <div className="space-y-2 pt-1">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setReceivedAmount(payableAmount)} className="py-3 rounded-xl font-bold text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100">จ่ายพอดี</button>
                                    <button onClick={confirmCashPayment} disabled={receivedAmount < payableAmount} className={`py-3 rounded-xl font-black text-base text-white shadow-md transition-all flex items-center justify-center gap-2 ${receivedAmount >= payableAmount ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}>ยืนยัน</button>
                                </div>
                                <button onClick={() => setShowCashModal(false)} className="w-full text-center text-slate-400 text-xs font-bold py-2 hover:text-slate-600 transition-colors">ยกเลิก</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Selector Modal */}
{showTableSelector && (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        {/* ✅ แก้ไข 1: เพิ่ม z-[300] ให้สูงกว่า Floating Bar (ที่เป็น z-[150]) */}
        
        <div className="bg-[#F8F9FD] rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/20">
            <div className="shrink-0 px-8 py-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200"><IconQrcode size={24} /></div>
                    <div><h3 className="text-2xl font-black text-slate-800 tracking-tight">เลือกโต๊ะ</h3><p className="text-slate-500 text-sm font-medium">พิมพ์ QR Code สำหรับสั่งอาหาร</p></div>
                </div>
            </div>
            
            {/* ✅ แก้ไข 2: เพิ่ม pb-24 ในมือถือ เพื่อกันไม่ให้เนื้อหาถูกบัง */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8 overscroll-contain bg-[#F8F9FD] pb-24 md:pb-8">
                {/* Legend */}
                <div className="flex gap-4 mb-6 px-2 shrink-0">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span><span className="text-sm font-bold text-slate-600">ว่าง (พร้อมใช้งาน)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-400"></span><span className="text-sm font-bold text-slate-400">ไม่ว่าง (มีลูกค้า)</span></div>
                </div>
                
                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
                    {allTables.map((table) => {
                        const isAvailable = table.status === 'available';
                        return (
                            <button 
                                key={table.id} 
                                onClick={() => handleSelectTableForQR(table)} 
                                className={`
                                    relative group p-4 rounded-[24px] border-2 transition-all duration-200 flex flex-col items-center justify-between min-h-[140px] cursor-pointer
                                    ${isAvailable 
                                        ? 'bg-white border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-400 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1' 
                                        : 'bg-slate-100 border-slate-200 hover:border-slate-300 hover:bg-slate-200' 
                                    }
                                `}
                            >
                                <div className="w-full flex justify-end">
                                    <span className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-400'}`}></span>
                                </div>
                                <div className="flex-1 flex items-center justify-center w-full">
                                    <span className={`text-3xl font-black tracking-tighter ${isAvailable ? 'text-slate-800 group-hover:text-emerald-600' : 'text-slate-500'}`}>{table.label}</span>
                                </div>
                                <div className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center transition-colors 
                                    ${isAvailable ? 'bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600' : 'bg-white text-slate-400 border border-slate-100'}
                                `}>
                                    พิมพ์ QR Code
                                </div>
                            </button>
                        );
                    })}
                    {allTables.length === 0 && <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 opacity-50"><IconGrid size={32} /></div><p className="font-bold text-lg">ไม่พบข้อมูลโต๊ะ</p></div>}
                </div>
            </div>
            
            {/* ✅ แก้ไข 3: ยกปุ่มปิดให้สูงขึ้น หรือให้ลอยเหนือ Floating Bar ในมือถือ */}
            <div className="shrink-0 p-4 bg-white border-t border-slate-100 z-20 pb-safe md:pb-4"> 
                {/* เพิ่ม pb-safe หรือ padding-bottom เผื่อไว้สำหรับจอที่มี safe area หรือ floating bar */}
                <button onClick={() => setShowTableSelector(false)} className="w-full py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 hover:text-slate-700 transition-colors">ปิดหน้าต่าง</button>
            </div>
        </div>
    </div>
)}

            {qrTableData && (
                <TableQrModal 
                    table={qrTableData} 
                    brandId={currentBrand?.id} 
                    brandSlug={currentBrand?.slug} 
                    // ✅ เปลี่ยนมาใช้ฟังก์ชันที่เราเพิ่งสร้าง
                    qrLogoUrl={getCorrectQrLogo()} 
                    onClose={() => setQrTableData(null)} 
                    limitStatus={limitStatus} 
                />
            )}
            {statusModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[48px] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        {statusModal.type === 'qrcode' ? (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2"><div className="bg-blue-600 p-1 rounded"><div className="w-4 h-3 bg-white/20"></div></div><span className="font-bold text-slate-700">PromptPay</span></div>
                                    <div className="bg-slate-100 px-4 py-1.5 rounded-full"><p className="text-slate-500 font-bold text-sm font-mono tracking-wider">{currentBrand?.promptpay_number || '-'}</p></div>
                                </div>
                                <div className="bg-white p-4 border border-slate-100 rounded-[32px] inline-block shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                                    <img src={`https://promptpay.io/${currentBrand?.promptpay_number || '0000000000'}/${payableAmount}.png`} className="w-56 h-56 mix-blend-multiply opacity-90" alt="QR" />
                                </div>
                                <div><p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">ยอดเงินที่ต้องโอน</p><p className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(payableAmount)}</p></div>
                                <div className="flex flex-col gap-3 pt-2">
                                    <button onClick={handlePayment} className="w-full py-4 bg-emerald-500 text-white rounded-[20px] font-black text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all">ลูกค้าโอนแล้ว</button>
                                    <button onClick={() => setStatusModal(prev => ({ ...prev, show: false }))} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 p-2">ยกเลิกรายการ</button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 px-4">
                                <div className={`flex justify-center mb-6 w-24 h-24 mx-auto rounded-full items-center shadow-lg ${statusModal.type === 'success' ? 'bg-green-50 text-green-500 shadow-green-100' : (statusModal.type === 'alert' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : 'bg-red-50 text-red-500 shadow-red-100')}`}>
    {statusModal.type === 'success' ? <IconCheckCircle size={48} /> : (statusModal.type === 'alert' ? <IconLock size={48} /> : <IconAlertCircle size={48} />)}
</div>
                                <h3 className="text-2xl font-black mb-3 text-slate-800 tracking-tight">{statusModal.title}</h3>
                                <p className="text-slate-500 font-medium mb-8 text-lg leading-relaxed whitespace-pre-line">{statusModal.message}</p>
                                {statusModal.type === 'alert' ? (
                                    <div className="space-y-3">
                                        <button onClick={() => router.push('/dashboard/settings')} className="w-full py-4 rounded-[20px] font-black text-white text-lg bg-gradient-to-r from-orange-500 to-rose-500 active:scale-95 transition-all shadow-lg hover:shadow-orange-200">อัปเกรดเลย</button>
                                        <button onClick={() => setStatusModal(prev => ({ ...prev, show: false }))} className="text-slate-400 font-bold text-sm hover:text-slate-600">ไว้ทีหลัง</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setStatusModal(prev => ({ ...prev, show: false }))} className="w-full py-4 rounded-[20px] font-black text-white text-lg bg-slate-800 active:scale-95 transition-all shadow-lg hover:bg-slate-900">ตกลง</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {variantModalProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setVariantModalProduct(null)}>
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden p-8 animate-in slide-in-from-bottom-8 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-8"><h3 className="text-2xl font-black text-slate-900 tracking-tight text-center">เลือกขนาด</h3></div>
                        <div className="space-y-3">
                            {[
                                { label: 'ธรรมดา', key: 'normal', ...calculatePrice(variantModalProduct, 'normal') },
                                variantModalProduct.price_special && { label: 'พิเศษ ✨', key: 'special', ...calculatePrice(variantModalProduct, 'special') },
                                variantModalProduct.price_jumbo && { label: 'จัมโบ้ 🔥', key: 'jumbo', ...calculatePrice(variantModalProduct, 'jumbo') }
                            ].filter(Boolean).map((opt: any) => (
                                <button key={opt.key} onClick={() => addToCart(variantModalProduct, opt.key)} className="w-full flex justify-between items-center p-5 rounded-[24px] border border-slate-100 hover:border-orange-500 hover:bg-orange-50 hover:shadow-md hover:shadow-orange-100 transition-all font-bold text-lg group bg-white">
                                    <div className="text-left flex flex-col gap-1">
                                        <span className="text-slate-700 group-hover:text-orange-700 text-lg">{opt.label}</span>
                                        {opt.discount > 0 && <span className="text-[10px] text-white bg-rose-500 px-2 py-0.5 rounded-md w-fit font-bold shadow-sm">ลด {formatCurrency(opt.discount)}</span>}
                                    </div>
                                    <div className="text-right leading-none">
                                        {opt.final < opt.original && <span className="text-xs text-slate-400 line-through font-medium block mb-1">{formatCurrency(opt.original)}</span>}
                                        <span className={`font-black text-2xl ${opt.final < opt.original ? 'text-rose-500' : 'text-slate-800'}`}>{formatCurrency(opt.final)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {completedReceipt && <ReceiptModal receipt={completedReceipt} onClose={() => setCompletedReceipt(null)} />}
                {kitchenOrder && (
                <KitchenTicketModal 
                    order={kitchenOrder} 
                    onClose={() => setKitchenOrder(null)} 
                    autoPrint={false} // 👈 เปลี่ยนเป็น false เพราะเราให้ระบบหลังบ้านสั่งพิมพ์โดยตรงไปแล้ว
                />
            )}
        </div>
    );
}