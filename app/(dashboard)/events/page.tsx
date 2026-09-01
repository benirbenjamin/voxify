'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { eventService } from '@/lib/services/eventService';
import { Event } from '@/lib/types/database.types';
import { Calendar, Music, Clock, MapPin, Volume2, Plus, Send, CheckCircle2 } from 'lucide-react';

export default function EventsPage() {
  const { activeChoir, isAdmin } = useChoir();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      if (!activeChoir) return;
      setLoading(true);
      const data = await eventService.getChoirEvents(activeChoir.id);
      setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, [activeChoir]);

  const handlePublishEvent = async (eventId: string) => {
    setPublishingId(eventId);
    const ok = await eventService.publishEvent(eventId);
    if (ok && activeChoir) {
      const updated = await eventService.getChoirEvents(activeChoir.id);
      setEvents(updated);
    }
    setPublishingId(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-400" /> Events &amp; Service Assignments
          </h1>
          <p className="text-sm text-slate-400">View upcoming Sunday worship services and assigned song repertoire</p>
        </div>
        {isAdmin && (
          <Link
            href="/manage/events/new"
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Schedule Event
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading choir events...</div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No upcoming events scheduled.</p>
          {isAdmin && (
            <Link
              href="/manage/events/new"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Schedule First Event
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(ev => (
            <div key={ev.id} className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 hover:border-slate-700/60 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
                      ev.status === 'published'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {ev.status === 'published' ? 'Active & Published' : 'Draft'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white pt-1">{ev.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-purple-400" /> {ev.event_date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-400" /> {ev.start_time} {ev.end_time ? `- ${ev.end_time}` : ''}</span>
                    {ev.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {ev.location}</span>}
                  </div>
                </div>

                {isAdmin && ev.status === 'draft' && (
                  <button
                    onClick={() => handlePublishEvent(ev.id)}
                    disabled={publishingId === ev.id}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> {publishingId === ev.id ? 'Publishing...' : 'Publish Event'}
                  </button>
                )}
              </div>

              {ev.description && (
                <p className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  {ev.description}
                </p>
              )}

              {/* Assigned Songs Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-indigo-400" /> Assigned Songs ({ev.assigned_songs?.length || 0})
                </h4>
                {ev.assigned_songs?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No songs assigned to this service yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ev.assigned_songs?.map(item => (
                      <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4 group hover:border-purple-500/40 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-purple-400 font-bold">Song #{item.order_index}</span>
                          <h5 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                            {item.song?.title || 'Assigned Song'}
                          </h5>
                          {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                        </div>
                        {item.song?.id && (
                          <Link
                            href={`/songs/${item.song.id}`}
                            className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white p-2.5 rounded-xl border border-purple-500/30 transition-all shrink-0"
                            title="Practice Voice Parts"
                          >
                            <Volume2 className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
