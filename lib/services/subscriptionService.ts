import { createClient } from '../supabase/client';
import { SubscriptionPlan, PlanLimits } from '../types/database.types';

export const subscriptionService = {
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    return (data as SubscriptionPlan[]) || [];
  },

  async createPlan(payload: {
    name: string;
    description?: string;
    price_monthly: number;
    is_free: boolean;
    features: string[];
    limits: PlanLimits;
  }): Promise<SubscriptionPlan | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        ...payload,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) return null;
    return data as SubscriptionPlan;
  },

  async togglePlanActive(planId: string, isActive: boolean): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: isActive })
      .eq('id', planId);

    return !error;
  }
};
