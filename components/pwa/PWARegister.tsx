'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { notificationService } from '@/lib/services/notificationService';
import { BellRing, Check, Download, Share, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWARegister() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

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

    if (typeof window === 'undefined') return;

    // 2. Detect Standalone Mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent;
    const isIOSDevice = /iPhone|iPad|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 4. Handle PWA Install Prompt
    const dismissedAt = localStorage.getItem('voxify_pwa_install_dismissed');
    const isRecentlyDismissed = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isStandaloneMode && !isRecentlyDismissed) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check timer for visitors on non-installed apps (iOS or desktop/Android)
    const installTimer = setTimeout(() => {
      if (!isStandaloneMode && !isRecentlyDismissed) {
        setShowInstallBanner(true);
      }
    }, 1500);

    // 5. Check Notification Permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default' && user) {
        const notifTimer = setTimeout(() => {
          setShowNotificationBanner(true);
        }, 3500);
        return () => clearTimeout(notifTimer);
      }
    } else {
      setNotificationPermission('unsupported');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(installTimer);
    };
  }, [user]);

  // Web App Badge API Synchronization
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
    const interval = setInterval(syncBadgeCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setShowInstallBanner(false);
        }
      } catch (err) {
        console.log('PWA prompt error:', err);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem('voxify_pwa_install_dismissed', Date.now().toString());
    } catch {}
  };

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      setShowNotificationBanner(false);
    }
  };

  return (
    <>
      {/* PWA Install Banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-slate-900/95 border border-purple-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 transition-all">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shrink-0 shadow-md">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-tight">Install Voxify Space App</h4>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                  App
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Install Voxify on your device for quick access, offline music learning, and instant rehearsal alerts!
              </p>
              
              {/* iOS Safari Instructions */}
              {isIOS ? (
                <div className="mt-2 text-[11px] bg-slate-800/90 p-2.5 rounded-xl border border-slate-700 text-purple-200 flex items-center gap-2">
                  <Share className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>Tap <strong>Share</strong> button, then select <strong>"Add to Home Screen"</strong></span>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleInstallClick}
                    disabled={!deferredPrompt}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Install App
                  </button>
                  <button
                    onClick={handleDismissInstall}
                    className="text-slate-400 hover:text-white text-xs font-medium px-3 py-2 transition-colors cursor-pointer"
                  >
                    Not Now
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleDismissInstall}
              className="text-slate-400 hover:text-white p-1 transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
              aria-label="Close install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Notification Permission Banner */}
      {!showInstallBanner && showNotificationBanner && notificationPermission === 'default' && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-40 bg-slate-900/95 border border-purple-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-600/20 text-purple-300 rounded-xl shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-xs font-bold text-white">Enable Mobile Notifications</h4>
              <p className="text-[11px] text-slate-300 leading-snug">
                Get instant mobile alerts &amp; home-screen badges when new songs, rehearsal events, or announcements are posted!
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={requestPermission}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Enable
                </button>
                <button
                  onClick={() => setShowNotificationBanner(false)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1.5 transition-colors cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationBanner(false)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
              aria-label="Close notification prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
