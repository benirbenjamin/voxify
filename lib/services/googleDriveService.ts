import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface GoogleDriveAccount {
  id: string;
  account_email: string;
  folder_id: string;
  credentials_json: any;
  status: 'active' | 'full' | 'disabled';
  max_storage_mb: number;
  used_storage_mb: number;
  file_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlatformStorageSettings {
  storage_mode: 'supabase_primary' | 'google_drive_primary' | 'supabase_only';
  storage_fallback_enabled: boolean;
}

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Fetch current platform storage settings
 */
export async function getStorageSettings(): Promise<PlatformStorageSettings> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('storage_mode, storage_fallback_enabled')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        storage_mode: 'supabase_primary',
        storage_fallback_enabled: true,
      };
    }

    return {
      storage_mode: data.storage_mode || 'supabase_primary',
      storage_fallback_enabled: data.storage_fallback_enabled ?? true,
    };
  } catch (err) {
    console.error('Error fetching storage settings:', err);
    return {
      storage_mode: 'supabase_primary',
      storage_fallback_enabled: true,
    };
  }
}

/**
 * Update platform storage settings
 */
export async function updateStorageSettings(settings: Partial<PlatformStorageSettings>): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getAdminSupabase();

    // Check if platform_settings record exists
    const { data: existing } = await supabase.from('platform_settings').select('id').limit(1).maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('platform_settings').insert([
        {
          id: 'global',
          storage_mode: settings.storage_mode || 'supabase_primary',
          storage_fallback_enabled: settings.storage_fallback_enabled ?? true,
        },
      ]);

      if (error) return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update storage settings' };
  }
}

/**
 * Fetch all configured Google Drive accounts
 */
export async function getDriveAccounts(): Promise<GoogleDriveAccount[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('google_drive_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching google_drive_accounts:', error);
      return [];
    }

    return (data || []) as GoogleDriveAccount[];
  } catch (err) {
    console.error('Error in getDriveAccounts:', err);
    return [];
  }
}

/**
 * Add a new Google Drive account to the rotation pool
 */
export async function addDriveAccount(account: {
  account_email: string;
  folder_id?: string;
  credentials_json: any;
  max_storage_mb?: number;
}): Promise<{ data: GoogleDriveAccount | null; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('google_drive_accounts')
      .insert([
        {
          account_email: account.account_email,
          folder_id: account.folder_id || '',
          credentials_json: typeof account.credentials_json === 'string' ? JSON.parse(account.credentials_json) : account.credentials_json,
          status: 'active',
          max_storage_mb: account.max_storage_mb || 15000,
          used_storage_mb: 0,
          file_count: 0,
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as GoogleDriveAccount, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to add Google Drive account' };
  }
}

/**
 * Update an existing Google Drive account
 */
export async function updateDriveAccount(
  id: string,
  updates: Partial<GoogleDriveAccount>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const payload: any = { ...updates };
    if (typeof payload.credentials_json === 'string') {
      try {
        payload.credentials_json = JSON.parse(payload.credentials_json);
      } catch (e) {
        // keep as is if parse fails
      }
    }

    const { error } = await supabase.from('google_drive_accounts').update(payload).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update Google Drive account' };
  }
}

/**
 * Delete a Google Drive account from the pool
 */
export async function deleteDriveAccount(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from('google_drive_accounts').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete account' };
  }
}

/**
 * Get the next active Google Drive account from the pool with available capacity
 */
export async function getActiveDriveAccount(): Promise<GoogleDriveAccount | null> {
  const accounts = await getDriveAccounts();
  const activeAccount = accounts.find(
    (acc) => acc.status === 'active' && acc.used_storage_mb < acc.max_storage_mb
  );
  return activeAccount || null;
}

/**
 * Mark a Google Drive account as full when capacity is genuinely exceeded
 */
export async function markAccountFull(accountId: string): Promise<void> {
  try {
    const supabase = getAdminSupabase();
    await supabase
      .from('google_drive_accounts')
      .update({ status: 'full' })
      .eq('id', accountId);
    console.log(`[GoogleDrivePool] Account ${accountId} marked as FULL.`);
  } catch (err) {
    console.error('Error marking account full:', err);
  }
}

/**
 * Reset all accounts falsely marked as full back to active
 */
export async function resetFullAccounts(): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const accounts = await getDriveAccounts();
    const toReset = accounts.filter(
      (a) => a.status === 'full' && (a.used_storage_mb || 0) < (a.max_storage_mb || 15000)
    );

    for (const acc of toReset) {
      await supabase.from('google_drive_accounts').update({ status: 'active' }).eq('id', acc.id);
    }

    return { count: toReset.length, error: null };
  } catch (err: any) {
    return { count: 0, error: err.message || 'Error resetting accounts' };
  }
}

/**
 * Obtain an OAuth2 Access Token using Service Account JSON credentials
 */
