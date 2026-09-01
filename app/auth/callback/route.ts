import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const rolePref = data.user.user_metadata?.role_preference || 'singer';

      // Check if user already owns a choir
      const { data: choir } = await supabase
        .from('choirs')
        .select('id')
        .eq('owner_id', data.user.id)
        .limit(1)
        .single();

      if (rolePref === 'director' && !choir) {
        return NextResponse.redirect(`${origin}/choir/create`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Fallback if no code or error
  return NextResponse.redirect(`${origin}/login?verified=true`);
}
