import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { songId } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required for song downloads.' }, { status: 401 });
    }

    // Verify user purchase in user_purchases
    const { data: purchase } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('buyer_id', session.user.id)
      .eq('song_id', songId)
      .maybeSingle();

    // Or check if user is the artist who uploaded the song
    const { data: song } = await supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*)')
      .eq('id', songId)
      .single();

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    const isArtistOwner = song.artist?.user_id === session.user.id;
    const isSuperAdmin = session.user.user_metadata?.is_super_admin === true;

    if (!purchase && !isArtistOwner && !isSuperAdmin) {
      return NextResponse.json({ error: 'You must purchase this song to access full download.' }, { status: 403 });
    }

    // If audio_file_path is a full URL, redirect directly
    if (song.audio_file_path.startsWith('http://') || song.audio_file_path.startsWith('https://')) {
      return NextResponse.redirect(song.audio_file_path);
    }

    // Create a temporary signed URL from Supabase Storage
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('songs')
      .createSignedUrl(song.audio_file_path, 3600, {
        download: `${song.title}.mp3`,
      });

    if (signedError || !signedUrlData?.signedUrl) {
      // Fallback to public storage URL
      const { data: publicUrl } = supabase.storage.from('songs').getPublicUrl(song.audio_file_path);
      return NextResponse.redirect(publicUrl.publicUrl);
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (err: any) {
    console.error('Download route error:', err);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
