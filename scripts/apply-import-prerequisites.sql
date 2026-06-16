-- Run this in Supabase SQL Editor before npm run import:wordpress:pilot
-- Combines import prerequisites from migrations 20250608000000, 20250608120000, 20250608130000

-- RLS policies for anon admin/import (skip if already applied)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Anon manage categories'
  ) THEN
    CREATE POLICY "Anon manage categories"
      ON public.categories FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tags' AND policyname = 'Anon manage tags'
  ) THEN
    CREATE POLICY "Anon manage tags"
      ON public.tags FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'posts' AND policyname = 'Anon manage posts'
  ) THEN
    CREATE POLICY "Anon manage posts"
      ON public.posts FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_tags' AND policyname = 'Anon manage post_tags'
  ) THEN
    CREATE POLICY "Anon manage post_tags"
      ON public.post_tags FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_assets' AND policyname = 'Anon manage media_assets'
  ) THEN
    CREATE POLICY "Anon manage media_assets"
      ON public.media_assets FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT INSERT, UPDATE, DELETE ON public.categories TO anon;
GRANT INSERT, UPDATE, DELETE ON public.tags TO anon;
GRANT INSERT, UPDATE, DELETE ON public.posts TO anon;
GRANT INSERT, UPDATE, DELETE ON public.post_tags TO anon;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO anon;

ALTER TABLE posts ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE media_assets ALTER COLUMN uploaded_by DROP NOT NULL;

DROP POLICY IF EXISTS "Anon upload media images" ON storage.objects;
CREATE POLICY "Anon upload media images"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'media-images');
