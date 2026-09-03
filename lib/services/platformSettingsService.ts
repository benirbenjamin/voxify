import { createClient } from '../supabase/client';
import { PlatformPaymentSettings } from '../types/database.types';

export const platformSettingsService = {
  async getSettings(): Promise<PlatformPaymentSettings> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'global')
        .single();

      if (error || !data) {
        return {
          google_pay_enabled: true,
          flutterwave_enabled: true,
        };
      }

      return {
        google_pay_enabled: data.google_pay_enabled ?? true,
        flutterwave_enabled: data.flutterwave_enabled ?? true,
        flutterwave_secret_key: data.flutterwave_secret_key || null,
        flutterwave_public_key: data.flutterwave_public_key || null,
      };
    } catch {
      return {
        google_pay_enabled: true,
        flutterwave_enabled: true,
      };
    }
  },

  async updateSettings(settings: Partial<PlatformPaymentSettings>): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        id: 'global',
        ...settings,
        updated_at: new Date().toISOString(),
      });

    return !error;
  },
};
