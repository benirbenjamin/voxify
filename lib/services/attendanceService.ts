import { createClient } from '../supabase/client';
import { Rehearsal, AttendanceRecord, AttendanceStatus } from '../types/database.types';

export const attendanceService = {
  async getRehearsals(choirId: string): Promise<Rehearsal[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('rehearsals')
      .select('*')
      .eq('choir_id', choirId)
      .order('date', { ascending: false });

    return (data as Rehearsal[]) || [];
  },

  async createRehearsal(payload: {
    choir_id: string;
    title: string;
    date: string;
    start_time: string;
    end_time?: string;
    location?: string;
    description?: string;
  }): Promise<Rehearsal | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('rehearsals')
      .insert({
        ...payload,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error || !data) return null;
    return data as Rehearsal;
  },

  async recordAttendance(records: Array<{
    rehearsal_id?: string;
    event_id?: string;
    member_id: string;
    status: AttendanceStatus;
    notes?: string;
  }>): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = records.map(r => ({
      ...r,
      recorded_by: user?.id || null,
      recorded_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(payload);

    return !error;
  },

  async getRehearsalAttendance(rehearsalId: string): Promise<AttendanceRecord[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('attendance')
      .select('*, member:choir_members(*, profile:profiles(*))')
      .eq('rehearsal_id', rehearsalId);

    return (data as AttendanceRecord[]) || [];
  }
};
