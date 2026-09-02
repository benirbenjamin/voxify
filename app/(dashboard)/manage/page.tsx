'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { choirService } from '@/lib/services/choirService';
import { attendanceService, AttendanceStats } from '@/lib/services/attendanceService';
import { songService } from '@/lib/services/songService';
import { ChoirMember, Song } from '@/lib/types/database.types';
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
  Clock3
} from 'lucide-react';

export default function ChoirAdminPage() {
  const { activeChoir, isAdmin } = useChoir();
  const [members, setMembers] = useState<ChoirMember[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      if (!activeChoir) return;
      setLoadingStats(true);

      const [memberData, songData, attendanceStats] = await Promise.all([
        choirService.getChoirMembers(activeChoir.id),
        songService.getChoirSongs(activeChoir.id),
        attendanceService.getChoirAttendanceStats(activeChoir.id),
      ]);

      setMembers(memberData);
      setSongs(songData);
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
      </div>
    );
  }

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  const handleUpdateStatus = async (memberId: string, status: 'active' | 'rejected' | 'suspended') => {
    await choirService.updateMemberStatus(memberId, status);
    if (activeChoir) {
      const updated = await choirService.getChoirMembers(activeChoir.id);
      setMembers(updated);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Choir Master Administration</h1>
          <p className="text-sm text-slate-400">Manage members, view attendance stats, upload songs, and schedule rehearsals for {activeChoir?.name}</p>
        </div>
      </div>

      {/* Choir Performance Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" /> Choir Attendance &amp; Performance Analytics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Attendance % Metric Card */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Attendance Rate</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
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
            <p className="text-[11px] text-slate-400">Based on {stats?.rehearsalsCount || 0} rehearsal sessions</p>
          </div>

          {/* Active Members Metric Card */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Active Singers</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{activeMembers.length}</div>
            <p className="text-[11px] text-slate-400">{pendingMembers.length} pending join request(s)</p>
          </div>

          {/* Music Library Songs Metric Card */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Songs in Library</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Music className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{songs.length}</div>
            <p className="text-[11px] text-slate-400">Multi-track voice parts uploaded</p>
          </div>

          {/* Attendance Breakdown (Present / Absent) */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Present vs Absent</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
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
            <p className="text-[11px] text-slate-400">{stats?.lateCount || 0} late, {stats?.excusedCount || 0} excused</p>
          </div>
        </div>
      </div>

      {/* Admin Action Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/manage/songs/new" className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all space-y-3 group">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-105">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">Upload New Song</h3>
          <p className="text-xs text-slate-400">Add voice part audio tracks, lyrics &amp; sheet music PDFs</p>
        </Link>

        <Link href="/manage/events/new" className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all space-y-3 group">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">Schedule Event</h3>
          <p className="text-xs text-slate-400">Assign Sunday songs to choir &amp; notify singers</p>
        </Link>

        <Link href="/manage/attendance" className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all space-y-3 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">Record Attendance</h3>
          <p className="text-xs text-slate-400">Mark rehearsal &amp; service present/absent statuses</p>
        </Link>

        <Link href="/manage/settings" className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all space-y-3 group">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-105">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">Choir Settings</h3>
          <p className="text-xs text-slate-400">Configure auto-approve, downloads &amp; notifications</p>
        </Link>
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
                <div>
                  <h4 className="font-bold text-white">{m.profile?.full_name || 'New Member'}</h4>
                  <p className="text-xs text-slate-400">{m.profile?.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(m.id, 'active')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(m.id, 'rejected')}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Choir Roster */}
      <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Active Choir Roster ({activeMembers.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold">
              <tr>
                <th className="p-4 rounded-l-xl">Member Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-semibold text-white">{m.profile?.full_name}</td>
                  <td className="p-4 text-xs text-slate-400">{m.profile?.email}</td>
                  <td className="p-4">
                    <span className="text-xs px-2.5 py-1 rounded-md font-semibold uppercase bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      {m.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-emerald-400 font-semibold capitalize">{m.status}</td>
                  <td className="p-4">
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => handleUpdateStatus(m.id, 'suspended')}
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" /> Suspend
                      </button>
                    )}
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
