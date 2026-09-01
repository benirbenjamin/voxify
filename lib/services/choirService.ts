import { createClient } from '../supabase/client';
import { Choir, ChoirMember, Section, ChoirSettings } from '../types/database.types';
import { generateChoirCode } from '../utils/choirCode';

export const choirService = {
  async getMyChoirs(): Promise<Choir[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: memberships, error } = await supabase
      .from('choir_members')
      .select('choir_id, choirs(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error || !memberships) return [];

    return memberships.map((m: any) => m.choirs).filter(Boolean) as Choir[];
  },

  async createChoir(payload: {
    name: string;
    description?: string;
    location?: string;
    church_name?: string;
    logo_url?: string;
  }): Promise<{ choir: Choir | null; error: string | null }> {
    try {
      const res = await fetch('/api/choir/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        // Fallback to browser client if API route fails
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { choir: null, error: 'User must be authenticated' };

        const choirCode = generateChoirCode();
        const { data: choir, error: choirError } = await supabase
          .from('choirs')
          .insert({
            name: payload.name,
            description: payload.description || null,
            location: payload.location || null,
            church_name: payload.church_name || null,
            logo_url: payload.logo_url || null,
            choir_code: choirCode,
            owner_id: user.id,
          })
          .select()
          .single();

        if (choirError || !choir) {
          return { choir: null, error: choirError?.message || 'Failed to create choir' };
        }

        await supabase.from('choir_members').upsert({
          choir_id: choir.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
        }, { onConflict: 'choir_id,user_id' });

        return { choir: choir as Choir, error: null };
      }

      return { choir: data.choir as Choir, error: null };
    } catch (err: any) {
      return { choir: null, error: err.message || 'Network error creating choir' };
    }
  },

  async findChoirByCode(code: string): Promise<Choir | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from('choirs')
      .select('*')
      .eq('choir_code', code.trim().toUpperCase())
      .single();

    return data as Choir | null;
  },

  async joinChoirByCode(choirId: string): Promise<{ success: boolean; status: string; alreadyMember?: boolean; error: string | null }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, status: '', error: 'User must be authenticated' };

    // Check if user is ALREADY a member
    const { data: existingMember } = await supabase
      .from('choir_members')
      .select('status, role')
      .eq('choir_id', choirId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      return {
        success: true,
        status: existingMember.status,
        alreadyMember: true,
        error: null,
      };
    }

    // Check choir auto-approve setting
    const { data: choir } = await supabase
      .from('choirs')
      .select('settings')
      .eq('id', choirId)
      .single();

    const autoApprove = (choir?.settings as ChoirSettings)?.auto_approve_members ?? false;
    const initialStatus = autoApprove ? 'active' : 'pending';

    const { error } = await supabase.from('choir_members').upsert({
      choir_id: choirId,
      user_id: user.id,
      role: 'member',
      status: initialStatus,
    }, { onConflict: 'choir_id,user_id' });

    if (error) return { success: false, status: '', error: error.message };

    return { success: true, status: initialStatus, alreadyMember: false, error: null };
  },

  async getChoirMembers(choirId: string): Promise<ChoirMember[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('choir_members')
      .select('*, profile:profiles(*)')
      .eq('choir_id', choirId)
      .order('joined_at', { ascending: false });

    if (error || !data) return [];
    return data as ChoirMember[];
  },

  async updateMemberStatus(memberId: string, status: 'active' | 'rejected' | 'suspended'): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('choir_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    return !error;
  },

  async getChoirSections(choirId: string): Promise<Section[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('sections')
      .select('*, leader_profile:profiles(*)')
      .eq('choir_id', choirId)
      .order('name');

    return (data as Section[]) || [];
  }
};
