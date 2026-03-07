'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Script from 'next/script';
import { useThemeDetail } from '@/hooks/useThemeDetail';
import { createCreditCardCharge } from '@/app/actions/omiseActions';
import { installThemeAction } from '@/app/actions/marketplaceDetailActions';

// --- Icons ---
// --- Icons (อัปเดตให้รองรับการรับค่า props เพื่อแก้ปัญหา TypeScript) ---
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;

// ✅ อัปเดต IconMobile ให้รับ size ได้
const IconMobile = ({ size = 16, className = "" }: any) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/>
    </svg>
);

// ✅ อัปเดต IconTablet ให้รับ size ได้
const IconTablet = ({ size = 16, className = "" }: any) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/>
    </svg>
);

const IconCheck = ({ size = 16, strokeWidth = 2.5, className = "" }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

const IconShare = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconX = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconQr = ({ size = 20 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconCreditCard = ({ size = 20 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconChevronLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const IconChevronRight = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
declare global { interface Window { Omise: any; } }

type PlanType = 'weekly' | 'monthly' | 'yearly';

export default function ThemeDetailPage() {
    const {
        theme, loading, ownership, processing, userRole,
        viewMode, setViewMode, activeImage, setActiveImage, displayImages,
        getImageUrl, handleGetTheme, handleShare, router,
        showPaymentModal, qrCode, paymentStatus, closePaymentModal
    } = useThemeDetail();

    const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
    const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'credit_card'>('promptpay');
    const [ccLoading, setCcLoading] = useState(false);
    
    const carouselRef = useRef<HTMLDivElement>(null);

    const cardNumberRef = useRef<HTMLInputElement>(null);
    const cardNameRef = useRef<HTMLInputElement>(null);
    const cardExpiryRef = useRef<HTMLInputElement>(null);
    const cardCvcRef = useRef<HTMLInputElement>(null);

    // ✅ รวบรวมข้อมูลแพ็กเกจที่มี เพื่อนำมาทำ Slider
    const availablePlans = useMemo(() => {
        if (!theme) return [];
        const plans = [];
        if (theme.price_weekly !== null) plans.push({ id: 'weekly', label: 'รายสัปดาห์', price: theme.price_weekly, desc: 'เรียกเก็บเงินทุกๆ 7 วัน' });
        if (theme.price_monthly !== null) plans.push({ id: 'monthly', label: 'รายเดือน', price: theme.price_monthly, desc: 'เรียกเก็บเงินทุกๆ 30 วัน' });
        if (theme.price_yearly !== null) plans.push({ id: 'yearly', label: 'รายปี', price: theme.price_yearly, desc: 'เรียกเก็บเงินทุกๆ 365 วัน' });
        return plans;
    }, [theme]);

    // ✅ หา Index ปัจจุบันที่กำลังเลือกอยู่ เพื่อใช้เลื่อนสไลด์
    const activeIndex = Math.max(0, availablePlans.findIndex(p => p.id === selectedPlan));

    // ตรวจสอบ Plan เริ่มต้นเมื่อโหลดธีมเสร็จ
    useEffect(() => {
        if (availablePlans.length > 0 && !availablePlans.find(p => p.id === selectedPlan)) {
            setSelectedPlan(availablePlans[0].id as PlanType);
        }
    }, [availablePlans, selectedPlan]);

    const getCurrentPrice = () => {
        const plan = availablePlans.find(p => p.id === selectedPlan);
        return plan ? plan.price : 0;
    };

    const currentPrice = getCurrentPrice();

    const handlePurchaseClick = () => {
        handleGetTheme(selectedPlan);
    };

    const handleScroll = () => {
        if (carouselRef.current) {
            const scrollPosition = carouselRef.current.scrollLeft;
            const containerWidth = carouselRef.current.clientWidth;
            const newIndex = Math.round(scrollPosition / containerWidth);
            if (displayImages[newIndex] && displayImages[newIndex] !== activeImage) {
                setActiveImage(displayImages[newIndex]);
            }
        }
    };

    const scrollPrev = () => {
        if (carouselRef.current) {
            const containerWidth = carouselRef.current.clientWidth;
            carouselRef.current.scrollBy({ left: -containerWidth, behavior: 'smooth' });
        }
    };

    const scrollNext = () => {
        if (carouselRef.current) {
            const containerWidth = carouselRef.current.clientWidth;
            carouselRef.current.scrollBy({ left: containerWidth, behavior: 'smooth' });
        }
    };

    const scrollToImage = (index: number) => {
        if (carouselRef.current) {
            const containerWidth = carouselRef.current.clientWidth;
            carouselRef.current.scrollTo({
                left: index * containerWidth,
                behavior: 'smooth'
            });
            setActiveImage(displayImages[index]);
        }
    };

    const handleCreditCardPaymentInternal = async (e: React.FormEvent) => {
        e.preventDefault();
        setCcLoading(true);
        try {
            window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY);
            const cardData = {
                name: cardNameRef.current?.value,
                number: cardNumberRef.current?.value?.replace(/\s/g, ''),
                expiration_month: cardExpiryRef.current?.value?.split('/')[0].trim(),
                expiration_year: cardExpiryRef.current?.value?.split('/')[1].trim(),
                security_code: cardCvcRef.current?.value,
            };

            window.Omise.createToken('card', cardData, async (status: number, resp: any) => {
                if (status === 200) {
                    const res = await createCreditCardCharge(currentPrice, resp.id, theme.id, selectedPlan);
                    if (res.success) {
                        await installThemeAction(theme.id, res.chargeId ?? null, selectedPlan);
                        window.location.reload();
                    } else {
                        alert(res.error || "ชำระเงินไม่สำเร็จ");
                    }
                } else {
                    alert(resp.message || "ข้อมูลบัตรไม่ถูกต้อง");
                }
                setCcLoading(false);
            });
        } catch (err) {
            setCcLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-medium tracking-wide">กำลังโหลด...</div>;
    if (!theme) return <div className="min-h-screen flex items-center justify-center text-red-500 font-medium">ไม่พบธีมที่ค้นหา</div>;

    const isActive = ownership.isOwned && !ownership.isExpired;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24 text-slate-900">
            <Script src="https://cdn.omise.co/omise.js" strategy="lazyOnload" />
            
            {/* Navbar */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
                    <button onClick={() => router.push('/dashboard/marketplace')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-xs md:text-sm font-bold bg-slate-100/50 px-3 py-1.5 rounded-lg active:scale-95">
                        <IconArrowLeft /> ย้อนกลับ
                    </button>
                    <button onClick={handleShare} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all active:scale-95">
                        <IconShare />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-start">
                
                {/* --- Left: Preview Gallery --- */}
                <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6 items-center lg:sticky lg:top-24 w-full">
                     <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm w-full max-w-[250px] md:max-w-[300px]">
                        <button onClick={() => setViewMode('mobile')} className={`flex-1 py-2 md:py-2.5 rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'mobile' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <IconMobile /> มือถือ
                        </button>
                        <button onClick={() => setViewMode('ipad')} className={`flex-1 py-2 md:py-2.5 rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'ipad' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <IconTablet /> แท็บเล็ต
                        </button>
                    </div>

                    <div className="relative w-full max-w-[300px] md:max-w-[440px] flex items-center justify-center group">
                        {displayImages.length > 1 && (
                            <button onClick={scrollPrev} className="absolute -left-4 md:-left-8 z-30 hidden md:flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg text-slate-600 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100">
                                <IconChevronLeft />
                            </button>
                        )}
                        <div className="relative w-full max-w-[240px] md:max-w-[340px] overflow-hidden">
                            <div ref={carouselRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full py-4" style={{ scrollBehavior: 'smooth' }}>
                                {displayImages.map((img, idx) => (
                                    <div key={idx} className="w-full flex-shrink-0 snap-center flex justify-center items-center px-2">
                                        {viewMode === 'mobile' ? (
                                            <div className="relative w-[180px] md:w-[260px] aspect-[9/19.5]">
                                                <div className="relative h-full w-full rounded-[2.5rem] md:rounded-[3.5rem] p-[2px] md:p-[3px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] border ring-1 ring-[#111] z-10 overflow-hidden bg-[#363535] border-[#555]">
                                                    <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[3.5rem] border-[1px] border-white/20 pointer-events-none z-20"></div>
                                                    <div className="relative w-full h-full bg-black rounded-[2.3rem] md:rounded-[3.2rem] overflow-hidden border-[3px] md:border-[4px] border-black">
                                                        <div className="absolute top-[6px] md:top-[10px] left-1/2 -translate-x-1/2 w-[35%] h-[18px] md:h-[26px] bg-black rounded-full z-50 flex items-center justify-between px-1.5 md:px-2 shadow-sm pointer-events-none">
                                                            <div className="w-[30%] h-[60%] bg-[#1a1a1a]/80 rounded-full blur-[0.5px]"></div>
                                                            <div className="w-[20%] h-[60%] bg-[#252525]/80 rounded-full blur-[0.5px]"></div>
                                                        </div>
                                                        <img src={getImageUrl(img)!} className="w-full h-full object-cover" alt={`รูปตัวอย่าง ${idx + 1}`} loading="lazy" />
                                                        <div className="absolute bottom-1.5 md:bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-1 bg-white/40 rounded-full backdrop-blur-md z-40"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative w-[220px] md:w-[320px] aspect-[3/4]">
                                                <div className="relative h-full w-full rounded-[1.5rem] md:rounded-[2rem] p-[4px] md:p-[6px] shadow-2xl shadow-slate-300/50 border ring-1 ring-[#111] z-10 overflow-hidden bg-[#363535] border-[#555]">
                                                    <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] border-[1px] border-white/20 pointer-events-none z-20"></div>
                                                    <div className="relative w-full h-full bg-black rounded-[1.2rem] md:rounded-[1.6rem] overflow-hidden border-[3px] md:border-[4px] border-black">
                                                        <img src={getImageUrl(img)!} className="w-full h-full object-cover" alt={`รูปตัวอย่าง ${idx + 1}`} loading="lazy" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {displayImages.length > 1 && (
                            <button onClick={scrollNext} className="absolute -right-4 md:-right-8 z-30 hidden md:flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg text-slate-600 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100">
                                <IconChevronRight />
                            </button>
                        )}
                    </div>

                    {displayImages.length > 1 && (
                        <div className="flex gap-2 items-center justify-center mt-2">
                            {displayImages.map((img, idx) => (
                                <button key={idx} onClick={() => scrollToImage(idx)} className={`h-2 transition-all rounded-full ${activeImage === img ? 'w-6 bg-slate-800' : 'w-2 bg-slate-300 hover:bg-slate-400'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Right: Details & Action --- */}
                <div className="lg:col-span-5 flex flex-col pb-8">
                    
                    <div className="mb-6 md:mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider border border-blue-100">{theme.marketplace_categories?.name || 'ทั่วไป'}</span>
                            <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">โหมด {theme.theme_mode}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">{theme.name}</h1>
                        <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                            {theme.description || 'สัมผัสประสบการณ์ดีไซน์ที่ทันสมัย รองรับทุกหน้าจอ ออกแบบมาเพื่อเพิ่มยอดขายให้กับร้านค้าของคุณโดยเฉพาะ'}
                        </p>
                    </div>

                    {/* ✅ ส่วนราคา */}
                    <div className="mb-8">
                        {isActive ? (
                            <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl shadow-sm">
                                <div className="p-2.5 bg-emerald-500 text-white rounded-full shadow-md"><IconCheck size={20} /></div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">แพ็กเกจปัจจุบันของคุณ</p>
                                    <p className="text-xs font-medium mt-0.5 opacity-80">แพ็กเกจจะหมดอายุในอีก <span className="font-bold">{ownership.daysLeft} วัน</span></p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* 1. Toggle Switch แบบแอนิเมชันสไลด์ก้อนขาวๆ */}
                                {availablePlans.length > 0 && (
                                    <div className="relative bg-slate-200/70 p-1.5 rounded-2xl flex items-center shadow-inner isolate">
                                        <div 
                                            className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 z-0"
                                            style={{
                                                width: `calc(${100 / availablePlans.length}% - 4px)`,
                                                transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
                                                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                                            }}
                                        />
                                        
                                        {availablePlans.map((plan) => (
                                            <button 
                                                key={plan.id}
                                                onClick={() => setSelectedPlan(plan.id as PlanType)}
                                                disabled={!userRole.isOwner}
                                                className={`relative flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors duration-300 z-10 ${
                                                    selectedPlan === plan.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                {plan.label}
                                                {plan.id === 'yearly' && selectedPlan !== 'yearly' && (
                                                    <span className="absolute top-2 right-4 bg-emerald-500 w-1.5 h-1.5 rounded-full shadow-sm"></span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* ✅ 2. Hero Price Card (ตัวเลขสไลด์ซ้าย-ขวา) */}
                                <div className="relative bg-white border-2 border-slate-900 rounded-[2rem] p-6 md:p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 group">
                                    
                                    {/* พื้นหลังฟุ้งๆ */}
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20 blur-3xl pointer-events-none transition-colors duration-700 ${selectedPlan === 'yearly' ? 'bg-emerald-400' : selectedPlan === 'monthly' ? 'bg-blue-400' : 'bg-slate-400'}`}></div>

                                    {/* ป้ายแจ้งเตือนด้านบน (คงที่ ไม่สไลด์) */}
                                    <div className="h-6 flex justify-center items-center mb-3">
                                        {selectedPlan === 'yearly' && <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-emerald-200 animate-pulse">⭐ คุ้มค่าที่สุด</span>}
                                        {selectedPlan === 'monthly' && <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-blue-200">🔥 ยอดนิยม</span>}
                                    </div>

                                    {/* ✅ โซนราคาและคำอธิบาย (ใช้ Flex ทำ Sliding) */}
                                    <div className="relative w-full overflow-hidden h-[100px] md:h-[120px]">
                                        <div 
                                            className="flex flex-row items-center w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                                        >
                                            {availablePlans.map((plan) => (
                                                <div key={plan.id} className="w-full flex-shrink-0 flex flex-col justify-center items-center">
                                                    {/* ราคา */}
                                                    <div className="flex items-end justify-center gap-1 relative z-10">
                                                        <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                                                            ฿{(plan.price ?? 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* คำอธิบาย */}
                                                    <p className="text-slate-500 text-[11px] md:text-xs font-bold tracking-wide mt-2 relative z-10">
                                                        {plan.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-16 h-1 bg-slate-100 mx-auto rounded-full mt-4 mb-6"></div>

                                    {/* Micro Features */}
                                    <div className="flex flex-col gap-3 text-left w-full max-w-[220px] mx-auto relative z-10">
                                        <div className="flex items-center gap-3 text-[11px] md:text-xs font-bold text-slate-700">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600"><IconCheck size={12} strokeWidth={3} /></div> 
                                            ยกเลิกได้ตลอดเวลา
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] md:text-xs font-bold text-slate-700">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600"><IconCheck size={12} strokeWidth={3} /></div> 
                                            เข้าถึงทุกฟีเจอร์แบบพรีเมียม
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                    {/* Features List */}
                    <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">สิ่งที่คุณจะได้รับ</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-700"><div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 scale-90"><IconCheck size={14}/></div> ติดตั้งผ่านระบบอัตโนมัติทันที</li>
                            <li className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-700"><div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 scale-90"><IconMobile size={14}/></div> รองรับการแสดงผลทุกขนาดหน้าจอ</li>
                        </ul>
                    </div>

                    {/* Checkout Button */}
                    <div className="pt-2 sticky bottom-4 z-40 lg:static">
                        {isActive ? (
                            <button onClick={() => router.push('/dashboard/theme')} className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-slate-800 shadow-lg active:scale-95 transition-all">ไปที่หน้าจัดการธีม</button>
                        ) : (
                            <button onClick={handlePurchaseClick} disabled={processing || !userRole.isOwner} className={`w-full py-4 md:py-5 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl transition-all flex justify-center items-center gap-2 active:scale-95 ${!userRole.isOwner ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-blue-200'}`}>
                                {processing ? <span className="animate-pulse">กำลังดำเนินการ...</span> : <span>ดำเนินการชำระเงิน</span>}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-[28px] md:rounded-[24px] shadow-2xl w-full max-w-[400px] relative animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <button onClick={closePaymentModal} disabled={paymentStatus === 'successful'} className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-0 z-20">
                            <IconX />
                        </button>
                        
                        <div className="p-6 md:p-8 flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner mb-2">
                                <IconCreditCard size={32} />
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-slate-900">ชำระเงิน</h3>
                                <p className="text-sm text-slate-500 mt-1">แพ็กเกจ{selectedPlan === 'weekly' ? 'รายสัปดาห์' : selectedPlan === 'monthly' ? 'รายเดือน' : 'รายปี'}</p>
                                <p className="text-3xl font-black text-slate-900 mt-2">฿{currentPrice.toLocaleString()}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full p-1.5 bg-slate-100 rounded-xl">
                                <button onClick={() => setPaymentMethod('promptpay')} className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'promptpay' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
                                    <IconQr size={16}/> พร้อมเพย์
                                </button>
                                <button onClick={() => setPaymentMethod('credit_card')} className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'credit_card' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
                                    <IconCreditCard size={16}/> บัตรเครดิต
                                </button>
                            </div>

                            <div className="w-full">
                                {paymentMethod === 'promptpay' ? (
                                    <div className="flex flex-col items-center gap-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                            {qrCode ? (
                                                <img src={qrCode} alt="QR Code สำหรับชำระเงิน" className="w-full aspect-square object-contain rounded-lg" />
                                            ) : (
                                                <div className="w-48 h-48 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg animate-pulse text-xs font-bold">กำลังสร้าง QR Code...</div>
                                            )}
                                        </div>
                                        {paymentStatus === 'successful' ? (
                                            <div className="w-full py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><IconCheck /> ชำระเงินสำเร็จ!</div>
                                        ) : (
                                            <div className="text-slate-400 text-xs font-bold animate-pulse uppercase tracking-wider">กำลังรอการสแกน...</div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleCreditCardPaymentInternal} className="flex flex-col gap-4 text-left w-full">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">หมายเลขบัตร</label>
                                            <input ref={cardNumberRef} type="text" placeholder="0000 0000 0000 0000" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ชื่อบนบัตร</label>
                                            <input ref={cardNameRef} type="text" placeholder="SOMCHAI JAI-DEE" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 uppercase transition-all placeholder:text-slate-300" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">วันหมดอายุ</label>
                                                <input ref={cardExpiryRef} type="text" placeholder="MM/YY" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">CVC</label>
                                                <input ref={cardCvcRef} type="tel" placeholder="123" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" required />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={ccLoading} className="mt-4 w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-slate-200">
                                            {ccLoading ? 'กำลังประมวลผล...' : `ชำระเงิน ฿${currentPrice.toLocaleString()}`}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}