'use client';

import React, { useEffect, useState } from 'react';
import { useChoir } from '@/lib/context/ChoirContext';
import { announcementService } from '@/lib/services/announcementService';
import { Announcement } from '@/lib/types/database.types';
import { Sparkles, Bell, Calendar } from 'lucide-react';

export default function AnnouncementsPage() {
  const { activeChoir } = useChoir();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!activeChoir) return;
      setLoading(true);
      const data = await announcementService.getAnnouncements(activeChoir.id);
      setAnnouncements(data);
      setLoading(false);
    }
    loadData();
  }, [activeChoir]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold">Choir Announcements Board</h1>
        <p className="text-sm text-slate-400">Important notices and updates from Choir Directors</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <Bell className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No announcements posted yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map(item => (
            <div key={item.id} className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${
                  item.priority === 'high' ? 'bg-rose-950/60 text-rose-300 border-rose-800/40' : 'bg-purple-950/60 text-purple-300 border-purple-800/40'
                }`}>
                  {item.priority === 'high' ? 'High Priority' : 'Announcement'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
