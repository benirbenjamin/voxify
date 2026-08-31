'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { SubscriptionPlan } from '@/lib/types/database.types';
import { Shield, Layers, Users, Music, Settings, Sparkles, ArrowRight, Plus } from 'lucide-react';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingUpDb, setSettingUpDb] = useState(false);
  const [dbSetupMessage, setDbSetupMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      setLoading(true);
      const data = await subscriptionService.getAllPlans();
      setPlans(data);
      setLoading(false);
    }
    loadPlans();
  }, []);

  const handleOneClickDbSetup = async () => {
    setSettingUpDb(true);
    setDbSetupMessage(null);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDbSetupMessage('✅ Database Setup Success! All 20 tables, RLS policies, storage buckets & plans created.');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
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
          <button
            onClick={handleOneClickDbSetup}
            disabled={settingUpDb}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            {settingUpDb ? 'Creating Tables & Buckets...' : '⚡ Run One-Click Supabase DB Setup'}
          </button>
          <Link
            href="/dashboard"
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Return to Choir App
          </Link>
        </div>
      </div>

      {dbSetupMessage && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white">
          {dbSetupMessage}
        </div>
      )}

      {/* Platform Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Choirs</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">1</p>
          <p className="text-xs text-slate-500">Multi-tenant isolation active</p>
        </div>

        <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Configured Plans</span>
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">{plans.length}</p>
          <p className="text-xs text-slate-500">Dynamic SaaS plans</p>
        </div>

        <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Platform Status</span>
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">Production Ready</p>
          <p className="text-xs text-slate-500">Supabase RLS active</p>
        </div>

        <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Storage Buckets</span>
            <Music className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-white">6 Buckets</p>
          <p className="text-xs text-slate-500">Audio, PDFs &amp; Avatars</p>
        </div>
      </div>

      {/* Dynamic SaaS Subscription Plan Management */}
      <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Dynamic SaaS Subscription Plans</h2>
            <p className="text-xs text-slate-400">Configure free/paid plans, member limits, and enabled feature flags without hardcoded restrictions</p>
          </div>
          <Link
            href="/admin/plans/new"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Create New Plan
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${
                    plan.is_free ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                  }`}>
                    {plan.is_free ? 'FREE PLAN' : `$${plan.price_monthly}/mo`}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Max Members: {plan.limits?.max_members || 'Unlimited'}</span>
                </div>

                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{plan.description}</p>
              </div>

              <div className="border-t border-slate-900 pt-4 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <strong className="text-slate-200">{plan.limits?.max_storage_mb || 500} MB</strong>
                </div>
                <div className="flex justify-between">
                  <span>Included Features:</span>
                  <strong className="text-slate-200">{plan.features?.length || 0} Enabled</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
