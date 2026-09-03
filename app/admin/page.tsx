'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { adminService } from '@/lib/services/adminService';
import { SubscriptionPlan } from '@/lib/types/database.types';
import { Shield, Layers, Users, Music, Sparkles, ArrowRight, Plus, Edit3, Trash2, Power, Calendar, BarChart3, Globe, TrendingUp } from 'lucide-react';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [choirsCount, setChoirsCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [settingUpDb, setSettingUpDb] = useState(false);
  const [dbSetupMessage, setDbSetupMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [plansData, choirsData, usersData] = await Promise.all([
        subscriptionService.getAllPlans(),
        adminService.getAllChoirs(),
        adminService.getAllUsers(),
      ]);
      setPlans(plansData);
      setChoirsCount(choirsData.length);
      setUsersCount(usersData.length);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleOneClickDbSetup = async () => {
    setSettingUpDb(true);
    setDbSetupMessage(null);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDbSetupMessage('✅ Database Setup Success! All tables, RLS policies, storage buckets & plans created.');
        const updatedPlans = await subscriptionService.getAllPlans();
        setPlans(updatedPlans);
      } else {
        setDbSetupMessage(`❌ Setup Error: ${data.error}`);
      }
    } catch (err: any) {
      setDbSetupMessage(`❌ Setup Error: ${err.message}`);
    } finally {
      setSettingUpDb(false);
    }
  };

  const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
    const nextStatus = !plan.is_active;
    const ok = await subscriptionService.togglePlanActive(plan.id, nextStatus);
    if (ok) {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: nextStatus } : p));
    }
  };

  const handleDeletePlan = async (e: React.MouseEvent, plan: SubscriptionPlan) => {
    e.preventDefault();
    if (!confirm(`Are you sure you want to delete "${plan.name}" plan?`)) return;

    const ok = await subscriptionService.deletePlan(plan.id);
    if (ok) {
      setPlans(prev => prev.filter(p => p.id !== plan.id));
    } else {
      alert('Failed to delete plan.');
    }
  };

  if (!user?.is_super_admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-white text-center space-y-4">
        <Shield className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
        <h1 className="text-2xl font-bold">Platform Super Admin Restricted</h1>
        <p className="text-xs text-slate-400 max-w-sm">This area is reserved for the platform administrator.</p>
        <Link href="/dashboard" className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-xl text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 p-1 flex items-center justify-center">
            <Image src="/logo.png" alt="Voxify Logo" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold uppercase tracking-wider">
                Super Admin Access
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Voxify SaaS Control Center</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/analytics"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
          >
            <BarChart3 className="w-4 h-4" /> View Platform Analytics Hub
          </Link>
          <button
            onClick={handleOneClickDbSetup}
            disabled={settingUpDb}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
          >
            {settingUpDb ? 'Creating Tables...' : '⚡ Run DB Setup'}
          </button>
        </div>
      </div>

      {dbSetupMessage && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white">
          {dbSetupMessage}
        </div>
      )}

      {/* Featured Platform Web & App Analytics Hero Banner */}
      <Link
        href="/admin/analytics"
        className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/40 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-purple-400 hover:scale-[1.005] transition-all shadow-2xl group block"
      >
        <div className="space-y-2 flex-1">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">
            <Globe className="w-3.5 h-3.5" /> Traffic Sources, Session Time &amp; Visitor Trends
          </div>
          <h2 className="text-2xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
            Real-Time Web Traffic &amp; Performance Analytics
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Monitor where visitors originate (Google, Direct, Social, Referrals), daily/weekly/yearly visitor counts, time spent on site, and top visited pages.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <span className="bg-purple-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-2 group-hover:bg-purple-500 transition-all">
            Open Analytics Dashboard <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {/* Platform Statistics & Super Admin Global Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/admin/choirs"
          className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Choirs Management</span>
            <Music className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors">{choirsCount}</p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400">View, edit &amp; delete choirs →</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-indigo-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Users Management</span>
            <Users className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-indigo-300 transition-colors">{usersCount}</p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400">Manage user profiles &amp; roles →</p>
        </Link>

        <Link
          href="/admin/events"
          className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Global Events</span>
            <Calendar className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-emerald-300 transition-colors">Manage</p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400">View &amp; publish choir events →</p>
        </Link>

        <Link
          href="/admin/announcements"
          className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Global Notices</span>
            <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-amber-300 transition-colors">Manage</p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400">Moderate &amp; hide announcements →</p>
        </Link>
      </div>

      {/* Dynamic SaaS Subscription Plan Management */}
      <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Dynamic SaaS Subscription Plans</h2>
            <p className="text-xs text-slate-400">Configure free/paid plans, member limits, and enabled feature flags without hardcoded restrictions</p>
          </div>
          <Link
            href="/admin/plans/new"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create New Plan
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 text-center py-10">Loading subscription plans...</p>
        ) : plans.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No subscription plans found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-amber-500/30 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${
                      plan.is_free ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                    }`}>
                      {plan.is_free ? 'FREE PLAN' : `$${plan.price_monthly}/mo`}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Max: {plan.limits?.max_members || '50'} singers</span>
                  </div>

                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{plan.description || 'No plan description.'}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="border-t border-slate-900 pt-3 space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <strong className="text-slate-200">{plan.limits?.max_storage_mb || 500} MB</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Included Features:</span>
                      <strong className="text-slate-200">{plan.features?.length || 0} Enabled</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-900 pt-3">
                    <Link
                      href={`/admin/plans/${plan.id}/edit`}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Plan
                    </Link>

                    <button
                      onClick={() => handleTogglePlanActive(plan)}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                        plan.is_active ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                      title="Toggle Plan Active Status"
                    >
                      <Power className="w-3 h-3" /> {plan.is_active ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      onClick={e => handleDeletePlan(e, plan)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
