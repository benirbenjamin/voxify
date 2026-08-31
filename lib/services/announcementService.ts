import { createClient } from '../supabase/client';
import { Announcement, NotificationPriority } from '../types/database.types';

export const announcementService = {
  async getAnnouncements(choirId: string): Promise<Announcement[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('choir_id', choirId)
      .order('created_at', { ascending: false });

    return (data as Announcement[]) || [];
  },

  async createAnnouncement(payload: {
    choir_id: string;
    title: string;
    content: string;
    priority?: NotificationPriority;
    target_scope?: 'all' | 'section';
    target_section_id?: string;
  }): Promise<Announcement | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...payload,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !data) return null;
    return data as Announcement;
  }
};
