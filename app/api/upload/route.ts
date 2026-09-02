import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User must be authenticated to upload files' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'song-audio';
    const choirId = (formData.get('choirId') as string) || 'default';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Admin Supabase client using Service Role Key to bypass RLS policies on storage.objects
    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const cleanFileName = `${choirId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { data, error } = await adminSupabase.storage
      .from(bucket)
      .upload(cleanFileName, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`Storage upload error for bucket ${bucket}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(cleanFileName);

    return NextResponse.json({ url: publicUrlData.publicUrl, error: null });

  } catch (err: any) {
    console.error('Server upload API error:', err);
    return NextResponse.json({ error: err.message || 'Server error processing file upload' }, { status: 500 });
  }
}
