-- Storage policies for media-images (avatars and article images)
-- Run in Supabase SQL Editor if avatar uploads fail or images do not load

DROP POLICY IF EXISTS "Public read media images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload media images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update media images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete media images" ON storage.objects;

CREATE POLICY "Public read media images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media-images');

CREATE POLICY "Authenticated upload media images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media-images');

CREATE POLICY "Authenticated update media images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media-images')
  WITH CHECK (bucket_id = 'media-images');

CREATE POLICY "Authenticated delete media images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media-images');
