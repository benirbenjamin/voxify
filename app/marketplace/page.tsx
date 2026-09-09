'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { Genre, MarketplaceSong } from '@/lib/types/database.types';
import { BackButton } from '@/components/ui/BackButton';
import {
  Sparkles,
  Search,
  Music,
  Play,
  Pause,
  Heart,
  ShoppingBag,
  Mic,
  Filter,
  CheckCircle2,
  Volume2,
  Share2,
  Globe
} from 'lucide-react';

export default function MarketplacePage() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<MarketplaceSong[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<string>('all');
  const [musicTypeCategory, setMusicTypeCategory] = useState<'all' | 'gospel' | 'secular'>('all');
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'price_asc' | 'price_desc'>('popular');

  // Audio Preview State
  const [currentPreviewSong, setCurrentPreviewSong] = useState<MarketplaceSong | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [gList, sList] = await Promise.all([
          marketplaceService.getGenres(),
          marketplaceService.getMarketplaceSongs({
            genreId: selectedGenreId,
            musicType: musicTypeCategory,
            isLocalOnly,
            searchQuery,
            sortBy,
          }, user?.id),
        ]);
        setGenres(gList);
        setSongs(sList);
      } catch (err) {
        console.error('Error loading marketplace data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedGenreId, musicTypeCategory, isLocalOnly, searchQuery, sortBy, user]);

  const handlePlayPreview = (song: MarketplaceSong) => {
    if (currentPreviewSong?.id === song.id && isPlayingPreview) {
      audioElement?.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audioUrl = song.preview_audio_path || song.audio_file_path;
    const audio = new Audio(audioUrl);
    
    // Set preview start timestamp
    audio.currentTime = song.preview_start_time || 0;

    // Monitor preview end limit
    const previewEnd = song.preview_end_time || (song.preview_start_time + 30);
    audio.ontimeupdate = () => {
      if (audio.currentTime >= previewEnd) {
        audio.pause();
        setIsPlayingPreview(false);
      }
    };

    audio.onended = () => {
      setIsPlayingPreview(false);
    };

    audio.play();
    setAudioElement(audio);
    setCurrentPreviewSong(song);
    setIsPlayingPreview(true);

    // Record view
    marketplaceService.recordSongView(song.id);
  };

  const handleLike = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await marketplaceService.toggleLikeSong(songId, user?.id);
      setSongs(songs.map(s => s.id === songId ? { ...s, is_liked: res.liked, likes_count: res.count } : s));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>
      
      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 dark:from-purple-950/60 dark:via-slate-900 dark:to-indigo-950/60 border border-slate-200 dark:border-slate-800 rounded-3xl py-8 sm:py-12 px-6 sm:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-extrabold text-xs uppercase tracking-wider border border-purple-200 dark:border-purple-700/50">
            <Sparkles className="w-3.5 h-3.5" /> Music Marketplace &amp; Creator Platform
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Discover, Preview &amp; Own Original Songs
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
            Explore authentic Rwandan local genres (Sebene, Igisirimba, Zoulu, Reggae) and international Gospel &amp; Secular tracks from independent artists.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-[#A8B5C2] absolute left-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by song title, lyrics, or songwriter name..."
                className="w-full bg-white border border-[#E6F2FC] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-[#000000] font-semibold focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Category & Rwandan Genre Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6F2FC] pb-4">
            
            {/* Gospel vs Secular Tabs */}
            <div className="flex items-center gap-2 bg-[#F5FAFF] p-1.5 rounded-2xl border border-[#E6F2FC]">
              {[
                { key: 'all', label: 'All Music' },
                { key: 'gospel', label: 'Gospel Only' },
                { key: 'secular', label: 'Secular & Cultural' },
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setMusicTypeCategory(cat.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    musicTypeCategory === cat.key
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-[#475569] hover:bg-[#DFF1FF]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filter Switches & Sorting */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLocalOnly(!isLocalOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  isLocalOnly
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-[#F5FAFF] border-[#E6F2FC] text-[#475569] hover:bg-[#DFF1FF]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Rwandan Local Genres Only</span>
              </button>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-[#F5FAFF] border border-[#E6F2FC] rounded-xl px-3.5 py-2 text-xs font-bold text-[#000000] focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="latest">Recently Released</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Genre Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedGenreId('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                selectedGenreId === 'all'
                  ? 'bg-[#000000] text-white border-[#000000]'
                  : 'bg-white border-[#E6F2FC] text-[#475569] hover:bg-[#F5FAFF]'
              }`}
            >
              All Genres
            </button>
            {genres.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGenreId(g.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  selectedGenreId === g.id
                    ? 'bg-[#000000] text-white border-[#000000]'
                    : 'bg-white border-[#E6F2FC] text-[#475569] hover:bg-[#F5FAFF]'
                }`}
              >
                {g.is_local && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                <span>{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Songs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white border border-[#E6F2FC] rounded-3xl p-5 space-y-4 animate-pulse">
                <div className="w-full h-48 bg-[#F5FAFF] rounded-2xl"></div>
                <div className="h-4 bg-[#F5FAFF] rounded w-3/4"></div>
                <div className="h-3 bg-[#F5FAFF] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 bg-[#F5FAFF] rounded-3xl border border-[#E6F2FC] space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#DFF1FF] text-purple-600 flex items-center justify-center mx-auto">
              <Music className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#000000]">No songs found</h3>
            <p className="text-xs text-[#475569]">Try selecting a different genre or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map(song => {
              const isCurrentlyPlaying = currentPreviewSong?.id === song.id && isPlayingPreview;
              return (
                <div
                  key={song.id}
                  className="bg-white border border-[#E6F2FC] rounded-3xl p-5 space-y-4 hover:shadow-xl hover:border-[#B9E2FF] transition-all group relative flex flex-col justify-between"
                >
                  {/* Cover Art & Play Button */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-[#E6F2FC] group">
                    {song.cover_image_url ? (
                      <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center text-amber-400 font-bold text-lg">
                        <Music className="w-12 h-12" />
                      </div>
                    )}

                    {/* Preview Play Overlay Button */}
                    <button
                      onClick={() => handlePlayPreview(song)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                        {isCurrentlyPlaying ? (
                          <Pause className="w-6 h-6 fill-current text-purple-600" />
                        ) : (
                          <Play className="w-6 h-6 fill-current text-purple-600 ml-1" />
                        )}
                      </div>
                    </button>

                    {/* Tags */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider">
                        {song.genre?.name || song.music_type}
                      </span>
                      {song.genre?.is_local && (
                        <span className="px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                          Local
                        </span>
                      )}
                    </div>

                    {/* Like button */}
                    <button
                      onClick={(e) => handleLike(song.id, e)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-rose-400 transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${song.is_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#A8B5C2] font-semibold">
                      <span className="truncate">{song.artist?.stage_name || 'Independent Artist'}</span>
                      <span className="text-[10px] bg-[#F5FAFF] px-2 py-0.5 rounded-full border border-[#E6F2FC]">
                        Preview Limit: {song.preview_start_time}s - {song.preview_end_time}s
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#000000] truncate group-hover:text-purple-600 transition-colors">
                      {song.title}
                    </h3>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="pt-3 border-t border-[#E6F2FC] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-[#A8B5C2] font-bold block">Buy Full Track</span>
                      <span className="text-base font-extrabold text-[#000000] font-mono">
                        {song.price.toLocaleString()} RWF
                      </span>
                    </div>

                    <Link
                      href={`/songs/marketplace/${song.id}`}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{song.is_purchased ? 'Stream Track' : 'Get Song'}</span>
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Floating Audio Preview Drawer */}
      {currentPreviewSong && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:max-w-md bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl shadow-2xl z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative border border-slate-700">
              {currentPreviewSong.cover_image_url ? (
                <img src={currentPreviewSong.cover_image_url} alt={currentPreviewSong.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-400">
                  <Music className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Playing Preview Clip</span>
              <h4 className="text-xs font-bold text-white truncate">{currentPreviewSong.title}</h4>
              <p className="text-[10px] text-slate-400 truncate">{currentPreviewSong.artist?.stage_name}</p>
            </div>
          </div>

          <button
            onClick={() => handlePlayPreview(currentPreviewSong)}
            className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 hover:bg-purple-500 shadow-md"
          >
            {isPlayingPreview ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
      )}

    </div>
  );
}
