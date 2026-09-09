'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { financialService, ArtistFinancialSummary } from '@/lib/services/financialService';
import { FinancialLedgerEntry, WithdrawalRequest } from '@/lib/types/database.types';
import { BackButton } from '@/components/ui/BackButton';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Plus,
  Shield,
  FileText
} from 'lucide-react';

export default function ArtistFinancialsPage() {
  const router = useRouter();
  const { user, artistProfile, loading: authLoading } = useAuth();

  const [summary, setSummary] = useState<ArtistFinancialSummary | null>(null);
  const [ledger, setLedger] = useState<FinancialLedgerEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(5000);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'airtel' | 'bank'>('momo');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoName, setMomoName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!artistProfile) {
      router.push('/onboarding/artist');
      return;
    }

    async function loadFinancialData() {
      try {
        const [sum, leg, withs, setRes] = await Promise.all([
          financialService.getArtistFinancialSummary(artistProfile!.id),
          financialService.getArtistLedger(artistProfile!.id),
          financialService.getArtistWithdrawalRequests(artistProfile!.id),
          financialService.getMarketplaceSettings(),
        ]);
        setSummary(sum);
        setLedger(leg);
        setWithdrawals(withs);
        setSettings(setRes);
        const minLimit = setRes?.min_withdrawal_amount ?? 5000;
        setMinWithdrawal(minLimit);
        setWithdrawAmount(minLimit);

        // Pre-fill payout details from artist profile
        const details = artistProfile?.payout_details || {};
        if (details.phone_number) setMomoNumber(details.phone_number);
        if (details.account_name) setMomoName(details.account_name);
        if (details.provider) setPayoutMethod(details.provider as any);
      } catch (err) {
        console.error('Error loading financials:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFinancialData();
  }, [user, artistProfile, authLoading, router]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await financialService.requestWithdrawal(
        artistProfile.id,
        withdrawAmount,
        payoutMethod,
        { phone_number: momoNumber, account_name: momoName }
      );

      setSuccessMsg(`Withdrawal request of ${withdrawAmount.toLocaleString()} RWF submitted successfully!`);
      setShowWithdrawModal(false);

      // Refresh data
      const [sum, leg, withs] = await Promise.all([
        financialService.getArtistFinancialSummary(artistProfile.id),
        financialService.getArtistLedger(artistProfile.id),
        financialService.getArtistWithdrawalRequests(artistProfile.id),
      ]);
      setSummary(sum);
      setLedger(leg);
      setWithdrawals(withs);
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!artistProfile) return null;

  return (
    <div className="space-y-6 my-4">
      <BackButton href="/artist/dashboard" label="Back to Artist Dashboard" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-purple-600 dark:text-purple-400" /> Financial Ledger &amp; Earnings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Immutable transaction records, platform commission splits, and Mobile Money payout requests.
          </p>
        </div>

        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={(summary?.availableBalance || 0) < 50000}
          className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            (summary?.availableBalance || 0) >= 50000
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" /> Request Payout (Min 50,000 RWF)
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Available Balance</span>
          <div className="text-2xl font-extrabold text-emerald-400">
            {(summary?.availableBalance || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">RWF</span>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-1">Ready for withdrawal</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Total Net Earned</span>
          <div className="text-2xl font-extrabold text-white">
            {(summary?.totalEarnings || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">RWF</span>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-1">After 15% platform split</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Gross Song Sales</span>
          <div className="text-2xl font-extrabold text-white">
            {(summary?.totalRevenue || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">RWF</span>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-1">{summary?.totalSalesCount || 0} song purchases</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Pending Payouts</span>
          <div className="text-2xl font-extrabold text-amber-400">
            {(summary?.pendingWithdrawalAmount || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">RWF</span>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-1">Processing requests</p>
        </div>
      </div>

      {/* Withdrawal Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" /> Payout &amp; Withdrawal Requests ({withdrawals.length})
        </h2>

        {withdrawals.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center bg-slate-950/50 rounded-2xl border border-slate-800">
            No withdrawal requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method &amp; Account</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {withdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {w.amount.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="uppercase font-bold text-amber-400">{w.payout_method}</span> ({w.payout_details?.phone_number || 'N/A'})
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        w.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : w.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Immutable Financial Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" /> Immutable Financial Sales Ledger ({ledger.length})
        </h2>

        {ledger.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center bg-slate-950/50 rounded-2xl border border-slate-800">
            No sales ledger entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Gross Sale</th>
                  <th className="py-3 px-4">Platform Fee (15%)</th>
                  <th className="py-3 px-4">Net Artist Amount</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ledger.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400 uppercase">
                      {entry.type}
                    </td>
                    <td className="py-3 px-4 font-mono text-white">
                      {Number(entry.amount).toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-400">
                      -{Number(entry.platform_fee_amount).toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      +{Number(entry.net_artist_amount).toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-xs">
                      {entry.description || 'Marketplace Song Purchase'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Request Mobile Money Payout</h3>
              <p className="text-xs text-slate-400">Available: {(summary?.availableBalance || 0).toLocaleString()} RWF</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-white block">Withdrawal Amount (RWF) *</label>
                  <span className="text-[11px] text-amber-400 font-bold">Min: {minWithdrawal.toLocaleString()} RWF</span>
                </div>
                <input
                  type="number"
                  min={minWithdrawal}
                  max={summary?.availableBalance || minWithdrawal}
                  required
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Minimum withdrawal threshold configured by admin: <strong className="text-white">{minWithdrawal.toLocaleString()} RWF</strong>.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="momo">MTN Mobile Money</option>
                  <option value="airtel">Airtel Money</option>
                  <option value="bank">Bank Account</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Money Phone / Account *</label>
                <input
                  type="text"
                  required
                  value={momoNumber}
                  onChange={e => setMomoNumber(e.target.value)}
                  placeholder="+250 788 000 000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Account Holder Full Name *</label>
                <input
                  type="text"
                  required
                  value={momoName}
                  onChange={e => setMomoName(e.target.value)}
                  placeholder="Jean Paul Habimana"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  {submitting ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
