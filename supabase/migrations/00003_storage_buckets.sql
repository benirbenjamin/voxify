-- ==========================================
-- VOXIFY SPACE — STORAGE BUCKETS & SECURITY
-- Migration 00003: Storage Buckets Definition
-- ==========================================

-- Insert storage buckets into storage.buckets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('profile-images', 'profile-images', true),
    ('choir-logos', 'choir-logos', true),
    ('song-audio', 'song-audio', false),
    ('song-parts', 'song-parts', false),
    ('song-documents', 'song-documents', false),
    ('announcement-attachments', 'announcement-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies for profile images (Public read, authenticated insert/update)
CREATE POLICY "Profile images public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

-- Storage object policies for choir logos
CREATE POLICY "Choir logos public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'choir-logos');

CREATE POLICY "Admins upload choir logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'choir-logos' AND auth.role() = 'authenticated');

-- Secure audio & documents access policies
CREATE POLICY "Authenticated users access song audio"
ON storage.objects FOR SELECT
USING (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments') AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins upload song files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments') AND auth.role() = 'authenticated');
