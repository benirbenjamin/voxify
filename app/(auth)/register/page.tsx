'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { User, Mail, Lock, Phone, ArrowRight, AlertCircle, Crown, Mic, MailCheck, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rolePreference, setRolePreference] = useState<'director' | 'singer'>('director');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const customDomainUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxify.space';
    const redirectTo = `${customDomainUrl}/auth/callback`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName,
          phone: phone,
          role_preference: rolePreference,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // If session is active (auto-confirmed)
    if (authData.session) {
      if (rolePreference === 'director') {
        router.push('/choir/create');
      } else {
        router.push('/dashboard');
      }
    } else {
      // Email verification required
      setVerificationSent(true);
      setLoading(false);
    }
  };

  // State: Verification Email Sent Card
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-white">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/30 items-center justify-center text-purple-400">
            <MailCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Check Your Email Inbox</h1>
            <p className="text-xs text-slate-300">
              We sent a verification link to <strong className="text-purple-400">{email}</strong>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs text-slate-400 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Click the verification link in your email to activate your account.</span>
            </div>
            {rolePreference === 'director' ? (
              <div className="flex items-start gap-2">
                <Crown className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>As a <strong>Choir Master</strong>, after clicking the link you will automatically be guided to <strong>Register & Create Your Choir</strong>!</span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Mic className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>As a <strong>Choir Member</strong>, after clicking the link you will land on your Dashboard to join your choir.</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all text-xs"
            >
              Verified Email? Proceed to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-white my-8">
      <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-purple-600/20 p-1 border border-purple-500/30 items-center justify-center mb-2">
            <Image src="/logo.png" alt="Voxify Logo" width={44} height={44} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold">Create Your Voxify Account</h1>
          <p className="text-xs text-slate-400">Join Voxify Space platform as a Choir Master or Choir Member</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Preference Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">I am registering as *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRolePreference('director')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  rolePreference === 'director'
                    ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Crown className={`w-5 h-5 mb-2 ${rolePreference === 'director' ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold block text-white">Choir Master / Director</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">I want to create & manage a choir</span>
              </button>

              <button
                type="button"
                onClick={() => setRolePreference('singer')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  rolePreference === 'singer'
                    ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Mic className={`w-5 h-5 mb-2 ${rolePreference === 'singer' ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold block text-white">Choir Member / Singer</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">I want to join a choir & practice</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Phone Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="director@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? 'Creating Account...' : rolePreference === 'director' ? 'Register & Create Choir' : 'Register & Join Choir'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2">
          Already registered?{' '}
          <Link href="/login" className="text-purple-400 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
