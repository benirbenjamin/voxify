import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAppUrl } from '@/lib/utils/appUrl';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tx_ref = searchParams.get('tx_ref');
    const songId = searchParams.get('song_id');
    const buyerId = searchParams.get('buyer_id');
    const statusParam = searchParams.get('status');

    if (!tx_ref || !songId || !buyerId) {
      return NextResponse.redirect(`${getAppUrl()}/marketplace?error=Invalid+payment+params`);
    }

    const supabase = await createServerSupabaseClient();

    // Fetch song details & marketplace settings
    const [songRes, settingsRes] = await Promise.all([
      supabase.from('marketplace_songs').select('*, artist:artist_profiles(*)').eq('id', songId).single(),
      supabase.from('marketplace_settings').select('*').eq('id', 'global').maybeSingle(),
    ]);

    const song = songRes.data;
    const settings = settingsRes.data || { platform_commission_percent: 15.0 };

    if (!song) {
      return NextResponse.redirect(`${getAppUrl()}/marketplace?error=Song+not+found`);
    }

    // Insert purchase record
    const { error: purchaseError } = await supabase.from('user_purchases').upsert({
      buyer_id: buyerId,
      song_id: songId,
      order_ref: tx_ref,
      amount_paid: song.price,
      currency: song.currency || 'RWF',
    });

    if (!purchaseError) {
      // Calculate platform commission split
      const platformCommissionPercent = settings.platform_commission_percent || 15.0;
      const platformFee = (Number(song.price) * platformCommissionPercent) / 100;
      const netArtistAmount = Number(song.price) - platformFee;

      // Calculate new balance snapshot
      const { data: ledgerEntries } = await supabase
        .from('financial_ledger')
        .select('net_artist_amount')
        .eq('artist_id', song.artist_id);

      const previousBalance = (ledgerEntries || []).reduce((acc: number, e: any) => acc + Number(e.net_artist_amount), 0);
      const newBalance = previousBalance + netArtistAmount;

      // Add to immutable financial ledger
      await supabase.from('financial_ledger').insert({
        artist_id: song.artist_id,
        order_id: tx_ref,
        type: 'sale',
        amount: song.price,
        platform_fee_amount: platformFee,
        net_artist_amount: netArtistAmount,
        currency: song.currency || 'RWF',
        balance_after: newBalance,
        description: `Song purchase: "${song.title}" (${platformCommissionPercent}% platform split)`,
      });

      // Increment song purchases_count
      await supabase
        .from('marketplace_songs')
        .update({ purchases_count: (song.purchases_count || 0) + 1 })
        .eq('id', songId);
    }

    return NextResponse.redirect(`${getAppUrl()}/purchases?success=true&song_id=${songId}`);
  } catch (err: any) {
    console.error('Marketplace verification error:', err);
    return NextResponse.redirect(`${getAppUrl()}/marketplace?error=Verification+failed`);
  }
}
