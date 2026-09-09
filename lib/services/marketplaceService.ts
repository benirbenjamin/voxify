import { createClient } from '../supabase/client';
import { Genre, MarketplaceSong, SongComment } from '../types/database.types';

export interface FilterSongsOptions {
  genreId?: string;
  musicType?: 'gospel' | 'secular' | 'all';
  isLocalOnly?: boolean;
  searchQuery?: string;
  artistId?: string;
  sortBy?: 'popular' | 'latest' | 'price_asc' | 'price_desc';
  limit?: number;
  offset?: number;
}

export interface CreateSongPayload {
  title: string;
  description?: string;
  genre_id?: string;
  music_type: 'gospel' | 'secular';
  language?: string;
  audio_file_path: string;
  preview_audio_path?: string;
  preview_start_time: number;
  preview_end_time: number;
  cover_image_url?: string;
  lyrics?: string;
  price: number;
  currency?: string;
  status?: 'draft' | 'published';
}

export const marketplaceService = {
  async getGenres(): Promise<Genre[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('is_active', true)
      .order('is_local', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
    return (data || []) as Genre[];
  },

  async getMarketplaceSongs(options: FilterSongsOptions = {}, userId?: string): Promise<MarketplaceSong[]> {
    const supabase = createClient();
    let query = supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*, profile:profiles(*)), genre:genres(*)')
      .eq('status', 'published');

    if (options.artistId) {
      query = query.eq('artist_id', options.artistId);
    }

    if (options.genreId && options.genreId !== 'all') {
      query = query.eq('genre_id', options.genreId);
    }

    if (options.musicType && options.musicType !== 'all') {
      query = query.eq('music_type', options.musicType);
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const term = `%${options.searchQuery.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }

    if (options.sortBy === 'latest') {
      query = query.order('published_at', { ascending: false });
    } else if (options.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (options.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      // Default: popular
      query = query.order('purchases_count', { ascending: false }).order('views_count', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data: songs, error } = await query;

    if (error) {
      console.error('Error fetching marketplace songs:', error);
      return [];
    }

    let result = (songs || []) as MarketplaceSong[];

    // Filter local genres client side if requested
    if (options.isLocalOnly) {
      result = result.filter(song => song.genre?.is_local === true);
    }

    // Check user purchase state & liked state if logged in
    if (userId && result.length > 0) {
      const songIds = result.map(s => s.id);
      
      const [purchasesRes, likesRes] = await Promise.all([
        supabase.from('user_purchases').select('song_id').eq('buyer_id', userId).in('song_id', songIds),
        supabase.from('song_likes').select('song_id').eq('user_id', userId).in('song_id', songIds),
      ]);

      const purchasedSet = new Set((purchasesRes.data || []).map(p => p.song_id));
      const likedSet = new Set((likesRes.data || []).map(l => l.song_id));

      result = result.map(song => ({
        ...song,
        is_purchased: purchasedSet.has(song.id),
        is_liked: likedSet.has(song.id),
      }));
    }

    return result;
  },

  async getMarketplaceSongById(songId: string, userId?: string): Promise<MarketplaceSong | null> {
    const supabase = createClient();
    const { data: song, error } = await supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*, profile:profiles(*)), genre:genres(*)')
      .eq('id', songId)
      .single();

    if (error || !song) {
      console.error('Error fetching song details:', error);
      return null;
    }

    let isPurchased = false;
    let isLiked = false;

    if (userId) {
      const [pRes, lRes] = await Promise.all([
        supabase.from('user_purchases').select('id').eq('buyer_id', userId).eq('song_id', songId).maybeSingle(),
        supabase.from('song_likes').select('id').eq('user_id', userId).eq('song_id', songId).maybeSingle(),
      ]);
      isPurchased = !!pRes.data;
      isLiked = !!lRes.data;
    }

    return {
      ...(song as MarketplaceSong),
      is_purchased: isPurchased,
      is_liked: isLiked,
    };
  },

  async createMarketplaceSong(artistId: string, payload: CreateSongPayload): Promise<MarketplaceSong> {
    if (!payload.audio_file_path || payload.audio_file_path.startsWith('blob:')) {
      throw new Error('Invalid audio file URL: temporary local blob URLs cannot be saved. Audio track must be uploaded to cloud storage first.');
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from('marketplace_songs')
      .insert({
        artist_id: artistId,
        title: payload.title,
        description: payload.description || '',
        genre_id: payload.genre_id || null,
        music_type: payload.music_type,
        language: payload.language || 'Kinyarwanda',
        audio_file_path: payload.audio_file_path,
        preview_audio_path: payload.preview_audio_path || null,
        preview_start_time: payload.preview_start_time || 0,
        preview_end_time: payload.preview_end_time || 30,
        cover_image_url: payload.cover_image_url || null,
        lyrics: payload.lyrics || '',
        price: payload.price,
        currency: payload.currency || 'RWF',
        status: payload.status || 'published',
      })
      .select('*, artist:artist_profiles(*), genre:genres(*)')
      .single();

    if (error) {
      console.error('Error creating marketplace song:', error);
      throw new Error(error.message || 'Failed to upload song');
    }
    return data as MarketplaceSong;
  },

  async updateMarketplaceSong(songId: string, payload: Partial<CreateSongPayload>): Promise<MarketplaceSong> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('marketplace_songs')
      .update(payload)
      .eq('id', songId)
      .select('*, artist:artist_profiles(*), genre:genres(*)')
      .single();

    if (error) {
      console.error('Error updating marketplace song:', error);
      throw new Error(error.message || 'Failed to update song');
    }
    return data as MarketplaceSong;
  },

  async getUserPurchasedSongs(userId: string): Promise<MarketplaceSong[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_purchases')
      .select('*, song:marketplace_songs(*, artist:artist_profiles(*), genre:genres(*))')
      .eq('buyer_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }

    return (data || []).map(p => ({
      ...(p.song as MarketplaceSong),
      is_purchased: true,
    }));
  },

  async toggleLikeSong(songId: string, userId?: string, sessionId?: string): Promise<{ liked: boolean; count: number }> {
    const supabase = createClient();
    
    // Check if existing like
    let query = supabase.from('song_likes').select('id').eq('song_id', songId);
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      return { liked: false, count: 0 };
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      // Unlike
      await supabase.from('song_likes').delete().eq('id', existing.id);
      // Decrement song likes_count
      const { data: updatedSong } = await supabase.rpc('decrement_likes_count', { song_id: songId });
      const currentCount = updatedSong?.likes_count ?? 0;
      return { liked: false, count: currentCount };
    } else {
      // Like
      await supabase.from('song_likes').insert({
        song_id: songId,
        user_id: userId || null,
        session_id: sessionId || null,
      });
      // Increment song likes_count
      const { data: song } = await supabase.from('marketplace_songs').select('likes_count').eq('id', songId).single();
      const newCount = (song?.likes_count || 0) + 1;
      await supabase.from('marketplace_songs').update({ likes_count: newCount }).eq('id', songId);
      return { liked: true, count: newCount };
    }
  },

  async recordSongView(songId: string): Promise<void> {
    const supabase = createClient();
    const { data: song } = await supabase.from('marketplace_songs').select('views_count').eq('id', songId).single();
    if (song) {
      await supabase.from('marketplace_songs').update({ views_count: (song.views_count || 0) + 1 }).eq('id', songId);
    }
  },

  async getSongComments(songId: string): Promise<SongComment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('song_comments')
      .select('*')
      .eq('song_id', songId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return (data || []) as SongComment[];
  },

  async addSongComment(songId: string, authorName: string, content: string, userId?: string): Promise<SongComment> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('song_comments')
      .insert({
        song_id: songId,
        author_name: authorName,
        content: content.trim(),
        user_id: userId || null,
        status: 'visible',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error posting comment:', error);
      throw new Error('Failed to post comment');
    }
    return data as SongComment;
  },
};
