import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAppUrl } from '@/lib/utils/appUrl';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 });
    }

    const { songId, amount, currency } = await req.json();

    if (!songId || !amount) {
      return NextResponse.json({ error: 'Missing songId or amount' }, { status: 400 });
    }

    // Fetch song details
    const { data: song } = await supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*)')
      .eq('id', songId)
      .single();

    if (!song) {
      return NextResponse.json({ error: 'Marketplace song not found' }, { status: 404 });
    }

    const tx_ref = `voxify_mkt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const redirectUrl = `${getAppUrl()}/api/payments/marketplace/verify?tx_ref=${tx_ref}&song_id=${songId}&buyer_id=${session.user.id}`;

    const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-sandbox-mock-key';

    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref,
        amount: Number(amount),
        currency: currency || 'RWF',
        redirect_url: redirectUrl,
        customer: {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || 'Voxify Listener',
        },
        customizations: {
          title: `Voxify Song Purchase: ${song.title}`,
          description: `Direct music purchase from artist ${song.artist?.stage_name || ''}`,
          logo: `${getAppUrl()}/icon.png`,
        },
      }),
    });

    const flwData = await flwResponse.json();

    if (flwData.status === 'success' && flwData.data?.link) {
      return NextResponse.json({
        success: true,
        paymentUrl: flwData.data.link,
      });
    }

    // Direct bypass/sandbox link if key is demo
    return NextResponse.json({
      success: true,
      paymentUrl: redirectUrl + '&status=successful',
    });
  } catch (err: any) {
    console.error('Marketplace checkout error:', err);
    return NextResponse.json({ error: err.message || 'Payment server error' }, { status: 500 });
  }
}
