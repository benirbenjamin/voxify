'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { ChevronDown, Plus, Music, Bell, Shield, LogOut, Check } from 'lucide-react';

export const ChoirHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { choirs, activeChoir, selectChoir, isAdmin } = useChoir();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Active Choir Selector */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-purple-600/20 p-1 border border-purple-500/30 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Voxify Logo"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-white">
                Voxify Space
              </span>
              <span className="block text-[10px] text-purple-400 uppercase tracking-widest font-semibold">
                Choir SaaS Platform
              </span>
            </div>
          </Link>

          {/* Active Choir Switcher Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 text-sm font-medium transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="max-w-[140px] truncate text-slate-200">
                  {activeChoir?.name || 'Select Choir'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    My Choirs ({choirs.length})
                  </div>
                  {choirs.map(c => {
                    const isSelected = c.id === activeChoir?.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          selectChoir(c.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                      </button>
                    );
                  })}

                  <div className="border-t border-slate-800 pt-1 mt-1">
                    <Link
                      href="/choir/create"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-purple-400 hover:bg-purple-900/30 flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Create New Choir
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-4">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
            <Link href="/dashboard" className="px-3 py-1.5 hover:text-white rounded-lg hover:bg-slate-800/60">
              Dashboard
            </Link>
            <Link href="/songs" className="px-3 py-1.5 hover:text-white rounded-lg hover:bg-slate-800/60">
              Music Library
            </Link>
            <Link href="/events" className="px-3 py-1.5 hover:text-white rounded-lg hover:bg-slate-800/60">
              Events
            </Link>
            <Link href="/announcements" className="px-3 py-1.5 hover:text-white rounded-lg hover:bg-slate-800/60">
              Announcements
            </Link>
            {isAdmin && (
              <Link href="/manage" className="px-3 py-1.5 text-purple-400 hover:text-purple-300 rounded-lg hover:bg-purple-950/40 font-semibold border border-purple-500/30">
                Choir Admin
              </Link>
            )}
            {user?.is_super_admin && (
              <Link href="/admin" className="px-3 py-1.5 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-amber-950/40 font-semibold flex items-center gap-1 border border-amber-500/30">
                <Shield className="w-3.5 h-3.5" /> Platform Admin
              </Link>
            )}
          </nav>

          {/* In-App Notifications Bell */}
          <Link href="/notifications" className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-4 ring-slate-900" />
          </Link>

          {/* User Signout / Profile Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden lg:block text-xs font-semibold text-slate-300 max-w-[100px] truncate">
                {user.full_name}
              </span>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
