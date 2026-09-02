'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { eventService } from '@/lib/services/eventService';
import { songService } from '@/lib/services/songService';
import { announcementService } from '@/lib/services/announcementService';
import { attendanceService, AttendanceStats } from '@/lib/services/attendanceService';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { Event, Song, Announcement, SubscriptionPlan } from '@/lib/types/database.types';
import {
  Music,
  Calendar,
  Users,
  Sparkles,
  Volume2,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Crown,
  Zap,
  KeyRound,
  Plus,
  Percent,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeChoir, activeMember, isAdmin } = useChoir();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  
  // Personal Singer Analytics State
  const [myAttendanceStats, setMyAttendanceStats] = useState<AttendanceStats | null>(null);
  const [myLearningStats, setMyLearningStats] = useState<{ readyCount: number; learningCount: number }>({ readyCount: 0, learningCount: 0 });

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!activeChoir) return;
      
      const [eventsData, songsData, announceData, subData] = await Promise.all([
        eventService.getChoirEvents(activeChoir.id),
        songService.getChoirSongs(activeChoir.id),
        announcementService.getAnnouncements(activeChoir.id),
        subscriptionService.getChoirSubscription(activeChoir.id),
      ]);

      setUpcomingEvents(eventsData);
      setSongs(songsData);
      setAnnouncements(announceData);
      setCurrentPlan(subData.plan);

      // Load Personal Singer Analytics if active member profile loaded
      if (activeMember) {
        const [attStats, learnStats] = await Promise.all([
          attendanceService.getMemberAttendanceStats(activeMember.id),
          songService.getMemberLearningSummary(activeMember.id),
        ]);
        setMyAttendanceStats(attStats);
        setMyLearningStats(learnStats);
      }
    }
    loadData();
  }, [activeChoir, activeMember]);

  const copyCode = () => {
    if (!activeChoir) return;
    navigator.clipboard.writeText(activeChoir.choir_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareableLink = activeChoir
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://voxify.space'}/join/${activeChoir.choir_code}`
    : '';

  const copyLink = () => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (!activeChoir || !shareableLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${activeChoir.name} on Voxify Space`,
          text: `Use this link or code ${activeChoir.choir_code} to join ${activeChoir.name} choir on Voxify Space!`,
          url: shareableLink,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    router.push(`/join/${joinCodeInput.trim().toUpperCase()}`);
  };

  // State: No Active Choir Joined Yet (Singers vs Directors)
  if (!activeChoir) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8 text-center">
        <div className="w-16 h-16 bg-purple-600/20 text-purple-400 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/30">
          <Music className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Welcome to Voxify Space</h1>
          <p className="text-sm text-slate-400">
            Hello <strong className="text-purple-300">{user?.full_name}</strong>! Enter a 5-character Choir Code from your Choir Master to join a choir, or create your own choir.
          </p>
        </div>

        {/* Singer / Choir Member Join Form */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 text-left shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <KeyRound className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Join a Choir as a Singer / Member</h2>
              <p className="text-xs text-slate-400">Ask your Choir Director for the 5-character choir code (e.g. ABC12)</p>
            </div>
          </div>

          <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              maxLength={8}
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="ENTER CHOIR CODE (e.g. ABC12)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-mono tracking-widest text-purple-300 font-bold uppercase focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-xs shrink-0"
            >
              Join Choir <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Choir Director Option */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" /> Are you a Choir Director / Master?
            </h3>
            <p className="text-xs text-slate-400">Create and manage your own choir organization, upload audio parts, and schedule rehearsals.</p>
          </div>
          <Link
            href="/choir/create"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 border border-slate-700"
          >
            <Plus className="w-4 h-4 text-purple-400" /> Create New Choir
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Choir Welcome & Code Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-500/30 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30 font-semibold uppercase tracking-wider">
              {activeChoir.church_name || 'Active Choir'}
            </span>
            <span className="bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-500/30 font-bold uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              {currentPlan?.name || 'Community Free Plan'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{activeChoir.name}</h1>
          <p className="text-sm text-slate-300">
            Welcome back, <strong className="text-purple-300">{user?.full_name}</strong>! Practice your voice parts for upcoming choir rehearsals and services.
          </p>
        </div>

        {/* Choir Code, Copy Link & Native Share App Buttons */}
        <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Choir Code</span>
            <span className="text-xl font-black font-mono tracking-widest text-purple-400">{activeChoir.choir_code}</span>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4 flex-wrap justify-center">
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
              title="Copy Direct Join Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-md shadow-purple-600/30"
              title="Open Device Share Menu (WhatsApp, Email, etc.)"
            >
              <Share2 className="w-4 h-4" />
              <span>Share App</span>
            </button>

            {isAdmin && (
              <Link
                href={`/choir/plan-select?choirId=${activeChoir.id}`}
                className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Upgrade Choir Subscription Plan"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Upgrade Plan</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Personal Singer Performance & Learning Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" /> Your Personal Singer Performance &amp; Song Analytics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Singer Attendance % Hero Card */}
          <Link
            href="/events"
            className="bg-gradient-to-br from-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 space-y-2 hover:border-emerald-400 transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Your Attendance</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {myAttendanceStats ? `${myAttendanceStats.attendancePercentage}%` : '100%'}
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${myAttendanceStats?.attendancePercentage || 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {myAttendanceStats?.presentCount || 0} Present, {myAttendanceStats?.absentCount || 0} Absent →
            </p>
          </Link>

          {/* Songs Fully Learnt Card */}
          <Link
            href="/songs"
            className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-purple-500/50 transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Songs Fully Learnt</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-105">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{myLearningStats.readyCount}</div>
            <p className="text-[11px] text-slate-400">Marked &quot;Ready&quot; for Sunday services →</p>
          </Link>

          {/* Songs Currently Learning Card */}
          <Link
            href="/songs"
            className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-indigo-500/50 transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Songs In Practice</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{myLearningStats.learningCount}</div>
            <p className="text-[11px] text-slate-400">Currently practicing voice tracks →</p>
          </Link>

          {/* Singer Role & Voice Part */}
          <Link
            href={isAdmin ? "/manage" : "/songs"}
            className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-amber-500/50 transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Voice Section</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-105">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-300 capitalize">
              {activeMember?.role === 'owner' ? 'Choir Master' : activeMember?.role === 'admin' ? 'Choir Director' : 'Choir Member'}
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">
              Status: <span className="text-emerald-400 capitalize">{activeMember?.status || 'Active'}</span> →
            </p>
          </Link>
        </div>
      </div>

      {/* Clickable Overview Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/songs"
          className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Choir Library</span>
            <Music className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors">{songs.length}</p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400">Songs with practice audio →</p>
        </Link>

        <Link
          href="/events"
          className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-indigo-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Events</span>
            <Calendar className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-indigo-300 transition-colors">{upcomingEvents.length}</p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400">Sunday services &amp; rehearsals →</p>
        </Link>

        <Link
          href="/announcements"
          className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Announcements</span>
            <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-amber-300 transition-colors">{announcements.length}</p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400">Choir notices &amp; updates →</p>
        </Link>

        <Link
          href={isAdmin ? "/manage" : "/songs"}
          className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Your Role</span>
            <Users className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 capitalize">
            {isAdmin ? 'Choir Master / Director' : 'Choir Singer / Member'}
          </p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400">
            {isAdmin ? 'Access Choir Admin →' : 'Practice Voice Parts →'}
          </p>
        </Link>
      </div>

      {/* Featured Service Songs / Practice Section for Choir Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-400" /> Songs to Practice
          </h2>
          <Link href="/songs" className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
            View All Library <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {songs.length === 0 ? (
          <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-400">No songs added to choir library yet.</p>
            {isAdmin && (
              <Link href="/manage/songs/new" className="inline-block bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
                + Upload First Song
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.slice(0, 3).map(song => (
              <Link
                key={song.id}
                href={`/songs/${song.id}`}
                className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between gap-4 hover:border-purple-500/60 hover:bg-slate-900 transition-all group block cursor-pointer"
              >
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-800/40">
                    {song.category}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                    {song.title}
                  </h3>
                  {song.composer && <p className="text-xs text-slate-400">Composer: {song.composer}</p>}
                </div>

                <div className="w-full bg-purple-600/20 group-hover:bg-purple-600 text-purple-300 group-hover:text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-purple-500/30 transition-all">
                  <Volume2 className="w-4 h-4" /> Practice Voice Parts
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
