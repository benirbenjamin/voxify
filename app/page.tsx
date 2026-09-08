'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { statsService, PlatformStats } from '@/lib/services/statsService';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { MarketplaceSong, SubscriptionPlan } from '@/lib/types/database.types';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  ShieldCheck,
  Calendar,
  Sparkles,
  Volume2,
  ArrowRight,
  CheckCircle2,
  Play,
  Pause,
  Repeat,
  Zap,
  Crown,
  LogOut,
  LayoutDashboard,
  Mic,
  ShoppingBag,
  Music,
  Heart,
  Globe
} from 'lucide-react';

export default function LandingPage() {
  const { user, artistProfile, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<PlatformStats>({
    totalChoirs: 0,
    totalSongs: 0,
    totalAudioTracks: 0,
    totalMembers: 0,
  });

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Marketplace Featured Songs
  const [featuredSongs, setFeaturedSongs] = useState<MarketplaceSong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  // Audio Preview State
  const [currentPreviewSong, setCurrentPreviewSong] = useState<MarketplaceSong | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const [activeVoicePart, setActiveVoicePart] = useState<'Full Mix' | 'Soprano' | 'Alto' | 'Tenor' | 'Bass'>('Soprano');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0x');

  useEffect(() => {
    async function loadData() {
      setLoadingPlans(true);
      setLoadingSongs(true);
      try {
        const [statsData, plansData, songsData] = await Promise.all([
          statsService.getPlatformStats(),
          subscriptionService.getAllPlans(),
          marketplaceService.getMarketplaceSongs({ limit: 6 }, user?.id),
        ]);
        setStats(statsData);
        setPlans(plansData);
        setFeaturedSongs(songsData);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoadingPlans(false);
        setLoadingSongs(false);
      }
    }
    loadData();
  }, [user]);

  const handlePlayPreview = (song: MarketplaceSong) => {
    if (currentPreviewSong?.id === song.id && isPlayingPreview) {
      audioElement?.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audioUrl = song.preview_audio_path || song.audio_file_path;
    const audio = new Audio(audioUrl);
    audio.currentTime = song.preview_start_time || 0;

    const previewEnd = song.preview_end_time || (song.preview_start_time + 30);
    audio.ontimeupdate = () => {
      if (audio.currentTime >= previewEnd) {
        audio.pause();
        setIsPlayingPreview(false);
      }
    };

    audio.onended = () => setIsPlayingPreview(false);

    audio.play();
    setAudioElement(audio);
    setCurrentPreviewSong(song);
    setIsPlayingPreview(true);

    marketplaceService.recordSongView(song.id);
  };

  return (
    <div className="min-h-screen bg-[#FCFEFF] text-[#475569] flex flex-col justify-between selection:bg-[#B9E2FF] selection:text-[#475569] scroll-smooth overflow-x-hidden w-full font-sans pb-16">
      
      {/* Navigation Header Bar */}
      <header className="border-b border-[#E6F2FC] bg-[#FCFEFF]/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#DFF1FF] border border-[#B9E2FF] p-1 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Image src="/logo.png" alt="Voxify Logo" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-[#475569]">
                Voxify Space
              </span>
              <span className="hidden sm:block text-[11px] text-[#A8B5C2] font-bold uppercase tracking-widest">
                Choir SaaS &amp; Music Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#475569]">
            <Link href="/marketplace" className="text-amber-600 hover:text-amber-500 font-extrabold flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <Sparkles className="w-4 h-4 text-amber-500" /> Music Marketplace
            </Link>
            <a href="#featured-songs" className="hover:text-purple-600 transition-colors">Artist Tracks</a>
            <a href="#features" className="hover:text-purple-600 transition-colors">Choir Features</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors">Pricing Plans</a>
          </nav>

          {/* Auth-Aware Action Buttons & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ThemeToggle showLabel={false} />
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {artistProfile ? (
                  <Link
                    href="/artist/dashboard"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline">Artist Portal</span>
                  </Link>
                ) : (
                  <Link
                    href="/onboarding/artist"
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-amber-300 transition-all flex items-center gap-1"
                  >
                    <Mic className="w-4 h-4 text-amber-600" />
                    <span className="hidden sm:inline">Become Artist</span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="bg-[#B9E2FF] hover:bg-[#a5d8ff] text-[#475569] text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 border border-[#E6F2FC]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden xs:inline">Choir Dashboard</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-xl text-[#A8B5C2] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/login" className="text-[#475569] hover:text-purple-600 text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-2 rounded-xl transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="bg-[#B9E2FF] hover:bg-[#a5d8ff] text-[#475569] text-xs sm:text-sm font-extrabold px-4 sm:px-5 py-2.5 rounded-xl shadow-sm border border-[#E6F2FC] transition-all hover:scale-105 flex items-center gap-1">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden bg-[#FCFEFF]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] sm:w-[750px] h-[250px] sm:h-[450px] bg-[#DFF1FF]/50 blur-[100px] sm:blur-[160px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DFF1FF] border border-[#B9E2FF] text-[#475569] text-xs font-bold uppercase tracking-widest shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Multi-Tenant Choir SaaS</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-widest shadow-sm">
              <Mic className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Music Creator Marketplace</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#000000] leading-tight sm:leading-tight">
            Manage Your Choir. <br />
            <span className="text-[#000000] underline decoration-[#B9E2FF] underline-offset-8">
              Discover &amp; Sell Original Music.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#475569] max-w-3xl mx-auto leading-relaxed px-2 font-medium">
            Voxify empowers Choir Masters to manage rehearsals, multi-track voice parts (Soprano, Alto, Tenor, Bass), and Sunday worship. <strong className="text-[#000000] font-extrabold">Songwriters &amp; Music Artists</strong> can now publish songs, set custom audio previews, earn sales revenue, and receive Mobile Money payouts!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/marketplace"
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-purple-600/20 transition-all flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" /> Explore Music Marketplace
            </Link>
            <Link
              href="/register"
              className="bg-[#DFF1FF] hover:bg-[#B9E2FF] text-[#000000] font-extrabold px-6 py-3.5 rounded-2xl border border-[#B9E2FF] transition-all flex items-center gap-2 text-sm"
            >
              <span>Create Choir or Artist Profile</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Join Code Box */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="bg-[#FFFFFF] border border-[#E6F2FC] p-2.5 sm:p-3 rounded-2xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2 backdrop-blur-xl">
              <input
                type="text"
                placeholder="Enter Choir Code (e.g. K7P2A)"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={5}
                className="w-full bg-transparent px-4 py-2.5 sm:py-3 text-center sm:text-left text-base text-[#000000] placeholder-[#A8B5C2] focus:outline-none uppercase font-mono tracking-widest font-extrabold"
              />
              <Link
                href={code.length === 5 ? `/join/${code}` : '#'}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shrink-0 ${
                  code.length === 5
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                    : 'bg-[#F5FAFF] text-[#A8B5C2] cursor-not-allowed border border-[#E6F2FC]'
                }`}
              >
                <span>Join Choir</span> <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED ARTIST MUSIC & MARKETPLACE SECTION */}
      <section id="featured-songs" className="bg-[#F5FAFF] border-y border-[#E6F2FC] py-16 sm:py-20 px-4 sm:px-8 space-y-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs uppercase tracking-wider">
                <Mic className="w-3.5 h-3.5 text-amber-600" /> New Released Songs &amp; Rwandan Local Music
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#000000]">
                Featured Songs on Voxify Marketplace
              </h2>
              <p className="text-sm text-[#475569] max-w-2xl font-medium">
                Listen to audio preview clips from independent songwriters and gospel creators across Rwandan local genres (Sebene, Igisirimba, Zoulu) and global tracks.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/marketplace"
                className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-5 py-3 rounded-2xl text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> View All Marketplace Songs &rarr;
              </Link>
            </div>
          </div>

          {/* Songs Grid */}
          {loadingSongs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-[#E6F2FC] space-y-4 animate-pulse">
                  <div className="w-full h-44 bg-[#DFF1FF] rounded-2xl"></div>
                  <div className="h-4 bg-[#DFF1FF] rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : featuredSongs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#E6F2FC] space-y-3">
              <Music className="w-10 h-10 text-purple-500 mx-auto" />
              <h3 className="text-base font-bold text-[#000000]">No marketplace songs published yet</h3>
              <p className="text-xs text-[#475569]">Be the first artist to publish original music on Voxify!</p>
              <Link
                href="/onboarding/artist"
                className="inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md"
              >
                <Mic className="w-4 h-4" /> Become an Artist Publisher
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSongs.map(song => {
                const isCurrentlyPlaying = currentPreviewSong?.id === song.id && isPlayingPreview;
                return (
                  <div
                    key={song.id}
                    className="bg-white border border-[#E6F2FC] rounded-3xl p-5 space-y-4 hover:shadow-xl hover:border-[#B9E2FC] transition-all group flex flex-col justify-between"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-[#E6F2FC]">
                      {song.cover_image_url ? (
                        <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center text-amber-400 font-bold">
                          <Music className="w-12 h-12" />
                        </div>
                      )}

                      {/* Preview Play Overlay Button */}
                      <button
                        onClick={() => handlePlayPreview(song)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <div className="w-14 h-14 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                          {isCurrentlyPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </div>
                      </button>

                      {/* Genre Tag */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider">
                          {song.genre?.name || song.music_type}
                        </span>
                        {song.genre?.is_local && (
                          <span className="px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                            Local
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-[#A8B5C2] font-semibold block truncate">
                        {song.artist?.stage_name || 'Independent Creator'}
                      </span>
                      <h3 className="text-base font-extrabold text-[#000000] truncate group-hover:text-purple-600 transition-colors">
                        {song.title}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-[#E6F2FC] flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-[#A8B5C2] font-bold block">Buy Song</span>
                        <span className="text-base font-extrabold text-[#000000] font-mono">
                          {song.price.toLocaleString()} RWF
                        </span>
                      </div>

                      <Link
                        href={`/songs/marketplace/${song.id}`}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Get Song</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* Real Database Statistics Counter Banner */}
      <section className="bg-[#FCFEFF] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#000000]">
              {stats.totalChoirs > 0 ? `${stats.totalChoirs}+` : '100+'}
            </span>
            <span className="block text-xs font-bold text-[#A8B5C2] uppercase tracking-wider">Registered Choirs</span>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#000000]">
              {stats.totalAudioTracks > 0 ? `${stats.totalAudioTracks}+` : '1,000+'}
            </span>
            <span className="block text-xs font-bold text-[#A8B5C2] uppercase tracking-wider">Voice Audio Tracks</span>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#000000]">
              {stats.totalSongs > 0 ? `${stats.totalSongs}+` : '500+'}
            </span>
            <span className="block text-xs font-bold text-[#A8B5C2] uppercase tracking-wider">Song Practice Files</span>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#000000]">
              {stats.totalMembers > 0 ? `${stats.totalMembers}+` : '5,000+'}
            </span>
            <span className="block text-xs font-bold text-[#A8B5C2] uppercase tracking-wider">Active Choir Singers</span>
          </div>
        </div>
      </section>

    </div>
  );
}
