import React, { useState, useEffect, useRef } from "react";

// --- 🛠️ Icons (Minimal Style) ---
const Icon = ({ name, size = 24, className = "" }: any) => {
  const icons = {
    shop: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </>
    ),
    home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    search: (
      <>
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </>
    ),
    basket: <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0"/>,
    clock: (
      <>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </>
    ),
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </>
    ),
    minus: <line x1="5" y1="12" x2="19" y2="12"/>,
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </>
    ),
    check: <polyline points="20 6 9 17 4 12"/>,
    trash: <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
  };

  const content = (icons as any)[name] || icons.home;
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {content}
    </svg>
  );
};

export default function App({ state, actions, helpers }: any) {
  const {
    loading, isVerified, activeTab, brand, tableLabel,
    banners, currentBannerIndex, categories, selectedCategoryId,
    products, filteredProducts, selectedProduct,
    cart, cartTotal, ordersList
  } = state || {}; 

  const {
    setActiveTab, setSelectedCategoryId, setSelectedProduct,
    handleAddToCart, updateQuantity, handleCheckout
  } = actions || {};

  const {
    calculatePrice, getMenuUrl, getBannerUrl
  } = helpers || {};

  // Local state
  const [variant, setVariant] = useState('normal'); 
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingCookNow, setPendingCookNow] = useState(false);

  // State สำหรับเก็บตัวเลือกเสริม (แค่ชื่อ ไม่มีราคา)
  const [selectedOptions, setSelectedOptions] = useState<any>({});

  useEffect(() => {
    if (selectedProduct) {
      setVariant('normal');
      setQty(1);
      setNote("");
      
      // รีเซ็ตตัวเลือกเสริม
      const initialOptions: any = {};
      if (selectedProduct.options && Array.isArray(selectedProduct.options)) {
        selectedProduct.options.forEach((opt: any, index: number) => {
            if (opt.type === 'single' && opt.required && opt.choices.length > 0) {
                initialOptions[index] = [opt.choices[0].name];
            } else {
                initialOptions[index] = [];
            }
        });
      }
      setSelectedOptions(initialOptions);
    }
  }, [selectedProduct]);

  // --- 🔥 AUTO-CHECKOUT LOGIC ---
  const prevCartLength = useRef(cart?.length || 0);

  useEffect(() => {
    if (pendingCookNow) {
        if (cart?.length > prevCartLength.current) {
             handleCheckout(""); 
             setPendingCookNow(false);
        }
        const timer = setTimeout(() => {
             if(pendingCookNow) {
                 handleCheckout(""); 
                 setPendingCookNow(false);
             }
        }, 1000);
        return () => clearTimeout(timer);
    }
    prevCartLength.current = cart?.length || 0;
  }, [cart, pendingCookNow, handleCheckout]);

  // 🌟 คำนวณราคาเมนูหลัก (ไม่รวมออปชั่นใดๆ เพราะออปชั่นไม่มีราคา)
  const basePriceObj = selectedProduct ? calculatePrice(selectedProduct, variant) : { final: 0, original: 0, discount: 0 };

  // 🌟 ฟังก์ชันจัดการ Text ของ Option เข้าไปใน Note
  const generateOptionNote = () => {
    if (!selectedProduct?.options) return note;

    let optTexts: string[] = [];
    selectedProduct.options.forEach((opt: any, index: number) => {
        const selectedNames = selectedOptions[index];
        if (selectedNames && selectedNames.length > 0) {
            optTexts.push(`${opt.name}: ${selectedNames.join(', ')}`);
        }
    });

    const optionsString = optTexts.length > 0 ? `[${optTexts.join(' | ')}] ` : "";
    return (optionsString + note).trim();
  };
  // --- ส่วนคำนวณราคาและเตรียมข้อมูล ---
  const currentPriceObj = selectedProduct ? calculatePrice(selectedProduct, variant) : { final: 0, original: 0, discount: 0 };
  
  // ท็อปปิ้งไม่มีราคา ดังนั้นราคารวมจึงเท่ากับราคาปกติครับ
  const finalPriceWithOpts = currentPriceObj.final;
  // 🌟 ฟังก์ชันคลิกเลือก Option
  const handleOptionToggle = (groupIndex: number, choiceName: string, type: string) => {
      setSelectedOptions((prev: any) => {
          const currentSelected = prev[groupIndex] || [];
          if (type === 'single') {
              return { ...prev, [groupIndex]: [choiceName] };
          } else {
              if (currentSelected.includes(choiceName)) {
                  return { ...prev, [groupIndex]: currentSelected.filter((n: string) => n !== choiceName) };
              } else {
                  return { ...prev, [groupIndex]: [...currentSelected, choiceName] };
              }
          }
      });
  };

  // --- 📝 Robust Data Passing ---
  const handleAdd = (addToCartOnly = true) => {
    if (!selectedProduct) return;

    // ตรวจสอบ Option บังคับ
    if (selectedProduct.options) {
        for (let i = 0; i < selectedProduct.options.length; i++) {
            const opt = selectedProduct.options[i];
            if (opt.required && (!selectedOptions[i] || selectedOptions[i].length === 0)) {
                alert(`กรุณาเลือก: ${opt.name}`);
                return;
            }
        }
    }

    const finalNote = generateOptionNote(); 
    
    const productToAdd = { 
        ...selectedProduct, 
        variant: variant, 
        note: finalNote,
        specialRequest: finalNote, 
        comment: finalNote,
        remark: finalNote,
        price: basePriceObj.final, // ใช้ราคาปกติ
        original_price: basePriceObj.original || basePriceObj.final + basePriceObj.discount 
    };

    if (addToCartOnly) {
        for(let i=0; i<qty; i++) {
            handleAddToCart(productToAdd, variant, finalNote);
        }
        setSelectedProduct(null);
    } else {
        if (cart && cart.length > 0) setShowConfirm(true); 
        else performCookNow(productToAdd, finalNote);
    }
  };

  const performCookNow = (prodObj = selectedProduct, nNote = note) => {
    let finalObj = prodObj;
    let finalNote = nNote;

    if (!finalObj || finalObj === selectedProduct) {
        finalNote = generateOptionNote();
        finalObj = { 
            ...selectedProduct, 
            variant: variant, 
            note: finalNote,
            specialRequest: finalNote,
            comment: finalNote,
            remark: finalNote,
            price: basePriceObj.final,
            original_price: basePriceObj.original || basePriceObj.final + basePriceObj.discount 
        };
    }
    
    for(let i=0; i<qty; i++) {
        handleAddToCart(finalObj, variant, finalNote);
    }
    setPendingCookNow(true);
    setSelectedProduct(null);
  };

  const onCheckoutClick = () => {
      handleCheckout("");
      setShowConfirm(false);
  };

  if (loading && !isVerified) return <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center text-[#44403c] font-light text-xl tracking-widest">LOADING</div>;

  return (
    // Theme: Minimal Earth (Stone & Olive)
    <div className="w-full max-w-md mx-auto min-h-screen pb-32 relative overflow-x-hidden bg-[#FAFAF9] font-sans text-[#1C1917]">
        
        {/* CSS Styles */}
        <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Sarabun:wght@300;400;500;600&display=swap');
            
            :root {
                --primary: #1C1917; /* stone-900 */
                --secondary: #57534E; /* stone-600 */
                --bg-main: #FAFAF9; /* stone-50 */
                --border-color: #E7E5E4; /* stone-200 */
            }

            body {
                font-family: 'Sarabun', sans-serif;
                background-color: var(--bg-main);
                -webkit-tap-highlight-color: transparent;
                color: var(--primary);
                letter-spacing: 0.02em;
            }

            .font-head { font-family: 'Outfit', sans-serif; }

            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

            /* Minimal Animations */
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade { animation: fadeIn 0.4s ease-out forwards; }
        `}} />

        {/* --- Header (Clean & Minimal) --- */}
        <header className="bg-white/80 backdrop-blur-md pt-12 pb-6 px-6 sticky top-0 z-50 border-b border-[#E7E5E4]">
             <div className="flex justify-between items-center">
                 <div>
                     <p className="text-[#57534E] text-[10px] font-medium tracking-[0.2em] font-head uppercase mb-1">Table {tableLabel}</p>
                     <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917] font-head">{brand?.name || "The Minimalist"}</h1>
                 </div>
                 <div className="w-10 h-10 border border-[#E7E5E4] rounded-full flex items-center justify-center text-[#1C1917]">
                     <Icon name="shop" size={18} />
                 </div>
             </div>
        </header>

        <main className="px-6 pb-24 relative z-20">
            {activeTab === 'home' && (
                <section className="animate-fade pt-6">
                    {banners?.length > 0 && (
                        <div className="relative w-full aspect-[2/1] bg-[#E7E5E4] rounded-lg overflow-hidden mb-8">
                             <img src={getBannerUrl(banners[currentBannerIndex].image_name)} className="w-full h-full object-cover opacity-90" />
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-6 border-b border-[#E7E5E4] pb-4">
                         <h2 className="text-lg font-medium text-[#1C1917]">Recommended</h2>
                         <button onClick={() => setActiveTab('menu')} className="text-[#57534E] text-xs flex items-center gap-1 hover:text-[#1C1917] transition-colors">
                             View All <Icon name="chevronRight" size={14} />
                         </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                        {products?.filter((p: any) => p.is_recommended).slice(0, 6).map((p: any, idx: any) => {
                             const pricing = calculatePrice(p, 'normal');
                             return (
                                <div key={p.id} onClick={() => setSelectedProduct(p)} className="cursor-pointer group" style={{animationDelay: `${idx * 0.05}s`}}>
                                     <div className="w-full aspect-square overflow-hidden bg-[#F5F5F4] mb-3 relative rounded-lg">
                                         <img src={getMenuUrl(p.image_name)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                                         {pricing.discount > 0 && (
                                            <div className="absolute top-0 right-0 bg-[#1C1917] text-white text-[10px] px-2 py-1">
                                                -{pricing.discount}
                                            </div>
                                         )}
                                     </div>
                                     <h3 className="font-medium text-[#1C1917] text-sm mb-1 leading-snug">{p.name}</h3>
                                     <div className="flex items-baseline gap-2">
                                         <span className="text-[#1C1917] font-medium text-base font-head">{pricing.final}</span>
                                         {pricing.discount > 0 && (
                                             <span className="text-[10px] text-[#A8A29E] line-through font-head">
                                                 {pricing.original}
                                             </span>
                                         )}
                                     </div>
                                </div>
                             );
                        })}
                    </div>
                </section>
            )}

            {activeTab === 'menu' && (
                <section className="animate-fade pt-6">
                    <div className="relative mb-8">
                         <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none"><Icon name="search" className="text-[#A8A29E]" size={18} /></div>
                         <input type="text" placeholder="Search for dishes..." value={state?.searchTerm} onChange={(e) => actions?.setSearchTerm(e.target.value)} className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-[#E7E5E4] focus:border-[#1C1917] outline-none text-sm text-[#1C1917] placeholder-[#A8A29E] transition-colors rounded-none" />
                    </div>
                    <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                        {categories?.map((c: any) => (
                            <button key={c.id} onClick={() => setSelectedCategoryId(c.id)} 
                                    className={`shrink-0 px-4 py-2 rounded-full text-xs transition-all
                                    ${selectedCategoryId === c.id ? 'bg-[#1C1917] text-white' : 'bg-transparent border border-[#E7E5E4] text-[#57534E]'}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4 pb-20">
                        {filteredProducts?.map((p: any, idx: any) => {
                             const pricing = calculatePrice(p, 'normal');
                             return (
                                <div key={p.id} onClick={() => setSelectedProduct(p)} className="flex gap-4 cursor-pointer py-2 border-b border-[#f5f5f4] last:border-0" style={{animationDelay: `${idx * 0.05}s`}}>
                                     <div className="w-24 h-24 bg-[#F5F5F4] overflow-hidden shrink-0 rounded-lg">
                                         <img src={getMenuUrl(p.image_name)} className="w-full h-full object-cover opacity-90" />
                                     </div>
                                     <div className="flex-1 flex flex-col justify-center">
                                         <h3 className="font-medium text-[#1C1917] text-sm mb-1">{p.name}</h3>
                                         <div className="flex items-center gap-2 mt-1">
                                             <span className="text-[#1C1917] font-medium font-head">{pricing.final}.-</span>
                                             {pricing.discount > 0 && <span className="text-xs text-[#A8A29E] line-through font-head">{pricing.original}</span>}
                                         </div>
                                     </div>
                                     <div className="flex items-center">
                                         <div className="w-8 h-8 rounded-full border border-[#E7E5E4] flex items-center justify-center text-[#1C1917] hover:bg-[#1C1917] hover:text-white transition-colors">
                                             <Icon name="plus" size={14} />
                                         </div>
                                     </div>
                                </div>
                             );
                        })}
                    </div>
                </section>
            )}

            {activeTab === 'status' && (
                <section className="animate-fade pt-6 pb-24">
                    <h2 className="text-xl font-light text-[#1C1917] mb-6 font-head tracking-wide">Order Status</h2>

                    <div className="space-y-6">
                        {ordersList?.map((o: any) => (
                            <div key={o.id} className="border border-[#E7E5E4] p-6 bg-white rounded-xl">
                                <div className="flex justify-between items-start mb-6">
                                     <div>
                                         <span className="text-[10px] text-[#A8A29E] uppercase tracking-widest block mb-1">Ticket ID</span>
                                         <span className="text-sm font-medium text-[#1C1917]">#{o.id.slice(-4)}</span>
                                     </div>
                                     <div className={`px-3 py-1 text-[10px] uppercase tracking-widest border rounded-full
                                        ${o.status === 'pending' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}`}>
                                         {o.status === 'pending' ? 'รอรับ' : 'กำลังทำ'}
                                     </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {o.order_items.map((i: any, idx: any) => (
                                        <div key={idx} className="flex justify-between text-sm text-[#57534E]">
                                            <div className="flex gap-3">
                                                <span className="text-[#1C1917] w-6">{i.quantity}x</span>
                                                <div className="flex flex-col">
                                                    <span>{i.product_name}</span>
                                                    {i.variant && i.variant !== 'normal' && <span className="text-[10px] text-[#A8A29E] uppercase mt-0.5">{i.variant}</span>}
                                                    {i.note && <span className="text-[10px] text-[#A8A29E] italic mt-0.5 leading-snug">{i.note}</span>}
                                                </div>
                                            </div>
                                            <span className="font-head">{i.price * i.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-[#E7E5E4]">
                                     <span className="text-xs text-[#1C1917] uppercase tracking-widest">Total</span>
                                     <span className="font-medium text-lg text-[#1C1917] font-head">
                                         {o.total_price || o.order_items.reduce((a: any, b: any) => a + (b.price * b.quantity), 0)}.-
                                     </span>
                                </div>
                            </div>
                        ))}
                        {(!ordersList || ordersList.length === 0) && (
                            <div className="text-center py-24 opacity-40">
                                <p className="text-sm font-light text-[#57534E]">No active orders</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

        </main>

        <nav className="fixed bottom-0 left-0 w-full h-[80px] bg-white border-t border-[#E7E5E4] flex justify-center items-center gap-12 z-[90] pb-2">
             <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'home' ? 'text-[#1C1917]' : 'text-[#A8A29E]'}`}>
                 <Icon name="home" size={22} />
                 <span className="text-[9px] uppercase tracking-widest">Home</span>
             </button>

             <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'menu' ? 'text-[#1C1917]' : 'text-[#A8A29E]'}`}>
                 <Icon name="menu" size={22} />
                 <span className="text-[9px] uppercase tracking-widest">Menu</span>
             </button>

             <button onClick={() => setActiveTab('cart')} className={`flex flex-col items-center gap-1.5 transition-colors relative ${activeTab === 'cart' ? 'text-[#1C1917]' : 'text-[#A8A29E]'}`}>
                 <div className="relative">
                     <Icon name="basket" size={22} />
                     {cart?.length > 0 && (
                         <span className="absolute -top-1 -right-2 bg-[#1C1917] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">
                             {cart.length}
                         </span>
                     )}
                 </div>
                 <span className="text-[9px] uppercase tracking-widest">Cart</span>
             </button>

             <button onClick={() => setActiveTab('status')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'status' ? 'text-[#1C1917]' : 'text-[#A8A29E]'}`}>
                 <Icon name="clock" size={22} />
                 <span className="text-[9px] uppercase tracking-widest">Status</span>
             </button>
        </nav>

       {/* --- ITEM DETAIL MODAL (Fixed Note Overlap) --- */}
        {selectedProduct && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1C1917]/20 backdrop-blur-sm animate-fade">
                <div onClick={() => setSelectedProduct(null)} className="absolute inset-0"></div>
                
                <div className="w-full max-w-md bg-white shadow-2xl max-h-[90vh] flex flex-col animate-fade rounded-t-2xl overflow-hidden relative">
                    <div className="absolute top-4 right-4 z-20">
                        <button onClick={() => setSelectedProduct(null)} className="w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-[#1C1917] hover:bg-black hover:text-white transition-colors shadow-sm">
                            <Icon name="x" size={18} />
                        </button>
                    </div>

                    <div className="relative h-56 sm:h-64 shrink-0 bg-[#F5F5F4]">
                        <img src={getMenuUrl(selectedProduct.image_name)} className="w-full h-full object-cover" />
                    </div>

                    {/* 🌟 ปรับตรงนี้: เพิ่ม pb-56 เพื่อให้เลื่อนพ้นปุ่มด้านล่าง */}
                    <div className="p-6 md:p-8 pb-56 overflow-y-auto bg-white flex-1 no-scrollbar">
                        <div className="mb-6">
                            <h2 className="text-2xl font-light text-[#1C1917] mb-2 font-head">{selectedProduct.name}</h2>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-medium font-head text-[#1C1917]">{basePriceObj.final}.-</span>
                                {basePriceObj.discount > 0 && (
                                    <>
                                        <span className="text-sm text-[#A8A29E] line-through font-head">{basePriceObj.original}</span>
                                        <span className="text-[10px] text-white bg-[#1C1917] px-2 py-0.5 rounded-sm">SAVE {basePriceObj.discount}</span>
                                    </>
                                )}
                            </div>
                            {selectedProduct.description && (
                                <p className="text-sm text-[#57534E] mt-3 leading-relaxed">{selectedProduct.description}</p>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* --- Size Selector --- */}
                            {(selectedProduct.price_special || selectedProduct.price_jumbo) && (
                                <div>
                                    <label className="block text-[10px] text-[#A8A29E] uppercase tracking-widest mb-3">Size Selection</label>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { key: 'normal', label: 'ปกติ', ...calculatePrice(selectedProduct, 'normal') },
                                            selectedProduct.price_special && { key: 'special', label: 'พิเศษ', ...calculatePrice(selectedProduct, 'special') },
                                            selectedProduct.price_jumbo && { key: 'jumbo', label: 'จัมโบ้', ...calculatePrice(selectedProduct, 'jumbo') }
                                        ].filter(Boolean).map((v: any) => (
                                            <button 
                                                key={v.key} 
                                                onClick={() => setVariant(v.key)}
                                                className={`w-full py-3 px-4 flex justify-between items-center border transition-all rounded-xl
                                                    ${variant === v.key ? 'border-[#1C1917] bg-[#FAFAF9]' : 'border-[#E7E5E4] text-[#57534E]'}`}
                                            >
                                                <span className="text-sm font-medium">{v.label}</span>
                                                <span className="text-sm font-medium">{v.final}.-</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- 🌟 OPTIONS (แบบไม่มีราคา) --- */}
                            {selectedProduct.options?.length > 0 && selectedProduct.options.map((opt: any, index: number) => (
                                <div key={index} className="pt-4 border-t border-[#E7E5E4]">
                                    <label className="block text-[10px] text-[#1C1917] font-medium uppercase tracking-widest mb-3">{opt.name}</label>
                                    <div className="flex flex-col gap-2">
                                        {opt.choices.map((choice: any, cIdx: number) => {
                                            const isSelected = selectedOptions[index]?.includes(choice.name);
                                            return (
                                                <label key={cIdx} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all active:scale-[0.99] ${isSelected ? 'border-[#1C1917] bg-[#FAFAF9]' : 'border-[#E7E5E4]'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 border flex items-center justify-center ${isSelected ? 'border-[#1C1917]' : 'border-[#A8A29E]'} ${opt.type === 'single' ? 'rounded-full' : 'rounded-sm'}`}>
                                                            {isSelected && <div className={`w-2 h-2 bg-[#1C1917] ${opt.type === 'single' ? 'rounded-full' : ''}`} />}
                                                        </div>
                                                        <span className="text-sm font-medium">{choice.name}</span>
                                                    </div>
                                                    <input type={opt.type === 'single' ? 'radio' : 'checkbox'} className="hidden" checked={isSelected || false} onChange={() => handleOptionToggle(index, choice.name, opt.type)} />
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* --- 📝 ช่อง NOTE (Customization) --- */}
                            <div className="pt-4 border-t border-[#E7E5E4]">
                                <label className="block text-[10px] text-[#A8A29E] uppercase tracking-widest mb-3">หมายเหตุพิเศษ</label>
                                <textarea 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="เช่น ไม่เผ็ด, ไม่ใส่ผัก..." 
                                    className="w-full p-4 border border-[#E7E5E4] rounded-xl focus:border-[#1C1917] outline-none text-sm transition-colors bg-[#FAFAF9] h-28 resize-none mb-4"
                                />
                            </div>
                        </div>

                        {/* Spacer เพื่อความมั่นใจว่าเลื่อนสุดจริงๆ */}
                        <div className="h-10" />
                    </div>

                    {/* Sticky Buttons */}
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-[#E7E5E4] grid grid-cols-2 gap-3 max-w-md mx-auto z-30">
                        <button onClick={() => handleAdd(true)} className="py-4 border border-[#1C1917] rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-[#FAFAF9]">ใส่ตะกร้า</button>
                        <button onClick={() => handleAdd(false)} className="py-4 bg-[#1C1917] text-white rounded-xl text-[10px] uppercase font-bold tracking-widest shadow-lg shadow-black/10 active:opacity-90">สั่งทันที</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- CART SHEET (Minimal) --- */}
        {activeTab === 'cart' && (
             <div className="fixed inset-0 z-[100] flex items-end bg-[#1C1917]/20 backdrop-blur-sm animate-fade">
                 <div className="w-full max-w-md bg-white h-[90vh] flex flex-col shadow-2xl mx-auto rounded-t-2xl overflow-hidden">
                     <div className="p-8 border-b border-[#F5F5F4] flex justify-between items-center">
                        <h2 className="text-xl font-light font-head">Your Tray</h2>
                        <button onClick={() => setActiveTab('menu')}><Icon name="x" size={20}/></button>
                     </div>
                     <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 no-scrollbar pb-32">
                         {cart.map((item: any, idx: any) => {
                            const finalPriceTotal = item.price * item.quantity;
                            const originalPriceTotal = (item.original_price || item.price) * item.quantity;
                            const hasDiscount = originalPriceTotal > finalPriceTotal;

                             return (
                             <div key={idx} className="flex gap-4 border-b border-[#E7E5E4] pb-4 last:border-0">
                                 <div className="w-14 h-14 bg-[#F5F5F4] rounded-lg shrink-0 overflow-hidden"><img src={item.image_url} className="w-full h-full object-cover" /></div>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between">
                                         <span className="text-sm font-medium truncate pr-4">{item.name} x{item.quantity}</span>
                                         <span className="text-sm font-head">{finalPriceTotal}</span>
                                     </div>
                                     <div className="text-[10px] text-[#A8A29E] mt-1 italic leading-snug">{item.note}</div>
                                     <div className="flex gap-4 mt-3">
                                         <button onClick={() => updateQuantity(idx, -1)} className="text-[10px] underline text-[#A8A29E] hover:text-[#ef4444]">Remove</button>
                                     </div>
                                 </div>
                             </div>
                         )})}
                         {cart.length === 0 && <div className="text-center py-20 text-sm text-[#A8A29E]">Empty</div>}
                     </div>
                     <div className="p-8 bg-[#FAFAF9] border-t border-[#E7E5E4] shrink-0">
                         <div className="flex justify-between items-center mb-6"><span className="text-xs uppercase tracking-widest">Total</span><span className="text-3xl font-light font-head">{cartTotal}.-</span></div>
                         <button onClick={() => { setShowConfirm(true); setSelectedProduct(null); }} disabled={cart.length === 0} className="w-full py-4 bg-[#1C1917] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl disabled:opacity-50">Confirm Order</button>
                     </div>
                 </div>
             </div>
        )}

        {/* --- CONFIRMATION --- */}
        {showConfirm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-fade">
                <div className="bg-white p-8 text-center border rounded-xl max-w-xs w-full">
                    <div className="mb-4 flex justify-center text-[#1C1917]"><Icon name="check" size={32} /></div>
                    <h3 className="text-lg font-head mb-4">Place Order?</h3>
                    <div className="flex flex-col gap-2">
                        <button onClick={onCheckoutClick} className="w-full py-3 bg-[#1C1917] text-white text-xs uppercase font-bold tracking-widest rounded-lg">Confirm</button>
                        <button onClick={() => setShowConfirm(false)} className="w-full py-3 text-xs uppercase text-[#A8A29E]">Cancel</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
}