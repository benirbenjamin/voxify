'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { songService } from '@/lib/services/songService';
import { VoicePart } from '@/lib/types/database.types';
import { ArrowLeft, Music, Upload, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface PartDraft {
  part_name: VoicePart;
  audio_url: string;
  duration_seconds: number;
}

export default function NewSongPage() {
  const router = useRouter();
  const { activeChoir } = useChoir();

  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [category, setCategory] = useState('Worship');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Advanced'>('Medium');
  const [lyrics, setLyrics] = useState('');
  const [sheetPdfUrl, setSheetPdfUrl] = useState('');
  
  const [parts, setParts] = useState<PartDraft[]>([
    { part_name: 'Full Mix', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration_seconds: 180 },
    { part_name: 'Soprano', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration_seconds: 180 },
    { part_name: 'Alto', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration_seconds: 180 },
    { part_name: 'Tenor', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration_seconds: 180 },
    { part_name: 'Bass', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration_seconds: 180 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPart = () => {
    setParts(prev => [...prev, { part_name: 'Custom', audio_url: '', duration_seconds: 120 }]);
  };

  const handlePartChange = (index: number, field: keyof PartDraft, value: any) => {
    setParts(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemovePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoir) return;

    setLoading(true);
    setError(null);

    const { song, error: songErr } = await songService.createSong({
      choir_id: activeChoir.id,
      title,
      composer,
      category,
      difficulty,
      lyrics,
      sheet_music_pdf_url: sheetPdfUrl || undefined,
    });

    if (songErr || !song) {
      setError(songErr || 'Failed to create song');
      setLoading(false);
      return;
    }

    // Insert Song Parts
    for (const p of parts) {
      if (p.audio_url.trim()) {
        await songService.addSongPart({
          song_id: song.id,
          part_name: p.part_name,
          audio_url: p.audio_url.trim(),
          duration_seconds: p.duration_seconds,
        });
      }
    }

    router.push(`/songs/${song.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/manage" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Choir Admin
      </Link>

      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold text-white">Upload New Song</h1>
        <p className="text-sm text-slate-400">Add song details, lyrics, PDF sheet music, and multi-track audio files for choir practice</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Song Info */}
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" /> Song Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Song Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Mwijuru Imbere y'Imana"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Composer / Arranger</label>
              <input
                type="text"
                value={composer}
                onChange={e => setComposer(e.target.value)}
                placeholder="e.g. Traditional Choir Arrangement"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Worship">Worship</option>
                <option value="Praise">Praise</option>
                <option value="Christmas">Christmas</option>
                <option value="Easter">Easter</option>
                <option value="Wedding">Wedding</option>
                <option value="Funeral">Funeral</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Lyrics</label>
            <textarea
              rows={4}
              value={lyrics}
              onChange={e => setLyrics(e.target.value)}
              placeholder="Paste song lyrics here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">PDF Sheet Music URL (Optional)</label>
            <input
              type="url"
              value={sheetPdfUrl}
              onChange={e => setSheetPdfUrl(e.target.value)}
              placeholder="https://example.com/sheet-music.pdf"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Multi-Track Voice Parts Audio Setup */}
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" /> Voice Part Audio Tracks
            </h3>
            <button
              type="button"
              onClick={handleAddPart}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Add Track
            </button>
          </div>

          <div className="space-y-4">
            {parts.map((p, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block">Voice Part</label>
                  <select
                    value={p.part_name}
                    onChange={e => handlePartChange(idx, 'part_name', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Full Mix">Full Mix</option>
                    <option value="Soprano">Soprano</option>
                    <option value="Alto">Alto</option>
                    <option value="Tenor">Tenor</option>
                    <option value="Bass">Bass</option>
                    <option value="Instrumental">Instrumental</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block">Audio Stream / MP3 URL</label>
                  <input
                    type="url"
                    required
                    value={p.audio_url}
                    onChange={e => handlePartChange(idx, 'audio_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-mono">180s</span>
                  {parts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      className="p-2 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? 'Publishing Song...' : 'Publish Song & Audio Tracks'} <CheckCircle2 className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
