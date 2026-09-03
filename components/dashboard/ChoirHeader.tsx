'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { notificationService } from '@/lib/services/notificationService';
import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  Shield,
  Music2,
  Users,
  Building2,
  Check,
  Menu,
  X,
  Calendar,
  Sparkles,
  Music,
  User
} from 'lucide-react';

export function ChoirHeader() {
  const { user, signOut } = useAuth();
  const { activeChoir, choirs, selectChoir, isAdmin } = useChoir();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      if (!user) return;
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    }
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Choir Switcher */}
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-purple-600/30">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white hidden xs:inline-block">
              Voxify<span className="text-purple-400">Space</span>
            </span>
          </Link>

          {/* Choir Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-slate-800/80 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white border border-slate-700/60 hover:bg-slate-800 transition-all max-w-[130px] sm:max-w-[180px]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{activeChoir?.name || 'Select Choir'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Your Active Choirs
                </div>
                {choirs.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      selectChoir(c.id);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                      activeChoir?.id === c.id
                        ? 'bg-purple-600/20 text-purple-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </div>
                    {activeChoir?.id === c.id && <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                  </button>
                ))}

                <div className="my-1 border-t border-slate-800" />
                
                <Link
                  href="/choir/create"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-purple-400 hover:bg-purple-950/40 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create New Choir</span>
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-950/40 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Join Choir with Code</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <Link href="/songs" className="px-3 py-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 font-semibold transition-colors">
              Song Library
            </Link>
            <Link href="/events" className="px-3 py-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 font-semibold transition-colors">
              Events &amp; Worship
            </Link>
            <Link href="/announcements" className="px-3 py-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 font-semibold transition-colors">
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile / Sign Out on Desktop */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors group"
                title="My Profile & Settings"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-7 h-7 rounded-xl object-cover border border-purple-500/40" />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden lg:block text-xs font-semibold text-slate-300 group-hover:text-white max-w-[100px] truncate">
                  {user.full_name}
                </span>
              </Link>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-flex text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl shadow-md transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Collapsible Menu Trigger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-4 py-5 space-y-4 animate-in fade-in slide-in-from-top-3 shadow-2xl">
          {user && (
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between pb-3 border-b border-slate-800/80 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-9 h-9 rounded-xl object-cover border border-purple-500/40" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white truncate max-w-[180px]">{user.full_name}</div>
                  <div className="text-[11px] text-purple-400 font-medium">Edit Profile &amp; Settings →</div>
                </div>
              </div>
              {user?.is_super_admin && (
                <span className="text-[10px] uppercase font-extrabold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                  Admin
                </span>
              )}
            </Link>
          )}

          <nav className="flex flex-col space-y-1">
            <Link
              href="/songs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <Music className="w-4 h-4 text-purple-400" />
              <span>Song Library</span>
            </Link>

            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Events &amp; Worship</span>
            </Link>

            <Link
              href="/announcements"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Announcements</span>
            </Link>

            <Link
              href="/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-rose-400" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link
                href="/manage"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-purple-400 bg-purple-950/30 border border-purple-500/30 hover:bg-purple-900/40 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Choir Admin Panel</span>
              </Link>
            )}

            {user?.is_super_admin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-400 bg-amber-950/30 border border-amber-500/30 hover:bg-amber-900/40 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Platform Super Admin</span>
              </Link>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-800 flex flex-col space-y-2">
            <Link
              href="/choir/create"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-purple-400 px-3.5 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Create New Choir</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-indigo-400 px-3.5 py-2 rounded-xl transition-colors"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Join Choir with Code</span>
            </Link>

            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-md"
              >
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

