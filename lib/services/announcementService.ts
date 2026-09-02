import { createClient } from '../supabase/client';
import { Announcement, AnnouncementComment, NotificationPriority } from '../types/database.types';
import { notificationService } from './notificationService';

export const announcementService = {
  async getAnnouncements(choirId: string): Promise<Announcement[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('announcements')
      .select('*, author_profile:profiles(*)')
      .eq('choir_id', choirId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const announcements = data as Announcement[];

    // Fetch comment counts and user reactions for each announcement
    const enriched = await Promise.all(announcements.map(async ann => {
      const [{ count: commentsCount }, { data: reactions }] = await Promise.all([
        supabase.from('announcement_comments').select('*', { count: 'exact', head: true }).eq('announcement_id', ann.id),
        supabase.from('announcement_reactions').select('reaction_type, user_id').eq('announcement_id', ann.id),
      ]);

      const userReactions = (reactions || []).filter(r => r.user_id === user?.id).map(r => r.reaction_type);

      return {
        ...ann,
        comments_count: commentsCount || 0,
        reactions_count: reactions?.length || 0,
        user_reactions: userReactions,
      };
    }));

    return enriched;
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

    // Trigger notification to all choir members
    await notificationService.sendNotificationToChoir(
      payload.choir_id,
      `Announcement: ${payload.title}`,
      payload.content.slice(0, 140),
      'announcement',
      '/announcements',
      payload.priority || 'normal'
    );

    return data as Announcement;
  },

  async deleteAnnouncement(announcementId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    return !error;
  },

  async getAnnouncementComments(announcementId: string): Promise<AnnouncementComment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('announcement_comments')
      .select('*, user_profile:profiles(*)')
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data as AnnouncementComment[];
  },

  async addComment(announcementId: string, content: string): Promise<AnnouncementComment | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !content.trim()) return null;

    const { data, error } = await supabase
      .from('announcement_comments')
      .insert({
        announcement_id: announcementId,
        user_id: user.id,
        content: content.trim(),
      })
      .select('*, user_profile:profiles(*)')
      .single();

    if (error || !data) return null;
    return data as AnnouncementComment;
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('announcement_comments')
      .delete()
      .eq('id', commentId);

    return !error;
  },

  async toggleReaction(announcementId: string, reactionType: 'love' | 'amen' | 'clap' | 'fire'): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check existing reaction
    const { data: existing } = await supabase
      .from('announcement_reactions')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (existing) {
      await supabase.from('announcement_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('announcement_reactions').insert({
        announcement_id: announcementId,
        user_id: user.id,
        reaction_type: reactionType,
      });
    }

    return true;
  }
};
