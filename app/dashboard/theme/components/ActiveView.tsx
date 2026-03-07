import { useState, useRef, useEffect } from 'react'; 
import ThemeCard from './ThemeCard';
import { IconGrid, IconArrowLeft, IconArrowRight, IconFilter } from './ThemeIcons'; 

export default function ActiveView({ 
  themes, currentConfig, applyingId, isOwner, onApply, getImageUrl, 
  currentPage, totalPages, changePage,
  categories, selectedCategory, handleCategoryChange 
}: any) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCategoryName = selectedCategory === 'ALL' 
    ? 'All Themes' 
    : categories?.find((c: any) => c.id === selectedCategory)?.name || 'Filter';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="mb-4 md:mb-8 flex justify-between items-center border-b border-slate-100 pb-3 md:pb-5">
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border ${
                        isFilterOpen || selectedCategory !== 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-slate-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                >
                    <IconFilter size={12} />
                    {selectedCategoryName}
                    <svg className={`ml-1 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {isFilterOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in zoom-in-95 duration-200 origin-top-left">
                        <button 
                            onClick={() => { handleCategoryChange('ALL'); setIsFilterOpen(false); }}
                            className={`w-full text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${selectedCategory === 'ALL' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            All Themes
                        </button>
                        <div className="h-[1px] bg-slate-100 mx-3 my-1"></div>
                        {categories?.map((cat: any) => (
                            <button 
                                key={cat.id}
                                onClick={() => { handleCategoryChange(cat.id); setIsFilterOpen(false); }}
                                className={`w-full text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${selectedCategory === cat.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase hidden md:block">
                Page {currentPage} of {totalPages || 1}
            </p>
        </div>

        {themes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-40">
                <IconGrid />
                <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">No themes found</p>
            </div>
        ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-6 xl:gap-8 justify-items-center w-full px-1 sm:px-0">
                {themes.map((theme: any) => {
                    const mkt = theme.marketplace_themes;
                    const isActive = currentConfig?.slug === mkt.slug && currentConfig?.mode === mkt.theme_mode;
                    return (
                        <ThemeCard 
                            key={theme.id} 
                            theme={theme} 
                            isActive={isActive} 
                            applyingId={applyingId}
                            isOwner={isOwner}
                            onApply={onApply}
                            getImageUrl={getImageUrl}
                        />
                    );
                })}
            </div>
        )}
        
        {totalPages > 1 && (
            <div className="mt-12 md:mt-20 flex justify-center items-center gap-3 md:gap-4 pb-10">
                <button onClick={() => changePage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"><IconArrowLeft /></button>
                <div className="flex gap-1 md:gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => changePage(page)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-xs font-black transition-all flex items-center justify-center ${currentPage === page ? 'bg-slate-900 text-white shadow-lg shadow-slate-300 scale-110' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{page}</button>
                    ))}
                </div>
                <button onClick={() => changePage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"><IconArrowRight /></button>
            </div>
        )}
    </div>
  );
}