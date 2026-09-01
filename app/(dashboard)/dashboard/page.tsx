'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { eventService } from '@/lib/services/eventService';
import { songService } from '@/lib/services/songService';
import { announcementService } from '@/lib/services/announcementService';
import { Event, Song, Announcement } from '@/lib/types/database.types';
import { Music, Calendar, Users, Sparkles, Volume2, ArrowRight, Share2, Copy, Check } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeChoir, isAdmin } = useChoir();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!activeChoir) return;
      const [eventsData, songsData, announceData] = await Promise.all([
        eventService.getChoirEvents(activeChoir.id),
        songService.getChoirSongs(activeChoir.id),
        announcementService.getAnnouncements(activeChoir.id),
      ]);
      setUpcomingEvents(eventsData);
      setSongs(songsData);
      setAnnouncements(announceData);
    }
    loadData();
  }, [activeChoir]);

  const copyCode = () => {
    if (!activeChoir) return;
    navigator.clipboard.writeText(activeChoir.choir_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!activeChoir) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="w-16 h-16 bg-purple-600/20 text-purple-400 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/30">
          <Music className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">No Active Choir Selected</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Create a new choir or enter a 5-character choir code to join an existing choir.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/choir/create" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg">
            Create a Choir
          </Link>
        </div>
      </div>
    );
  }

  const [copiedLink, setCopiedLink] = useState(false);

  const shareableLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://voxify.space'}/join/${activeChoir.choir_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Active Choir Welcome & Code Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-500/30 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30 font-semibold uppercase tracking-wider">
              {activeChoir.church_name || 'Active Choir'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{activeChoir.name}</h1>
          <p className="text-sm text-slate-300">
            Welcome back, <strong className="text-purple-300">{user?.full_name}</strong>! Prepare your voice parts for upcoming Sunday services.
          </p>
        </div>

        {/* Choir Code & Shareable Invitation Link Card */}
        <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Choir Code</span>
            <span className="text-xl font-black font-mono tracking-widest text-purple-400">{activeChoir.choir_code}</span>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
            <button
              onClick={copyCode}
              className="p-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Copy Choir Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={copyLink}
              className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Copy Shareable Join Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Choir Library</span>
            <Music className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{songs.length}</p>
          <p className="text-xs text-slate-500">Songs with practice audio</p>
        </div>

        <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Events</span>
            <Calendar className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-white">{upcomingEvents.length}</p>
          <p className="text-xs text-slate-500">Sunday services & rehearsals</p>
        </div>

        <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Announcements</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">{announcements.length}</p>
          <p className="text-xs text-slate-500">Choir notices & updates</p>
        </div>

        <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Role</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 capitalize">{isAdmin ? 'Choir Leader' : 'Active Singer'}</p>
          <p className="text-xs text-slate-500">Voice Part Readiness</p>
        </div>
      </div>

      {/* Featured Service Songs / Quick Practice */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-400" /> Songs to Prepare
          </h2>
          <Link href="/songs" className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
            View All Library <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {songs.length === 0 ? (
          <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-400">No songs added to library yet.</p>
            {isAdmin && (
              <Link href="/manage/songs/new" className="inline-block bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                + Upload First Song
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.slice(0, 3).map(song => (
              <div key={song.id} className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between gap-4 hover:border-purple-500/40 transition-all">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-800/40">
                    {song.category}
                  </span>
                  <h3 className="text-lg font-bold text-white line-clamp-1">{song.title}</h3>
                  {song.composer && <p className="text-xs text-slate-400">Composer: {song.composer}</p>}
                </div>

                <Link
                  href={`/songs/${song.id}`}
                  className="w-full bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-purple-500/30 transition-all"
                >
                  <Volume2 className="w-4 h-4" /> Practice Voice Parts
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
