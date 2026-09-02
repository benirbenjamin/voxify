import { createClient } from '../supabase/client';
import { Announcement, AnnouncementComment, NotificationPriority } from '../types/database.types';
import { notificationService } from './notificationService';

// Metadata helper to parse comments and reactions embedded in announcement's attachment_url field
function parseMetadata(ann: any): {
  realAttachment: string | null;
  comments: AnnouncementComment[];
  reactions: { user_id: string; reaction_type: string }[];
} {
  let realAttachment: string | null = null;
  let comments: AnnouncementComment[] = [];
  let reactions: { user_id: string; reaction_type: string }[] = [];

  if (!ann || !ann.attachment_url) {
    return { realAttachment, comments, reactions };
  }

  const str = ann.attachment_url;
  if (str.startsWith('__META_V2__:')) {
    try {
      const parsed = JSON.parse(str.replace('__META_V2__:', ''));
      realAttachment = parsed.realAttachment || null;
      comments = parsed.comments || [];
      reactions = parsed.reactions || [];
    } catch (e) {
      // ignore
    }
  } else if (!str.startsWith('__VOXIFY_META__:')) {
    realAttachment = str;
  }

  return { realAttachment, comments, reactions };
}

function stringifyMetadata(meta: {
  realAttachment: string | null;
  comments: AnnouncementComment[];
  reactions: { user_id: string; reaction_type: string }[];
}): string {
  return '__META_V2__:' + JSON.stringify(meta);
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

    return announcements.map(ann => {
      const meta = parseMetadata(ann);
      const userReactions = meta.reactions
        .filter(r => r.user_id === user?.id)
        .map(r => r.reaction_type);

      return {
        ...ann,
        attachment_url: meta.realAttachment,
        comments_count: meta.comments.length,
        reactions_count: meta.reactions.length,
        user_reactions: userReactions,
      };
    });
  },

  async createAnnouncement(payload: {
    choir_id: string;
    title: string;
    content: string;
    priority?: NotificationPriority;
    target_scope?: 'all' | 'section';
    target_section_id?: string;
    attachment_url?: string;
  }): Promise<Announcement | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const initialMeta = stringifyMetadata({
      realAttachment: payload.attachment_url || null,
      comments: [],
      reactions: [],
    });

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        choir_id: payload.choir_id,
        title: payload.title,
        content: payload.content,
        priority: payload.priority || 'normal',
        target_scope: payload.target_scope || 'all',
        target_section_id: payload.target_section_id || null,
        attachment_url: initialMeta,
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
    const { data: ann } = await supabase
      .from('announcements')
      .select('attachment_url')
      .eq('id', announcementId)
      .single();

    if (!ann) return [];
    const meta = parseMetadata(ann);
    return meta.comments;
  },

  async addComment(announcementId: string, content: string): Promise<AnnouncementComment | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !content.trim()) return null;

    // Fetch profile of commenting user
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userProfile = profile || {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Choir Member',
      email: user.email!,
    };

    const { data: ann } = await supabase
      .from('announcements')
      .select('attachment_url')
      .eq('id', announcementId)
      .single();

    if (!ann) return null;

    const meta = parseMetadata(ann);

    const newComment: AnnouncementComment = {
      id: Math.random().toString(36).substring(2, 11),
      announcement_id: announcementId,
      user_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_profile: userProfile as any,
    };

    meta.comments.push(newComment);
    const updatedMeta = stringifyMetadata(meta);

    const { error } = await supabase
      .from('announcements')
      .update({ attachment_url: updatedMeta })
      .eq('id', announcementId);

    if (error) return null;

    return newComment;
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const supabase = createClient();

    // Fetch all announcements to find and remove the target comment
    const { data: list } = await supabase
      .from('announcements')
      .select('id, attachment_url');

    if (!list) return false;

    for (const ann of list) {
      const meta = parseMetadata(ann);
      const commentIdx = meta.comments.findIndex(c => c.id === commentId);
      if (commentIdx >= 0) {
        meta.comments.splice(commentIdx, 1);
        const updatedMeta = stringifyMetadata(meta);
        await supabase
          .from('announcements')
          .update({ attachment_url: updatedMeta })
          .eq('id', ann.id);
        return true;
      }
    }

    return true;
  },

  async toggleReaction(announcementId: string, reactionType: 'love' | 'amen' | 'clap' | 'fire'): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: ann } = await supabase
      .from('announcements')
      .select('attachment_url')
      .eq('id', announcementId)
      .single();

    if (!ann) return false;

    const meta = parseMetadata(ann);
    const existingIdx = meta.reactions.findIndex(
      r => r.user_id === user.id && r.reaction_type === reactionType
    );

    if (existingIdx >= 0) {
      meta.reactions.splice(existingIdx, 1);
    } else {
      meta.reactions.push({ user_id: user.id, reaction_type: reactionType });
    }

    const updatedMeta = stringifyMetadata(meta);

    const { error } = await supabase
      .from('announcements')
      .update({ attachment_url: updatedMeta })
      .eq('id', announcementId);

    return !error;
  }
};
