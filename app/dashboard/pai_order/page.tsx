// app/dashboard/pai_order/page.tsx
'use client';
import { Html5Qrcode } from 'html5-qrcode';
import React, { useState, useEffect, useRef } from 'react';
import { usePayment } from '@/hooks/usePayment'; 
import { usePaimaster } from '@/hooks/usePaimaster'; 
import { useGlobalAlert } from '@/components/providers/GlobalAlertProvider';
import { useRouter } from 'next/navigation';
import { useFcmToken } from '@/hooks/useFcmToken';
import { db } from '@/lib/db';

import ReceiptModal from '@/app/dashboard/pai_order/components/ReceiptModal';
import TableQrModal from '@/app/dashboard/(owner)/tables/TableQrModal';
import KitchenTicketModal from '@/app/dashboard/pai_order/components/KitchenTicketModal';

// --- Icons ---
const IconCamera = ({ size = 20 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const IconBarcode = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/></svg>;
const IconTrash = ({ size = 18 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);const IconWallet = ({ size = 20 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;
const IconQrcode = ({ size = 20 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconBackspace = ({ size = 24 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>;
const IconCheckCircle = ({ size = 24 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const IconZap = ({ size = 20, className = "" }: any) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconLock = ({ size = 20, className = "" }: any) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconReceipt = ({ size = 20 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 14h-8"/><path d="M16 10h-8"/></svg>;
const IconGrid = ({ size = 20 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconVolume2 = ({ size = 24 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>;
const IconAlertCircle = ({ size = 24 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

export default function PaiOrderMasterPage() {
    const [showCamera, setShowCamera] = useState(false);
    const {
        activeTab, setActiveTab, loading, autoKitchen, setAutoKitchen,
        categories, products, unpaidOrders, allTables, selectedCategory, setSelectedCategory,
        calculatePrice, cart, selectedOrder, setSelectedOrder, receivedAmount, setReceivedAmount,
        paymentMethod, setPaymentMethod, payableAmount, rawTotal, variantModalProduct, setVariantModalProduct,
        statusModal, setStatusModal, completedReceipt, setCompletedReceipt, qrTableData, setQrTableData,
        showTableSelector, setShowTableSelector, currentBrand, getFullImageUrl, handleSelectTableForQR, handleProductClick,
        addToCart, removeFromCart, handlePayment, formatCurrency, limitStatus, refreshTables, toggleAutoKitchen, 
        isAudioUnlocked, unlockAudio, currentUser, fetchAndProcessOrders, playSound, playScanSound, kitchenOrder, setKitchenOrder
    } = usePayment();

    const onCameraScanSuccess = (decodedText: string) => {
        setShowCamera(false); 
        if (paimaster.barcodeInputRef.current) {
            paimaster.barcodeInputRef.current.blur(); 
        }
        paimaster.setBarcodeInput(decodedText); 
        setTimeout(() => {
            if (paimaster.barcodeInputRef.current) {
                const form = paimaster.barcodeInputRef.current.closest('form');
                if (form) form.requestSubmit(); 
            }
        }, 100);
    };

    const paimaster = usePaimaster(); 
    const { showAlert } = useGlobalAlert();
    const router = useRouter();

    const [showMobileCart, setShowMobileCart] = useState(false);
    const [showCashModal, setShowCashModal] = useState(false);
    const itemsRef = useRef<{[key: number]: HTMLDivElement | null}>({});
    const prevItemsRef = useRef<any[]>([]);

    const isLimitReached = limitStatus?.isLocked;
    const usageText = limitStatus ? `${limitStatus.usage}/${limitStatus.limit}` : '';
    const showSoundGuard = autoKitchen && !isAudioUnlocked;

    useFcmToken(currentUser?.id, (payload: any) => { 
        console.log("📢 สัญญาณ FCM เข้า! โหลดข้อมูลและเช็กออเดอร์...", payload);
        try {
            const msgType = payload?.data?.type || payload?.type || '';
            const msgTitle = payload?.data?.title || payload?.notification?.title || '';
            fetchAndProcessOrders(payload); 
            refreshTables(); 
            if (msgType === 'SILENT_UPDATE' || msgType === 'ANDROID_REFRESH' || msgTitle.includes('อัปเดต')) {
                console.log("🔇 เงียบ: ไม่ส่งเสียงเพราะเป็นการเคลียร์โต๊ะ");
            } else {
                playSound(); 
            }
        } catch (e) {
            console.warn("FCM Handler Error:", e);
        }
    });

    const getCorrectQrLogo = () => {
        if (!currentBrand?.qr_image_url || !currentBrand?.id) return null;
        const CDN = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://img.pos-foodscan.com";
        let finalLogo = currentBrand.qr_image_url;
        if (finalLogo.includes('supabase.co')) {
            return `${CDN}/${currentBrand.id}/${finalLogo.split('/').pop()}`;
        } else if (!finalLogo.startsWith('http')) {
            const cleanPath = finalLogo.replace(/^\/+/, '');
            return cleanPath.startsWith(currentBrand.id) ? `${CDN}/${cleanPath}` : `${CDN}/${currentBrand.id}/${cleanPath}`;
        }
        return finalLogo;
    };

    useEffect(() => {
        if (activeTab === 'pos') paimaster.barcodeInputRef.current?.focus();
    }, [activeTab]);

    useEffect(() => {
        let html5QrCode: Html5Qrcode | null = null;
        if (showCamera) {
            html5QrCode = new Html5Qrcode("reader"); 
            html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: { width: 280, height: 150 } },
                onCameraScanSuccess, 
                (errorMessage) => { }
            ).catch(err => console.error("Camera Error:", err));

            return () => {
                if (html5QrCode?.isScanning) {
                    html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
                }
            };
        }
    }, [showCamera]);

    useEffect(() => {
        document.body.style.overflow = (showTableSelector || showCashModal || variantModalProduct || statusModal.show || completedReceipt || qrTableData || showSoundGuard) ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [showTableSelector, showCashModal, variantModalProduct, statusModal.show, completedReceipt, qrTableData, showSoundGuard]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
        const currentItems = activeTab === 'tables' ? (selectedOrder?.order_items || []) : cart;
        const prevItems = prevItemsRef.current;
        let changedIndex = -1;
        
        if (currentItems.length > prevItems.length) changedIndex = currentItems.length - 1;
        else if (currentItems.length === prevItems.length) changedIndex = currentItems.findIndex((item: any, i: number) => item.quantity !== prevItems[i]?.quantity);

        if (changedIndex !== -1 && itemsRef.current[changedIndex]) {
            setTimeout(() => itemsRef.current[changedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
        }
        prevItemsRef.current = currentItems;
    }, [cart, selectedOrder, activeTab]);

    const handleBarcodeScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = paimaster.barcodeInput.trim();
        if (!code) return;

        paimaster.setBarcodeInput('');
        paimaster.setIsScanning(true);

        try {
            const localProduct = await db.products.where('barcode').equals(code).or('sku').equals(code).first();
            if (localProduct) {
                console.log("⚡ Found locally! (Fast Scan)");
                addToCart(localProduct, 'normal'); 
                playScanSound(); 
                paimaster.setIsScanning(false);
                return; 
            }

            console.log("☁️ Not found locally, checking cloud...");
            const res = await paimaster.scanProduct(code);
            if (res.success && res.data) {
                addToCart(res.data, 'normal');
                playScanSound(); 
            } else {
                showAlert('warning', 'ไม่พบสินค้า', `ไม่มีรหัส: ${code} ในระบบ`);
            }
        } catch (err) {
            console.error("Scan Error:", err);
            showAlert('error', 'ระบบขัดข้อง', 'สแกนไม่สำเร็จ');
        } finally {
            paimaster.setIsScanning(false);
            paimaster.barcodeInputRef.current?.focus();
        }
    };

    const handleNumPad = (value: number | string) => {
        if (value === 'C') setReceivedAmount(0);
        else if (value === 'DEL') {
            const currentString = receivedAmount.toString();
            setReceivedAmount(currentString.length > 1 ? parseInt(currentString.slice(0, -1)) || 0 : 0);
        } else {
            if (receivedAmount === 0 && value === 0) return;
            setReceivedAmount(parseInt(`${receivedAmount}${value}`));
        }
    };

    const onMainPaymentClick = () => {
        setShowMobileCart(false);
        if (isLimitReached) {
            setStatusModal({ show: true, type: 'alert', title: 'อัปเกรดเพื่อใช้งานต่อ', message: `แพ็กเกจฟรีจำกัด ${usageText} ออเดอร์ \nกรุณาอัปเกรดแพ็กเกจเพื่อรับออเดอร์เพิ่มครับ` });
            return;
        }
        if (paymentMethod === 'promptpay') {
            setStatusModal({ show: true, type: 'qrcode', title: 'สแกนจ่ายเงิน', message: '' });
        } else {
            setReceivedAmount(0); 
            setShowCashModal(true);
        }
    };

    const confirmCashPayment = async () => {
        try {
            if (Number(receivedAmount) < Number(payableAmount)) {
                showAlert('warning', 'ยอดเงินไม่พอ', 'ยอดเงินที่รับมาไม่เพียงพอครับ');
                return;
            }
            await handlePayment();
            setShowCashModal(false);
            if (activeTab === 'pos') paimaster.barcodeInputRef.current?.focus();
        } catch (error) {
            showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const isTableActive = activeTab === 'tables' && selectedOrder;
    const cartItemsToRender = isTableActive ? selectedOrder.order_items.filter((i: any) => i.status !== 'cancelled') : cart;

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-2 md:p-6 font-sans pb-24 md:pb-6 text-slate-800 h-screen overflow-hidden">
            
            <style jsx>{`
                @keyframes pop-bounce { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                .animate-pop-item { animation: pop-bounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes pulse-ring { 0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(249, 115, 22, 0); } 100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); } }
                .pulse-btn { animation: pulse-ring 2s infinite; }
            `}</style>

            {/* ===================== SOUND GUARD MODAL ===================== */}
            {showSoundGuard && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex flex-col items-center justify-center p-8 max-w-md text-center">
                        <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-orange-500/50 pulse-btn"><IconVolume2 size={48} /></div>
                        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">ระบบ Auto Kitchen</h2>
                        <p className="text-slate-300 mb-8 text-lg font-medium">กดปุ่มเพื่อเริ่มทำงานและเปิดเสียงแจ้งเตือนอัตโนมัติ</p>
                        <button onClick={unlockAudio} className="px-10 py-4 bg-white text-orange-600 rounded-[24px] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-900/20 flex items-center gap-3">
                            <IconZap size={24} className="fill-orange-600" /> เริ่มทำงาน
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6 h-[calc(100vh-1rem)] md:h-[calc(100vh-3rem)]">
                
                {/* ================= LEFT SIDE: MENU & TABLES ================= */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 md:gap-5 h-full overflow-hidden pb-16 lg:pb-0">
                    
                    {/* ✅ Top Bar (ย่อในมือถือ) */}
                    <div className="flex gap-2 md:gap-4 shrink-0 h-14 md:h-[4.5rem]">
                        <div className="bg-white p-1 md:p-1.5 rounded-xl md:rounded-[20px] shadow-sm border border-slate-100 flex flex-1 items-center">
                            <button onClick={() => { setActiveTab('tables'); setSelectedOrder(null); }} className={`flex-1 h-full rounded-lg md:rounded-2xl font-bold flex items-center justify-center gap-1 md:gap-2 transition-all duration-300 text-xs md:text-base ${activeTab === 'tables' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50'}`}>
                                <span className="w-4 md:w-5"><IconReceipt size="100%" /></span> <span className="hidden sm:inline">โต๊ะ & รายการ</span> 
                                {unpaidOrders.length > 0 && <span className="bg-orange-500 text-white text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full">{unpaidOrders.length}</span>}
                            </button>
                            <button onClick={() => { setActiveTab('pos'); setSelectedOrder(null); paimaster.barcodeInputRef.current?.focus(); }} className={`flex-1 h-full rounded-lg md:rounded-2xl font-bold flex items-center justify-center gap-1 md:gap-2 transition-all duration-300 text-xs md:text-base ${activeTab === 'pos' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50'}`}>
                                <span className="w-4 md:w-5"><IconGrid size="100%" /></span> POS
                            </button>
                        </div>
                        <div className="flex gap-2 md:gap-3 h-full">
                            <button onClick={toggleAutoKitchen} className={`h-full aspect-square rounded-xl md:rounded-[20px] shadow-sm flex items-center justify-center transition-all border ${autoKitchen ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-100' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-400'}`} title="Auto Kitchen Print">
                                <span className="w-5 md:w-[22px]"><IconZap size="100%" className={autoKitchen ? 'fill-current' : ''} /></span>
                            </button>
                            <button onClick={() => {
                                if (isLimitReached) {
                                    setStatusModal({ show: true, type: 'alert', title: 'อัปเกรดเพื่อใช้งานต่อ', message: `แพ็กเกจฟรีจำกัด ${usageText} ออเดอร์ \nกรุณาอัปเกรดแพ็กเกจเพื่อรับออเดอร์เพิ่มครับ` });
                                    return;
                                }
                                setShowTableSelector(true);
                            }} className={`h-full aspect-square rounded-xl md:rounded-[20px] shadow-sm flex flex-col items-center justify-center transition-all border relative group ${isLimitReached ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 cursor-pointer' : 'bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-md'}`}>
                                {isLimitReached ? <span className="w-4 md:w-5"><IconLock size="100%" /></span> : <span className="w-5 md:w-[22px]"><IconQrcode size="100%" /></span>}
                                {isLimitReached && <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 w-4 h-4 md:w-5 md:h-5 bg-rose-500 text-white text-[9px] md:text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-bounce border border-white">!</span>}
                                {limitStatus?.plan === 'free' && <span className="text-[8px] md:text-[9px] font-bold mt-0.5 opacity-60">{limitStatus.usage}/{limitStatus.limit}</span>}
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-white rounded-2xl md:rounded-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-1 flex flex-col overflow-hidden relative">
                        {activeTab === 'tables' ? (
                            <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-2 md:space-y-3 bg-[#FCFCFD]">
                                {unpaidOrders.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3 md:gap-4 opacity-50">
                                        <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100"><span className="w-8 md:w-10"><IconReceipt size="100%" /></span></div>
                                        <p className="font-semibold text-xs md:text-sm uppercase tracking-wider">ไม่มีรายการค้างชำระ</p>
                                    </div>
                                )}
                                {unpaidOrders.map((o, i) => (
                                    <button key={i} onClick={() => { setSelectedOrder(o); setReceivedAmount(0); }} className={`w-full p-3 md:p-5 rounded-xl md:rounded-[24px] border flex justify-between items-center transition-all duration-200 group relative overflow-hidden ${selectedOrder?.table_label === o.table_label ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-100 ring-1 ring-orange-500' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'}`}>
                                        <div className="flex items-center gap-3 md:gap-4 z-10">
                                            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center font-black text-base md:text-xl shadow-sm transition-colors ${selectedOrder?.table_label === o.table_label ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{o.table_label.replace('โต๊ะ ', '')}</div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm md:text-lg text-slate-800">โต๊ะ {o.table_label}</p>
                                                <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide">{o.order_items?.length || 0} ITEMS</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="text-[10px] md:text-xs text-slate-400">Waiting Payment</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="font-black text-base md:text-xl text-slate-700 group-hover:text-orange-600 transition-colors z-10">{formatCurrency(o.total_price)}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full bg-[#FCFCFD]">
                                
                                {/* 🌟 ช่องสแกนบาร์โค้ด (ย่อในมือถือ) */}
                                <div className="p-3 md:p-6 shrink-0 bg-white border-b border-slate-100/80">
                                    <form 
                                        onSubmit={handleBarcodeScan} 
                                        className={`
                                            relative flex items-center transition-all duration-300 group
                                            ${paimaster.isScanning ? 'opacity-70 scale-[0.99]' : 'scale-100'}
                                        `}
                                    >
                                        <div className="absolute left-3 md:left-6 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300 w-5 md:w-6">
                                            <IconBarcode />
                                        </div>

                                        <input
                                            ref={paimaster.barcodeInputRef}
                                            type="text"
                                            inputMode="none"
                                            value={paimaster.barcodeInput}
                                            onChange={(e) => paimaster.setBarcodeInput(e.target.value)}
                                            placeholder="ยิงบาร์โค้ด หรือสแกน ->"
                                            className={`
                                                w-full pl-10 md:pl-16 pr-16 md:pr-36 py-3 md:py-5 text-lg md:text-2xl font-black font-mono tracking-widest md:tracking-[0.1em]
                                                bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-[24px] outline-none
                                                placeholder:text-slate-300 placeholder:font-sans placeholder:text-xs md:placeholder:text-lg placeholder:font-bold placeholder:tracking-normal
                                                focus:bg-white focus:border-blue-500 focus:ring-4 md:focus:ring-8 focus:ring-blue-500/5 
                                                shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.1)]
                                                transition-all duration-300
                                            `}
                                            autoComplete="off"
                                        />

                                        <div className="absolute right-1.5 md:right-2.5">
                                            <button 
                                                type="button" 
                                                onClick={() => setShowCamera(true)} 
                                                disabled={paimaster.isScanning} 
                                                className={`
                                                    px-3 py-2 md:px-6 md:py-3.5 rounded-lg md:rounded-[18px] font-black text-sm md:text-base flex items-center gap-1 md:gap-2
                                                    transition-all duration-300 active:scale-95 disabled:opacity-50
                                                    bg-slate-800 text-white shadow-md hover:bg-slate-900 hover:shadow-slate-900/30 hover:-translate-y-0.5
                                                `}
                                            >
                                                <span className="w-4 md:w-5"><IconCamera size="100%" /></span>
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="relative shrink-0 bg-white border-b border-slate-100 z-20">
                                    <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 lg:hidden" />
                                    <div className="flex gap-2 overflow-x-auto p-2 md:p-3 px-3 md:px-4 items-center no-scrollbar scroll-smooth">
                                        <button onClick={() => setSelectedCategory('ALL')} className={`px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shrink-0 transition-all border ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white shadow-md border-slate-800' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>ทั้งหมด</button>
                                        <div className="w-[1px] h-4 md:h-6 bg-slate-200 mx-0.5 md:mx-1 shrink-0"></div>
                                        {categories.map((cat:any) => (
                                            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shrink-0 transition-all border whitespace-nowrap ${selectedCategory === cat.id ? 'bg-slate-800 text-white shadow-md border-slate-800' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>{cat.name}</button>
                                        ))}
                                        <div className="w-8 shrink-0 lg:hidden"></div>
                                    </div>
                                </div>
                                
                                {/* 🚫 ตารางสินค้า (บีบในมือถือแล้ว) 🚫 */}
                                <div className="flex-1 overflow-y-auto p-2 sm:p-4 grid grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-3 content-start">
                                    {products.map((p: any) => {
                                        const pricing = calculatePrice(p, 'normal');
                                        const hasDiscount = pricing.discount > 0;
                                        return (
                                            <button 
                                                key={p.id} 
                                                onClick={() => handleProductClick(p)} 
                                                className={`
                                                    relative bg-white rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between 
                                                    p-2 sm:p-4 min-h-[4.5rem] sm:min-h-[6.5rem] group overflow-hidden text-left
                                                    ${hasDiscount ? 'border-orange-200 shadow-orange-50' : 'border-slate-200 shadow-sm'}
                                                    hover:border-orange-400 hover:shadow-[0_4px_12px_rgb(251,146,60,0.15)] 
                                                    hover:-translate-y-0.5 active:scale-[0.96] duration-200
                                                `}
                                            >
                                                {/* 🌟 ระบบ Promo */}
                                                {hasDiscount && <span className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-bl-lg sm:rounded-bl-xl rounded-tr-xl sm:rounded-tr-2xl z-10 shadow-sm tracking-wider">SALE</span>}
                                                
                                                <div className="w-full mb-1 sm:mb-2 pr-1 sm:pr-4">
                                                    <h3 className="font-bold text-slate-700 text-[10px] sm:text-sm leading-tight sm:leading-snug line-clamp-2 group-hover:text-orange-700 transition-colors">{p.name}</h3>
                                                    {p.barcode && <p className="text-[8px] sm:text-xs font-mono text-slate-400 mt-0.5 sm:mt-1 truncate">{p.barcode}</p>}
                                                </div>
                                                <div className="w-full flex items-end justify-between mt-auto">
                                                    <div className="flex flex-col leading-none">
                                                        {hasDiscount && <span className="text-[8px] sm:text-[10px] text-slate-400 line-through font-medium opacity-80 mb-0.5">{formatCurrency(pricing.original)}</span>}
                                                        <span className={`font-black text-xs sm:text-xl tracking-tight ${hasDiscount ? 'text-rose-500' : 'text-slate-800'}`}>{formatCurrency(pricing.final)}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===================== CAMERA SCANNER MODAL ===================== */}
                {showCamera && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl md:rounded-[32px] shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
                            <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2"><IconCamera size={18}/> สแกนบาร์โค้ด</h3>
                                <button onClick={() => setShowCamera(false)} className="w-7 h-7 md:w-8 md:h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors">
                                    <IconBackspace size={14} />
                                </button>
                            </div>
                            <div className="p-2 md:p-4 bg-black relative min-h-[250px] md:min-h-[300px] flex items-center justify-center">
                                <div id="reader" className="w-full rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800"></div>
                                <div className="absolute w-48 h-24 md:w-64 md:h-32 border-2 border-blue-500/50 rounded-lg pointer-events-none animate-pulse"></div>
                            </div>
                            <div className="p-3 md:p-4 bg-slate-50 text-center">
                                <p className="text-xs md:text-sm font-bold text-slate-500">หันกล้องไปที่บาร์โค้ดของสินค้า</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= RIGHT SIDE: BILL & PAYMENT ================= */}
                <div className={`
                    fixed inset-0 z-[200] bg-white p-3 pt-12 transition-transform duration-300 ease-in-out
                    lg:static lg:bg-transparent lg:p-0 lg:col-span-5 lg:flex lg:flex-col lg:h-full lg:gap-5 lg:overflow-hidden lg:z-auto lg:translate-y-0
                    ${showMobileCart ? 'translate-y-0' : 'translate-y-[110%] lg:translate-y-0'}
                `}> 
                    <button onClick={() => setShowMobileCart(false)} className="absolute top-3 right-3 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 lg:hidden z-50 hover:bg-slate-200 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <div className="bg-white rounded-2xl md:rounded-[32px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden flex flex-col h-full relative z-10">
                        
                        {/* Bill Header */}
                        <div className="p-4 md:p-6 border-b border-slate-50 shrink-0 bg-white flex justify-between items-center z-10">
                            <h2 className="text-lg md:text-xl font-black flex items-center gap-2 md:gap-3 text-slate-800">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white shadow-md md:shadow-lg"><span className="w-4 md:w-[18px]"><IconWallet size="100%"/></span></div> 
                                สรุปยอดชำระ
                            </h2>
                            {selectedOrder && activeTab === 'tables' && <span className="bg-orange-100 text-orange-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">โต๊ะ {selectedOrder.table_label}</span>}
                            {/* {activeTab === 'pos' && cart.length > 0 && (
    <button onClick={() => { clearCart(); paimaster.barcodeInputRef.current?.focus(); }} className="text-[10px] md:text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 md:px-3 md:py-1.5 rounded-full transition-colors border border-red-100">ล้างตะกร้า</button>
)} 
*/}
                        </div>

                        {/* Order Items List */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-3 md:p-5 space-y-2 md:space-y-3 bg-[#FCFCFD]">
                            {cartItemsToRender?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 md:gap-3 opacity-60">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center opacity-50"><span className="w-6 md:w-8"><IconReceipt size="100%" /></span></div>
                                    <p className="font-medium text-xs md:text-sm">ยังไม่มีรายการ</p>
                                </div>
                            ) : (
                                cartItemsToRender?.map((item: any, idx: number) => (
                                    <div key={`${idx}-${item.quantity}`} ref={(el) => { itemsRef.current[idx] = el; }} className="flex justify-between items-start py-2 px-3 md:py-3 md:px-4 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all animate-pop-item">
                                        <div className="flex gap-2 md:gap-4 items-start min-w-0 flex-1 pr-2">
                                            <div className="bg-slate-50 min-w-[2rem] md:min-w-[2.5rem] h-8 md:h-10 rounded-md md:rounded-lg flex items-center justify-center border border-slate-100 mt-0.5 shadow-sm">
                                                <span className="text-xs md:text-sm font-black text-slate-700">x{item.quantity}</span>
                                            </div>
                                            <div className="pt-0.5 min-w-0">
                                                <p className="text-sm md:text-base font-bold text-slate-700 leading-tight truncate">{item.product_name || item.name}</p>
                                                {item.barcode && <p className="text-[10px] md:text-xs font-mono text-slate-400 mt-0.5">{item.barcode}</p>}
                                                {item.variant !== 'normal' && <span className="inline-block mt-1 text-[8px] md:text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase tracking-wider">{item.variant}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3 pt-0.5 shrink-0">
                                            <div className="text-right leading-tight">
                                                {item.originalPrice && item.price < item.originalPrice && <p className="text-[9px] md:text-[10px] text-slate-400 line-through font-medium">{formatCurrency(item.originalPrice * item.quantity)}</p>}
                                                <p className={`font-bold text-sm md:text-lg ${item.price < item.originalPrice ? 'text-rose-500' : 'text-slate-800'}`}>{formatCurrency(item.price * item.quantity)}</p>
                                            </div>
                                            {activeTab === 'pos' && (
                                                <button onClick={() => removeFromCart(idx)} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all"><IconTrash size={12}/></button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Payment Footer */}
                        {(selectedOrder || cart.length > 0) && (
                            <div className="p-4 md:p-6 bg-white border-t border-slate-100 space-y-3 md:space-y-5 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 rounded-t-2xl md:rounded-t-[32px]">
                                <div className="grid grid-cols-2 gap-2 md:gap-3 bg-slate-50 p-1 md:p-1.5 rounded-xl md:rounded-[20px]">
                                    <button onClick={() => setPaymentMethod('cash')} className={`py-2 md:py-3 rounded-lg md:rounded-2xl font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-all text-xs md:text-sm ${paymentMethod === 'cash' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}><span className="w-4 md:w-[18px]"><IconWallet size="100%" /></span> เงินสด</button>
                                    <button onClick={() => setPaymentMethod('promptpay')} className={`py-2 md:py-3 rounded-lg md:rounded-2xl font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-all text-xs md:text-sm ${paymentMethod === 'promptpay' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-slate-400 hover:text-slate-600'}`}><span className="w-4 md:w-[18px]"><IconQrcode size="100%" /></span> พร้อมเพย์</button>
                                </div>
                                <div className="flex justify-between items-end px-1">
                                    <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1 md:mb-1.5">ยอดสุทธิ {paymentMethod === 'cash' && '(ปัดเศษ)'}</p>
                                    <div className="text-right">
                                        {rawTotal !== payableAmount && <p className="text-xs md:text-sm text-slate-400 line-through font-medium">{formatCurrency(rawTotal)}</p>}
                                        <p className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(payableAmount)}</p>
                                    </div>
                                </div>
                                <button onClick={onMainPaymentClick} className={`w-full py-3 md:py-5 rounded-xl md:rounded-[24px] font-black text-base md:text-lg text-white shadow-lg md:shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2 ${paymentMethod === 'promptpay' ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-200 hover:shadow-blue-300' : 'bg-slate-800 shadow-slate-300 hover:bg-slate-900'}`}>
                                    {paymentMethod === 'promptpay' ? <><span className="w-5 md:w-6"><IconQrcode size="100%" /></span> แสดง QR</> : <><span className="w-5 md:w-6"><IconCheckCircle size="100%" /></span> รับชำระเงิน</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ✅ Mobile Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-[150] lg:hidden">
                <button onClick={() => setShowMobileCart(true)} className="w-full bg-slate-800 text-white rounded-xl p-3 flex justify-between items-center shadow-lg active:scale-95 transition-transform">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center font-bold text-xs">{(activeTab === 'tables' ? selectedOrder?.order_items?.length : cart.length) || 0}</div>
                        <span className="font-bold text-sm">ดูตะกร้า</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-xs">รวม</span>
                        <span className="text-lg font-black">{formatCurrency(payableAmount)}</span>
                    </div>
                </button>
            </div>

            {/* --- Modals --- */}
            {showCashModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl md:rounded-[32px] shadow-2xl w-full max-w-[360px] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
                        <div className="py-3 md:py-4 border-b border-slate-100 bg-slate-50/50 text-center">
                            <h3 className="text-lg md:text-xl font-black text-slate-800">รับเงินสด</h3>
                        </div>
                        <div className="p-4 md:p-5 space-y-3 md:space-y-4">
                            <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm space-y-2 md:space-y-3">
                                <div className="flex justify-between items-center text-slate-500 text-xs md:text-sm font-bold">
                                    <span>ยอดรวม</span><span className="text-slate-900 text-base md:text-lg">{formatCurrency(payableAmount)}</span>
                                </div>
                                <div className={`flex items-center justify-between border-b-2 py-1 ${receivedAmount < payableAmount ? 'border-orange-500 text-orange-600' : 'border-emerald-500 text-emerald-600'}`}>
                                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">รับเงิน</span>
                                    <span className="text-2xl md:text-3xl font-black">{receivedAmount > 0 ? formatCurrency(receivedAmount).replace('฿', '') : '0'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-slate-500 text-xs md:text-sm font-bold">เงินทอน</span>
                                    <span className={`text-base md:text-lg font-black ${receivedAmount >= payableAmount ? 'text-emerald-600' : 'text-slate-300'}`}>
                                        {receivedAmount >= payableAmount ? formatCurrency(receivedAmount - payableAmount) : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1 md:gap-1.5">
                                {[20, 50, 100, 500, 1000].map(v => (
                                    <button key={v} onClick={() => setReceivedAmount(prev => prev + v)} className="py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[9px] md:text-[10px] text-slate-600 hover:bg-white hover:border-orange-400 hover:text-orange-600 transition-all active:scale-95 shadow-sm">+{v}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button key={num} onClick={() => handleNumPad(num)} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-white border border-slate-100 shadow-sm text-lg md:text-xl font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">{num}</button>
                                ))}
                                <button onClick={() => handleNumPad('C')} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-rose-50 border border-rose-100 text-rose-500 font-bold hover:bg-rose-100 transition-colors">C</button>
                                <button onClick={() => handleNumPad(0)} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-white border border-slate-100 shadow-sm text-lg md:text-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">0</button>
                                <button onClick={() => handleNumPad('DEL')} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"><IconBackspace size={18} /></button>
                            </div>
                            <div className="space-y-2 pt-1">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setReceivedAmount(payableAmount)} className="py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100">จ่ายพอดี</button>
                                    <button onClick={confirmCashPayment} disabled={receivedAmount < payableAmount} className={`py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-sm md:text-base text-white shadow-md transition-all flex items-center justify-center gap-2 ${receivedAmount >= payableAmount ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}>ยืนยัน</button>
                                </div>
                                <button onClick={() => { setShowCashModal(false); if(activeTab==='pos') paimaster.barcodeInputRef.current?.focus(); }} className="w-full text-center text-slate-400 text-[10px] md:text-xs font-bold py-1.5 md:py-2 hover:text-slate-600 transition-colors">ยกเลิก</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showTableSelector && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#F8F9FD] rounded-2xl md:rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/20">
                        <div className="shrink-0 px-4 md:px-8 py-4 md:py-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200"><IconQrcode size={20} /></div>
                                <div><h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">เลือกโต๊ะ</h3><p className="text-slate-500 text-xs md:text-sm font-medium">พิมพ์ QR Code สำหรับสั่งอาหาร</p></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8 overscroll-contain bg-[#F8F9FD] pb-20 md:pb-8">
                            <div className="flex gap-4 mb-4 md:mb-6 px-1 md:px-2 shrink-0">
                                <div className="flex items-center gap-1.5 md:gap-2"><span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span><span className="text-xs md:text-sm font-bold text-slate-600">ว่าง</span></div>
                                <div className="flex items-center gap-1.5 md:gap-2"><span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-400"></span><span className="text-xs md:text-sm font-bold text-slate-400">ไม่ว่าง</span></div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-4">
                                {allTables.map((table:any) => {
                                    const isAvailable = table.status === 'available';
                                    return (
                                        <button key={table.id} onClick={() => handleSelectTableForQR(table)} className={`relative group p-3 md:p-4 rounded-xl md:rounded-[24px] border-2 transition-all duration-200 flex flex-col items-center justify-between min-h-[100px] md:min-h-[140px] cursor-pointer ${isAvailable ? 'bg-white border-white shadow-sm md:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-400 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1' : 'bg-slate-100 border-slate-200 hover:border-slate-300 hover:bg-slate-200'}`}>
                                            <div className="w-full flex justify-end">
                                                <span className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-400'}`}></span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center w-full">
                                                <span className={`text-xl md:text-3xl font-black tracking-tighter ${isAvailable ? 'text-slate-800 group-hover:text-emerald-600' : 'text-slate-500'}`}>{table.label}</span>
                                            </div>
                                            <div className={`w-full py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-center transition-colors ${isAvailable ? 'bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600' : 'bg-white text-slate-400 border border-slate-100'}`}>พิมพ์ QR</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="shrink-0 p-3 md:p-4 bg-white border-t border-slate-100 z-20 pb-safe md:pb-4"> 
                            <button onClick={() => setShowTableSelector(false)} className="w-full py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-slate-100 text-slate-500 text-sm md:text-base font-bold hover:bg-slate-200 hover:text-slate-700 transition-colors">ปิดหน้าต่าง</button>
                        </div>
                    </div>
                </div>
            )}

            {qrTableData && <TableQrModal table={qrTableData} brandId={currentBrand?.id} brandSlug={currentBrand?.slug} qrLogoUrl={getCorrectQrLogo()} onClose={() => setQrTableData(null)} limitStatus={limitStatus} />}
            
            {statusModal.show && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-2xl md:rounded-[48px] p-6 md:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        {statusModal.type === 'qrcode' ? (
                            <div className="space-y-4 md:space-y-6">
                                <div className="flex flex-col items-center gap-1 md:gap-2">
                                    <div className="flex items-center gap-2"><div className="bg-blue-600 p-1 rounded"><div className="w-3 h-2 md:w-4 md:h-3 bg-white/20"></div></div><span className="font-bold text-sm md:text-base text-slate-700">PromptPay</span></div>
                                    <div className="bg-slate-100 px-3 py-1 md:px-4 md:py-1.5 rounded-full"><p className="text-slate-500 font-bold text-xs md:text-sm font-mono tracking-wider">{currentBrand?.promptpay_number || '-'}</p></div>
                                </div>
                                <div className="bg-white p-3 md:p-4 border border-slate-100 rounded-[20px] md:rounded-[32px] inline-block shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                                    <img src={`https://promptpay.io/${currentBrand?.promptpay_number || '0000000000'}/${payableAmount}.png`} className="w-48 h-48 md:w-56 md:h-56 mix-blend-multiply opacity-90" alt="QR" />
                                </div>
                                <div><p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">ยอดเงินที่ต้องโอน</p><p className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(payableAmount)}</p></div>
                                <div className="flex flex-col gap-2 md:gap-3 pt-1 md:pt-2">
                                    <button onClick={async () => { await handlePayment(); setStatusModal(prev => ({ ...prev, show: false })); if(activeTab==='pos') paimaster.barcodeInputRef.current?.focus(); }} className="w-full py-3 md:py-4 bg-emerald-500 text-white rounded-xl md:rounded-[20px] font-black text-base md:text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all">ลูกค้าโอนแล้ว</button>
                                    <button onClick={() => { setStatusModal(prev => ({ ...prev, show: false })); if(activeTab==='pos') paimaster.barcodeInputRef.current?.focus(); }} className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:text-slate-600 p-2">ยกเลิกรายการ</button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 md:py-6 px-2 md:px-4">
                                <div className={`flex justify-center mb-4 md:mb-6 w-16 h-16 md:w-24 md:h-24 mx-auto rounded-full items-center shadow-lg ${statusModal.type === 'success' ? 'bg-green-50 text-green-500 shadow-green-100' : (statusModal.type === 'alert' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : 'bg-red-50 text-red-500 shadow-red-100')}`}>
                                    {statusModal.type === 'success' ? <IconCheckCircle size="50%" /> : (statusModal.type === 'alert' ? <IconLock size="50%" /> : <IconAlertCircle size="50%" />)}
                                </div>
                                <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 text-slate-800 tracking-tight">{statusModal.title}</h3>
                                <p className="text-slate-500 font-medium mb-6 md:mb-8 text-sm md:text-lg leading-relaxed whitespace-pre-line">{statusModal.message}</p>
                                {statusModal.type === 'alert' ? (
                                    <div className="space-y-2 md:space-y-3">
                                        <button onClick={() => router.push('/dashboard/settings')} className="w-full py-3 md:py-4 rounded-xl md:rounded-[20px] font-black text-white text-base md:text-lg bg-gradient-to-r from-orange-500 to-rose-500 active:scale-95 transition-all shadow-lg hover:shadow-orange-200">อัปเกรดเลย</button>
                                        <button onClick={() => setStatusModal(prev => ({ ...prev, show: false }))} className="text-slate-400 font-bold text-xs md:text-sm hover:text-slate-600 p-2">ไว้ทีหลัง</button>
                                    </div>
                                ) : (
                                    <button onClick={() => { setStatusModal(prev => ({ ...prev, show: false })); if(activeTab==='pos') paimaster.barcodeInputRef.current?.focus(); }} className="w-full py-3 md:py-4 rounded-xl md:rounded-[20px] font-black text-white text-base md:text-lg bg-slate-800 active:scale-95 transition-all shadow-lg hover:bg-slate-900">ตกลง</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {variantModalProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setVariantModalProduct(null)}>
                    <div className="bg-white rounded-2xl md:rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden p-6 md:p-8 animate-in slide-in-from-bottom-8 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6 md:mb-8"><h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-center">เลือกขนาด</h3></div>
                        <div className="space-y-2 md:space-y-3">
                            {[
                                { label: 'ธรรมดา', key: 'normal', ...calculatePrice(variantModalProduct, 'normal') },
                                variantModalProduct.price_special && { label: 'พิเศษ ✨', key: 'special', ...calculatePrice(variantModalProduct, 'special') },
                                variantModalProduct.price_jumbo && { label: 'จัมโบ้ 🔥', key: 'jumbo', ...calculatePrice(variantModalProduct, 'jumbo') }
                            ].filter(Boolean).map((opt: any) => (
                                <button key={opt.key} onClick={() => addToCart(variantModalProduct, opt.key)} className="w-full flex justify-between items-center p-3 md:p-5 rounded-xl md:rounded-[24px] border border-slate-100 hover:border-orange-500 hover:bg-orange-50 hover:shadow-md hover:shadow-orange-100 transition-all font-bold text-base md:text-lg group bg-white">
                                    <div className="text-left flex flex-col gap-0.5 md:gap-1">
                                        <span className="text-slate-700 group-hover:text-orange-700 text-sm md:text-lg">{opt.label}</span>
                                        {opt.discount > 0 && <span className="text-[9px] md:text-[10px] text-white bg-rose-500 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md w-fit font-bold shadow-sm">ลด {formatCurrency(opt.discount)}</span>}
                                    </div>
                                    <div className="text-right leading-none">
                                        {opt.final < opt.original && <span className="text-[10px] md:text-xs text-slate-400 line-through font-medium block mb-1">{formatCurrency(opt.original)}</span>}
                                        <span className={`font-black text-xl md:text-2xl ${opt.final < opt.original ? 'text-rose-500' : 'text-slate-800'}`}>{formatCurrency(opt.final)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setVariantModalProduct(null)} className="w-full mt-3 md:mt-4 py-2.5 md:py-3 text-slate-400 text-sm font-bold hover:bg-slate-50 rounded-lg md:rounded-xl">ยกเลิก</button>
                    </div>
                </div>
            )}

            {completedReceipt && <ReceiptModal receipt={completedReceipt} onClose={() => { setCompletedReceipt(null); if(activeTab==='pos') paimaster.barcodeInputRef.current?.focus(); }} />}
            {kitchenOrder && <KitchenTicketModal order={kitchenOrder} onClose={() => setKitchenOrder(null)} autoPrint={false} />}
        </div>
    );
}