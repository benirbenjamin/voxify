-- ==========================================
-- VOXIFY SPACE — CHOIR MANAGEMENT PLATFORM
-- Migration 00002: Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.choirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.choir_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehearsals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- HELPER FUNCTIONS FOR SECURITY & PERMISSIONS
-- ------------------------------------------

-- Check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_super_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is active member of choir
CREATE OR REPLACE FUNCTION public.is_choir_member(target_choir_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.choir_members 
        WHERE choir_id = target_choir_id 
          AND user_id = auth.uid() 
          AND status = 'active'
    ) OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is owner or admin of choir
CREATE OR REPLACE FUNCTION public.is_choir_admin(target_choir_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.choir_members 
        WHERE choir_id = target_choir_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin')
          AND status = 'active'
    ) OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------
CREATE POLICY "Public profiles are readable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Super admin can manage all profiles" 
ON public.profiles FOR ALL USING (public.is_super_admin());

-- ------------------------------------------
-- 2. SUBSCRIPTION PLANS POLICIES
-- ------------------------------------------
CREATE POLICY "Plans readable by everyone" 
ON public.subscription_plans FOR SELECT USING (true);

CREATE POLICY "Plans managed by Super Admin only" 
ON public.subscription_plans FOR ALL USING (public.is_super_admin());

-- ------------------------------------------
-- 3. CHOIRS POLICIES
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can view choirs they belong to or by code search" ON public.choirs;
DROP POLICY IF EXISTS "Authenticated users can create a choir" ON public.choirs;
DROP POLICY IF EXISTS "Choir owner and admin can update choir info" ON public.choirs;
DROP POLICY IF EXISTS "Super admin can manage all choirs" ON public.choirs;

CREATE POLICY "Users can view choirs they belong to or by code search" 
ON public.choirs FOR SELECT USING (
    owner_id = auth.uid() OR public.is_choir_member(id) OR auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can create a choir" 
ON public.choirs FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

CREATE POLICY "Choir owner and admin can update choir info" 
ON public.choirs FOR UPDATE USING (
    owner_id = auth.uid() OR public.is_choir_admin(id)
);

CREATE POLICY "Super admin can manage all choirs" 
ON public.choirs FOR ALL USING (public.is_super_admin());

-- ------------------------------------------
-- 4. SUBSCRIPTIONS POLICIES
-- ------------------------------------------
CREATE POLICY "Members can view choir subscription" 
ON public.subscriptions FOR SELECT USING (public.is_choir_member(choir_id));

CREATE POLICY "Super admin and choir owner can manage subscription" 
ON public.subscriptions FOR ALL USING (public.is_choir_admin(choir_id));

-- ------------------------------------------
-- 5. CHOIR MEMBERS POLICIES
-- ------------------------------------------
CREATE POLICY "Members can view co-members in same choir" 
ON public.choir_members FOR SELECT USING (
    public.is_choir_member(choir_id) OR user_id = auth.uid()
);

CREATE POLICY "Users can insert membership join requests" 
ON public.choir_members FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "Admins can update choir memberships" 
ON public.choir_members FOR UPDATE USING (public.is_choir_admin(choir_id));

CREATE POLICY "Admins can delete choir memberships" 
ON public.choir_members FOR DELETE USING (public.is_choir_admin(choir_id));

-- ------------------------------------------
-- 6. SECTIONS POLICIES
-- ------------------------------------------
CREATE POLICY "Sections readable by choir members" 
ON public.sections FOR SELECT USING (public.is_choir_member(choir_id));

CREATE POLICY "Sections managed by choir admins" 
ON public.sections FOR ALL USING (public.is_choir_admin(choir_id));

-- ------------------------------------------
-- 7. MEMBER SECTIONS POLICIES
-- ------------------------------------------
CREATE POLICY "Member sections readable by choir members" 
ON public.member_sections FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.choir_members cm 
        WHERE cm.id = member_id AND public.is_choir_member(cm.choir_id)
    )
);

CREATE POLICY "Member sections managed by choir admins" 
ON public.member_sections FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.choir_members cm 
        WHERE cm.id = member_id AND public.is_choir_admin(cm.choir_id)
    )
);

-- ------------------------------------------
-- 8. INVITATIONS POLICIES
-- ------------------------------------------
CREATE POLICY "Invitations readable by choir code or link lookup" 
ON public.invitations FOR SELECT USING (true);

