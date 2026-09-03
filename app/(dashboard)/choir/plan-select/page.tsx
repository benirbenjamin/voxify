'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { SubscriptionPlan } from '@/lib/types/database.types';
import { Crown, CheckCircle2, ArrowRight, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { GooglePayButton } from '@/components/payments/GooglePayButton';
import { FlutterwaveButton } from '@/components/payments/FlutterwaveButton';
import { platformSettingsService } from '@/lib/services/platformSettingsService';
import { PlatformPaymentSettings } from '@/lib/types/database.types';
import { useAuth } from '@/lib/context/AuthContext';

function PlanSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeChoir, refreshChoirs } = useChoir();

  const choirId = searchParams.get('choirId') || activeChoir?.id;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'1M' | '3M' | '6M' | '12M'>('1M');
  const [platformSettings, setPlatformSettings] = useState<PlatformPaymentSettings>({
    google_pay_enabled: true,
    flutterwave_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      setLoading(true);
      const [data, settings] = await Promise.all([
        subscriptionService.getAllPlans(),
        platformSettingsService.getSettings(),
      ]);
      setPlans(data);
      setPlatformSettings(settings);
      if (data.length > 0) {
        const defaultPlan = data.find(p => p.is_free) || data[0];
        setSelectedPlanId(defaultPlan.id);
      }
      setLoading(false);
    }
    loadPlans();
  }, []);

  const handleConfirmPlan = async () => {
    if (!choirId || !selectedPlanId) {
      setError('Please select a choir and subscription plan.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { success, error: err } = await subscriptionService.setChoirPlan(choirId, selectedPlanId);

    if (!success) {
      setError(err || 'Failed to update subscription plan.');
      setSubmitting(false);
    } else {
      await refreshChoirs(choirId);
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center text-slate-400">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold">Loading Subscription Plans from Database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-white py-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
          <Crown className="w-4 h-4 text-purple-400" /> Choir Subscription Setup
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white">Select Your Choir SaaS Plan</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Choose a subscription plan for <strong className="text-purple-300">{activeChoir?.name || 'Your Choir'}</strong> directly from our active plans database.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Billing Duration Selector Tabs with Discount Badges */}
      <div className="flex justify-center">
        <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap justify-center gap-1.5 shadow-xl max-w-2xl w-full">
          <button
            type="button"
            onClick={() => setBillingInterval('1M')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              billingInterval === '1M'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Monthly Pay (1 Mo)
          </button>

          <button
            type="button"
            onClick={() => setBillingInterval('3M')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              billingInterval === '3M'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            3 Months <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30">SAVE %</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingInterval('6M')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              billingInterval === '6M'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            6 Months <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">SAVE MORE</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingInterval('12M')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              billingInterval === '12M'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                : 'text-amber-400 hover:bg-slate-800'
            }`}
          >
            Yearly (12 Mo) <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => {
          const isSelected = selectedPlanId === plan.id;
          
          // Calculate interval parameters
          let monthsCount = 1;
          let discountPct = 0;
          if (billingInterval === '3M') {
            monthsCount = 3;
            discountPct = plan.discount_3_months ?? 10;
          } else if (billingInterval === '6M') {
            monthsCount = 6;
            discountPct = plan.discount_6_months ?? 20;
          } else if (billingInterval === '12M') {
            monthsCount = 12;
            discountPct = plan.discount_12_months ?? 30;
          }

          const rawTotal = (plan.price_monthly || 0) * monthsCount;
          const finalTotal = plan.is_free ? 0 : Number((rawTotal * (1 - discountPct / 100)).toFixed(2));
          const effectiveMonthly = plan.is_free ? 0 : Number((finalTotal / monthsCount).toFixed(2));

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                isSelected
                  ? 'bg-gradient-to-b from-purple-950/80 to-slate-900/90 border-purple-500 shadow-2xl shadow-purple-600/20 scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{plan.name}</span>
                  {isSelected && (
                    <span className="bg-purple-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                      Selected
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">
                      ${plan.is_free ? '0' : finalTotal}
                    </span>
                    <span className="text-xs text-slate-400">
                      / {monthsCount === 1 ? 'month' : `${monthsCount} months`}
                    </span>
                  </div>

                  {!plan.is_free && monthsCount > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="line-through text-slate-500">${rawTotal}</span>
                      <span className="text-amber-400 font-extrabold bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full text-[10px]">
                        {discountPct}% OFF ({`$${effectiveMonthly}/mo`})
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{plan.description}</p>

                {/* Plan Limits Badges */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Max Singers:</span>
                    <strong className="text-purple-300 font-bold">
                      {plan.limits?.max_members < 0 || (plan.limits?.max_members || 0) >= 999000 ? 'Unlimited' : `${plan.limits?.max_members || 15} Members`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Song Library:</span>
                    <strong className="text-indigo-300 font-bold">
                      {plan.limits?.max_songs < 0 || (plan.limits?.max_songs || 0) >= 999000 ? 'Unlimited' : `${plan.limits?.max_songs || 5} Songs`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Monthly Events:</span>
                    <strong className="text-emerald-300 font-bold">
                      {plan.limits?.max_events_per_month < 0 || (plan.limits?.max_events_per_month || 0) >= 999000 ? 'Unlimited' : `${plan.limits?.max_events_per_month || 4} Events/Mo`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Announcements:</span>
                    <strong className="text-amber-300 font-bold">
                      {plan.limits?.max_announcements_per_month < 0 || (plan.limits?.max_announcements_per_month || 0) >= 999000 ? 'Unlimited' : `${plan.limits?.max_announcements_per_month || 3} Notices/Mo`}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Included Feature Flags:</span>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {(plan.features || []).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Payment Buttons Section */}
              <div className="pt-2 space-y-2.5">
                {!plan.is_free && choirId ? (
                  <>
                    {/* Google Pay Gateway Button */}
                    {platformSettings.google_pay_enabled && (
                      <GooglePayButton
                        planId={plan.id}
                        planName={plan.name}
                        priceMonthly={finalTotal}
                        choirId={choirId}
                        onSuccess={async () => {
                          await refreshChoirs(choirId);
                          router.push('/dashboard');
                        }}
                      />
                    )}

                    {/* Flutterwave Gateway Button */}
                    {platformSettings.flutterwave_enabled && (
                      <FlutterwaveButton
                        planId={plan.id}
                        planName={plan.name}
                        usdAmount={finalTotal}
                        monthsCount={monthsCount}
                        choirId={choirId}
                        userEmail={user?.email}
                        userName={user?.full_name || 'Choir Director'}
                        onSuccess={async () => {
                          await refreshChoirs(choirId);
                          router.push('/dashboard');
                        }}
                      />
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Current Selection' : 'Choose Free Plan'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm & Save Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleConfirmPlan}
          disabled={submitting}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-purple-600/40 text-sm flex items-center gap-2 transition-all hover:scale-105"
        >
          {submitting ? 'Activating Plan...' : 'Confirm Plan & Go to Dashboard'} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function PlanSelectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-xs">
        Loading Subscription Selection...
      </div>
    }>
      <PlanSelectContent />
    </Suspense>
  );
}
