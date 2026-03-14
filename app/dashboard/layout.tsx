// app/dashboard/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// --- 🎨 Custom Icons ---
const IconMenu = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
const IconX = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconChef = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20" /><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" /><path d="m4 8 16-4" /><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.55a2 2 0 0 1 2.43 1.46l.45 1.8" /></svg>);
const IconQRCode = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>);
const IconGrid = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /><path d="M2 13h20" opacity="0.5"/> </svg>);
const IconHistory = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2h14a2 2 0 0 1 2 2v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5V4a2 2 0 0 1 2-2Z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>);
const IconTag = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IconLogOut = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconUser = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconSettings = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>;
const IconShoppingBag = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconPalette = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;
const IconPlusSquare = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>;
const Icondashboard = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 17v-5"/><path d="M12 17v-8"/><path d="M16 17v-3"/></svg>;
const IconBox = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;

const CDN_BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://img.pos-foodscan.com";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const isMarketplaceDetail = /^\/dashboard\/marketplace\/[^/]+$/.test(pathname);

  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('profiles').select('*, brands(*)').eq('id', user.id).single();
      if (data) { 
          setProfile(data); 
          const brandsData = data.brands;
          if (Array.isArray(brandsData) && brandsData.length > 0) {
             setBrand(brandsData[0]);
          } else {
             setBrand(brandsData);
          }
      }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    if (path.startsWith('profiles/')) return `${CDN_BASE_URL}/${path}`;
    return `${CDN_BASE_URL}/profiles/${path}`;
  };

  const isOwner = profile?.role === 'owner';
  const isPremium = ['pro', 'ultimate'].includes(brand?.plan);

  const navItems = [
    { name: 'คิดเงิน (POS)', href: '/dashboard/pai_order', icon: IconGrid, hidden: !isOwner && !isPremium },
    { name: 'ออเดอร์ (ครัว)', href: '/dashboard/orders', icon: IconChef, hidden: !isOwner && !isPremium },
    { name: 'ระบบคลังสินค้า', href: '/dashboard/inventory', icon: IconBox, hidden: !isOwner && !isPremium },
    { name: '--- จัดการร้าน ---', href: '#', icon: null, separator: true, hidden: !isOwner && !isPremium },
    { name: 'Dashboard', href: '/dashboard', icon: Icondashboard, ownerOnly: true },
    { name: 'ส่วนลด/โปรฯ', href: '/dashboard/discounts', icon: IconTag, ownerOnly: true },
    { name: 'เมนูอาหาร', href: '/dashboard/products', icon: IconPlusSquare, ownerOnly: true },
    { name: 'ใบเสร็จย้อนหลัง', href: '/dashboard/receipts', icon: IconHistory, ownerOnly: true },
    { name: 'ตั้งค่าร้าน', href: '/dashboard/settings', icon: IconSettings, ownerOnly: true },
    { name: '--- จัดการธีม ---', href: '#', icon: null, separator: true },
    { name: 'เลือกธีมร้าน', href: '/dashboard/theme', icon: IconPalette, isMagic: true }, 
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: IconShoppingBag, isGold: true },
  ];

  if (isMarketplaceDetail) return <>{children}</>;
  if (!mounted) return <div className="min-h-screen bg-slate-50">{children}</div>;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" suppressHydrationWarning>
      
      {/* 🟢 ส่วนเนื้อหาหลัก (Header + Main) */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 w-full relative z-10"> 
        <header className="bg-white border-b border-slate-100 p-4 relative z-30 flex items-center justify-between shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <button suppressHydrationWarning onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-xl bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-slate-200 active:scale-95">
              <IconMenu size={24} />
            </button>
            <div className="flex flex-col">
               <h1 className="font-black text-slate-800 text-lg leading-none tracking-tight">{brand?.name || 'Store Dashboard'}</h1>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Management Panel</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
             <div className="text-right">
                <p className="text-sm font-bold text-slate-700">{profile?.full_name}</p>
                <p className="text-[10px] text-green-500 uppercase font-black bg-green-50 px-2 py-0.5 rounded-full inline-block mt-0.5">Online</p>
             </div>
             <Link href="/dashboard/profile">
                <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md hover:shadow-lg hover:scale-110 hover:border-blue-200 transition-all cursor-pointer active:scale-95">
                    {profile?.avatar_url ? (
                      <img src={getAvatarUrl(profile.avatar_url) ?? ''} className="w-full h-full object-cover" alt="Profile" /> 
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><IconUser size={18}/></div>
                    )}
                </div>
             </Link>
          </div>
        </header>
        
        <main className="flex-1 w-full bg-slate-50/50">
          {children}
        </main>
      </div>

      {/* 🔴 ส่วน Sidebar & Backdrop */}
      
      {/* Backdrop: z-[9998] */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar: z-[9999] */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white z-[9999] transition-transform duration-300 ease-out shadow-2xl border-r border-slate-100 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* 🌟 ส่วนหัว Sidebar: โลโก้ และ ปุ่ม Logout แบบเล็กๆ อยู่ข้างใต้ */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white shrink-0 relative flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="text-indigo-600 bg-indigo-50 p-2 rounded-xl shadow-sm border border-indigo-100">
                <IconQRCode size={20} />
              </div>
              <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Scan-Food</span>
            </div>
            
            {/* ปุ่ม Logout ไซส์มินิ แปะใต้โลโก้ */}
            <button 
              onClick={handleLogout} 
              className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1.5 mt-0.5 ml-11 font-bold transition-colors w-max"
            >
              <IconLogOut size={14} /> ออกจากระบบ
            </button>
          </div>

          <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 mt-1">
            <IconX size={20} />
          </button>
        </div>

        {/* เมนู Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {navItems.map((item: any, idx) => {
            if (item.hidden) return null;
            if (item.ownerOnly && !isOwner) return null;
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href) && item.href !== '#';

            return item.separator ? (
              <div key={idx} className="my-4 flex items-center gap-4 mx-4">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.name.replace(/---/g, '')}</span>
                  <div className="h-px bg-slate-100 flex-1"></div>
              </div>
            ) : (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group font-bold text-sm relative overflow-hidden shrink-0
                  ${item.isMagic ? 'bg-gradient-to-br from-[#4a00e0] to-[#8e2de2] text-white shadow-md' : 
                    item.isGold ? 'bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-700 border border-amber-200' : 
                    isActive ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon && <item.icon size={20} />}
                </div>
                <span className={item.isGold || item.isMagic ? 'font-black tracking-wide' : ''}>{item.name}</span>
                {item.isGold && <span className="ml-auto bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">NEW</span>}
              </Link>
            );
          })}
        </nav>
        
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}