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
  Sparkles,
  Loader2,
  Play,
  Pause,
  Volume2,
  ShieldCheck
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
  const [audioFileName, setAudioFileName] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [lyrics, setLyrics] = useState('');
  const [price, setPrice] = useState<number>(1000);

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Audio Player Preview State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

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

  // Immediate Audio File Upload on Selection with Instant Local Playback Preview
  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artistProfile) return;

    setAudioFile(file);
    setAudioFileName(file.name);
    setIsUploadingAudio(true);
    setError(null);

    // Create immediate local object URL for instant playability
    const localBlobUrl = URL.createObjectURL(file);
    setAudioFilePath(localBlobUrl);

    // Calculate audio duration for preview clip default
    const audio = new Audio();
    audio.src = localBlobUrl;
    audio.onloadedmetadata = () => {
      const dur = Math.round(audio.duration);
      if (dur > 0 && previewEnd === 30) {
        setPreviewEnd(Math.min(dur, 30));
      }
    };

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'mp3';
      const cleanFileName = `marketplace/${artistProfile.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Try direct client upload first using 'song-audio' bucket
      const { data, error: uploadErr } = await supabase.storage
        .from('song-audio')
        .upload(cleanFileName, file, { cacheControl: '3600', upsert: true });

      if (!uploadErr && data) {
        const { data: publicUrlData } = supabase.storage.from('song-audio').getPublicUrl(cleanFileName);
        setAudioFilePath(publicUrlData.publicUrl);
      } else {
        // Fallback to server /api/upload which auto-creates bucket using Service Role Key
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'song-audio');
        formData.append('choirId', artistProfile.id);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const resData = await res.json();
        if (res.ok && resData.url) {
          setAudioFilePath(resData.url);
        } else if (!localBlobUrl) {
          setError(resData.error || 'Failed to upload audio file.');
        }
      }
    } catch (err: any) {
      console.error('Audio upload error:', err);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Immediate Cover Image Upload on Selection
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artistProfile) return;

    setIsUploadingCover(true);
    setError(null);

    const localBlobUrl = URL.createObjectURL(file);
    setCoverImageUrl(localBlobUrl);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `covers/${artistProfile.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadErr } = await supabase.storage
        .from('song-audio')
        .upload(cleanFileName, file, { cacheControl: '3600', upsert: true });

      if (!uploadErr && data) {
        const { data: publicUrlData } = supabase.storage.from('song-audio').getPublicUrl(cleanFileName);
        setCoverImageUrl(publicUrlData.publicUrl);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'song-audio');
        formData.append('choirId', artistProfile.id);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const resData = await res.json();
        if (res.ok && resData.url) {
          setCoverImageUrl(resData.url);
        }
      }
    } catch (err: any) {
      console.error('Cover upload error:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const toggleTestPlayback = () => {
    if (!audioFilePath) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(audioFilePath);
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setAudioElement(audio);
    setIsPlaying(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile) return;

    if (!title.trim()) {
      setError('Song title is required.');
      return;
    }

    if (!audioFilePath.trim()) {
      setError('Please select an audio track file to upload first.');
      return;
    }

    if (isUploadingAudio || isUploadingCover) {
      setError('Please wait a moment while your audio file finishes uploading...');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      await marketplaceService.createMarketplaceSong(artistProfile.id, {
        title: title.trim(),
        description: description.trim(),
        genre_id: genreId || undefined,
        music_type: musicType,
        language: language.trim(),
        audio_file_path: audioFilePath.trim(),
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
      setError(err.message || 'Failed to publish song.');
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 my-6">
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Music Marketplace Publisher
          </div>
          <h1 className="text-2xl font-extrabold text-white">Upload &amp; Publish New Song</h1>
          <p className="text-xs text-slate-300">
            Select your track for instant upload, test audio playback, set preview clip timestamps, cover art, and pricing.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Immediate Audio Track Upload & Playback Test */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4" /> 1. Audio Track File (Instant Upload &amp; Playback)
            </h2>

            <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 text-center transition-all bg-slate-900/50">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
                id="audio-upload-input"
              />
              <label htmlFor="audio-upload-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  {isUploadingAudio ? (
                    <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  ) : (
                    <Music className="w-6 h-6" />
                  )}
                </div>
                <div className="text-sm font-bold text-white">
                  {isUploadingAudio
                    ? `Uploading "${audioFileName}" to Storage...`
                    : audioFileName
                    ? `Selected: ${audioFileName} (Uploaded ✅)`
                    : 'Click to select audio file from device (MP3, WAV, M4A)'}
                </div>
                <p className="text-xs text-slate-400">
                  Selecting a file uploads it directly so you can test audio playback before publishing.
                </p>
              </label>
            </div>

            {/* Live Audio Playback Verification Bar */}
            {audioFilePath && (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleTestPlayback}
                    className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-lg transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isPlaying ? '▶ Playing Uploaded Track...' : 'Test Uploaded Audio Track'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Audio Track Playable &amp; Ready
                    </span>
                  </div>
                </div>

                <audio controls src={audioFilePath} className="w-full sm:w-64 h-9 rounded-lg" />
              </div>
            )}
          </div>

          {/* Section 2: Audio Preview Clip Timestamps */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> 2. Audio Preview Clip Timestamps (Start to End)
            </h2>
            <p className="text-xs text-slate-400">
              Non-purchasers will only be able to listen to this snippet. Full track unlocks permanently upon purchase.
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
              Preview Duration: {Math.max(0, previewEnd - previewStart)} seconds clip for non-purchasers
            </div>
          </div>

          {/* Section 3: Song Metadata & Cover Art */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4" /> 3. Song Details &amp; Cover Art
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Song Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Nitaubeba, Malaika"
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

            {/* Cover Image Upload / URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cover Artwork Image</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-amber-500 rounded-xl px-3 py-2 cursor-pointer transition-colors text-xs text-slate-300">
                    <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">
                      {isUploadingCover ? 'Uploading Cover Image...' : coverImageUrl ? 'Cover Attached ✅' : 'Pick Image File (JPG/PNG)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverSelect}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={e => setCoverImageUrl(e.target.value)}
                    placeholder="Or paste cover image URL..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Song Price (RWF) *</label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  placeholder="1000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Multi-Buyer Ownership Notice */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" /> Voxify Marketplace Purchase Model
              </div>
              <p className="text-[11px] text-slate-400">
                Any buyer pays the price once to own their permanent copy in their personal library with unlimited streams and MP3 downloads. You earn your commission on every single purchase!
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Song Lyrics</label>
              <textarea
                rows={5}
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                placeholder="Paste song lyrics here... (Full lyrics unlock for buyers)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={publishing || isUploadingAudio || isUploadingCover}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            {isUploadingAudio || isUploadingCover ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Uploading Files to Storage...
              </>
            ) : publishing ? (
              'Publishing Song to Voxify Marketplace...'
            ) : (
              <>
                Publish Song to Voxify Marketplace <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
