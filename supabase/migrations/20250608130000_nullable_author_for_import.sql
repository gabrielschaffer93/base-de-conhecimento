-- Allow WordPress import without assigning author (user updates via SQL later)

ALTER TABLE posts ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE media_assets ALTER COLUMN uploaded_by DROP NOT NULL;

-- Table grants required for anon import script (RLA policies alone are not enough)
GRANT INSERT, UPDATE, DELETE ON public.categories TO anon;
GRANT INSERT, UPDATE, DELETE ON public.tags TO anon;
GRANT INSERT, UPDATE, DELETE ON public.posts TO anon;
GRANT INSERT, UPDATE, DELETE ON public.post_tags TO anon;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO anon;

DROP POLICY IF EXISTS "Anon upload media images" ON storage.objects;

CREATE POLICY "Anon upload media images"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'media-images');
