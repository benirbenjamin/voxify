'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { songService } from '@/lib/services/songService';
import { Song } from '@/lib/types/database.types';
import { Music, Search, Filter, Volume2, Plus } from 'lucide-react';

export default function MusicLibraryPage() {
  const { activeChoir, isAdmin } = useChoir();
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSongs() {
      if (!activeChoir) return;
      setLoading(true);
      const data = await songService.getChoirSongs(activeChoir.id, search, category);
      setSongs(data);
      setLoading(false);
    }
    fetchSongs();
  }, [activeChoir, search, category]);

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Music Library</h1>
          <p className="text-sm text-slate-400">Search songs, view lyrics/PDFs, and practice voice part audio tracks</p>
        </div>
        {isAdmin && (
          <Link
            href="/manage/songs/new"
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Song
          </Link>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by title or composer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Categories</option>
            <option value="Worship">Worship</option>
            <option value="Praise">Praise</option>
            <option value="Christmas">Christmas</option>
            <option value="Easter">Easter</option>
            <option value="Wedding">Wedding</option>
            <option value="Funeral">Funeral</option>
          </select>
        </div>
      </div>

      {/* Song Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading choir music library...</div>
      ) : songs.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <Music className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No songs match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.map(song => (
            <div key={song.id} className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between gap-6 hover:border-purple-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-800/40">
                    {song.category}
                  </span>
                  <span className="text-xs text-slate-400">{song.difficulty}</span>
                </div>
                <h3 className="text-xl font-bold text-white line-clamp-1">{song.title}</h3>
                {song.composer && <p className="text-xs text-slate-400">Composer: {song.composer}</p>}
                <p className="text-xs text-slate-500 line-clamp-2">{song.description || 'No description provided.'}</p>
              </div>

              <Link
                href={`/songs/${song.id}`}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <Volume2 className="w-4 h-4" /> Open Practice Room
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
