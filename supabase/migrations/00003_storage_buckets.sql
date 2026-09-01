-- ==========================================
-- VOXIFY SPACE — STORAGE BUCKETS & SECURITY
-- Migration 00003: Storage Buckets Definition (Public Audio & PDFs)
-- ==========================================

-- Insert or update storage buckets into storage.buckets with public = true
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('profile-images', 'profile-images', true),
    ('choir-logos', 'choir-logos', true),
    ('song-audio', 'song-audio', true),
    ('song-parts', 'song-parts', true),
    ('song-documents', 'song-documents', true),
    ('announcement-attachments', 'announcement-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Ensure all storage buckets are marked public
UPDATE storage.buckets
SET public = true
WHERE id IN ('profile-images', 'choir-logos', 'song-audio', 'song-parts', 'song-documents', 'announcement-attachments');

-- Storage object policies for profile images
DROP POLICY IF EXISTS "Profile images public access" ON storage.objects;
CREATE POLICY "Profile images public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users upload profile images" ON storage.objects;
CREATE POLICY "Users upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

-- Storage object policies for choir logos
DROP POLICY IF EXISTS "Choir logos public access" ON storage.objects;
CREATE POLICY "Choir logos public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'choir-logos');

DROP POLICY IF EXISTS "Admins upload choir logos" ON storage.objects;
CREATE POLICY "Admins upload choir logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'choir-logos' AND auth.role() = 'authenticated');

-- Audio & Documents public read access policies for streaming and downloading
DROP POLICY IF EXISTS "Public read song audio" ON storage.objects;
CREATE POLICY "Public read song audio"
ON storage.objects FOR SELECT
USING (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments'));

DROP POLICY IF EXISTS "Authenticated users access song audio" ON storage.objects;
CREATE POLICY "Authenticated users access song audio"
ON storage.objects FOR SELECT
USING (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments'));

DROP POLICY IF EXISTS "Authenticated admins upload song files" ON storage.objects;
CREATE POLICY "Authenticated admins upload song files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments'));

DROP POLICY IF EXISTS "Authenticated admins update song files" ON storage.objects;
CREATE POLICY "Authenticated admins update song files"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments'));
