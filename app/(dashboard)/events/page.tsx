'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { eventService } from '@/lib/services/eventService';
import { Event } from '@/lib/types/database.types';
import { Calendar, Music, Clock, MapPin, Volume2, Plus, Send, CheckCircle2, ArrowLeft } from 'lucide-react';

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
      const data = await eventService.getChoirEvents(activeChoir.id);
      setEvents(data);
    }
    setPublishingId(null);
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-400" /> Worship Services &amp; Events
          </h1>
          <p className="text-sm text-slate-400">View upcoming Sunday worship services, rehearsals, and song assignments</p>
        </div>

        {isAdmin && (
          <Link
            href="/manage/events/new"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Schedule New Event
          </Link>
        )}
      </div>

      {/* Events List */}
      {loading ? (
        <p className="text-center text-xs text-slate-400 py-16">Loading upcoming choir events...</p>
      ) : events.length === 0 ? (
        <div className="bg-slate-900/40 p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Events Scheduled</h3>
          <p className="text-xs text-slate-400">Check back soon for new Sunday worship services or rehearsals.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(ev => (
            <div key={ev.id} className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 hover:border-indigo-500/40 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                      {ev.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> {ev.start_time} {ev.end_time ? `- ${ev.end_time}` : ''}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">{ev.title}</h3>
                  {ev.location && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> {ev.location}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-center shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Date</span>
                    <span className="text-sm font-bold text-indigo-300 font-mono">{ev.event_date}</span>
                  </div>

                  {isAdmin && ev.status === 'draft' && (
                    <button
                      onClick={() => handlePublishEvent(ev.id)}
                      disabled={publishingId === ev.id}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" /> {publishingId === ev.id ? 'Publishing...' : 'Publish to Singers'}
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned Songs for this Event */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-400" /> Assigned Songs for Worship
                </h4>

                {!ev.assigned_songs || ev.assigned_songs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No songs assigned to this event yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ev.assigned_songs.map((asg: any) => (
                      <Link
                        key={asg.id}
                        href={asg.song ? `/songs/${asg.song.id}` : '#'}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 hover:border-purple-500/40 transition-all group"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                            Track #{asg.order_index} • {asg.song?.category || 'Worship'}
                          </span>
                          <h5 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                            {asg.song?.title || 'Assigned Song'}
                          </h5>
                        </div>

                        <div className="bg-purple-950/60 text-purple-300 p-2 rounded-xl border border-purple-800/40 shrink-0">
                          <Volume2 className="w-4 h-4" />
                        </div>
                      </Link>
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
