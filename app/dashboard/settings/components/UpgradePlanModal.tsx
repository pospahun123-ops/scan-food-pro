import { useRef, useState, useEffect } from 'react';
import { PLANS } from '../constants';
import { IconCrown, IconClose, IconQr, IconCreditCard, IconCheck } from './Icons';

interface Props {
  show: boolean;
  onClose: () => void;
  period: string;
  setPeriod: (p: string) => void;
  paymentMethod: 'credit_card' | 'promptpay';
  setPaymentMethod: (m: 'credit_card' | 'promptpay') => void;
  currentPlanKey: string;
  submitting: boolean;
  handleUpgradePlan: (planKey: string, method: string) => void;
}

// 🌟 1. กำหนดลำดับขั้น (Rank) ของแพ็กเกจ เพื่อเอาไว้เปรียบเทียบ
const PLAN_RANKS: Record<string, number> = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'ultimate': 3
};

export default function UpgradePlanModal({ 
  show, onClose, period, setPeriod, paymentMethod, setPaymentMethod, 
  currentPlanKey, submitting, handleUpgradePlan 
}: Props) {
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // 🌟 2. หา Rank ปัจจุบันของร้าน
  const currentRank = PLAN_RANKS[currentPlanKey] ?? 0;
  const allPlans = ['free', 'basic', 'pro', 'ultimate'] as const;
  
  // 🌟 3. กรอง (Filter) เอาเฉพาะแพ็กเกจที่ระดับเท่ากันหรือสูงกว่า
  const plansList = allPlans.filter(plan => PLAN_RANKS[plan] >= currentRank);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.65; 
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.clientWidth * 0.65;
      const newIndex = Math.round(scrollLeft / cardWidth);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < plansList.length) {
        setActiveIndex(newIndex);
      }
    }
  };

  // รีเซ็ตตำแหน่งเวลาเปิด Modal
  useEffect(() => {
     if (show) setActiveIndex(0);
  }, [show, plansList.length]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500" onClick={onClose}></div>
        
        <div className="bg-[#F8FAFC] w-full md:max-w-6xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[32px] md:rounded-[40px] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500 ease-out">
            
            <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center shrink-0 z-30">
               <div className="flex items-center gap-3">
                   <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/50">
                       <IconCrown size={22}/>
                   </div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">อัปเกรดแพ็กเกจ</h2>
               </div>
               <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all duration-300">
                   <IconClose size={18} />
               </button>
            </div>
            
            <div className="relative z-20 px-4 py-3 bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-100">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center max-w-4xl mx-auto">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto h-12 shadow-inner">
                        <button onClick={() => setPeriod('monthly')} className={`flex-1 sm:flex-none px-6 rounded-xl text-xs font-bold transition-all duration-300 ${period === 'monthly' ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.06)] scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}>รายเดือน</button>
                        <button onClick={() => setPeriod('yearly')} className={`flex-1 sm:flex-none px-6 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${period === 'yearly' ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.06)] scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}>
                            รายปี <span className="text-[9px] bg-gradient-to-r from-emerald-400 to-emerald-500 text-white px-2 py-0.5 rounded-md shadow-sm animate-pulse">-20%</span>
                        </button>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto h-12">
                        {['promptpay', 'credit_card'].map((method) => (
                            <button key={method} onClick={() => setPaymentMethod(method as any)} className={`flex-1 sm:flex-none px-4 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${paymentMethod === method ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md shadow-indigo-100/50' : 'border-transparent bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                               {method === 'promptpay' ? <IconQr size={16}/> : <IconCreditCard size={16}/>} {method.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative flex-1 bg-slate-50/80 overflow-hidden flex flex-col">
               <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />

               {/* ซ่อนลูกศรถ้ามีแพ็กเกจให้เลือกแค่ 1 อัน */}
               {plansList.length > 1 && (
                 <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 flex justify-between z-40 pointer-events-none md:hidden">
                     <button onClick={() => scroll('left')} className={`pointer-events-auto w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md shadow-[0_8px_20px_rgb(0,0,0,0.15)] border border-slate-100 rounded-full text-indigo-600 hover:scale-110 active:scale-95 transition-all duration-300 ${activeIndex === 0 ? 'opacity-0 scale-75' : 'opacity-100'}`}>
                         <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
                     </button>
                     <button onClick={() => scroll('right')} className={`pointer-events-auto w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md shadow-[0_8px_20px_rgb(0,0,0,0.15)] border border-slate-100 rounded-full text-indigo-600 hover:scale-110 active:scale-95 transition-all duration-300 ${activeIndex === plansList.length - 1 ? 'opacity-0 scale-75' : 'opacity-100'}`}>
                         <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                     </button>
                 </div>
               )}

               <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    // 🌟 4. ใช้ justify-center เพื่อให้การ์ดจัดกึ่งกลางเสมอในกรณีที่แพ็กเกจเหลือน้อยชิ้น
                    className="flex overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none px-[15vw] sm:px-[20vw] md:px-6 py-10 scroll-smooth items-center h-full gap-0 md:gap-6 md:justify-center"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
               >
                   {/* 🌟 5. วนลูปจาก plansList ที่ผ่านการกรองมาแล้ว */}
                   {plansList.map((planKey, index) => {
                      const plan = PLANS[planKey];
                      const isCurrent = currentPlanKey === planKey;
                      const isFree = planKey === 'free';
                      const basePrice = isFree ? 0 : parseInt(plan.price.replace(/,/g, ''));
                      const fullPricePerYear = basePrice * 12;
                      const discountedPricePerYear = fullPricePerYear * 0.8;
                      const monthlyAverage = Math.floor(discountedPricePerYear / 12);
                      
                      const isCenter = activeIndex === index;
                      const isLeft = index < activeIndex;
                      const isRight = index > activeIndex;

                      return (
                        <div key={planKey} className="snap-center shrink-0 w-[70vw] sm:w-[320px] md:w-auto h-max flex justify-center [perspective:1200px] md:[perspective:none]">
                           <div className={`
                                relative w-full flex flex-col p-6 rounded-[32px] bg-white transition-all duration-500 ease-out
                                ${isCenter ? '[transform:rotateY(0deg)_scale(1)] opacity-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] z-30' : ''}
                                ${isLeft ? '[transform:rotateY(25deg)_scale(0.85)_translateX(15%)] opacity-60 shadow-sm z-10' : ''}
                                ${isRight ? '[transform:rotateY(-25deg)_scale(0.85)_translateX(-15%)] opacity-60 shadow-sm z-10' : ''}
                                md:[transform:none] md:scale-100 md:opacity-100 md:hover:-translate-y-2 md:hover:shadow-xl md:z-auto
                                ${(plan as any).isPopular ? 'border-2 border-indigo-500 ring-4 ring-indigo-50/50' : 'border border-slate-100'}
                           `}>
                               {(plan as any).isPopular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/30 whitespace-nowrap z-40">🌟 ขายดีที่สุด</div>}
                               
                               <div className="text-center mb-5 pt-2">
                                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{plan.name}</h3>
                                   
                                   {period === 'yearly' && planKey !== 'free' ? (
                                       <div className="flex flex-col items-center">
                                            <div className="flex items-baseline gap-1 text-slate-900">
                                                <span className="text-4xl font-black tracking-tight">{monthlyAverage.toLocaleString()}</span>
                                                <span className="text-xs font-bold text-slate-400">บ./เดือน</span>
                                            </div>
                                            <div className="mt-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
                                                ประหยัด {(fullPricePerYear - discountedPricePerYear).toLocaleString()} บ./ปี
                                            </div>
                                       </div>
                                   ) : (
                                       <div className="flex items-baseline justify-center gap-1 text-slate-900 h-[60px]">
                                            <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                                            {planKey !== 'free' && <span className="text-xs font-bold text-slate-400">บ./เดือน</span>}
                                       </div>
                                   )}
                               </div>

                               <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-5" />

                               <div className="flex-1 space-y-3 mb-8">
                                   {plan.features.map((feat, i) => (
                                       <div key={i} className="flex items-start gap-3 group">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-50 text-indigo-500 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                                <IconCheck size={12} strokeWidth={4}/>
                                            </div>
                                            <span className="text-[13px] font-medium text-slate-600 leading-snug">{feat}</span>
                                       </div>
                                   ))}
                               </div>

                               <button 
                                 disabled={(isCurrent && isFree) || submitting} 
                                 onClick={() => { onClose(); handleUpgradePlan(planKey, paymentMethod); }} 
                                 className={`w-full py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-sm relative overflow-hidden
                                    ${(isCurrent && isFree) 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : plan.btnColor + ' text-white hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 hover:-translate-y-0.5'
                                    }
                                 `}
                               >
                                 {isCurrent 
                                    ? (isFree ? 'กำลังใช้งาน' : 'ต่ออายุแพ็กเกจนี้') 
                                    : 'เลือกแพ็กเกจนี้'
                                 }
                               </button>
                           </div>
                        </div>
                      );
                   })}
               </div>

               {/* จุดบอกตำแหน่ง (Dots Pagination) - ซ่อนถ้ามีแพ็กเกจเดียว */}
               {plansList.length > 1 && (
                 <div className="flex justify-center gap-2 mt-auto pb-6 md:hidden">
                     {plansList.map((_, i) => (
                         <button 
                            key={i} 
                            onClick={() => {
                               const container = scrollContainerRef.current;
                               if(container) {
                                 const scrollAmount = container.clientWidth * 0.65;
                                 container.scrollTo({ left: i * scrollAmount, behavior: 'smooth' });
                               }
                            }}
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${activeIndex === i ? 'w-8 bg-indigo-600 shadow-md' : 'w-2 bg-slate-300 hover:bg-slate-400'}`} 
                         />
                     ))}
                 </div>
               )}

            </div>
        </div>
    </div>
  );
}