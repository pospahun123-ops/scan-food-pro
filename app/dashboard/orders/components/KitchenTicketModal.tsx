'use client';

import React from 'react';

// ไอคอนสำหรับใช้ใน Modal นี้
const IconPrinter = ({ size = 20 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;
const IconClose = ({ size = 16 }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default function KitchenTicketModal({ order, onClose }: { order: any, onClose: () => void }) {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 print:bg-white print:p-0">
            
            {/* ✅ แก้ไขตรงนี้: เปลี่ยนเป็น dangerouslySetInnerHTML แล้วครับ */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-section, .print-section * { visibility: visible; }
                    .print-section { position: absolute; left: 0; top: 0; width: 80mm; padding: 0; margin: 0; }
                    .no-print { display: none !important; }
                }
            `}} />

            <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl print:shadow-none print:rounded-none animate-in zoom-in-95 duration-200">
                
                {/* ส่วนหัวของ Modal (ซ่อนตอนปริ้นจริง) */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                        <IconPrinter size={20} /> พิมพ์ใบสั่งอาหาร
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors">
                        <IconClose size={16} /> 
                    </button>
                </div>

                {/* 📄 เนื้อหาใบเสร็จ (ที่จะถูกปริ้นออกกระดาษ) */}
                <div className="print-section bg-white text-black p-6 overflow-y-auto">
                    <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
                        <h2 className="text-2xl font-black mb-1">ใบสั่งอาหาร (ครัว)</h2>
                        <p className="text-4xl font-black mt-2 mb-2">โต๊ะ {order.table_label}</p>
                        <p className="text-sm font-medium">วันที่: {new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        <p className="text-sm font-medium text-gray-500">Order ID: {order.id.slice(0, 8)}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm font-bold border-b border-black pb-1 mb-2">
                            <span>รายการ</span>
                            <span>จำนวน</span>
                        </div>
                        {order.order_items?.map((item: any) => (
                            <div key={item.id} className={`flex justify-between items-start ${item.status === 'cancelled' ? 'line-through text-gray-400 opacity-60' : ''}`}>
                                <div className="pr-4">
                                    <p className="font-bold text-lg leading-tight">{item.product_name}</p>
                                    {item.variant !== 'normal' && (
                                        <p className="text-sm font-bold text-gray-600 mt-0.5">- ตัวเลือก: {item.variant}</p>
                                    )}
                                    {item.note && (
                                        <p className="text-sm font-medium text-gray-800 mt-1">** หมายเหตุ: {item.note}</p>
                                    )}
                                    {item.status === 'cancelled' && (
                                        <span className="text-xs border border-gray-400 rounded px-1 mt-1 inline-block">ยกเลิกแล้ว</span>
                                    )}
                                </div>
                                <div className="font-black text-2xl pt-1">
                                    x{item.quantity}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t-2 border-dashed border-black text-center text-sm font-bold">
                        *** ตรวจสอบความถูกต้อง ***
                    </div>
                </div>

                {/* ปุ่มกดสั่งการ (ซ่อนตอนปริ้นจริง) */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 no-print">
                    <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                        ปิดหน้าต่าง
                    </button>
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                        <IconPrinter size={20} /> สั่งพิมพ์เลย
                    </button>
                </div>
            </div>
        </div>
    );
}