-- Storage Buckets Setup
-- Run this in Supabase SQL Editor AFTER running schema.sql

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('images', 'images', true),
  ('videos', 'videos', true),
  ('audio', 'audio', true),
  ('ply-files', 'ply-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies - allow public read and authenticated upload
-- For development, we allow all operations

-- Images bucket policies
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;
CREATE POLICY "Public read access for images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Allow uploads to images" ON storage.objects;
CREATE POLICY "Allow uploads to images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Allow updates to images" ON storage.objects;
CREATE POLICY "Allow updates to images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Allow deletes from images" ON storage.objects;
CREATE POLICY "Allow deletes from images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');

-- Videos bucket policies
DROP POLICY IF EXISTS "Public read access for videos" ON storage.objects;
CREATE POLICY "Public read access for videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Allow uploads to videos" ON storage.objects;
CREATE POLICY "Allow uploads to videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos');

DROP POLICY IF EXISTS "Allow updates to videos" ON storage.objects;
CREATE POLICY "Allow updates to videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Allow deletes from videos" ON storage.objects;
CREATE POLICY "Allow deletes from videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos');

-- Audio bucket policies
DROP POLICY IF EXISTS "Public read access for audio" ON storage.objects;
CREATE POLICY "Public read access for audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio');

DROP POLICY IF EXISTS "Allow uploads to audio" ON storage.objects;
CREATE POLICY "Allow uploads to audio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'audio');

DROP POLICY IF EXISTS "Allow updates to audio" ON storage.objects;
CREATE POLICY "Allow updates to audio" ON storage.objects
  FOR UPDATE USING (bucket_id = 'audio');

DROP POLICY IF EXISTS "Allow deletes from audio" ON storage.objects;
CREATE POLICY "Allow deletes from audio" ON storage.objects
  FOR DELETE USING (bucket_id = 'audio');

-- PLY files bucket policies
DROP POLICY IF EXISTS "Public read access for ply-files" ON storage.objects;
CREATE POLICY "Public read access for ply-files" ON storage.objects
  FOR SELECT USING (bucket_id = 'ply-files');

DROP POLICY IF EXISTS "Allow uploads to ply-files" ON storage.objects;
CREATE POLICY "Allow uploads to ply-files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ply-files');

DROP POLICY IF EXISTS "Allow updates to ply-files" ON storage.objects;
CREATE POLICY "Allow updates to ply-files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'ply-files');

DROP POLICY IF EXISTS "Allow deletes from ply-files" ON storage.objects;
CREATE POLICY "Allow deletes from ply-files" ON storage.objects
  FOR DELETE USING (bucket_id = 'ply-files');

SELECT 'Storage buckets created successfully!' as status;
