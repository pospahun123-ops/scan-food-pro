'use client';

import { useState, useRef, useEffect } from 'react'; 
import { useMarketplace } from '@/hooks/useMarketplace';
import MarketplaceCard from './components/MarketplaceCard';
import { IconGrid, IconArrowLeft, IconArrowRight } from './components/ThemeIcons'; 

// 🛍️ Icon ถุงช้อปปิ้ง
const IconShoppingBag = ({ size = 24, className="" }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
        <path d="M3 6h18"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
);

// 🔍 Icon สำหรับปุ่มเลือก Filter
const IconFilter = ({ size = 16, className = "" }: any) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
);

// ✔️ Icon เช็คถูก
const IconCheckSmall = ({ size = 12, className = "" }: any) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export default function MarketplacePage() {
    const {
        categories, currentThemes, ownedThemeIds, loading,
        currentPage, totalPages, changePage,
        selectedCategory, setSelectedCategory,
        getImageUrl, goToDetails,
        tierFilter, setTierFilter, tierCounts
    } = useMarketplace();

    // ✅ State ควบคุม Dropdown รวมอันเดียว
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // ปิด Dropdown เมื่อคลิกที่อื่น
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const planLabels: any = { ALL: 'All Plans', free: 'Free', basic: 'Basic', pro: 'Pro', ultimate: 'Ultimate' };

    // เช็คว่ามีการใช้ Filter อยู่ไหม (เพื่อแสดงจุดแจ้งเตือนสีแดง)
    const hasActiveFilter = tierFilter !== 'ALL' || selectedCategory !== 'ALL';

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
            
            {/* Header + Filter Button */}
            <div className="w-full bg-white border-b border-slate-100 shadow-sm ">
                <div className="max-w-[1920px] mx-auto px-4 md:px-10 py-3 md:py-4"> 
                    <div className="flex items-center justify-between gap-4"> 
                        
                        {/* ฝั่งซ้าย: โลโก้ และ ชื่อ */}
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0">
                                 <IconShoppingBag size={20} className="md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                                    MARKETPLACE
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                        Official Store
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ฝั่งขวา: ปุ่ม Filter รวม */}
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`relative flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:px-5 md:py-2.5 md:h-auto rounded-xl md:rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border ${
                                    isFilterOpen || hasActiveFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <IconFilter size={14} className="shrink-0" />
                                <span className="hidden md:inline">Filters</span>
                                {hasActiveFilter && (
                                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 border-2 border-white shadow-sm"></span>
                                )}
                            </button>

                            {/* 📱 Dropdown Modal (รวม Plan + Category) */}
                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 md:w-72 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 p-2 z-[100] animate-in zoom-in-95 duration-200 origin-top-right flex flex-col max-h-[70vh]">
                                    
                                    <div className="overflow-y-auto no-scrollbar">
                                        {/* --- Section 1: PLANS --- */}
                                        <div className="px-3 pt-2 pb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter by Plan</span>
                                        </div>
                                        {['ALL', 'free', 'basic', 'pro', 'ultimate'].map(tier => (
                                            <button 
                                                key={tier}
                                                onClick={() => { setTierFilter(tier); setIsFilterOpen(false); }}
                                                className={`w-full flex justify-between items-center px-3 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-colors ${tierFilter === tier ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {tierFilter === tier ? <IconCheckSmall className="text-blue-600" /> : <div className="w-3" />}
                                                    {planLabels[tier]}
                                                </div>
                                                <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${tierFilter === tier ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {tierCounts[tier.toUpperCase() as keyof typeof tierCounts] || 0}
                                                </span>
                                            </button>
                                        ))}

                                        <div className="h-[1px] bg-slate-100 mx-2 my-2"></div>

                                        {/* --- Section 2: CATEGORIES --- */}
                                        <div className="px-3 pt-2 pb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categories</span>
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedCategory('ALL'); setIsFilterOpen(false); }}
                                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-colors ${selectedCategory === 'ALL' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {selectedCategory === 'ALL' ? <IconCheckSmall className="text-blue-600" /> : <div className="w-3" />}
                                            All Items
                                        </button>
                                        {categories.map((cat: any) => (
                                            <button 
                                                key={cat.id}
                                                onClick={() => { setSelectedCategory(cat.id); setIsFilterOpen(false); }}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${selectedCategory === cat.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {selectedCategory === cat.id ? <IconCheckSmall className="text-blue-600" /> : <div className="w-3" />}
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>

                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1920px] mx-auto px-2 md:px-10 mt-4 md:mt-6 min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* แสดงสรุปจำนวนหน้าที่กำลังดู */}
                <div className="mb-4 flex justify-between md:justify-end items-center px-1">
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        SHOWING {currentThemes.length} RESULTS (PAGE {currentPage}/{totalPages || 1})
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-40">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Loading Store...</span>
                        </div>
                    </div>
                ) : currentThemes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 md:py-32 opacity-50 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 mx-4 md:mx-0">
                        <IconGrid />
                        <p className="mt-4 text-sm font-bold text-slate-400">NO ITEMS FOUND</p>
                        <p className="text-xs text-slate-300 mt-1">Try changing the filters</p>
                    </div>
                ) : (
                    /* Grid แสดงผล 3 คอลัมน์จิ๋วๆ ในมือถือ */
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-6 xl:gap-8 justify-items-center w-full px-1 sm:px-0 pb-24 md:pb-20 relative z-10">
                        {currentThemes.map((theme: any) => (
                            <MarketplaceCard 
                                key={theme.id}
                                theme={theme}
                                isOwned={ownedThemeIds.includes(theme.id)}
                                getImageUrl={getImageUrl}
                                onClick={() => goToDetails(theme.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-white/90 backdrop-blur-md p-2 pl-4 md:pl-6 pr-2 rounded-full shadow-2xl border border-slate-200 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700 max-w-[90vw]">
                         <span className="text-[9px] md:text-[10px] font-black text-slate-400 mr-1 md:mr-2 whitespace-nowrap hidden sm:inline">PAGE NAVIGATION</span>
                        <div className="flex items-center gap-1 md:gap-2">
                             <button onClick={() => changePage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><IconArrowLeft /></button>
                             <div className="flex gap-1 px-1 md:px-2 overflow-x-auto no-scrollbar max-w-[150px] md:max-w-none">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => changePage(page)} className={`w-8 h-8 rounded-full text-[10px] font-black transition-all flex items-center justify-center shrink-0 ${currentPage === page ? 'bg-slate-900 text-white scale-110 shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{page}</button>
                                ))}
                            </div>
                            <button onClick={() => changePage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><IconArrowRight /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}