import { createClient } from '../supabase/client';
import { FinancialLedgerEntry, MarketplaceSettings, WithdrawalRequest, WithdrawalStatus } from '../types/database.types';

export interface ArtistFinancialSummary {
  totalSalesCount: number;
  totalRevenue: number; // total gross sales
  platformFeesPaid: number;
  totalEarnings: number; // net total earned by artist
  availableBalance: number; // net earnings minus processed withdrawals
  pendingWithdrawalAmount: number;
}

export const financialService = {
  async getArtistFinancialSummary(artistId: string): Promise<ArtistFinancialSummary> {
    const supabase = createClient();

    // Fetch all ledger entries
    const { data: ledger } = await supabase
      .from('financial_ledger')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    // Fetch withdrawal requests
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('artist_id', artistId);

    const entries = (ledger || []) as FinancialLedgerEntry[];
    const withdrawalReqs = (withdrawals || []) as WithdrawalRequest[];

    let totalSalesCount = 0;
    let totalRevenue = 0;
    let platformFeesPaid = 0;
    let totalEarnings = 0;

    entries.forEach(e => {
      if (e.type === 'sale') {
        totalSalesCount += 1;
        totalRevenue += Number(e.amount);
        platformFeesPaid += Number(e.platform_fee_amount);
        totalEarnings += Number(e.net_artist_amount);
      }
    });

    let paidWithdrawals = 0;
    let pendingWithdrawals = 0;

    withdrawalReqs.forEach(w => {
      if (w.status === 'paid') {
        paidWithdrawals += Number(w.amount);
      } else if (w.status === 'pending' || w.status === 'processing') {
        pendingWithdrawals += Number(w.amount);
      }
    });

    const availableBalance = Math.max(0, totalEarnings - paidWithdrawals - pendingWithdrawals);

    return {
      totalSalesCount,
      totalRevenue,
      platformFeesPaid,
      totalEarnings,
      availableBalance,
      pendingWithdrawalAmount: pendingWithdrawals,
    };
  },

  async getArtistLedger(artistId: string): Promise<FinancialLedgerEntry[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('financial_ledger')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ledger:', error);
      return [];
    }
    return (data || []) as FinancialLedgerEntry[];
  },

  async getArtistWithdrawalRequests(artistId: string): Promise<WithdrawalRequest[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }
    return (data || []) as WithdrawalRequest[];
  },

  async requestWithdrawal(
    artistId: string,
    amount: number,
    payoutMethod: string,
    payoutDetails: Record<string, any>
  ): Promise<WithdrawalRequest> {
    const supabase = createClient();

    // Check settings for min withdrawal limit
    const settings = await this.getMarketplaceSettings();
    if (amount < settings.min_withdrawal_amount) {
      throw new Error(`Minimum withdrawal amount is ${settings.min_withdrawal_amount.toLocaleString()} RWF`);
    }

    // Verify balance
    const summary = await this.getArtistFinancialSummary(artistId);
    if (amount > summary.availableBalance) {
      throw new Error(`Insufficient available balance (${summary.availableBalance.toLocaleString()} RWF available)`);
    }

    const feeAmount = (amount * settings.withdrawal_fee_percent) / 100;
    const netPayout = amount - feeAmount;

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        artist_id: artistId,
        amount,
        fee_amount: feeAmount,
        net_payout_amount: netPayout,
        currency: 'RWF',
        payout_method: payoutMethod,
        payout_details: payoutDetails,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating withdrawal request:', error);
      throw new Error(error.message || 'Failed to submit withdrawal request');
    }

    return data as WithdrawalRequest;
  },

  async getMarketplaceSettings(): Promise<MarketplaceSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('marketplace_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return {
        id: 'global',
        platform_commission_percent: 15.0,
        min_withdrawal_amount: 50000.0,
        withdrawal_fee_percent: 0.0,
        allow_auto_artist_approval: true,
        updated_at: new Date().toISOString(),
      };
    }
    return data as MarketplaceSettings;
  },

  async updateMarketplaceSettings(settings: Partial<MarketplaceSettings>): Promise<MarketplaceSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('marketplace_settings')
      .upsert({
        id: 'global',
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update marketplace settings');
    }
    return data as MarketplaceSettings;
  },

  async listAllWithdrawalRequestsForAdmin(): Promise<WithdrawalRequest[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, artist:artist_profiles(*, profile:profiles(*))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing withdrawals for admin:', error);
      return [];
    }
    return (data || []) as WithdrawalRequest[];
  },

  async updateWithdrawalStatus(
    requestId: string,
    status: WithdrawalStatus,
    adminNote?: string
  ): Promise<boolean> {
    const supabase = createClient();
    const { data: req } = await supabase.from('withdrawal_requests').select('*').eq('id', requestId).single();
    if (!req) return false;

    const updateData: any = {
      status,
      admin_note: adminNote || null,
      processed_at: status === 'paid' || status === 'rejected' ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from('withdrawal_requests').update(updateData).eq('id', requestId);

    if (error) {
      console.error('Error updating withdrawal status:', error);
      return false;
    }

    // If paid, insert withdrawal entry into financial ledger
    if (status === 'paid') {
      const summary = await this.getArtistFinancialSummary(req.artist_id);
      await supabase.from('financial_ledger').insert({
        artist_id: req.artist_id,
        type: 'withdrawal',
        amount: req.amount,
        platform_fee_amount: req.fee_amount,
        net_artist_amount: -req.net_payout_amount,
        currency: req.currency || 'RWF',
        balance_after: summary.availableBalance,
        description: `Payout processed via ${req.payout_method.toUpperCase()}`,
      });
    }

    return true;
  },
};
