'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { artistService } from '@/lib/services/artistService';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { Genre, MusicTypeCategory } from '@/lib/types/database.types';
import { Mic, Globe, CheckCircle2, AlertCircle, ArrowRight, Music, Smartphone, Sparkles, MapPin } from 'lucide-react';

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const { user, artistProfile, refreshProfile } = useAuth();

  const [stageName, setStageName] = useState('');
  const [bio, setBio] = useState('');
  const [musicType, setMusicType] = useState<MusicTypeCategory>('gospel');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [location, setLocation] = useState('Kigali');
  const [country, setCountry] = useState('Rwanda');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Socials
  const [youtube, setYoutube] = useState('');
  const [instagram, setInstagram] = useState('');
  const [spotify, setSpotify] = useState('');

  // Payout details
  const [momoNumber, setMomoNumber] = useState('');
  const [momoName, setMomoName] = useState('');
  const [payoutProvider, setPayoutProvider] = useState<'momo' | 'airtel' | 'bank'>('momo');

  const [loading, setLoading] = useState(false);
  const [fetchingGenres, setFetchingGenres] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (artistProfile) {
      // If already has an artist profile, go to dashboard
      router.push('/artist/dashboard');
      return;
    }

    async function loadGenres() {
      try {
        const gList = await marketplaceService.getGenres();
        setAllGenres(gList);
      } catch (err) {
        console.error('Error loading genres:', err);
      } finally {
        setFetchingGenres(false);
      }
    }

    loadGenres();
  }, [artistProfile, router]);

  const toggleGenre = (genreName: string) => {
    if (selectedGenres.includes(genreName)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genreName));
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to set up an artist profile.');
      return;
    }

    if (!stageName.trim()) {
      setError('Stage Name / Artist Name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await artistService.createArtistProfile(user.id, {
        stage_name: stageName.trim(),
        bio: bio.trim(),
        genres: selectedGenres,
        music_type: musicType,
        location: location.trim(),
        country: country.trim(),
        social_links: {
          youtube: youtube.trim(),
          instagram: instagram.trim(),
          spotify: spotify.trim(),
        },
        payout_details: {
          provider: payoutProvider,
          phone_number: momoNumber.trim(),
          account_name: momoName.trim(),
        },
        avatar_url: avatarUrl.trim() || user.avatar_url || undefined,
        banner_url: bannerUrl.trim() || undefined,
      });

      await refreshProfile();
      router.push('/artist/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create artist profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 my-10">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Mic className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Create Your Voxify Artist Profile</h1>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Set up your songwriter and music creator profile to publish your music, reach local & global fans, and receive payout earnings.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 1. Artist Details
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Stage Name / Artist Name *</label>
              <input
                type="text"
                required
                value={stageName}
                onChange={e => setStageName(e.target.value)}
                placeholder="e.g. Israel Mbonyi, Clarisse Karasira, Chorale de Kigali"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Artist Bio / Description</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell listeners about your music journey, vocal style, and inspiration..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">City / Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Kigali"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Country</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Rwanda"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Music Classification & Rwandan Local Genres */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4" /> 2. Music Category & Genres
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Music Classification *</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'gospel', label: 'Gospel Music', desc: 'Praise, Worship & Christian Hymns' },
                  { key: 'secular', label: 'Secular / Cultural', desc: 'Afrobeats, Cultural & Contemporary' },
                  { key: 'both', label: 'Both Categories', desc: 'Gospel & Secular arrangements' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMusicType(item.key as MusicTypeCategory)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      musicType === item.key
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold block text-white">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Select Your Primary Genres (Rwandan Local & Global)
              </label>
              {fetchingGenres ? (
                <div className="text-xs text-slate-400 animate-pulse">Loading genres catalog...</div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {allGenres.map(g => {
                    const active = selectedGenres.includes(g.name);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGenre(g.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {g.is_local && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                        <span>{g.name}</span>
                        {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Payout Details */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> 3. Payout & Mobile Money Account
            </h2>
            <p className="text-xs text-slate-400">
              Your song sales earnings will be disbursed directly to your mobile wallet or bank account.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: 'momo', label: 'MTN Mobile Money' },
                { key: 'airtel', label: 'Airtel Money' },
                { key: 'bank', label: 'Bank Transfer' },
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPayoutProvider(p.key as any)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    payoutProvider === p.key
                      ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{p.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Money / Account Number *</label>
                <input
                  type="text"
                  required
                  value={momoNumber}
                  onChange={e => setMomoNumber(e.target.value)}
                  placeholder="e.g. +250 788 123 456"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Account Holder Full Name *</label>
                <input
                  type="text"
                  required
                  value={momoName}
                  onChange={e => setMomoName(e.target.value)}
                  placeholder="e.g. Jean Paul Habimana"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base"
          >
            {loading ? 'Submitting Artist Profile...' : 'Complete Artist Onboarding & Open Dashboard'}{' '}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
