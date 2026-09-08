'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { MarketplaceSong } from '@/lib/types/database.types';
import {
  Music,
  Play,
  Pause,
  Download,
  FileText,
  ShoppingBag,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function MyPurchasesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [purchasedSongs, setPurchasedSongs] = useState<MarketplaceSong[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Streaming Audio Player State
  const [currentSong, setCurrentSong] = useState<MarketplaceSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Selected lyrics modal / view
  const [selectedLyricsSong, setSelectedLyricsSong] = useState<MarketplaceSong | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/purchases');
      return;
    }

    async function loadPurchases() {
      try {
        const songs = await marketplaceService.getUserPurchasedSongs(user!.id);
        setPurchasedSongs(songs);
      } catch (err) {
        console.error('Error loading purchases:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPurchases();
  }, [user, authLoading, router]);

  const handlePlayFullAudio = (song: MarketplaceSong) => {
    if (currentSong?.id === song.id && isPlaying) {
      audioElement?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audioUrl = song.audio_file_path;
    const audio = new Audio(audioUrl);

    audio.onended = () => setIsPlaying(false);
    audio.play();

    setAudioElement(audio);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-amber-950 p-6 sm:p-8 rounded-3xl text-white shadow-2xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5" /> Permanent Library
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">My Purchased Music Library</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Stream full audio tracks, access complete lyrics, and download MP3s anytime.
        </p>
      </div>

      {purchasedSongs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E6F2FC] space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#DFF1FF] text-purple-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#000000]">No purchased music yet</h3>
          <p className="text-xs text-[#475569] max-w-sm mx-auto">
            Explore the Voxify Music Marketplace to purchase original Gospel &amp; Secular tracks from top Rwandan &amp; African creators.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" /> Explore Marketplace Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {purchasedSongs.map(song => {
            const isCurrentlyPlaying = currentSong?.id === song.id && isPlaying;
            return (
              <div
                key={song.id}
                className="bg-white border border-[#E6F2FC] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 overflow-hidden shrink-0 relative border border-[#E6F2FC]">
                    {song.cover_image_url ? (
                      <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-400">
                        <Music className="w-8 h-8" />
                      </div>
                    )}

                    <button
                      onClick={() => handlePlayFullAudio(song)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        {isCurrentlyPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                      </div>
                    </button>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Purchased
                      </span>
                      <span className="text-[10px] text-[#A8B5C2] font-semibold">{song.genre?.name || song.music_type}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#000000] truncate">{song.title}</h3>
                    <p className="text-xs text-[#475569] font-medium truncate">{song.artist?.stage_name || 'Independent Creator'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#E6F2FC] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedLyricsSong(song)}
                    className="px-3.5 py-2 rounded-xl bg-[#F5FAFF] hover:bg-[#DFF1FF] text-[#000000] font-bold text-xs border border-[#E6F2FC] flex items-center gap-1.5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600" /> View Lyrics
                  </button>

                  <a
                    href={`/api/marketplace/download/${song.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Audio
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lyrics Viewing Modal */}
      {selectedLyricsSong && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-[#E6F2FC] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6F2FC] pb-3">
              <div>
                <h3 className="text-lg font-black text-[#000000]">{selectedLyricsSong.title}</h3>
                <p className="text-xs text-[#475569]">By {selectedLyricsSong.artist?.stage_name}</p>
              </div>
              <button
                onClick={() => setSelectedLyricsSong(null)}
                className="text-xs font-bold text-[#A8B5C2] hover:text-[#000000]"
              >
                Close
              </button>
            </div>

            <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-[#000000] leading-relaxed bg-[#F5FAFF] p-5 rounded-2xl border border-[#E6F2FC]">
              {selectedLyricsSong.lyrics || 'No lyrics provided for this track.'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
