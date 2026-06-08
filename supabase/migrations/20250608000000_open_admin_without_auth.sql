-- Allow admin panel to work without Supabase Auth login (anon key)
-- Run in Supabase SQL Editor if writes fail from the admin panel

CREATE POLICY "Anon manage categories"
  ON public.categories FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon manage tags"
  ON public.tags FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon manage posts"
  ON public.posts FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon manage post_tags"
  ON public.post_tags FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon manage media_assets"
  ON public.media_assets FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon read profiles"
  ON public.profiles FOR SELECT TO anon
  USING (true);
