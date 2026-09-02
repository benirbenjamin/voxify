export type UserRole = 'owner' | 'admin' | 'section_leader' | 'member';
export type MemberStatus = 'pending' | 'active' | 'rejected' | 'suspended' | 'left';
export type VoicePart = 'Full Mix' | 'Soprano' | 'Alto' | 'Tenor' | 'Bass' | 'Instrumental' | 'Custom';
export type LearningStatus = 'not_started' | 'learning' | 'ready';
export type EventStatus = 'draft' | 'published' | 'completed' | 'ended' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type NotificationPriority = 'normal' | 'high';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChoirSettings {
  auto_approve_members: boolean;
  allow_code_join: boolean;
  allow_invite_links: boolean;
  allow_audio_downloads: boolean;
  allow_pdf_downloads: boolean;
  enable_email_notifications: boolean;
  enable_push_notifications: boolean;
}

export interface Choir {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  church_name?: string | null;
  logo_url?: string | null;
  choir_code: string;
  owner_id: string;
  settings: ChoirSettings;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface ChoirMember {
  id: string;
  choir_id: string;
  user_id: string;
  role: UserRole;
  status: MemberStatus;
  permissions: Record<string, boolean>;
  joined_at: string;
  updated_at: string;
  profile?: Profile;
  sections?: Section[];
}

export interface Section {
  id: string;
  choir_id: string;
  name: string;
  description?: string | null;
  leader_id?: string | null;
  created_at: string;
  leader_profile?: Profile;
  member_count?: number;
}

export interface SongPart {
  id: string;
  song_id: string;
  part_name: VoicePart;
  custom_part_label?: string | null;
  audio_url: string;
  duration_seconds: number;
  description?: string | null;
  version: number;
  created_at: string;
}

export interface Song {
  id: string;
  choir_id: string;
  title: string;
  composer?: string | null;
  arranger?: string | null;
  description?: string | null;
  language: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Advanced';
  duration_seconds: number;
  lyrics?: string | null;
  notes?: string | null;
  cover_url?: string | null;
  sheet_music_pdf_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  parts?: SongPart[];
  user_learning_status?: LearningStatus;
  is_favorite?: boolean;
}

export interface EventSongAssignment {
  id: string;
  event_id: string;
  song_id: string;
  order_index: number;
  notes?: string | null;
  target_scope: 'all' | 'section' | 'members';
  target_section_id?: string | null;
  target_member_ids: string[];
  created_at: string;
  song?: Song;
}

export interface Event {
  id: string;
  choir_id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  description?: string | null;
  status: EventStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  assigned_songs?: EventSongAssignment[];
}

export interface Rehearsal {
  id: string;
  choir_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  rehearsal_id?: string | null;
  event_id?: string | null;
  member_id: string;
  status: AttendanceStatus;
  notes?: string | null;
  recorded_by?: string | null;
  recorded_at: string;
  member?: ChoirMember;
}

export interface LearningProgressRecord {
  id: string;
  member_id: string;
  song_id: string;
  part_name: string;
  status: LearningStatus;
  updated_at: string;
}

export interface Announcement {
  id: string;
  choir_id: string;
  title: string;
  content: string;
  priority: NotificationPriority;
  target_scope: 'all' | 'section';
  target_section_id?: string | null;
  attachment_url?: string | null;
  created_by: string;
  created_at: string;
  author_name?: string;
  author_profile?: Profile;
  comments_count?: number;
  reactions_count?: number;
  user_reactions?: string[];
}

export interface AnnouncementComment {
  id: string;
  announcement_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: Profile;
}

export interface AnnouncementReaction {
  id: string;
  announcement_id: string;
  user_id: string;
  reaction_type: 'love' | 'amen' | 'clap' | 'fire';
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  choir_id?: string | null;
  title: string;
  message: string;
  priority: NotificationPriority;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PlanLimits {
  max_members: number;
  max_storage_mb: number;
  max_choirs: number;
  max_audio_files: number;
  max_events_per_month: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  is_free: boolean;
  is_active: boolean;
  features: string[];
  limits: PlanLimits;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  choir_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_end?: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface AuditLog {
  id: string;
  choir_id?: string | null;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details: Record<string, unknown>;
  created_at: string;
  user_email?: string;
}
