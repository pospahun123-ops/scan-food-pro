import { IconCheck } from './ThemeIcons';

interface MarketplaceCardProps {
    theme: any;
    isOwned: boolean;
    getImageUrl: (path: string) => string;
    onClick: () => void;
}

export default function MarketplaceCard({ theme, isOwned, getImageUrl, onClick }: MarketplaceCardProps) {
    
    // 🎨 ฟังก์ชันเลือกสีป้ายตาม Plan (ปรับขนาด Text และ Padding ให้จิ๋วลงในมือถือ)
    const renderTierBadge = () => {
        if (isOwned) {
            return (
                <span className="inline-flex items-center gap-0.5 md:gap-1 text-[7px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 md:px-3 md:py-1 rounded-full border border-emerald-100 shadow-sm">
                    <IconCheck size={8} className="md:w-3.5 md:h-3.5 stroke-[3px]" /> OWNED
                </span>
            );
        }

        const plan = theme.min_plan?.toLowerCase() || 'free';

        switch (plan) {
            case 'ultimate':
                return (
                    <span className="inline-flex items-center gap-0.5 md:gap-1 text-[7px] md:text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 md:px-3 md:py-1 rounded-full border border-rose-100 shadow-sm">
                        🔥 ULTIMATE
                    </span>
                );
            case 'pro':
                return (
                    <span className="inline-flex items-center gap-0.5 md:gap-1 text-[7px] md:text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 md:px-3 md:py-1 rounded-full border border-indigo-100 shadow-sm">
                        ✨ PRO PLAN
                    </span>
                );
            case 'basic':
                return (
                    <span className="inline-flex items-center gap-0.5 md:gap-1 text-[7px] md:text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 md:px-3 md:py-1 rounded-full border border-blue-100 shadow-sm">
                        🔹 BASIC
                    </span>
                );
            default: // Free
                return (
                    <span className="inline-flex items-center gap-0.5 md:gap-1 text-[7px] md:text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 md:px-3 md:py-1 rounded-full border border-slate-200 shadow-sm">
                        🎁 FREE
                    </span>
                );
        }
    };

    // แสดงราคาเสริม
    const renderPriceInfo = () => {
        if (isOwned) return null;

        const monthly = Number(theme.price_monthly || 0);
        const lifetime = Number(theme.price_lifetime || 0);

        if (monthly > 0 || lifetime > 0) {
            return (
                <div className="text-[7px] md:text-[9px] text-slate-400 font-bold mt-0.5 md:mt-1">
                    OR BUY: {monthly > 0 && `$${monthly}/mo`} {lifetime > 0 && ` • $${lifetime} Life`}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="group flex flex-col items-center cursor-pointer w-full" onClick={onClick}>
            {/* รูปทรงมือถือ (ปรับ Max-W เหลือ 115px สำหรับ 3 คอลัมน์) */}
            <div className="relative w-full aspect-[9/19.5] transition-all duration-500 group-hover:-translate-y-4 max-w-[115px] sm:max-w-[160px] md:max-w-[240px] xl:max-w-[280px]">
                
                {/* Glow Effect */}
                {isOwned ? (
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl md:blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 md:translate-y-10 scale-90"></div>
                ) : theme.min_plan === 'ultimate' ? (
                    <div className="absolute inset-0 bg-rose-500/20 blur-xl md:blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 md:translate-y-10 scale-90"></div>
                ) : null}

                {/* กรอบนอก */}
                <div className={`relative h-full w-full rounded-[1.5rem] md:rounded-[3.5rem] p-[1.5px] md:p-[4px] shadow-[0_0_2px_rgba(0,0,0,0.3),0_10px_20px_-10px_rgba(0,0,0,0.4)] border ring-1 ring-[#111] z-10 overflow-hidden transition-colors duration-500 bg-[#363535] border-[#555] group-hover:border-slate-400`}>
                    <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[3.5rem] border-[1px] border-white/20 pointer-events-none z-20"></div>
                    
                    {/* ขอบใน (หน้าจอ) */}
                    <div className="relative w-full h-full bg-black rounded-[1.3rem] md:rounded-[3.2rem] overflow-hidden border-[2px] md:border-[5px] border-black">
                        
                        {/* Notch ไซส์จิ๋ว */}
                        <div className="absolute top-[4px] md:top-[12px] left-1/2 -translate-x-1/2 w-[35%] h-[10px] md:h-[24px] bg-black rounded-full z-50 flex items-center justify-between px-1 md:px-2 shadow-sm pointer-events-none">
                            <div className="w-[30%] h-[60%] bg-[#1a1a1a]/80 rounded-full blur-[0.2px] md:blur-[0.5px]"></div>
                            <div className="w-[20%] h-[60%] bg-[#252525]/80 rounded-full blur-[0.2px] md:blur-[0.5px]"></div>
                        </div>
                        
                        {/* Image */}
                        <img src={getImageUrl(theme.image_url)} loading="lazy" className="w-full h-full object-cover object-top transition-transform duration-[2s] ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100" alt={theme.name} />
                        
                        {/* Overlay "View Details" */}
                        {!isOwned && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px] md:backdrop-blur-[2px] z-30">
                                <div className="bg-white px-2 py-1 md:px-4 md:py-2 rounded-full font-bold text-[7px] md:text-xs shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                    View Details
                                </div>
                            </div>
                        )}

                         {/* Icon Check (Owned) ย่อส่วนให้เล็กลง */}
                         {isOwned && (
                             <div className="absolute top-2 right-2 md:top-4 md:right-4 z-30 bg-emerald-500 text-white p-1 md:p-1.5 rounded-full shadow-lg border-2 border-[#363535]">
                                <IconCheck size={8} className="md:w-3 md:h-3 stroke-[4px]" />
                             </div>
                         )}

                        {/* เส้นล่างจอ */}
                        <div className="absolute bottom-1 md:bottom-2.5 left-1/2 -translate-x-1/2 w-[35%] h-[2px] md:h-1 bg-white/40 rounded-full backdrop-blur-md z-40"></div>
                    </div>
                </div>
            </div>

            {/* Info ด้านล่าง */}
            <div className="mt-2 md:mt-6 w-full max-w-[115px] md:max-w-[280px] text-center px-1">
                <h3 className="text-[9px] md:text-sm font-black text-slate-800 leading-tight uppercase truncate">{theme.name}</h3>
                
                {/* ป้าย Plan Badge */}
                <div className="mt-1 md:mt-2 mb-1.5 md:mb-2 h-4 md:h-6 flex items-center justify-center">
                    {renderTierBadge()}
                </div>
                
                {/* ราคาเสริม */}
                {renderPriceInfo()}
                
                {/* ปุ่มกด (ย่อให้บางลง) */}
                <button
                    className={`mt-1.5 md:mt-3 w-full py-1.5 md:py-3 rounded-md md:rounded-xl font-black text-[7px] md:text-[11px] uppercase tracking-[0.05em] md:tracking-[0.15em] transition-all relative
                        ${isOwned 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default' 
                            : 'bg-slate-900 text-white border border-slate-900 hover:bg-blue-600 hover:border-blue-600 hover:shadow-lg shadow-blue-200 active:scale-95'
                        }
                    `}
                >
                    {isOwned ? 'INSTALLED' : 'GET THEME'}
                </button>
            </div>
        </div>
    );
}