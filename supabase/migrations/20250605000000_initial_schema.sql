-- Base de Conhecimento Loft - Initial schema
-- Run via Supabase CLI or SQL Editor

-- Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'editor', 'viewer');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE media_type AS ENUM ('image', 'video', 'document');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'editor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  status post_status NOT NULL DEFAULT 'draft',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  featured_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post tags (N:N)
CREATE TABLE post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Media assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  type media_type NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_media_assets_type ON media_assets(type);
CREATE INDEX idx_media_assets_uploaded_by ON media_assets(uploaded_by);

-- Full-text search
CREATE INDEX idx_posts_search ON posts USING gin(
  to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'editor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table grants (required alongside RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.post_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.post_tags TO authenticated;
GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Helper: check if user has role
CREATE OR REPLACE FUNCTION has_role(required_roles user_role[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role = ANY(required_roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Super admins manage profiles"
  ON profiles FOR ALL TO authenticated
  USING (has_role(ARRAY['super_admin']::user_role[]))
  WITH CHECK (has_role(ARRAY['super_admin']::user_role[]));

-- Categories: public read, editors write
CREATE POLICY "Categories are public readable"
  ON categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Editors manage categories"
  ON categories FOR ALL TO authenticated
  USING (has_role(ARRAY['super_admin', 'editor']::user_role[]))
  WITH CHECK (has_role(ARRAY['super_admin', 'editor']::user_role[]));

-- Tags: public read, editors write
CREATE POLICY "Tags are public readable"
  ON tags FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Editors manage tags"
  ON tags FOR ALL TO authenticated
  USING (has_role(ARRAY['super_admin', 'editor']::user_role[]))
  WITH CHECK (has_role(ARRAY['super_admin', 'editor']::user_role[]));

-- Posts policies
CREATE POLICY "Published posts are public"
  ON posts FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Authenticated users see all posts"
  ON posts FOR SELECT TO authenticated
  USING (has_role(ARRAY['super_admin', 'editor', 'viewer']::user_role[]));

CREATE POLICY "Editors manage posts"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (has_role(ARRAY['super_admin', 'editor']::user_role[]));

CREATE POLICY "Editors update posts"
  ON posts FOR UPDATE TO authenticated
  USING (has_role(ARRAY['super_admin', 'editor']::user_role[]))
  WITH CHECK (has_role(ARRAY['super_admin', 'editor']::user_role[]));

CREATE POLICY "Editors delete posts"
  ON posts FOR DELETE TO authenticated
  USING (has_role(ARRAY['super_admin', 'editor']::user_role[]));

-- Post tags policies
CREATE POLICY "Post tags public for published posts"
  ON post_tags FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id
        AND (posts.status = 'published' OR has_role(ARRAY['super_admin', 'editor', 'viewer']::user_role[]))
    )
  );

CREATE POLICY "Editors manage post tags"
  ON post_tags FOR ALL TO authenticated
  USING (has_role(ARRAY['super_admin', 'editor']::user_role[]))
  WITH CHECK (has_role(ARRAY['super_admin', 'editor']::user_role[]));

-- Media policies
CREATE POLICY "Media assets are public readable"
  ON media_assets FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Editors manage media"
  ON media_assets FOR ALL TO authenticated
  USING (has_role(ARRAY['super_admin', 'editor']::user_role[]))
  WITH CHECK (has_role(ARRAY['super_admin', 'editor']::user_role[]));

-- Storage buckets (run in Storage settings or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media-images', 'media-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media-videos', 'media-videos', true);
