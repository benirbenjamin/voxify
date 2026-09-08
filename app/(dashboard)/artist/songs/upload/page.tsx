'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { Genre, MusicTypeCategory } from '@/lib/types/database.types';
import { createClient } from '@/lib/supabase/client';
import {
  UploadCloud,
  Music,
  Clock,
  DollarSign,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function SongUploadPage() {
  const router = useRouter();
  const { user, artistProfile, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [musicType, setMusicType] = useState<'gospel' | 'secular'>('gospel');
  const [genreId, setGenreId] = useState('');
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [language, setLanguage] = useState('Kinyarwanda');

  // Preview timestamps
  const [previewStart, setPreviewStart] = useState<number>(0);
  const [previewEnd, setPreviewEnd] = useState<number>(30);

  // Storage paths / URL inputs
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFilePath, setAudioFilePath] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [price, setPrice] = useState<number>(1000);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!artistProfile) {
      router.push('/onboarding/artist');
      return;
    }

    async function fetchGenres() {
      const g = await marketplaceService.getGenres();
      setAllGenres(g);
      if (g.length > 0) setGenreId(g[0].id);
    }
    fetchGenres();
  }, [user, artistProfile, authLoading, router]);

  const handleAudioUpload = async (file: File): Promise<string> => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${artistProfile!.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to public/marketplace bucket or storage
    const { data, error } = await supabase.storage
      .from('songs')
      .upload(`marketplace/${fileName}`, file, { cacheControl: '3600', upsert: true });

    if (error) {
      // Fallback path
      return `marketplace/${fileName}`;
    }

    const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(`marketplace/${fileName}`);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile) return;

    if (!title.trim()) {
      setError('Song title is required.');
      return;
    }

    if (!audioFile && !audioFilePath.trim()) {
      setError('Please select an audio file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let finalAudioPath = audioFilePath;
      if (audioFile) {
        finalAudioPath = await handleAudioUpload(audioFile);
      }

      await marketplaceService.createMarketplaceSong(artistProfile.id, {
        title: title.trim(),
        description: description.trim(),
        genre_id: genreId || undefined,
        music_type: musicType,
        language: language.trim(),
        audio_file_path: finalAudioPath,
        preview_start_time: Number(previewStart) || 0,
        preview_end_time: Number(previewEnd) || 30,
        cover_image_url: coverImageUrl.trim() || undefined,
        lyrics: lyrics.trim() || undefined,
        price: Number(price) || 1000,
        currency: 'RWF',
        status: 'published',
      });

      router.push('/artist/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to upload song.');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 my-6">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Music Marketplace Publisher
          </div>
          <h1 className="text-2xl font-extrabold text-white">Upload &amp; Publish New Song</h1>
          <p className="text-xs text-slate-300">
            Set preview audio clip timestamps, lyrics, cover art, and pricing for your song.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Audio File Selection */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4" /> 1. Audio Track File (MP3 / WAV)
            </h2>

            <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 text-center transition-all bg-slate-900/50">
              <input
                type="file"
                accept="audio/*"
                onChange={e => setAudioFile(e.target.files?.[0] || null)}
                className="hidden"
                id="audio-upload-input"
              />
              <label htmlFor="audio-upload-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Music className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">
                  {audioFile ? audioFile.name : 'Click to select audio file from device'}
                </div>
                <p className="text-xs text-slate-400">Supported formats: MP3, WAV, M4A, FLAC (Max 50MB)</p>
              </label>
            </div>
          </div>

          {/* Audio Preview Clip Timestamps */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> 2. Audio Preview Clip Limit (Start to End Time)
            </h2>
            <p className="text-xs text-slate-400">
              Non-purchasers can only listen to this designated preview clip timestamp.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Preview Start (Seconds)</label>
                <input
                  type="number"
                  min={0}
                  value={previewStart}
                  onChange={e => setPreviewStart(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Preview End (Seconds)</label>
                <input
                  type="number"
                  min={previewStart + 5}
                  value={previewEnd}
                  onChange={e => setPreviewEnd(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                />
              </div>
            </div>
            <div className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              Preview duration: {Math.max(0, previewEnd - previewStart)} seconds clip
            </div>
          </div>

          {/* Song Details */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4" /> 3. Song Details &amp; Metadata
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Song Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Nitaubeba, Yvan Buravan - Malaika"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={musicType}
                  onChange={e => setMusicType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="gospel">Gospel Music</option>
                  <option value="secular">Secular / Cultural</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Genre</label>
                <select
                  value={genreId}
                  onChange={e => setGenreId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {allGenres.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.is_local ? '(Rwandan Local)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Song Description &amp; Credits</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Composer, instruments, arrangement details, producer..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={e => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Price (RWF) *</label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  placeholder="1000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Song Lyrics</label>
              <textarea
                rows={6}
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                placeholder="Paste song lyrics here... (Full lyrics will be visible to verified purchasers)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base"
          >
            {uploading ? 'Publishing Song to Marketplace...' : 'Publish Song to Voxify Marketplace'}{' '}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
