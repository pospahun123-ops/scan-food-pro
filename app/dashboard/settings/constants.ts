export const PLANS = {
  free: { 
    name: 'Free', 
    price: 'ฟรี', 
    period: 'ตลอดชีพ', 
    themes: '2 ธีม', 
    orders: '100 ออเดอร์/เดือน', 
    features: [
      'คิดเงินหน้าร้านไม่จำกัด',
      'เลือกได้ 2 ธีม',
      'รองรับ 100 ออเดอร์/เดือน',
      'Dashboard ย้อนหลัง 30 วัน',
    ], 
    color: 'border-slate-200', 
    btnColor: 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
  },

  basic: { 
    name: 'Basic', 
    price: '250', 
    period: 'บาท/เดือน', 
    themes: '4 ธีม', 
    orders: 'ไม่จำกัด', 
    features: [
      'เลือกได้ 4 ธีม',
      'ออเดอร์ไม่จำกัด',
      'สร้างQrCode ไม่จำกัด', 
      'คิดเงินได้ไม่จำกัด',
      'Dashboard ไม่จำกัดย้อนหลัง',
      'Export รายงาน (Excel)',
    ], 
    color: 'border-blue-200', 
    btnColor: 'bg-blue-600 text-white hover:bg-blue-700' 
  },

  pro: { 
    name: 'Pro', 
    price: '489', 
    period: 'บาท/เดือน', 
    themes: '7 ธีม', 
    orders: 'ไม่จำกัด', 
    features: [
      'เลือกได้ 7 ธีม',
      'สร้างQrCode ไม่จำกัด', 
      'คิดเงินได้ไม่จำกัด',
      'Dashboard ไม่จำกัดย้อนหลัง',
      'Export รายงาน (Excel)',

      'ระบบพนักงาน',
      'ระบบพนักงานสูงสุด3',
      'กำหนดสิทธิ์พนักงาน',
      
    ], 
    color: 'border-indigo-200', 
    btnColor: 'bg-indigo-600 text-white hover:bg-indigo-700' 
  },

  ultimate: { 
    name: 'Ultimate', 
    price: '1,999', 
    period: 'บาท/เดือน', 
    themes: '55 ธีม + พรีเมียม', 
    orders: 'ไม่จำกัด', 
    features: [
      'ทุกธีม ',
      'สิทธิ์ใช้ธีมพรีเมียม',
      'มีแบบใบเสร็จให้เลือก 5 แบบ',
      'สร้างQrCode ไม่จำกัด', 
      'คิดเงินได้ไม่จำกัด',
      'Dashboard ไม่จำกัดย้อนหลัง',
      'Export รายงาน (Excel)',
    ], 
    color: 'border-purple-500 shadow-purple-200', 
    btnColor: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30', 
    isPopular: true 
  }
};
