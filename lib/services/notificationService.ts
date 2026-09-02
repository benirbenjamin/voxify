import { createClient } from '../supabase/client';
import { NotificationItem, NotificationPriority } from '../types/database.types';

export const notificationService = {
  async getUserNotifications(userId: string): Promise<NotificationItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as NotificationItem[];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error || count === null) return 0;
    return count;
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return !error;
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return !error;
  },

  async createNotification(payload: {
    user_id: string;
    choir_id?: string;
    title: string;
    message: string;
    type?: string;
    priority?: NotificationPriority;
    link?: string;
  }): Promise<NotificationItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        choir_id: payload.choir_id || null,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'general',
        priority: payload.priority || 'normal',
        link: payload.link || null,
        is_read: false,
      })
      .select()
      .single();

    if (error || !data) return null;
    return data as NotificationItem;
  },

  async sendNotificationToChoir(
    choirId: string,
    title: string,
    message: string,
    type = 'general',
    link?: string,
    priority: NotificationPriority = 'normal'
  ): Promise<boolean> {
    const supabase = createClient();

    // 1. Fetch all active member user IDs in this choir
    const { data: members } = await supabase
      .from('choir_members')
      .select('user_id')
      .eq('choir_id', choirId)
      .eq('status', 'active');

    if (!members || members.length === 0) return true;

    // 2. Bulk insert notifications for each user
    const notifications = members.map(m => ({
      user_id: m.user_id,
      choir_id: choirId,
      title,
      message,
      type,
      priority,
      link: link || null,
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    return !error;
  },

  async sendNotificationToChoirAdmins(
    choirId: string,
    title: string,
    message: string,
    type = 'member_request',
    link = '/manage',
    priority: NotificationPriority = 'high'
  ): Promise<boolean> {
    const supabase = createClient();

    // 1. Fetch all choir owners and admins for this choir
    const { data: admins } = await supabase
      .from('choir_members')
      .select('user_id')
      .eq('choir_id', choirId)
      .in('role', ['owner', 'admin']);

    if (!admins || admins.length === 0) return true;

    // 2. Bulk insert admin notifications
    const notifications = admins.map(a => ({
      user_id: a.user_id,
      choir_id: choirId,
      title,
      message,
      type,
      priority,
      link,
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    return !error;
  }
};