export async function getAccessTokenFromServiceAccount(creds: any): Promise<string> {
  if (typeof creds === 'string' && creds.length > 50 && !creds.startsWith('{')) {
    return creds;
  }
  if (creds.access_token) {
    return creds.access_token;
  }

  // Support for OAuth 2.0 User Credentials (client_id, client_secret, refresh_token)
  if (creds.refresh_token && creds.client_id && creds.client_secret) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        refresh_token: creds.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      throw new Error(`Google OAuth refresh failed: ${data.error_description || data.error || 'Unknown error'}`);
    }
    return data.access_token;
  }

  const clientEmail = creds.client_email;
  let privateKey = creds.private_key;

  if (!clientEmail || !privateKey) {
    throw new Error('Invalid Service Account JSON: missing client_email or private_key.');
  }

  // Format private key correctly if escaped
  privateKey = privateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(header);
  const encodedClaimSet = base64UrlEncode(claimSet);
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer
    .sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Google OAuth token failed: ${tokenData.error_description || tokenData.error || 'Unknown error'}`);
  }

  return tokenData.access_token;
}

/**
 * Upload file to Google Drive with multi-account auto-rotation & folder permission fallback
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  preferredAccountId?: string
): Promise<{
  fileId: string;
  streamUrl: string;
  accountEmail: string;
  error: string | null;
}> {
  const accounts = await getDriveAccounts();
  
  // Find accounts that are active with available space
  let activeAccounts = accounts.filter(
    (acc) => acc.status === 'active' && (acc.used_storage_mb || 0) < (acc.max_storage_mb || 15000)
  );

  // AUTO-RECOVERY: If no accounts are active, check if any accounts were falsely marked "full"
  // when their recorded storage is still well below max capacity!
  if (activeAccounts.length === 0) {
    const recoverableAccounts = accounts.filter(
      (acc) => acc.status === 'full' && (acc.used_storage_mb || 0) < (acc.max_storage_mb || 15000)
    );

    if (recoverableAccounts.length > 0) {
      console.log(`[GoogleDrivePool] Auto-recovering ${recoverableAccounts.length} accounts marked full before reaching max limit...`);
      for (const rec of recoverableAccounts) {
        await updateDriveAccount(rec.id, { status: 'active' });
        rec.status = 'active';
      }
      activeAccounts = recoverableAccounts;
    }
  }

  if (preferredAccountId) {
    const idx = activeAccounts.findIndex((a) => a.id === preferredAccountId);
    if (idx > 0) {
      const [pref] = activeAccounts.splice(idx, 1);
      activeAccounts.unshift(pref);
    }
  }

  if (activeAccounts.length === 0) {
    return {
      fileId: '',
      streamUrl: '',
      accountEmail: '',
      error: accounts.length === 0
        ? 'No Google Drive accounts are configured in Super Admin -> Storage Settings.'
        : 'All Google Drive accounts in the pool have reached their maximum storage limit.',
    };
  }

  let lastError = '';

  // Helper to send multipart upload
  const sendDriveUpload = async (
    accessToken: string,
    metadata: any,
    buffer: Buffer,
    type: string
  ) => {
    const boundary = '-------VoxifyBoundary' + Date.now().toString(16);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
      ),
      Buffer.from(
        `${delimiter}Content-Type: ${type || 'application/octet-stream'}\r\n\r\n`
      ),
      buffer,
      Buffer.from(closeDelimiter),
    ]);

    return fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length.toString(),
        },
        body: bodyBuffer,
      }
    );
  };

  // Iterate over active accounts until upload succeeds or pool exhausted
  for (const account of activeAccounts) {
    try {
      const accessToken = await getAccessTokenFromServiceAccount(account.credentials_json);

      // Attempt 1: Upload with folder_id if provided
      let metadata: any = { name: fileName };
      if (account.folder_id && account.folder_id.trim()) {
        metadata.parents = [account.folder_id.trim()];
      }

      let uploadRes = await sendDriveUpload(accessToken, metadata, fileBuffer, mimeType);
      let uploadData = await uploadRes.json();

      // If folder upload failed due to folder permission or not found, retry without folder
      if (!uploadRes.ok && account.folder_id && (uploadRes.status === 404 || uploadRes.status === 403)) {
        console.warn(
          `[GoogleDrivePool] Account ${account.account_email} upload to folder '${account.folder_id}' failed (${uploadRes.status}). Retrying directly to root Drive...`
        );
        metadata = { name: fileName };
        uploadRes = await sendDriveUpload(accessToken, metadata, fileBuffer, mimeType);
        uploadData = await uploadRes.json();
      }

      if (!uploadRes.ok) {
        const errorMsg = uploadData.error?.message || JSON.stringify(uploadData);
        lastError = errorMsg;
        console.warn(`[GoogleDrivePool] Account ${account.account_email} upload error:`, errorMsg);

        // Check if error is specifically service account quota limitation on personal @gmail accounts
        const isServiceAccountLimitation = errorMsg.toLowerCase().includes('service accounts do not have storage quota');
        const isQuota =
          !isServiceAccountLimitation &&
          (uploadData.error?.errors?.some((e: any) => e.reason === 'storageQuotaExceeded') ||
          errorMsg.toLowerCase().includes('storagequotaexceeded') ||
          errorMsg.toLowerCase().includes('storage quota exceeded'));

        if (isQuota) {
          await markAccountFull(account.id);
          console.log(`[GoogleDrivePool] Account ${account.account_email} genuinely exceeded quota. Auto-rotating...`);
          continue; // Try next account in pool
        }

        if (isServiceAccountLimitation) {
          console.warn(`[GoogleDrivePool] Account ${account.account_email} note: Service accounts cannot own files in standard personal Gmail folders. A Google Workspace Shared Drive or OAuth Refresh Token is required.`);
        }

        // It was a permission or configuration error, do NOT mark as full!
        continue;
      }

      const fileId = uploadData.id;
      const fileSizeMb = fileBuffer.length / (1024 * 1024);

      // Make file readable via permissions API
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        });
      } catch (permErr) {
        console.warn('Google Drive permission update note:', permErr);
      }

      // Update used storage & file count on the account record in Supabase
      const updatedUsedMb = (account.used_storage_mb || 0) + fileSizeMb;
      const updatedCount = (account.file_count || 0) + 1;
      const newStatus = updatedUsedMb >= account.max_storage_mb ? 'full' : 'active';

      await updateDriveAccount(account.id, {
        used_storage_mb: Math.round(updatedUsedMb * 100) / 100,
        file_count: updatedCount,
        status: newStatus,
      });

      const streamUrl = `/api/storage/drive?id=${fileId}&email=${encodeURIComponent(account.account_email)}`;

      return {
        fileId,
        streamUrl,
        accountEmail: account.account_email,
        error: null,
      };
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
      console.error(`[GoogleDrivePool] Exception uploading to ${account.account_email}:`, err);
    }
  }

  return {
    fileId: '',
    streamUrl: '',
    accountEmail: '',
    error: lastError ? `Google Drive API error: ${lastError}` : 'All Google Drive accounts in pool failed to process upload.',
  };
}

/**
 * Initialize a direct resumable upload session for large files
 * Bypasses serverless payload limits by letting the client browser PUT directly to Google Drive
 */
export async function initDriveResumableUpload(
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<{
  success: boolean;
  resumableUploadUrl?: string;
  accountEmail?: string;
  error?: string;
}> {
  try {
    const accounts = await getDriveAccounts();
    const activeAccount = accounts.find(
      (acc) => acc.status === 'active' && (acc.used_storage_mb || 0) < (acc.max_storage_mb || 15000)
    );

    if (!activeAccount) {
      return {
        success: false,
        error: accounts.length === 0
          ? 'No Google Drive accounts configured.'
          : 'All Google Drive accounts in pool have reached maximum limit.',
      };
    }

    const accessToken = await getAccessTokenFromServiceAccount(activeAccount.credentials_json);

    const metadata: any = { name: fileName };
    if (activeAccount.folder_id && activeAccount.folder_id.trim()) {
      metadata.parents = [activeAccount.folder_id.trim()];
    }

    const initRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType || 'application/octet-stream',
          'X-Upload-Content-Length': fileSize.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text();
      return { success: false, error: `Failed to initialize Google Drive upload: ${errText}` };
    }

    const resumableUploadUrl = initRes.headers.get('Location');
    if (!resumableUploadUrl) {
      return { success: false, error: 'Google Drive did not return a resumable upload location.' };
    }

    return {
      success: true,
      resumableUploadUrl,
      accountEmail: activeAccount.account_email,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error initializing Google Drive upload' };
  }
}

/**
 * Finalize Google Drive upload after browser successfully uploads file to the resumable URL
 */
export async function finalizeDriveUpload(
  fileId: string,
  accountEmail: string,
  fileSizeMb: number
): Promise<{ streamUrl: string; error: string | null }> {
  try {
    const accounts = await getDriveAccounts();
    const account = accounts.find((a) => a.account_email === accountEmail);
    if (account) {
      const accessToken = await getAccessTokenFromServiceAccount(account.credentials_json);
      // Grant public read permission
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' }),
        });
      } catch (e) {
        console.warn('Google Drive permission update error:', e);
      }

      // Update storage tracking
      const updatedUsedMb = (account.used_storage_mb || 0) + fileSizeMb;
      const updatedCount = (account.file_count || 0) + 1;
      const newStatus = updatedUsedMb >= account.max_storage_mb ? 'full' : 'active';
      await updateDriveAccount(account.id, {
        used_storage_mb: Math.round(updatedUsedMb * 100) / 100,
        file_count: updatedCount,
        status: newStatus,
      });
    }

    const streamUrl = `/api/storage/drive?id=${fileId}&email=${encodeURIComponent(accountEmail)}`;
    return { streamUrl, error: null };
  } catch (err: any) {
    return { streamUrl: '', error: err.message || 'Failed to finalize Drive upload' };
  }
}
