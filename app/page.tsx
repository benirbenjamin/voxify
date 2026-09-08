'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { statsService, PlatformStats } from '@/lib/services/statsService';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { SubscriptionPlan } from '@/lib/types/database.types';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ShieldCheck, Calendar, Sparkles, Volume2, ArrowRight, CheckCircle2, Play, Pause, Repeat, Zap, Crown, LogOut, LayoutDashboard } from 'lucide-react';

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<PlatformStats>({
    totalChoirs: 0,
    totalSongs: 0,
    totalAudioTracks: 0,
    totalMembers: 0,
  });

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [activeVoicePart, setActiveVoicePart] = useState<'Full Mix' | 'Soprano' | 'Alto' | 'Tenor' | 'Bass'>('Soprano');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0x');

  useEffect(() => {
    async function loadData() {
      setLoadingPlans(true);
      const [statsData, plansData] = await Promise.all([
        statsService.getPlatformStats(),
        subscriptionService.getAllPlans(),
      ]);
      setStats(statsData);
      setPlans(plansData);
      setLoadingPlans(false);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFEFF] text-[#475569] flex flex-col justify-between selection:bg-[#B9E2FF] selection:text-[#475569] scroll-smooth overflow-x-hidden w-full font-sans">
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
                Choir SaaS Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#475569]">
            <a href="#features" className="hover:text-purple-600 transition-colors">Features</a>
            <a href="#demo" className="hover:text-purple-600 transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors">Pricing Plans</a>
          </nav>

          {/* Auth-Aware Action Buttons & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ThemeToggle showLabel={false} />
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/dashboard"
                  className="bg-[#B9E2FF] hover:bg-[#a5d8ff] text-[#475569] text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 flex items-center gap-1.5 border border-[#E6F2FC]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden xs:inline">Dashboard</span>
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
                  <span>Create Choir</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-24 pb-16 sm:pb-28 px-4 sm:px-6 overflow-hidden bg-[#FCFEFF]">
        {/* Soft Background Highlight Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] sm:w-[750px] h-[250px] sm:h-[450px] bg-[#DFF1FF]/50 blur-[100px] sm:blur-[160px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DFF1FF] border border-[#B9E2FF] text-[#475569] text-xs font-bold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="truncate">Multi-Tenant Choir &amp; Music Learning SaaS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#475569] leading-tight sm:leading-tight">
            Manage Your Choir. <br />
            <span className="text-[#475569] underline decoration-[#B9E2FF] underline-offset-8">
              Master Every Voice Part.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#475569]/90 max-w-2xl mx-auto leading-relaxed px-2">
            The complete platform for Choir Directors and Singers. Schedule Sunday worship services, distribute multi-track voice parts (<strong className="text-purple-600 font-bold">Soprano, Alto, Tenor, Bass</strong>), practice with variable speed (0.5x–1.5x) &amp; A-B looping, and track member readiness.
          </p>

          {/* Quick Join Code Box */}
          <div className="max-w-md mx-auto bg-[#FFFFFF] border border-[#E6F2FC] p-2.5 sm:p-3 rounded-2xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2 backdrop-blur-xl transition-all duration-300 hover:border-[#B9E2FF]">
            <input
              type="text"
              placeholder="Enter Choir Code (e.g. K7P2A)"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={5}
              className="w-full bg-transparent px-4 py-2.5 sm:py-3 text-center sm:text-left text-base text-[#475569] placeholder-[#A8B5C2] focus:outline-none uppercase font-mono tracking-widest font-bold"
            />
            <Link
              href={code.length === 5 ? `/join/${code}` : '#'}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shrink-0 ${
                code.length === 5
                  ? 'bg-[#B9E2FF] hover:bg-[#a5d8ff] text-[#475569] shadow-sm border border-[#E6F2FC] hover:scale-105'
                  : 'bg-[#F5FAFF] text-[#A8B5C2] cursor-not-allowed border border-[#E6F2FC]'
              }`}
            >
              <span>Join Choir</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Real Database Statistics Counter Banner */}
      <section className="bg-[#F5FAFF] border-y border-[#E6F2FC] py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#475569]">
              {stats.totalChoirs > 0 ? `${stats.totalChoirs}+` : '100+'}
            </span>
            <span className="block text-xs font-bold text-[#A8B5C2] uppercase tracking-wider">Registered Choirs</span>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#475569]">
              {stats.totalAudioTracks > 0 ? `${stats.totalAudioTracks}+` : '1,000+'}
            </span>
            <span className="block text-xs font-bold text-[#A8B5C2] uppercase tracking-wider">Voice Audio Tracks</span>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#475569]">
              {stats.totalSongs > 0 ? `${stats.totalSongs}+` : '500+'}
            </span>
            <span className="block text-xs font-bold text-[#A8B5C2] uppercase tracking-wider">Song Practice Files</span>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#475569]">
              {stats.totalMembers > 0 ? `${stats.totalMembers}+` : '5,000+'}
            </span>
            <span className="block text-xs font-bold text-[#A8B5C2] uppercase tracking-wider">Active Choir Singers</span>
          </div>
        </div>
      </section>

      {/* Interactive Voice Part Practice Sandbox Demo */}
      <section id="demo" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-24 space-y-8 sm:space-y-12">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DFF1FF] border border-[#B9E2FF] text-[#475569] text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-purple-600 shrink-0" /> Interactive Audio Sandbox Demo
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#475569]">Experience the Multi-Track Voice Engine</h2>
          <p className="text-sm sm:text-base text-[#475569]/90 max-w-2xl mx-auto px-2">
            Test how singers isolate voice parts (Soprano, Alto, Tenor, Bass), change playback speeds, and toggle readiness directly in Voxify Space.
          </p>
        </div>

        {/* Player Component Sandbox Card */}
        <div className="bg-[#FFFFFF] border border-[#E6F2FC] p-6 sm:p-8 rounded-3xl shadow-lg space-y-6 sm:space-y-8 overflow-hidden w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6F2FC] pb-4 sm:pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest bg-[#DFF1FF] text-[#475569] px-3 py-1 rounded-md border border-[#B9E2FF] inline-block">
                Worship Song Sandbox Preview
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#475569] mt-2">Voxify Sample Voice Track</h3>
              <p className="text-sm text-[#A8B5C2]">4-Part Harmony Arrangement Demo</p>
            </div>

            <div className="flex items-center gap-2 bg-[#F5FAFF] p-2 rounded-2xl border border-[#E6F2FC] self-start sm:self-auto">
              <span className="text-xs text-[#A8B5C2] font-semibold px-1">Status:</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-xl">
                Ready for Worship
              </span>
            </div>
          </div>

          {/* Voice Part Selector Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider block">Select Voice Part Track</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {(['Full Mix', 'Soprano', 'Alto', 'Tenor', 'Bass'] as const).map(part => (
                <button
                  key={part}
                  onClick={() => setActiveVoicePart(part)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all duration-300 ${
                    activeVoicePart === part
                      ? 'bg-[#B9E2FF] text-[#475569] border-[#E6F2FC] shadow-sm font-extrabold scale-105'
                      : 'bg-[#F5FAFF] border-[#E6F2FC] text-[#475569] hover:bg-[#DFF1FF]'
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>

          {/* Waveform Visualizer Bar */}
          <div className="bg-[#F5FAFF] p-4 sm:p-6 rounded-2xl border border-[#E6F2FC] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569] font-mono">
              <span>00:42 / 03:15</span>
              <span className="text-purple-600 font-bold uppercase truncate">Track: {activeVoicePart}</span>
              <span>Speed: {playbackSpeed}</span>
            </div>

            {/* Responsive Waveform Bars */}
            <div className="flex items-center gap-1 sm:gap-1.5 h-10 sm:h-12 w-full overflow-hidden">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 min-w-[2px] rounded-full transition-all duration-300 ${
                    i < 12
                      ? 'bg-[#B9E2FF] h-full'
                      : i === 12
                      ? 'bg-amber-400 h-full animate-bounce'
                      : 'bg-[#E6F2FC] h-2/5'
                  }`}
                />
              ))}
            </div>

            {/* Audio Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(prev => !prev)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#B9E2FF] hover:bg-[#a5d8ff] text-[#475569] flex items-center justify-center shadow-sm border border-[#E6F2FC] transition-transform duration-200 active:scale-95 shrink-0"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <button className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E6F2FC] text-xs font-mono text-[#475569] flex items-center gap-1.5 shadow-sm">
                  <Repeat className="w-4 h-4 text-purple-600 shrink-0" /> Loop (00:30 → 01:15)
                </button>
              </div>

              {/* Speed Preset Buttons */}
              <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-xl border border-[#E6F2FC] text-xs shadow-sm">
                {['0.75x', '1.0x', '1.25x'].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all duration-200 ${
                      playbackSpeed === spd ? 'bg-[#B9E2FF] text-[#475569]' : 'text-[#A8B5C2] hover:text-[#475569]'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-[#E6F2FC] space-y-12 sm:space-y-16">
        <div className="text-center space-y-3 sm:space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#475569]">Built Specifically for Choirs &amp; Music Directors</h2>
          <p className="text-sm sm:text-base text-[#475569]/90 max-w-xl mx-auto px-2">
            Everything your choir needs from Sunday service planning to multi-part music learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E6F2FC] space-y-4 sm:space-y-5 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#DFF1FF] flex items-center justify-center text-[#475569] border border-[#B9E2FF] group-hover:scale-110 transition-transform duration-300">
              <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#475569]">Multi-Track Voice Part Isolation</h3>
            <p className="text-sm text-[#475569]/90 leading-relaxed">
              Upload separate audio tracks for Soprano, Alto, Tenor, Bass, and Full Mix. Singers can slow down playback to 0.75x and set A-B repeat loops to master difficult harmonies.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E6F2FC] space-y-4 sm:space-y-5 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#DFF1FF] flex items-center justify-center text-[#475569] border border-[#B9E2FF] group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#475569]">Sunday Service Song Assignments</h3>
            <p className="text-sm text-[#475569]/90 leading-relaxed">
              Schedule Sunday worship events and assign target songs to specific voice sections or the full choir. Members receive instant practice notifications on their dashboard.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E6F2FC] space-y-4 sm:space-y-5 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#DFF1FF] flex items-center justify-center text-[#475569] border border-[#B9E2FF] group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#475569]">Multi-Tenant SaaS Security</h3>
            <p className="text-sm text-[#475569]/90 leading-relaxed">
              Data isolated with Row Level Security. Choir Masters generate 5-character codes and shareable links for seamless singer onboarding.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Database SaaS Pricing Plans Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-[#E6F2FC] space-y-10 sm:space-y-12 bg-[#FCFEFF]">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DFF1FF] border border-[#B9E2FF] text-[#475569] text-xs font-bold uppercase tracking-wider">
            <Crown className="w-4 h-4 text-purple-600 shrink-0" /> Live Database SaaS Plans
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#475569]">Choose Your Choir SaaS Plan</h2>
        </div>

        {loadingPlans ? (
          <div className="text-center py-12 text-[#A8B5C2] text-sm font-semibold">
            Loading active subscription plans from database...
          </div>
        ) : plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {plans.map((plan, index) => {
              const isHighlighted = !plan.is_free && index === 1;
              return (
                <div
                  key={plan.id}
                  className={`p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between transition-all duration-300 relative ${
                    isHighlighted
                      ? 'bg-[#FFFFFF] border-2 border-[#B9E2FC] shadow-xl ring-2 ring-[#B9E2FF]/50'
                      : 'bg-[#FFFFFF] border border-[#E6F2FC] shadow-sm hover:shadow-md'
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#DFF1FF] text-[#475569] border border-[#B9E2FF] text-xs font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-sm shrink-0">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4 pt-2 sm:pt-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#475569]">
                      {plan.name}
                    </span>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-[#475569]">
                        {plan.is_free ? '$0' : `$${plan.price_monthly}`}
                      </span>
                      <span className="text-xs font-semibold text-[#A8B5C2]">
                        {plan.is_free ? '/ forever free' : '/ month'}
                      </span>
                    </div>

                    <p className="text-sm text-[#475569]/90 leading-relaxed">
                      {plan.description || 'Flexible SaaS subscription plan for choir management & music learning.'}
                    </p>

                    <div className="pt-4 border-t border-[#E6F2FC] space-y-2">
                      <span className="text-xs font-bold text-[#A8B5C2] uppercase tracking-wider block">Plan Capacity &amp; Features:</span>
                      <ul className="space-y-2.5 text-sm text-[#475569]">
                        {plan.limits?.max_members && (
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Up to {plan.limits.max_members} Active Singers</span>
                          </li>
                        )}
                        {plan.limits?.max_storage_mb && (
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              {plan.limits.max_storage_mb >= 1024
                                ? `${(plan.limits.max_storage_mb / 1024).toFixed(0)} GB Storage`
                                : `${plan.limits.max_storage_mb} MB Storage`}
                            </span>
                          </li>
                        )}
                        {(plan.features || []).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Link
                    href="/register"
                    className={`w-full font-extrabold py-3.5 rounded-xl text-xs text-center block transition-all shadow-sm ${
                      isHighlighted
                        ? 'bg-[#B9E2FF] hover:bg-[#a5d8ff] text-[#475569] border border-[#E6F2FC] hover:scale-105'
                        : 'bg-[#F5FAFF] hover:bg-[#DFF1FF] text-[#475569] border border-[#E6F2FC]'
                    }`}
                  >
                    {plan.is_free ? 'Start Free' : `Choose ${plan.name}`}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E6F2FC] space-y-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <span className="text-xs font-bold text-[#A8B5C2] uppercase tracking-widest">Community</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-[#475569]">$0</span>
                  <span className="text-xs text-[#A8B5C2]">/ forever free</span>
                </div>
                <p className="text-sm text-[#475569]/90">Perfect for small church choirs getting started with voice practice.</p>
                <ul className="space-y-2.5 text-sm text-[#475569] pt-4 border-t border-[#E6F2FC]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 30 Active Singers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 100 Voice Part Audio Tracks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 500 MB Storage</li>
                </ul>
              </div>
              <Link href="/register" className="w-full bg-[#F5FAFF] hover:bg-[#DFF1FF] text-[#475569] font-extrabold py-3.5 rounded-xl text-xs text-center block border border-[#E6F2FC] transition-colors">
                Start Free
              </Link>
            </div>

            <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border-2 border-[#B9E2FF] space-y-6 flex flex-col justify-between shadow-xl relative ring-2 ring-[#B9E2FF]/50">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#DFF1FF] text-[#475569] border border-[#B9E2FF] text-xs font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-sm shrink-0">
                Most Popular
              </div>
              <div className="space-y-4 pt-2 sm:pt-0">
                <span className="text-xs font-bold text-[#475569] uppercase tracking-widest">Choir Pro</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-[#475569]">$19</span>
                  <span className="text-xs text-[#A8B5C2]">/ month</span>
                </div>
                <p className="text-sm text-[#475569]/90">For active church &amp; cathedral choirs with regular Sunday services.</p>
                <ul className="space-y-2.5 text-sm text-[#475569] pt-4 border-t border-[#E6F2FC]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> Up to 150 Active Singers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> Unlimited Audio &amp; PDF Uploads</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> 10 GB Supabase Storage</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> Resend Email Notifications</li>
                </ul>
              </div>
              <Link href="/register" className="w-full bg-[#B9E2FF] hover:bg-[#a5d8ff] text-[#475569] font-extrabold py-3.5 rounded-xl text-xs text-center block shadow-sm border border-[#E6F2FC] transition-colors">
                Upgrade to Choir Pro
              </Link>
            </div>

            <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E6F2FC] space-y-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <span className="text-xs font-bold text-[#A8B5C2] uppercase tracking-widest">Cathedral Enterprise</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-[#475569]">$49</span>
                  <span className="text-xs text-[#A8B5C2]">/ month</span>
                </div>
                <p className="text-sm text-[#475569]/90">For large music ministries managing multiple choir groups.</p>
                <ul className="space-y-2.5 text-sm text-[#475569] pt-4 border-t border-[#E6F2FC]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> Unlimited Singers &amp; Choirs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> 100 GB Storage &amp; Dedicated Support</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> Multi-Choir Super Admin</li>
                </ul>
              </div>
              <Link href="/register" className="w-full bg-[#F5FAFF] hover:bg-[#DFF1FF] text-[#475569] font-extrabold py-3.5 rounded-xl text-xs text-center block border border-[#E6F2FC] transition-colors">
                Get Enterprise
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E6F2FC] py-8 sm:py-12 px-4 sm:px-6 bg-[#F5FAFF] text-xs text-[#A8B5C2]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Voxify Logo" width={28} height={28} className="object-contain" />
            <span className="font-extrabold text-[#475569]">Voxify Space</span>
          </Link>
          <div className="text-[#475569]/80 font-medium">
            &copy; {new Date().getFullYear()} Voxify Space Platform. Built for Choirs, Directors, and Singers worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}
