import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getStorageSettings,
  updateStorageSettings,
  getDriveAccounts,
  addDriveAccount,
  updateDriveAccount,
  deleteDriveAccount,
  resetFullAccounts,
} from '@/lib/services/googleDriveService';

async function verifySuperAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (user.user_metadata?.is_super_admin === true) return true;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.is_super_admin === true;
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifySuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';

    if (action === 'settings') {
      const settings = await getStorageSettings();
      return NextResponse.json({ settings });
    }

    if (action === 'accounts') {
      const accounts = await getDriveAccounts();
      return NextResponse.json({ accounts });
    }

    // Default: return both
    const [settings, accounts] = await Promise.all([
      getStorageSettings(),
      getDriveAccounts(),
    ]);

    return NextResponse.json({ settings, accounts });
  } catch (err: any) {
    console.error('Storage API GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load storage config' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifySuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'update_settings') {
      const { storage_mode, storage_fallback_enabled } = body;
      const result = await updateStorageSettings({ storage_mode, storage_fallback_enabled });
      return NextResponse.json(result);
    }

    if (action === 'add_account') {
      const { account_email, folder_id, credentials_json, max_storage_mb } = body;
      const result = await addDriveAccount({
        account_email,
        folder_id,
        credentials_json,
        max_storage_mb,
      });
      return NextResponse.json(result);
    }

    if (action === 'update_account') {
      const { id, updates } = body;
      const result = await updateDriveAccount(id, updates);
      return NextResponse.json(result);
    }

    if (action === 'delete_account') {
      const { id } = body;
      const result = await deleteDriveAccount(id);
      return NextResponse.json(result);
    }

    if (action === 'reset_full_accounts') {
      const result = await resetFullAccounts();
      const accounts = await getDriveAccounts();
      return NextResponse.json({ ...result, accounts });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Storage API POST error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
