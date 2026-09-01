'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { eventService } from '@/lib/services/eventService';
import { songService } from '@/lib/services/songService';
import { Song } from '@/lib/types/database.types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Music,
  Sparkles,
  Send
} from 'lucide-react';

interface SongAssignmentDraft {
  song_id: string;
  order_index: number;
  notes: string;
}

export default function ScheduleEventPage() {
  const router = useRouter();
  const { activeChoir } = useChoir();

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [assignedSongs, setAssignedSongs] = useState<SongAssignmentDraft[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSongs() {
      if (!activeChoir) return;
      setLoadingSongs(true);
      const songs = await songService.getChoirSongs(activeChoir.id);
      setAvailableSongs(songs);
      setLoadingSongs(false);
    }
    loadSongs();
  }, [activeChoir]);

  const handleAddSongAssignment = () => {
    if (availableSongs.length === 0) return;
    setAssignedSongs(prev => [
      ...prev,
      {
        song_id: availableSongs[0].id,
        order_index: prev.length + 1,
        notes: '',
      }
    ]);
  };

  const handleUpdateAssignment = (index: number, field: keyof SongAssignmentDraft, value: any) => {
    setAssignedSongs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignedSongs(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((item, idx) => ({ ...item, order_index: idx + 1 }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoir) return;

    setLoading(true);
    setError(null);

    const { event, error: eventErr } = await eventService.createEvent({
      choir_id: activeChoir.id,
      title,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime || undefined,
      location: location || undefined,
      description: description || undefined,
      status,
    });

    if (eventErr || !event) {
      setError(eventErr || 'Failed to create event');
      setLoading(false);
      return;
    }

    // Assign songs to event
    for (const item of assignedSongs) {
      if (item.song_id) {
        await eventService.assignSongToEvent({
          event_id: event.id,
          song_id: item.song_id,
          order_index: item.order_index,
          notes: item.notes,
        });
      }
    }

    router.push('/events');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/manage" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Choir Admin
      </Link>

      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-purple-400" /> Schedule New Event
        </h1>
        <p className="text-sm text-slate-400">Set up Sunday worship services, concerts, or rehearsals and assign choir song lists</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event General Info */}
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-purple-400" /> Event Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Sunday Morning Worship Service & Communion"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" /> Event Date *
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location / Sanctuary
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Main Church Sanctuary, Hall A"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Visibility Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
              >
                <option value="published">Active &amp; Published (Visible to Choir Members)</option>
                <option value="draft">Draft (Visible to Admins only)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Notes / Service Order Instructions
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add choir arrival time, dress code, or service order details..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Assigned Songs Section */}
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-indigo-400" /> Assigned Song Repertoire
              </h3>
              <p className="text-xs text-slate-400">Select songs from your library for this service</p>
            </div>
            <button
              type="button"
              onClick={handleAddSongAssignment}
              disabled={availableSongs.length === 0}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-950/40 border border-purple-800/40 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add Song to Event
            </button>
          </div>

          {loadingSongs ? (
            <p className="text-xs text-slate-400 text-center py-4">Loading song library...</p>
          ) : availableSongs.length === 0 ? (
            <div className="text-center py-6 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-xs text-slate-400">No songs found in choir library.</p>
              <Link href="/manage/songs/new" className="text-xs text-purple-400 hover:underline font-semibold block">
                + Upload a new song first
              </Link>
            </div>
          ) : assignedSongs.length === 0 ? (
            <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
              <Music className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No songs assigned to this event yet.</p>
              <button
                type="button"
                onClick={handleAddSongAssignment}
                className="text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl hover:bg-purple-600 hover:text-white transition-all inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Select Songs
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedSongs.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="w-7 h-7 rounded-xl bg-purple-950 border border-purple-800 text-purple-300 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      #{item.order_index}
                    </span>
                    <select
                      value={item.song_id}
                      onChange={e => handleUpdateAssignment(idx, 'song_id', e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 w-full md:w-64 font-semibold"
                    >
                      {availableSongs.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.category || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full md:flex-1">
                    <input
                      type="text"
                      value={item.notes}
                      onChange={e => handleUpdateAssignment(idx, 'notes', e.target.value)}
                      placeholder="Performance notes (e.g. Processional Hymn, Key of E-flat)..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAssignment(idx)}
                    className="p-2 text-rose-400 hover:text-rose-300 transition-colors shrink-0"
                    title="Remove Song"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? 'Creating Event...' : 'Schedule & Publish Event'} <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
