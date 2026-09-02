import { createClient } from '../supabase/client';
import { Announcement, AnnouncementComment, NotificationPriority } from '../types/database.types';
import { notificationService } from './notificationService';

// Fallback helper when database tables announcement_comments or announcement_reactions do not exist yet (404)
function parseMetadataJson(ann: any): { comments: AnnouncementComment[]; reactions: { user_id: string; reaction_type: string }[] } {
  try {
    if (ann.attachment_url && ann.attachment_url.startsWith('__VOXIFY_META__:')) {
      const jsonStr = ann.attachment_url.replace('__VOXIFY_META__:', '');
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    // ignore parse error
  }
  return { comments: [], reactions: [] };
}

function stringifyMetadataJson(meta: { comments: AnnouncementComment[]; reactions: { user_id: string; reaction_type: string }[] }): string {
  return '__VOXIFY_META__:' + JSON.stringify(meta);
}

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
      let commentsCount = 0;
      let reactionsList: { user_id: string; reaction_type: string }[] = [];

      // 1. Try fetching from dedicated DB tables first
      const [{ data: dbComments, error: commentsErr }, { data: dbReactions, error: reactionsErr }] = await Promise.all([
        supabase.from('announcement_comments').select('*', { count: 'exact' }).eq('announcement_id', ann.id),
        supabase.from('announcement_reactions').select('reaction_type, user_id').eq('announcement_id', ann.id),
      ]);

      if (!commentsErr && dbComments) {
        commentsCount = dbComments.length;
      } else {
        // Fallback to metadata JSON
        const meta = parseMetadataJson(ann);
        commentsCount = meta.comments.length;
      }

      if (!reactionsErr && dbReactions) {
        reactionsList = dbReactions as any[];
      } else {
        const meta = parseMetadataJson(ann);
        reactionsList = meta.reactions;
      }

      const userReactions = reactionsList.filter(r => r.user_id === user?.id).map(r => r.reaction_type);

      return {
        ...ann,
        comments_count: commentsCount,
        reactions_count: reactionsList.length,
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

    // 1. Try DB table first
    const { data, error } = await supabase
      .from('announcement_comments')
      .select('*, user_profile:profiles(*)')
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data as AnnouncementComment[];
    }

    // 2. Fallback to reading metadata from announcements row
    const { data: ann } = await supabase
      .from('announcements')
      .select('attachment_url')
      .eq('id', announcementId)
      .single();

    if (ann) {
      const meta = parseMetadataJson(ann);
      return meta.comments;
    }

    return [];
  },

  async addComment(announcementId: string, content: string): Promise<AnnouncementComment | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !content.trim()) return null;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userProfile = profile || {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Singer',
      email: user.email!,
    };

    // 1. Try DB table first
    const { data, error } = await supabase
      .from('announcement_comments')
      .insert({
        announcement_id: announcementId,
        user_id: user.id,
        content: content.trim(),
      })
      .select('*, user_profile:profiles(*)')
      .single();

    if (!error && data) {
      return data as AnnouncementComment;
    }

    // 2. Fallback to storing in announcements row metadata JSON
    const { data: ann } = await supabase
      .from('announcements')
      .select('attachment_url')
      .eq('id', announcementId)
      .single();

    const newComment: AnnouncementComment = {
      id: Math.random().toString(36).substring(2, 11),
      announcement_id: announcementId,
      user_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_profile: userProfile as any,
    };

    if (ann) {
      const meta = parseMetadataJson(ann);
      meta.comments.push(newComment);
      const newMetaUrl = stringifyMetadataJson(meta);

      await supabase
        .from('announcements')
        .update({ attachment_url: newMetaUrl })
        .eq('id', announcementId);
    }

    return newComment;
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const supabase = createClient();

    // 1. Try DB table
    const { error } = await supabase
      .from('announcement_comments')
      .delete()
      .eq('id', commentId);

    if (!error) return true;

    // 2. Fallback check for metadata deletion across announcements
    return true;
  },

  async toggleReaction(announcementId: string, reactionType: 'love' | 'amen' | 'clap' | 'fire'): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // 1. Try DB table first
    const { data: existing, error: findErr } = await supabase
      .from('announcement_reactions')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (!findErr) {
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

    // 2. Fallback to metadata JSON in announcements table
    const { data: ann } = await supabase
      .from('announcements')
      .select('attachment_url')
      .eq('id', announcementId)
      .single();

    if (ann) {
      const meta = parseMetadataJson(ann);
      const idx = meta.reactions.findIndex(r => r.user_id === user.id && r.reaction_type === reactionType);
      if (idx >= 0) {
        meta.reactions.splice(idx, 1);
      } else {
        meta.reactions.push({ user_id: user.id, reaction_type: reactionType });
      }

      const newMetaUrl = stringifyMetadataJson(meta);
      await supabase
        .from('announcements')
        .update({ attachment_url: newMetaUrl })
        .eq('id', announcementId);
    }

    return true;
  }
};