CREATE POLICY "Invitations managed by choir admins" 
ON public.invitations FOR ALL USING (public.is_choir_admin(choir_id));

-- ------------------------------------------
-- 9. SONGS & PARTS POLICIES
-- ------------------------------------------
CREATE POLICY "Songs readable by choir members" 
ON public.songs FOR SELECT USING (public.is_choir_member(choir_id));

CREATE POLICY "Songs managed by choir admins" 
ON public.songs FOR ALL USING (public.is_choir_admin(choir_id));

CREATE POLICY "Song parts readable by choir members" 
ON public.song_parts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.songs s WHERE s.id = song_id AND public.is_choir_member(s.choir_id))
);

CREATE POLICY "Song parts managed by choir admins" 
ON public.song_parts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.songs s WHERE s.id = song_id AND public.is_choir_admin(s.choir_id))
);

CREATE POLICY "Song versions readable by choir members" 
ON public.song_versions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.songs s WHERE s.id = song_id AND public.is_choir_member(s.choir_id))
);

CREATE POLICY "Song versions managed by choir admins" 
ON public.song_versions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.songs s WHERE s.id = song_id AND public.is_choir_admin(s.choir_id))
);

-- ------------------------------------------
-- 10. EVENTS & EVENT SONGS POLICIES
-- ------------------------------------------
CREATE POLICY "Events readable by choir members" 
ON public.events FOR SELECT USING (public.is_choir_member(choir_id));

CREATE POLICY "Events managed by choir admins" 
ON public.events FOR ALL USING (public.is_choir_admin(choir_id));

CREATE POLICY "Event songs readable by choir members" 
ON public.event_songs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.is_choir_member(e.choir_id))
);

CREATE POLICY "Event songs managed by choir admins" 
ON public.event_songs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.is_choir_admin(e.choir_id))
);

-- ------------------------------------------
-- 11. REHEARSALS & ATTENDANCE POLICIES
-- ------------------------------------------
CREATE POLICY "Rehearsals readable by choir members" 
ON public.rehearsals FOR SELECT USING (public.is_choir_member(choir_id));

CREATE POLICY "Rehearsals managed by choir admins" 
ON public.rehearsals FOR ALL USING (public.is_choir_admin(choir_id));

CREATE POLICY "Attendance readable by choir members" 
ON public.attendance FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.choir_members cm 
        WHERE cm.id = member_id AND public.is_choir_member(cm.choir_id)
    )
);

CREATE POLICY "Attendance managed by choir admins" 
ON public.attendance FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.choir_members cm 
        WHERE cm.id = member_id AND public.is_choir_admin(cm.choir_id)
    )
);

-- ------------------------------------------
-- 12. LEARNING PROGRESS POLICIES
-- ------------------------------------------
CREATE POLICY "Learning progress readable by user and choir admins" 
ON public.learning_progress FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.choir_members cm 
        WHERE cm.id = member_id AND (cm.user_id = auth.uid() OR public.is_choir_admin(cm.choir_id))
    )
);

CREATE POLICY "Members update own learning progress" 
ON public.learning_progress FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.choir_members cm 
        WHERE cm.id = member_id AND cm.user_id = auth.uid()
    )
);

-- ------------------------------------------
-- 13. ANNOUNCEMENTS POLICIES
-- ------------------------------------------
CREATE POLICY "Announcements readable by choir members" 
ON public.announcements FOR SELECT USING (public.is_choir_member(choir_id));

CREATE POLICY "Announcements managed by choir admins" 
ON public.announcements FOR ALL USING (public.is_choir_admin(choir_id));

-- ------------------------------------------
-- 14. NOTIFICATIONS POLICIES
-- ------------------------------------------
CREATE POLICY "Users read and manage own notifications" 
ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ------------------------------------------
-- 15. AUDIT LOGS POLICIES
-- ------------------------------------------
CREATE POLICY "Audit logs viewable by choir admins and Super Admin" 
ON public.audit_logs FOR SELECT USING (
    (choir_id IS NOT NULL AND public.is_choir_admin(choir_id)) OR public.is_super_admin()
);

-- ------------------------------------------
-- 16. FAVORITES POLICIES
-- ------------------------------------------
CREATE POLICY "Users manage own song favorites" 
ON public.favorites FOR ALL USING (user_id = auth.uid());
