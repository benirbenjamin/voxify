import { createClient } from '../supabase/client';
import { Song, SongPart, LearningStatus } from '../types/database.types';

export const songService = {
  async getChoirSongs(choirId: string, search = '', category = ''): Promise<Song[]> {
    const supabase = createClient();
    let query = supabase
      .from('songs')
      .select('*, parts:song_parts(*)')
      .eq('choir_id', choirId)
      .order('title');

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }
    if (category.trim()) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Song[];
  },

  async getSongById(songId: string): Promise<Song | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('songs')
      .select('*, parts:song_parts(*)')
      .eq('id', songId)
      .single();

    if (error || !data) return null;
    return data as Song;
  },

  async createSong(payload: {
    choir_id: string;
    title: string;
    composer?: string;
    arranger?: string;
    category?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Advanced';
    lyrics?: string;
    notes?: string;
    sheet_music_pdf_url?: string;
  }): Promise<{ song: Song | null; error: string | null }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('songs')
      .insert({
        ...payload,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error || !data) {
      return { song: null, error: error?.message || 'Failed to create song' };
    }

    return { song: data as Song, error: null };
  },

  async updateSong(songId: string, payload: {
    title?: string;
    composer?: string;
    arranger?: string;
    category?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Advanced';
    lyrics?: string;
    notes?: string;
    sheet_music_pdf_url?: string | null;
  }): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('songs')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', songId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  },

  async addSongPart(payload: {
    song_id: string;
    part_name: string;
    audio_url: string;
    duration_seconds?: number;
    description?: string;
  }): Promise<SongPart | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('song_parts')
      .insert(payload)
      .select()
      .single();

    if (error || !data) return null;
    return data as SongPart;
  },

  async deleteSongPart(partId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('song_parts')
      .delete()
      .eq('id', partId);

    return !error;
  },

  async deleteSong(songId: string): Promise<boolean> {
    const supabase = createClient();
    // Delete song parts first
    await supabase.from('song_parts').delete().eq('song_id', songId);
    const { error } = await supabase.from('songs').delete().eq('id', songId);
    return !error;
  },

  async updateLearningStatus(memberId: string, songId: string, partName: string, status: LearningStatus): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        member_id: memberId,
        song_id: songId,
        part_name: partName,
        status,
        updated_at: new Date().toISOString(),
      });

    return !error;
  },

  async getMemberLearningStatus(memberId: string, songId: string): Promise<Record<string, LearningStatus>> {
    const supabase = createClient();
    const { data } = await supabase
      .from('learning_progress')
      .select('part_name, status')
      .eq('member_id', memberId)
      .eq('song_id', songId);

    const result: Record<string, LearningStatus> = {};
    if (data) {
      data.forEach((row: any) => {
        result[row.part_name] = row.status as LearningStatus;
      });
    }
    return result;
  },

  async uploadAudioFile(file: File, choirId: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'song-audio');
      formData.append('choirId', choirId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        return { url: data.url, error: null };
      }

      // Fallback to browser client if API fails
      const supabase = createClient();
      const cleanFileName = `${choirId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error } = await supabase.storage.from('song-audio').upload(cleanFileName, file, { cacheControl: '3600', upsert: true });
      if (error) return { url: null, error: error.message };

      const { data: publicUrlData } = supabase.storage.from('song-audio').getPublicUrl(cleanFileName);
      return { url: publicUrlData.publicUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err.message || 'Audio file upload failed' };
    }
  },

  async uploadPdfFile(file: File, choirId: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'song-documents');
      formData.append('choirId', choirId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        return { url: data.url, error: null };
      }

      // Fallback to browser client if API fails
      const supabase = createClient();
      const cleanFileName = `${choirId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error } = await supabase.storage.from('song-documents').upload(cleanFileName, file, { cacheControl: '3600', upsert: true });
      if (error) return { url: null, error: error.message };

      const { data: publicUrlData } = supabase.storage.from('song-documents').getPublicUrl(cleanFileName);
      return { url: publicUrlData.publicUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err.message || 'PDF sheet music upload failed' };
    }
  }
};
