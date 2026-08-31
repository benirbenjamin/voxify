'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Music, ShieldCheck, Users, Calendar, Sparkles, Volume2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const [code, setCode] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Image src="/logo.png" alt="Voxify Logo" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">Voxify Space</span>
              <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-widest">Choir SaaS Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-105">
              Create Choir
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/20 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-400" /> Multi-Tenant Choir SaaS Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Manage your Choir. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-amber-300">
              Master every Song.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            The complete platform for choir leaders and singers. Assign Sunday worship songs, distribute multi-track voice parts (Soprano, Alto, Tenor, Bass), practice with variable speed &amp; A-B looping, and track member readiness.
          </p>

          {/* Quick Join Code Box */}
          <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-2xl flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter 5-character Choir Code (e.g. K7P2A)"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={5}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none uppercase font-mono tracking-widest"
            />
            <Link
              href={code.length === 5 ? `/join/${code}` : '#'}
              className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                code.length === 5
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Join <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-4 hover:border-purple-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
            <Volume2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Multi-Track Audio Engine</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Upload audio for Full Choir, Soprano, Alto, Tenor, Bass, and Instrumental tracks. Singers isolate their voice part with speed selection (0.5x–1.5x) and precise segment looping.
          </p>
        </div>

        <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-4 hover:border-purple-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Service Song Assignments</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Schedule Sunday worship events, assign target songs to the entire choir or specific voice sections, and notify members instantly with direct practice shortcuts.
          </p>
        </div>

        <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-4 hover:border-purple-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Dynamic Multi-Tenant SaaS</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Isolated choir data with strict Supabase Row Level Security. Super Admin can dynamically configure SaaS plans, custom member caps, storage limits, and feature flags.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Voxify Space Platform. Built for Choirs, Directors, and Singers worldwide.
      </footer>
    </div>
  );
}
