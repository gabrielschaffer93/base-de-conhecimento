CREATE TABLE post_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_key TEXT NOT NULL,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_key)
);

CREATE INDEX idx_post_feedback_post_id ON post_feedback(post_id);

CREATE TRIGGER post_feedback_updated_at
  BEFORE UPDATE ON post_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE post_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read post feedback"
  ON post_feedback FOR SELECT
  USING (has_role(ARRAY['super_admin', 'editor', 'viewer']::user_role[]));

CREATE OR REPLACE FUNCTION get_post_feedback_summary(p_post_id UUID)
RETURNS TABLE (likes_count INT, dislikes_count INT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE vote = 1)::int,
    COUNT(*) FILTER (WHERE vote = -1)::int
  FROM post_feedback
  WHERE post_id = p_post_id
    AND EXISTS (
      SELECT 1 FROM posts WHERE posts.id = p_post_id AND posts.status = 'published'
    );
$$;

CREATE OR REPLACE FUNCTION submit_post_feedback(
  p_post_id UUID,
  p_vote SMALLINT,
  p_visitor_key TEXT
)
RETURNS TABLE (likes_count INT, dislikes_count INT, user_vote SMALLINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes INT;
  v_dislikes INT;
BEGIN
  IF p_vote NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'INVALID_VOTE';
  END IF;

  IF length(trim(p_visitor_key)) < 8 THEN
    RAISE EXCEPTION 'INVALID_VISITOR_KEY';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM posts WHERE id = p_post_id AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'POST_NOT_FOUND';
  END IF;

  INSERT INTO post_feedback (post_id, visitor_key, vote)
  VALUES (p_post_id, p_visitor_key, p_vote)
  ON CONFLICT (post_id, visitor_key)
  DO UPDATE SET vote = EXCLUDED.vote, updated_at = now();

  SELECT
    COUNT(*) FILTER (WHERE vote = 1),
    COUNT(*) FILTER (WHERE vote = -1)
  INTO v_likes, v_dislikes
  FROM post_feedback
  WHERE post_id = p_post_id;

  RETURN QUERY SELECT v_likes, v_dislikes, p_vote;
END;
$$;

GRANT EXECUTE ON FUNCTION get_post_feedback_summary(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_post_feedback(UUID, SMALLINT, TEXT) TO anon, authenticated;
