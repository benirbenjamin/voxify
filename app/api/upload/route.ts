import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getStorageSettings,
  uploadToGoogleDrive,
  initDriveResumableUpload,
  finalizeDriveUpload,
} from '@/lib/services/googleDriveService';

export async function POST(request: Request) {
  try {
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User must be authenticated to upload files' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle JSON actions: Resumable Drive upload init & finalize (0 payload overhead, bypasses Vercel 4.5MB limit)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { action } = body;

      if (action === 'init_drive_upload') {
        const { fileName, mimeType, fileSize } = body;
        const result = await initDriveResumableUpload(fileName, mimeType, Number(fileSize) || 0);
        return NextResponse.json(result);
      }

      if (action === 'finalize_drive_upload') {
        const { fileId, accountEmail, fileSizeMb } = body;
        const result = await finalizeDriveUpload(fileId, accountEmail, Number(fileSizeMb) || 0);
        return NextResponse.json({ success: !result.error, url: result.streamUrl, error: result.error, provider: 'google_drive' });
      }

      if (action === 'init_signed_upload') {
        const { fileName, bucket = 'song-audio' } = body;
        if (!fileName) {
          return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const adminSupabase = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Ensure bucket exists
        const { data: bucketData } = await adminSupabase.storage.getBucket(bucket);
        if (!bucketData) {
          await adminSupabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          }).catch(() => {});
        }

        const { data, error } = await adminSupabase.storage
          .from(bucket)
          .createSignedUploadUrl(fileName);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(fileName);

        return NextResponse.json({
          success: true,
          signedUrl: data.signedUrl,
          path: data.path,
          token: data.token,
          publicUrl: publicUrlData.publicUrl,
        });
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'song-audio';
    const choirId = (formData.get('choirId') as string) || 'default';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const cleanFileName = `${choirId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Get platform storage configuration
    const storageSettings = await getStorageSettings();

    // 1. Handle Google Drive Primary Mode
    if (storageSettings.storage_mode === 'google_drive_primary') {
      console.log(`[UploadAPI] Primary storage mode is Google Drive. Uploading file '${file.name}' to Drive pool...`);
      const driveResult = await uploadToGoogleDrive(fileBuffer, file.name, file.type);
      
      if (!driveResult.error) {
        return NextResponse.json({
          url: driveResult.streamUrl,
          provider: 'google_drive',
          accountEmail: driveResult.accountEmail,
          error: null,
        });
      }

      console.warn(`[UploadAPI] Google Drive primary upload failed: ${driveResult.error}. Checking fallback...`);
      if (!storageSettings.storage_fallback_enabled) {
        return NextResponse.json({ error: driveResult.error }, { status: 500 });
      }
    }

    // 2. Handle Supabase Primary Mode (or fallback destination)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Ensure bucket exists or create it automatically with public access
    const { data: bucketData } = await adminSupabase.storage.getBucket(bucket);
    if (!bucketData) {
      await adminSupabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800, // 50MB limit
      }).catch((createErr) => {
        console.log(`Auto-create bucket ${bucket} note:`, createErr);
      });
    }

    let uploadResult = await adminSupabase.storage
      .from(bucket)
      .upload(cleanFileName, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: true,
      });

    // If bucket was missing or RLS error, attempt creating public bucket and retrying
    if (uploadResult.error && (uploadResult.error.message.toLowerCase().includes('not found') || uploadResult.error.message.toLowerCase().includes('bucket'))) {
      await adminSupabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 15728640 }).catch(() => {});
      uploadResult = await adminSupabase.storage
        .from(bucket)
        .upload(cleanFileName, fileBuffer, {
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: true,
        });
    }

    // Check if Supabase succeeded
    if (!uploadResult.error) {
      const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(cleanFileName);
      return NextResponse.json({ url: publicUrlData.publicUrl, provider: 'supabase', error: null });
    }

    // Supabase upload failed (e.g. storage full / quota / limit)
    console.error(`[UploadAPI] Supabase storage upload failed: ${uploadResult.error.message}`);

    // 3. Fallback to Google Drive if fallback enabled
    if (storageSettings.storage_fallback_enabled && storageSettings.storage_mode !== 'google_drive_primary') {
      console.log(`[UploadAPI] Supabase storage failed/full. Falling back to Google Drive multi-account pool...`);
      const driveResult = await uploadToGoogleDrive(fileBuffer, file.name, file.type);

      if (!driveResult.error) {
        return NextResponse.json({
          url: driveResult.streamUrl,
          provider: 'google_drive',
          accountEmail: driveResult.accountEmail,
          error: null,
        });
      }

      console.error(`[UploadAPI] Both Supabase and Google Drive fallback failed:`, driveResult.error);
      return NextResponse.json({
        error: `Supabase upload failed (${uploadResult.error.message}) and Google Drive fallback failed (${driveResult.error})`,
      }, { status: 500 });
    }

    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });

  } catch (err: any) {
    console.error('Server upload API error:', err);
    return NextResponse.json({ error: err.message || 'Server error processing file upload' }, { status: 500 });
  }
}
