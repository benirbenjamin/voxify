import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAppUrl } from '@/lib/utils/appUrl';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error') || searchParams.get('error_code');
  const errorDesc = searchParams.get('error_description');

  const appUrl = getAppUrl();

  // If Supabase returned an error in query params (e.g. link expired)
  if (errorParam || errorDesc) {
    const isExpired = errorParam === 'otp_expired' || (errorDesc && errorDesc.toLowerCase().includes('expired'));
    const reason = isExpired ? 'link_expired' : 'verification_failed';
    return NextResponse.redirect(`${appUrl}/login?error=${reason}`);
  }

  const next = searchParams.get('next');

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure profile row exists in database with full_name, email & phone number
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email!,
        phone: data.user.user_metadata?.phone || null,
        avatar_url: data.user.user_metadata?.avatar_url || null,
        is_super_admin: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // If next param was specified (e.g., /reset-password)
      if (next) {
        return NextResponse.redirect(`${appUrl}${next}`);
      }

      const rolePref = data.user.user_metadata?.role_preference || 'singer';

      // Check if user already owns a choir
      const { data: choir } = await supabase
        .from('choirs')
        .select('id')
        .eq('owner_id', data.user.id)
        .limit(1)
        .single();

      if (rolePref === 'director' && !choir) {
        return NextResponse.redirect(`${appUrl}/choir/create`);
      }

      return NextResponse.redirect(`${appUrl}/dashboard`);
    }
  }

  // Fallback if no code or error
  return NextResponse.redirect(`${appUrl}/login?verified=true`);
}
