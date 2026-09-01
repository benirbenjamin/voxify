'use client';

import React from 'react';
import { useChoir } from '@/lib/context/ChoirContext';
import { Bell, CheckCircle2, Volume2, Calendar, Sparkles } from 'lucide-react';

export default function NotificationsPage() {
  const { activeChoir } = useChoir();

  const notifications = [
    {
      id: '1',
      title: 'Welcome to Voxify Space',
      message: `Your choir ${activeChoir?.name || ''} is active and ready for multi-track voice practice.`,
      time: 'Just now',
      type: 'system',
    },
    {
      id: '2',
      title: 'Sunday Worship Songs Assigned',
      message: 'New choir songs have been added to your choir music library.',
      time: '2 hours ago',
      type: 'song',
    },
    {
      id: '3',
      title: 'Voice Part Readiness Tracker Active',
      message: 'Practice Soprano, Alto, Tenor, and Bass isolated tracks with speed control.',
      time: '1 day ago',
      type: 'practice',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-white py-4">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Choir Notifications</h1>
          <p className="text-xs text-slate-400">Updates, practice notices, and worship service announcements</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map(n => (
          <div key={n.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-purple-500/40 transition-colors">
            <div className="p-2.5 rounded-xl bg-purple-950/80 text-purple-400 shrink-0 border border-purple-800/40 mt-0.5">
              {n.type === 'song' ? <Volume2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{n.title}</h3>
                <span className="text-[11px] text-slate-500">{n.time}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
