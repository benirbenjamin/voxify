'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { notificationService } from '@/lib/services/notificationService';
import { NotificationItem } from '@/lib/types/database.types';
import {
  Bell,
  CheckCircle2,
  Volume2,
  Calendar,
  Sparkles,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Loader2,
  BellOff
} from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { activeChoir } = useChoir();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      setLoading(true);
      const data = await notificationService.getUserNotifications(user.id);
      setNotifications(data);
      setLoading(false);
    }
    loadNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    setActionLoading(true);
    await notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setActionLoading(false);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'song':
        return <Volume2 className="w-4 h-4 text-purple-400" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'announcement':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-white py-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Choir Notifications</h1>
            <p className="text-xs text-slate-400">
              Live updates, practice notices, and worship service announcements {activeChoir ? `for ${activeChoir.name}` : ''}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/50 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
            filter === 'unread'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400" />
          <p className="text-xs">Loading live notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3 p-8">
          <BellOff className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Notifications</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You have read all your notifications! Great job keeping up with your choir.'
              : 'No notifications available yet. You will be notified when new songs, events, or announcements are posted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(n => {
            const cardContent = (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  !n.is_read
                    ? 'bg-slate-900 border-purple-500/40 shadow-lg shadow-purple-950/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 opacity-90'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-950 shrink-0 border border-slate-800 mt-0.5">
                  {getIconForType(n.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{n.title}</h3>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>

                  {n.link && (
                    <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300">
                      View details <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {!n.is_read && (
                  <button
                    onClick={e => handleMarkAsRead(n.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors shrink-0"
                    title="Mark as Read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );

            if (n.link) {
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => {
                    if (!n.is_read) notificationService.markAsRead(n.id);
                  }}
                  className="block"
                >
                  {cardContent}
                </Link>
              );
            }

            return <div key={n.id}>{cardContent}</div>;
          })}
        </div>
      )}
    </div>
  );
}
