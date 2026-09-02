'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { announcementService } from '@/lib/services/announcementService';
import { Announcement } from '@/lib/types/database.types';
import { Sparkles, Bell, Calendar, ArrowLeft } from 'lucide-react';

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
      {/* Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-400" /> Choir Announcements Board
        </h1>
        <p className="text-sm text-slate-400">Important notices and updates from Choir Directors</p>
      </div>

      {loading ? (
        <p className="text-center text-xs text-slate-400 py-16">Loading choir announcements...</p>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-900/40 p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <Bell className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Announcements Posted</h3>
          <p className="text-xs text-slate-400">Check back later for choir news and rehearsal updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/40">
                  {ann.priority || 'Normal'} Priority
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">{ann.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{ann.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
