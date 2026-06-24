ALTER TABLE post_feedback
  ADD COLUMN IF NOT EXISTS comment TEXT;

GRANT SELECT ON public.post_feedback TO authenticated;

DROP FUNCTION IF EXISTS submit_post_feedback(UUID, SMALLINT, TEXT);

CREATE OR REPLACE FUNCTION submit_post_feedback(
  p_post_id UUID,
  p_vote SMALLINT,
  p_visitor_key TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS TABLE (likes_count INT, dislikes_count INT, user_vote SMALLINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes INT;
  v_dislikes INT;
  v_comment TEXT;
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

  v_comment := NULLIF(trim(p_comment), '');

  IF v_comment IS NOT NULL AND length(v_comment) > 1000 THEN
    RAISE EXCEPTION 'COMMENT_TOO_LONG';
  END IF;

  INSERT INTO post_feedback (post_id, visitor_key, vote, comment)
  VALUES (p_post_id, p_visitor_key, p_vote, v_comment)
  ON CONFLICT (post_id, visitor_key)
  DO UPDATE SET
    vote = EXCLUDED.vote,
    comment = COALESCE(EXCLUDED.comment, post_feedback.comment),
    updated_at = now();

  SELECT
    COUNT(*) FILTER (WHERE vote = 1),
    COUNT(*) FILTER (WHERE vote = -1)
  INTO v_likes, v_dislikes
  FROM post_feedback
  WHERE post_id = p_post_id;

  RETURN QUERY SELECT v_likes, v_dislikes, p_vote;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_post_feedback(UUID, SMALLINT, TEXT, TEXT) TO anon, authenticated;
