'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { notificationService } from '@/lib/services/notificationService';
import { BellRing, Check, X } from 'lucide-react';

export function PWARegister() {
  const { user } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPromptBanner, setShowPromptBanner] = useState(false);

  useEffect(() => {
    // 1. Register PWA Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.log('PWA ServiceWorker registration failed:', err);
        });
    }

    // 2. Check Notification Permission Support
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default' && user) {
        // Delay showing banner slightly for smooth UX
        const timer = setTimeout(() => setShowPromptBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setNotificationPermission('unsupported');
    }
  }, [user]);

  // 3. Web App Badge API Synchronization
  useEffect(() => {
    if (!user) {
      if (typeof window !== 'undefined' && 'clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(() => {});
      }
      return;
    }

    async function syncBadgeCount() {
      if (!user) return;
      try {
        const count = await notificationService.getUnreadCount(user.id);
        if ('setAppBadge' in navigator) {
          if (count > 0) {
            await navigator.setAppBadge(count);
          } else {
            await navigator.clearAppBadge();
          }
        }
      } catch (err) {
        console.log('App Badging sync note:', err);
      }
    }

    syncBadgeCount();
    const interval = setInterval(syncBadgeCount, 15000); // sync every 15s
    return () => clearInterval(interval);
  }, [user]);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      setShowPromptBanner(false);
    }
  };

  if (!showPromptBanner || notificationPermission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 bg-slate-900 border border-purple-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-600/20 text-purple-300 rounded-xl shrink-0">
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>
        <div className="space-y-1 flex-1">
          <h4 className="text-xs font-bold text-white">Enable Mobile Notifications</h4>
          <p className="text-[11px] text-slate-300">
            Get instant mobile alerts &amp; home-screen badges when new songs, rehearsal events, or announcements are posted!
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={requestPermission}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Enable
            </button>
            <button
              onClick={() => setShowPromptBanner(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1.5 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowPromptBanner(false)}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
