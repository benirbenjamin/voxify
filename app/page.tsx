'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Music, ShieldCheck, Users, Calendar, Sparkles, Volume2, ArrowRight, CheckCircle2, Play, Pause, Repeat, Sliders, Layers, Zap, Crown, Award, ChevronRight, Share2 } from 'lucide-react';

export default function LandingPage() {
  const [code, setCode] = useState('');
  const [activeVoicePart, setActiveVoicePart] = useState<'Full Mix' | 'Soprano' | 'Alto' | 'Tenor' | 'Bass'>('Soprano');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0x');
  const [readinessStatus, setReadinessStatus] = useState('Ready for Worship');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Navigation Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="Voxify Logo" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-white">
                Voxify Space
              </span>
              <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                Choir SaaS Platform
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#demo" className="hover:text-purple-400 transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing Plans</a>
            <a href="#testimonials" className="hover:text-purple-400 transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-105 flex items-center gap-1.5">
              <span>Create Choir</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Glowing Gradients */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-widest shadow-xl shadow-purple-900/20 animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-400" /> Multi-Tenant Choir & Music Learning SaaS
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
            Manage Your Choir. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-amber-300">
              Master Every Voice Part.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            The complete platform for Choir Directors and Singers. Schedule Sunday worship services, distribute multi-track voice parts (<strong className="text-purple-300">Soprano, Alto, Tenor, Bass</strong>), practice with variable speed (0.5x–1.5x) &amp; A-B looping, and track member readiness.
          </p>

          {/* Quick Join Code Box */}
          <div className="max-w-lg mx-auto bg-slate-900/90 border border-purple-500/40 p-2.5 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-xl">
            <input
              type="text"
              placeholder="Enter 5-character Choir Code (e.g. K7P2A)"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={5}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none uppercase font-mono tracking-widest font-bold"
            />
            <Link
              href={code.length === 5 ? `/join/${code}` : '#'}
              className={`px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all ${
                code.length === 5
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/40 hover:scale-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Join Choir</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Live Statistics Counter Banner */}
      <section className="bg-slate-900/80 border-y border-slate-800/80 py-10 px-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">250+</span>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Choirs Registered</span>
          </div>

          <div className="space-y-1">
            <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">14,800+</span>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Voice Part Audio Tracks</span>
          </div>

          <div className="space-y-1">
            <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-rose-400">99.7%</span>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Sunday Worship Readiness</span>
          </div>

          <div className="space-y-1">
            <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-amber-400">4 Parts</span>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Isolated Practice Engine</span>
          </div>
        </div>
      </section>

      {/* Interactive Voice Part Practice Sandbox Demo */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-indigo-400" /> Interactive Audio Sandbox
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Experience the Multi-Track Voice Engine</h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Test how singers isolate voice parts (Soprano, Alto, Tenor, Bass), change playback speeds, and toggle readiness directly in Voxify Space.
          </p>
        </div>

        {/* Player Component Sandbox Card */}
        <div className="bg-slate-900/90 border border-purple-500/30 p-8 rounded-3xl shadow-2xl space-y-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest bg-purple-950/80 px-3 py-1 rounded-md border border-purple-800/50">Worship Song Demo</span>
              <h3 className="text-2xl font-black text-white mt-2">Mwijuru Imbere y&apos;Imana</h3>
              <p className="text-xs text-slate-400">Traditional Choir Arrangement • Key of G Major</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold px-2">Readiness Status:</span>
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl">
                {readinessStatus}
              </span>
            </div>
          </div>

          {/* Voice Part Selector Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Select Voice Part Track</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['Full Mix', 'Soprano', 'Alto', 'Tenor', 'Bass'] as const).map(part => (
                <button
                  key={part}
                  onClick={() => setActiveVoicePart(part)}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all ${
                    activeVoicePart === part
                      ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>

          {/* Waveform Visualizer Bar */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>00:42 / 03:15</span>
              <span className="text-purple-400 font-bold uppercase">Isolated Track: {activeVoicePart}</span>
              <span>Speed: {playbackSpeed}</span>
            </div>

            <div className="flex items-center gap-1.5 h-12">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    i < 18
                      ? 'bg-gradient-to-t from-purple-600 to-indigo-400 h-full'
                      : i === 18
                      ? 'bg-amber-400 h-full animate-bounce'
                      : 'bg-slate-800 h-2/5'
                  }`}
                />
              ))}
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(prev => !prev)}
                  className="w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <button className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-purple-300 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-purple-400" /> Loop (00:30 → 01:15)
                </button>
              </div>

              {/* Speed Preset Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
                {['0.75x', '1.0x', '1.25x'].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold ${
                      playbackSpeed === spd ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
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

      {/* Feature Grid with Modern Graphics & Micro-Animations */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-white">Built Specifically for Choirs &amp; Music Directors</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Everything your choir needs from Sunday service planning to multi-part music learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-5 hover:border-purple-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400 border border-purple-500/30 group-hover:scale-110 transition-transform">
              <Volume2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Multi-Track Voice Part Isolation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload separate audio tracks for Soprano, Alto, Tenor, Bass, and Full Mix. Singers can slow down playback to 0.75x and set A-B repeat loops to master difficult harmonies.
            </p>
          </div>

          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-5 hover:border-indigo-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Sunday Service Song Assignments</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Schedule Sunday worship events and assign target songs to specific voice sections or the full choir. Members receive instant practice notifications on their dashboard.
            </p>
          </div>

          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-5 hover:border-amber-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 flex items-center justify-center text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Multi-Tenant SaaS Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Data isolated with Row Level Security. Choir Masters generate 5-character codes and shareable links for seamless singer onboarding.
            </p>
          </div>
        </div>
      </section>

      {/* SaaS Pricing Plans Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-4 h-4 text-purple-400" /> Transparent Choir Plans
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white">Choose Your Choir SaaS Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Community</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-slate-500">/ forever free</span>
              </div>
              <p className="text-xs text-slate-400">Perfect for small church choirs getting started with voice practice.</p>
              <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 30 Active Singers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 100 Voice Part Audio Tracks</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 500 MB Storage</li>
              </ul>
            </div>
            <Link href="/register" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs text-center block">
              Start Free
            </Link>
          </div>

          <div className="bg-gradient-to-b from-purple-950/80 to-slate-900/90 p-8 rounded-3xl border-2 border-purple-500 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
              Most Popular
            </div>
            <div className="space-y-4">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Choir Pro</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$19</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-300">For active church &amp; cathedral choirs with regular Sunday services.</p>
              <ul className="space-y-2 text-xs text-slate-200 pt-4 border-t border-purple-900/60">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Up to 150 Active Singers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Unlimited Audio &amp; PDF Uploads</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> 10 GB Supabase Storage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Resend Email Notifications</li>
              </ul>
            </div>
            <Link href="/register" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs text-center block shadow-lg shadow-purple-600/30">
              Upgrade to Choir Pro
            </Link>
          </div>

          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Cathedral Enterprise</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$49</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <p className="text-xs text-slate-400">For large music ministries managing multiple choir groups.</p>
              <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Unlimited Singers &amp; Choirs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> 100 GB Storage &amp; Dedicated Support</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Multi-Choir Super Admin</li>
              </ul>
            </div>
            <Link href="/register" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs text-center block">
              Get Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 px-6 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Voxify Logo" width={28} height={28} className="object-contain" />
            <span className="font-extrabold text-slate-200">Voxify Space</span>
          </Link>
          <div>
            &copy; {new Date().getFullYear()} Voxify Space Platform. Built for Choirs, Directors, and Singers worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}
