'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { artistService } from '@/lib/services/artistService';
import { financialService } from '@/lib/services/financialService';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { ArtistProfile, Genre, MarketplaceSettings, WithdrawalRequest } from '@/lib/types/database.types';
import {
  Shield,
  Sliders,
  Users,
  Clock,
  Music,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Save,
  Globe
} from 'lucide-react';

export default function AdminMarketplacePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'settings' | 'artists' | 'withdrawals' | 'genres'>('withdrawals');

  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  const [loading, setLoading] = useState(true);

  // Settings form
  const [commissionPercent, setCommissionPercent] = useState<number>(15);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(50000);
  const [autoApproval, setAutoApproval] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Action status
  const [adminNote, setAdminNote] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.is_super_admin) {
      router.push('/dashboard');
      return;
    }

    async function loadAdminData() {
      try {
        const [setRes, artList, withList, genList] = await Promise.all([
          financialService.getMarketplaceSettings(),
          artistService.listAllArtistsForAdmin(),
          financialService.listAllWithdrawalRequestsForAdmin(),
          marketplaceService.getGenres(),
        ]);
        setSettings(setRes);
        setCommissionPercent(setRes.platform_commission_percent);
        setMinWithdrawal(setRes.min_withdrawal_amount);
        setAutoApproval(setRes.allow_auto_artist_approval);

        setArtists(artList);
        setWithdrawals(withList);
        setGenres(genList);
      } catch (err) {
        console.error('Error loading admin marketplace data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [user, authLoading, router]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setActionMsg(null);
    try {
      const updated = await financialService.updateMarketplaceSettings({
        platform_commission_percent: commissionPercent,
        min_withdrawal_amount: minWithdrawal,
        allow_auto_artist_approval: autoApproval,
      });
      setSettings(updated);
      setActionMsg('Platform marketplace settings saved successfully!');
    } catch (err: any) {
      setActionMsg('Failed to save settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleArtistStatusChange = async (artistId: string, status: 'approved' | 'suspended') => {
    const success = await artistService.updateArtistStatus(artistId, status);
    if (success) {
      setArtists(artists.map(a => a.id === artistId ? { ...a, status } : a));
      setActionMsg(`Artist status updated to ${status}.`);
    }
  };

  const handleWithdrawalProcess = async (requestId: string, status: 'paid' | 'rejected') => {
    const success = await financialService.updateWithdrawalStatus(requestId, status, adminNote);
    if (success) {
      setWithdrawals(withdrawals.map(w => w.id === requestId ? { ...w, status, admin_note: adminNote } : w));
      setActionMsg(`Withdrawal request marked as ${status.toUpperCase()}.`);
      setAdminNote('');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 my-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-purple-950 p-6 sm:p-8 rounded-3xl text-white shadow-2xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">
          <Shield className="w-3.5 h-3.5" /> Super Admin Control Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">Marketplace &amp; Artist Ecosystem Manager</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Manage commission %, process Mobile Money payout requests, approve artist applications, and edit Rwandan genres.
        </p>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        {[
          { key: 'withdrawals', label: `Payout Requests (${withdrawals.filter(w => w.status === 'pending').length})`, icon: Clock },
          { key: 'artists', label: `Artists (${artists.length})`, icon: Users },
          { key: 'settings', label: 'Platform Rules', icon: Sliders },
          { key: 'genres', label: `Genres (${genres.length})`, icon: Music },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Withdrawal Requests */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Artist Payout Requests</h2>
          {withdrawals.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center bg-slate-950 rounded-2xl border border-slate-800">
              No withdrawal requests logged.
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map(req => (
                <div key={req.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="text-sm font-extrabold text-white">
                        {req.artist?.stage_name || 'Artist ID: ' + req.artist_id}
                      </div>
                      <div className="text-xs text-slate-400">
                        Requested: {req.amount.toLocaleString()} RWF via <span className="uppercase font-bold text-amber-400">{req.payout_method}</span>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      req.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : req.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div><strong>Mobile / Account Number:</strong> {req.payout_details?.phone_number || 'N/A'}</div>
                    <div><strong>Account Name:</strong> {req.payout_details?.account_name || 'N/A'}</div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        placeholder="Admin processing note (optional)..."
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleWithdrawalProcess(req.id, 'paid')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Paid
                        </button>
                        <button
                          onClick={() => handleWithdrawalProcess(req.id, 'rejected')}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Artists Approval */}
      {activeTab === 'artists' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Registered Music Artists</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Stage Name</th>
                  <th className="py-3 px-4">Category &amp; Genres</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {artists.map(art => (
                  <tr key={art.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{art.stage_name}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="uppercase text-amber-400 font-bold">{art.music_type}</span> ({art.genres?.join(', ') || 'N/A'})
                    </td>
                    <td className="py-3 px-4 text-slate-400">{art.location}, {art.country}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        art.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : art.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {art.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {art.status !== 'approved' && (
                        <button
                          onClick={() => handleArtistStatusChange(art.id, 'approved')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold mr-2"
                        >
                          Approve
                        </button>
                      )}
                      {art.status !== 'suspended' && (
                        <button
                          onClick={() => handleArtistStatusChange(art.id, 'suspended')}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" /> Platform Marketplace Rules
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Platform Sales Commission Percentage (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={commissionPercent}
                onChange={e => setCommissionPercent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Platform retains {commissionPercent}%, artist receives {100 - commissionPercent}% net.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Minimum Withdrawal Threshold (RWF)
              </label>
              <input
                type="number"
                min={5000}
                step={5000}
                value={minWithdrawal}
                onChange={e => setMinWithdrawal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="auto-approval-check"
                checked={autoApproval}
                onChange={e => setAutoApproval(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500"
              />
              <label htmlFor="auto-approval-check" className="text-xs font-semibold text-slate-300 cursor-pointer">
                Automatically approve new artist registrations
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" /> Save Marketplace Settings
          </button>
        </form>
      )}

      {/* Tab 4: Genres */}
      {activeTab === 'genres' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Configured Genres (Rwandan Local &amp; International)</h2>
          <div className="flex flex-wrap gap-2">
            {genres.map(g => (
              <div
                key={g.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 max-w-xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{g.name}</span>
                  {g.is_local && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Local</span>}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{g.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
