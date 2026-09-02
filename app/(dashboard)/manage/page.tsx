'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { choirService } from '@/lib/services/choirService';
import { attendanceService, AttendanceStats } from '@/lib/services/attendanceService';
import { songService } from '@/lib/services/songService';
import { eventService } from '@/lib/services/eventService';
import { ChoirMember, Song, Event } from '@/lib/types/database.types';
import {
  Users,
  Music,
  Calendar,
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Ban,
  Plus,
  TrendingUp,
  Percent,
  UserCheck,
  UserX,
  Clock3,
  ArrowLeft,
  BarChart3,
  Mail,
  Phone,
  Send,
  Loader2,
  Edit3,
  Trash2,
  EyeOff,
  Clock,
  MapPin
} from 'lucide-react';

export default function ChoirAdminPage() {
  const { activeChoir, isAdmin } = useChoir();
  const [members, setMembers] = useState<ChoirMember[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Invite Singer State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Event Action state
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      if (!activeChoir) return;
      setLoadingStats(true);

      const [memberData, songData, eventData, attendanceStats] = await Promise.all([
        choirService.getChoirMembers(activeChoir.id),
        songService.getChoirSongs(activeChoir.id),
        eventService.getChoirEvents(activeChoir.id),
        attendanceService.getChoirAttendanceStats(activeChoir.id),
      ]);

      setMembers(memberData);
      setSongs(songData);
      setEvents(eventData);
      setStats(attendanceStats);
      setLoadingStats(false);
    }
    loadAdminData();
  }, [activeChoir]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs">You must be a Choir Owner or Administrator to access this area.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-purple-400 hover:underline pt-2 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  const refreshEvents = async () => {
    if (activeChoir) {
      const data = await eventService.getChoirEvents(activeChoir.id);
      setEvents(data);
    }
  };

  const handleUpdateStatus = async (memberId: string, status: 'active' | 'rejected' | 'suspended') => {
    await choirService.updateMemberStatus(memberId, status);
    if (activeChoir) {
      const updated = await choirService.getChoirMembers(activeChoir.id);
      setMembers(updated);
    }
  };

  const handlePublishEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionId(eventId);
    await eventService.publishEvent(eventId);
    await refreshEvents();
    setActionId(null);
  };

  const handleUnpublishEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionId(eventId);
    await eventService.unpublishEvent(eventId);
    await refreshEvents();
    setActionId(null);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete event "${eventTitle}"?`)) return;
    setActionId(eventId);
    await eventService.deleteEvent(eventId);
    await refreshEvents();
    setActionId(null);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoir || !inviteEmail.trim()) return;

    setInviting(true);
    setInviteMsg(null);

    try {
      const res = await fetch('/api/choir/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choirId: activeChoir.id, email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteMsg({ type: 'success', text: `Invitation sent to ${inviteEmail}!` });
        setInviteEmail('');
      } else {
        setInviteMsg({ type: 'error', text: data.error || 'Failed to send invite.' });
      }
    } catch (err) {
      setInviteMsg({ type: 'error', text: 'Server error sending email invitation.' });
    }
    setInviting(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Universal Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Choir Admin Control Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-purple-400" /> Choir Master Control Center
          </h1>
          <p className="text-sm text-slate-400">
            Manage <span className="text-purple-300 font-bold">{activeChoir?.name}</span> • Roster, Invitations, Sunday Services &amp; Attendance Analytics
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Mail className="w-4 h-4" /> Invite Singer by Email
        </button>
      </div>

      {/* Email Invitation Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" /> Invite Singer to Choir
              </h3>
              <button
                onClick={() => { setInviteModalOpen(false); setInviteMsg(null); }}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {inviteMsg && (
              <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                inviteMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {inviteMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{inviteMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Singer Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="singer@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">The singer will receive an instant invitation email with choir join instructions.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setInviteModalOpen(false); setInviteMsg(null); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md flex items-center gap-1.5"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Choir Performance Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" /> Choir Attendance &amp; Performance Analytics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Clickable Attendance % Metric Card */}
          <Link
            href="/manage/attendance"
            className="bg-gradient-to-br from-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 space-y-2 relative overflow-hidden hover:border-emerald-400 hover:scale-[1.01] transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Attendance Rate</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {loadingStats ? '...' : `${stats?.attendancePercentage || 100}%`}
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.attendancePercentage || 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">Based on {stats?.rehearsalsCount || 0} rehearsal sessions →</p>
          </Link>

          {/* Clickable Active Members Metric Card */}
          <a
            href="#roster-section"
            className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-purple-500/50 hover:scale-[1.01] transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Active Singers</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-105">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{activeMembers.length}</div>
            <p className="text-[11px] text-slate-400">{pendingMembers.length} pending join request(s) →</p>
          </a>

          {/* Clickable Music Library Songs Metric Card */}
          <Link
            href="/songs"
            className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-indigo-500/50 hover:scale-[1.01] transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Songs in Library</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105">
                <Music className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{songs.length}</div>
            <p className="text-[11px] text-slate-400">Multi-track voice parts uploaded →</p>
          </Link>

          {/* Clickable Attendance Breakdown Card */}
          <Link
            href="/manage/attendance"
            className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-amber-500/50 hover:scale-[1.01] transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Present vs Absent</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-105">
                <Clock3 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-white pt-1">
              <span className="text-emerald-400 flex items-center gap-1">
                <UserCheck className="w-4 h-4" /> {stats?.presentCount || 0} Present
              </span>
              <span className="text-rose-400 flex items-center gap-1">
                <UserX className="w-4 h-4" /> {stats?.absentCount || 0} Absent
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{stats?.lateCount || 0} late, {stats?.excusedCount || 0} excused →</p>
          </Link>
        </div>
      </div>

      {/* Admin Action Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/manage/songs/new" className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 hover:scale-[1.01] transition-all space-y-3 group block cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-105">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">Upload New Song</h3>
          <p className="text-xs text-slate-400">Add voice part audio tracks, lyrics &amp; sheet music PDFs</p>
        </Link>

        <Link href="/manage/events/new" className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 hover:scale-[1.01] transition-all space-y-3 group block cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">Schedule Event</h3>
          <p className="text-xs text-slate-400">Assign Sunday songs to choir &amp; notify singers</p>
        </Link>

        <Link href="/manage/attendance" className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 hover:scale-[1.01] transition-all space-y-3 group block cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">Record Attendance</h3>
          <p className="text-xs text-slate-400">Mark rehearsal &amp; service present/absent statuses</p>
        </Link>

        <Link href="/manage/settings" className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 hover:scale-[1.01] transition-all space-y-3 group block cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-105">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">Choir Settings</h3>
          <p className="text-xs text-slate-400">Configure auto-approve, downloads &amp; notifications</p>
        </Link>
      </div>

      {/* Clickable Events Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> Manage Choir Events &amp; Services ({events.length})
          </h2>
          <Link
            href="/events"
            className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
          >
            View Full Calendar →
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">No events scheduled yet for this choir.</p>
            <Link href="/manage/events/new" className="inline-block text-xs text-indigo-400 font-bold hover:underline">
              + Schedule First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(ev => (
              <div
                key={ev.id}
                className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 group relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href="/events" className="space-y-1 block flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        ev.status === 'published'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                          : ev.status === 'ended'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                      }`}>
                        {ev.status === 'ended' ? '🔚 Ended' : ev.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" /> {ev.event_date} ({ev.start_time})
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {ev.title}
                    </h4>

                    {ev.location && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" /> {ev.location}
                      </p>
                    )}
                  </Link>

                  {/* Card Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ev.status === 'draft' && (
                      <button
                        onClick={(e) => handlePublishEvent(ev.id, e)}
                        disabled={actionId === ev.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
                        title="Publish to Singers"
                      >
                        <Send className="w-3 h-3" /> Publish
                      </button>
                    )}

                    {ev.status === 'published' && (
                      <button
                        onClick={(e) => handleUnpublishEvent(ev.id, e)}
                        disabled={actionId === ev.id}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
                        title="Unpublish Event"
                      >
                        <EyeOff className="w-3 h-3" /> Unpublish
                      </button>
                    )}

                    <Link
                      href="/events"
                      className="bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1"
                      title="Edit Event"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </Link>

                    <button
                      onClick={(e) => handleDeleteEvent(ev.id, ev.title, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Approval Requests Section */}
      {pendingMembers.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 p-6 rounded-3xl space-y-4">
          <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
            <Users className="w-5 h-5" /> Pending Membership Requests ({pendingMembers.length})
          </h2>
          <div className="space-y-3">
            {pendingMembers.map(m => (
              <div key={m.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <Link href={`/manage/members/${m.id}`} className="hover:underline">
                  <h4 className="font-bold text-white">{m.profile?.full_name || 'New Member'}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{m.profile?.email}</span>
                    {m.profile?.phone && (
                      <span className="flex items-center gap-1 text-purple-300">
                        <Phone className="w-3 h-3 text-purple-400" /> {m.profile.phone}
                      </span>
                    )}
                  </p>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(m.id, 'active')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Singer
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(m.id, 'rejected')}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clickable Active Choir Roster with Phone Numbers */}
      <div id="roster-section" className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Active Choir Roster ({activeMembers.length} Singers)</h2>
          <span className="text-xs text-purple-400 font-semibold">Click any singer to view individual attendance &amp; song analytics →</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold">
              <tr>
                <th className="p-4 rounded-l-xl">Singer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-r-xl">Analytics &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/60 transition-colors group">
                  <td className="p-4 font-semibold text-white">
                    <Link href={`/manage/members/${m.id}`} className="group-hover:text-purple-300 font-bold hover:underline flex items-center gap-2">
                      {m.profile?.full_name}
                    </Link>
                  </td>
                  <td className="p-4 text-xs text-slate-400">{m.profile?.email}</td>
                  <td className="p-4 text-xs text-purple-300 font-mono">
                    {m.profile?.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {m.profile.phone}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-sans italic">Not provided</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2.5 py-1 rounded-md font-semibold uppercase bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      {m.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-emerald-400 font-semibold capitalize">{m.status}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/manage/members/${m.id}`}
                        className="text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> View Analytics
                      </Link>

                      {m.role !== 'owner' && (
                        <button
                          onClick={() => handleUpdateStatus(m.id, 'suspended')}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
