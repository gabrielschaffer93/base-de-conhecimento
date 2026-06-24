-- Analytics tables for dashboard metrics: views, search, reading time, broken links

CREATE TABLE post_view_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_key TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_view_events_post_id ON post_view_events(post_id);
CREATE INDEX idx_post_view_events_viewed_at ON post_view_events(viewed_at DESC);
CREATE INDEX idx_post_view_events_post_visitor ON post_view_events(post_id, visitor_key, viewed_at DESC);

CREATE TABLE search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  results_count INT NOT NULL DEFAULT 0 CHECK (results_count >= 0),
  visitor_key TEXT NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_events_searched_at ON search_events(searched_at DESC);
CREATE INDEX idx_search_events_query ON search_events(lower(trim(query_text)));

CREATE TABLE post_reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_key TEXT NOT NULL,
  duration_seconds INT NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 7200),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_reading_sessions_post_id ON post_reading_sessions(post_id);
CREATE INDEX idx_post_reading_sessions_recorded_at ON post_reading_sessions(recorded_at DESC);

CREATE TABLE post_broken_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INT,
  is_broken BOOLEAN NOT NULL DEFAULT true,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, url)
);

CREATE INDEX idx_post_broken_links_post_id ON post_broken_links(post_id);
CREATE INDEX idx_post_broken_links_broken ON post_broken_links(is_broken) WHERE is_broken = true;

ALTER TABLE post_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_broken_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read post view events"
  ON post_view_events FOR SELECT
  USING (has_role(ARRAY['super_admin', 'editor', 'viewer']::user_role[]));

CREATE POLICY "Admins read search events"
  ON search_events FOR SELECT
  USING (has_role(ARRAY['super_admin', 'editor', 'viewer']::user_role[]));

CREATE POLICY "Admins read reading sessions"
  ON post_reading_sessions FOR SELECT
  USING (has_role(ARRAY['super_admin', 'editor', 'viewer']::user_role[]));

CREATE POLICY "Admins read broken links"
  ON post_broken_links FOR SELECT
  USING (has_role(ARRAY['super_admin', 'editor', 'viewer']::user_role[]));

CREATE POLICY "Admins manage broken links"
  ON post_broken_links FOR ALL
  USING (has_role(ARRAY['super_admin', 'editor']::user_role[]))
  WITH CHECK (has_role(ARRAY['super_admin', 'editor']::user_role[]));

CREATE OR REPLACE FUNCTION record_post_view(
  p_post_id UUID,
  p_visitor_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(trim(p_visitor_key)) < 8 THEN
    RAISE EXCEPTION 'INVALID_VISITOR_KEY';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM posts WHERE id = p_post_id AND status = 'published'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM post_view_events
    WHERE post_id = p_post_id
      AND visitor_key = p_visitor_key
      AND viewed_at > now() - interval '30 minutes'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO post_view_events (post_id, visitor_key)
  VALUES (p_post_id, p_visitor_key);
END;
$$;

CREATE OR REPLACE FUNCTION record_search_event(
  p_query_text TEXT,
  p_results_count INT,
  p_visitor_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query TEXT := lower(trim(p_query_text));
BEGIN
  IF length(trim(p_visitor_key)) < 8 THEN
    RAISE EXCEPTION 'INVALID_VISITOR_KEY';
  END IF;

  IF length(v_query) < 2 THEN
    RETURN;
  END IF;

  IF p_results_count < 0 THEN
    RAISE EXCEPTION 'INVALID_RESULTS_COUNT';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM search_events
    WHERE visitor_key = p_visitor_key
      AND lower(trim(query_text)) = v_query
      AND searched_at > now() - interval '5 minutes'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO search_events (query_text, results_count, visitor_key)
  VALUES (trim(p_query_text), p_results_count, p_visitor_key);
END;
$$;

CREATE OR REPLACE FUNCTION record_reading_session(
  p_post_id UUID,
  p_visitor_key TEXT,
  p_duration_seconds INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(trim(p_visitor_key)) < 8 THEN
    RAISE EXCEPTION 'INVALID_VISITOR_KEY';
  END IF;

  IF p_duration_seconds < 5 OR p_duration_seconds > 7200 THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM posts WHERE id = p_post_id AND status = 'published'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO post_reading_sessions (post_id, visitor_key, duration_seconds)
  VALUES (p_post_id, p_visitor_key, p_duration_seconds);
END;
$$;

CREATE OR REPLACE FUNCTION upsert_post_broken_link(
  p_post_id UUID,
  p_url TEXT,
  p_status_code INT DEFAULT NULL,
  p_is_broken BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(ARRAY['super_admin', 'editor']::user_role[]) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF length(trim(p_url)) < 4 THEN
    RAISE EXCEPTION 'INVALID_URL';
  END IF;

  INSERT INTO post_broken_links (post_id, url, status_code, is_broken, checked_at)
  VALUES (p_post_id, trim(p_url), p_status_code, p_is_broken, now())
  ON CONFLICT (post_id, url)
  DO UPDATE SET
    status_code = EXCLUDED.status_code,
    is_broken = EXCLUDED.is_broken,
    checked_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION record_post_view(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_search_event(TEXT, INT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_reading_session(UUID, TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_post_broken_link(UUID, TEXT, INT, BOOLEAN) TO authenticated;

GRANT SELECT ON public.post_view_events TO authenticated;
GRANT SELECT ON public.search_events TO authenticated;
GRANT SELECT ON public.post_reading_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_broken_links TO authenticated;
