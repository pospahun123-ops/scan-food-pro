// hooks/useFcmToken.ts
import { useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

// 🌟 แก้ไขตรงนี้: เพิ่มให้รับ (payload?: any) เพื่อส่งข้อมูลกลับไปได้
export const useFcmToken = (userId: string | undefined, onMessageReceived: (payload?: any) => void) => {
    const savedCallback = useRef(onMessageReceived);

    useEffect(() => {
        savedCallback.current = onMessageReceived;
    }, [onMessageReceived]);

    // ==========================================
    // 1. จัดการ Bridge ของ Android (บังคับอัปเดตลง fcm_token)
    // ==========================================
    useEffect(() => {
        if (!userId) return; // ถ้ายังไม่มีไอดีคนล็อกอิน ให้หยุดการทำงานไปก่อน

        // ฟังก์ชันรับ Token จาก Android (แอปส่งมาให้)
        (window as any).updateFcmTokenFromAndroid = async (token: string) => {
            console.log('📱 ได้รับ Token จาก Android App:', token);
            if (token) {
                // 🌟 ยิงอัปเดตลง Database ทันที! ไม่ต้องสนใจ LocalStorage
                const { error } = await supabase
                    .from('profiles')
                    .update({ fcm_token: token })
                    .eq('id', userId);

                if (!error) {
                    console.log('✅ [Android] อัปเดต FCM Token ลง Database สำเร็จ!');
                } else {
                    console.error('❌ [Android] อัปเดต Token พลาด:', error.message);
                }
            }
        };

       // ฟังก์ชันรับคำสั่ง Refresh หน้าจอจาก Android
        (window as any).triggerRefreshFromAndroid = (updateType: string = 'NEW_ORDER') => {
            // 🌟 รับค่า type จาก Android ส่งเข้าไปให้ useKitchen จัดการ
            savedCallback.current({ data: { type: updateType } }); 
        };

        // 🌟 ดักจับกรณีที่ Android โยน Token มาให้ก่อนที่ React จะโหลดเสร็จ
        const earlyToken = (window as any).ANDROID_FCM_TOKEN;
        if (earlyToken) {
            console.log('🔄 พบ Token ที่ตกค้างจากแอป กำลังบังคับอัปเดต...');
            supabase.from('profiles').update({ fcm_token: earlyToken }).eq('id', userId)
                .then(({ error }) => {
                    if (!error) console.log('✅ [Android] อัปเดต Token ตกค้างสำเร็จ!');
                    else console.error('❌ [Android] อัปเดต Token ตกค้างพลาด:', error.message);
                });
        }

        return () => {
            delete (window as any).updateFcmTokenFromAndroid;
            delete (window as any).triggerRefreshFromAndroid;
        };
    }, [userId]);


    // ==========================================
    // 2. จัดการ Web FCM (บังคับอัปเดตลง fcm_token_web)
    // ==========================================
    useEffect(() => {
        if (!userId) return; 
        if ((window as any).AndroidBridge) return; // ถ้าเป็นแอป Android ข้าม Web FCM ไปเลย

        let webUnsubscribe: any;

        const setupWebFCM = async () => {
            try {
                if (!('serviceWorker' in navigator) || !('Notification' in window)) return;

                const messaging = getMessaging(app);
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (token) {
                    // 🌟 ยิงอัปเดตลง Database ทันที!
                    const { error } = await supabase
                        .from('profiles')
                        .update({ fcm_token_web: token })
                        .eq('id', userId);

                    if (!error) {
                        console.log('✅ [Web] อัปเดต FCM Token ลง Database สำเร็จ!');
                    } else {
                        console.error('❌ [Web] อัปเดต Token พลาด:', error.message);
                    }
                }

                webUnsubscribe = onMessage(messaging, (payload) => {
                    console.log('🔔 [Web] มีแจ้งเตือนเข้า!', payload);
                    // 🌟 แก้ไขตรงนี้: โยนข้อมูล (payload) ทั้งก้อนกลับไปให้หน้าเว็บเช็คต่อ
                    savedCallback.current(payload); 
                });
            } catch (error) {
                console.error('❌ [Web] FCM Setup Error:', error);
            }
        };

        setupWebFCM();

        return () => {
            if (webUnsubscribe) webUnsubscribe();
        };
    }, [userId]); 
};