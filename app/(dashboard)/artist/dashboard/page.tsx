'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { financialService, ArtistFinancialSummary } from '@/lib/services/financialService';
import { MarketplaceSong } from '@/lib/types/database.types';
import {
  Mic,
  Plus,
  DollarSign,
  TrendingUp,
  Eye,
  Heart,
  Music,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  Wallet,
  Clock
} from 'lucide-react';

export default function ArtistDashboardPage() {
  const router = useRouter();
  const { user, artistProfile, loading: authLoading } = useAuth();

  const [summary, setSummary] = useState<ArtistFinancialSummary | null>(null);
  const [songs, setSongs] = useState<MarketplaceSong[]>([]);
  const [loading, setLoading] = useState(true);

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

    async function loadData() {
      try {
        const [finData, artistSongs] = await Promise.all([
          financialService.getArtistFinancialSummary(artistProfile!.id),
          marketplaceService.getMarketplaceSongs({ artistId: artistProfile!.id, limit: 10 }),
        ]);
        setSummary(finData);
        setSongs(artistSongs);
      } catch (err) {
        console.error('Error loading artist dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, artistProfile, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!artistProfile) return null;

  const totalViews = songs.reduce((acc, s) => acc + (s.views_count || 0), 0);
  const totalLikes = songs.reduce((acc, s) => acc + (s.likes_count || 0), 0);

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-purple-950/40 border border-amber-500/20 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Mic className="w-64 h-64 text-amber-400" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Artist Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, <span className="text-amber-400">{artistProfile.stage_name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage your published songs, track marketplace sales, and request payout earnings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/artist/songs/upload"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" /> Upload New Song
            </Link>
            <Link
              href="/artist/financials"
              className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-2xl border border-slate-700 transition-all flex items-center gap-2 text-xs sm:text-sm"
            >
              <Wallet className="w-4 h-4 text-amber-400" /> Payout &amp; Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* Financial & Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Available Balance */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Available Balance</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {(summary?.availableBalance || 0).toLocaleString()} <span className="text-xs text-emerald-400 font-normal">RWF</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Minimum Payout: 50,000 RWF</span>
            <Link href="/artist/financials" className="text-amber-400 hover:underline font-bold">
              Withdraw &rarr;
            </Link>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Net Earnings</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {(summary?.totalEarnings || 0).toLocaleString()} <span className="text-xs text-amber-400 font-normal">RWF</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            From {summary?.totalSalesCount || 0} song purchases
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Song Listeners / Views</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{totalViews.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Across {songs.length} published tracks
          </div>
        </div>

        {/* Total Likes */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Track Likes</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{totalLikes.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Listener appreciation count
          </div>
        </div>
      </div>

      {/* Published Song Catalog Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-400" /> Your Published Songs ({songs.length})
            </h2>
            <p className="text-xs text-slate-400">Songs available for purchase and audio preview on Voxify Marketplace</p>
          </div>
          <Link
            href="/artist/songs/upload"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            + Upload Song
          </Link>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No songs published yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start earning by uploading your first audio track with custom audio preview range and pricing.
            </p>
            <Link
              href="/artist/songs/upload"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Upload Your First Song
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {songs.map(song => (
              <div
                key={song.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative border border-slate-700">
                    {song.cover_image_url ? (
                      <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-400 font-bold text-sm bg-amber-500/10">
                        <Music className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium text-[10px]">
                        {song.genre?.name || song.music_type}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {song.price.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs">
                  <div className="text-right hidden sm:block">
                    <div className="text-slate-300 font-bold">{song.purchases_count || 0} sales</div>
                    <div className="text-slate-500 text-[10px]">{song.views_count || 0} plays</div>
                  </div>
                  <Link
                    href={`/songs/marketplace/${song.id}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="View Song Marketplace Page"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
