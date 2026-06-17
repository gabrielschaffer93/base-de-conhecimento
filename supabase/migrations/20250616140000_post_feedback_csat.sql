ALTER TABLE post_feedback
  ADD COLUMN IF NOT EXISTS csat_score SMALLINT;

ALTER TABLE post_feedback
  ALTER COLUMN vote DROP NOT NULL;

ALTER TABLE post_feedback
  DROP CONSTRAINT IF EXISTS post_feedback_vote_check;

ALTER TABLE post_feedback
  ADD CONSTRAINT post_feedback_vote_check
  CHECK (vote IS NULL OR vote IN (-1, 1));

ALTER TABLE post_feedback
  DROP CONSTRAINT IF EXISTS post_feedback_csat_score_check;

ALTER TABLE post_feedback
  ADD CONSTRAINT post_feedback_csat_score_check
  CHECK (csat_score IS NULL OR (csat_score >= 0 AND csat_score <= 5));

DROP FUNCTION IF EXISTS get_post_feedback_summary(UUID);

CREATE OR REPLACE FUNCTION get_post_feedback_summary(p_post_id UUID)
RETURNS TABLE (
  likes_count INT,
  dislikes_count INT,
  avg_csat NUMERIC,
  csat_count INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE vote = 1)::int,
    COUNT(*) FILTER (WHERE vote = -1)::int,
    ROUND(AVG(csat_score)::numeric, 1),
    COUNT(*) FILTER (WHERE csat_score IS NOT NULL)::int
  FROM post_feedback
  WHERE post_id = p_post_id
    AND EXISTS (
      SELECT 1 FROM posts WHERE posts.id = p_post_id AND posts.status = 'published'
    );
$$;

DROP FUNCTION IF EXISTS submit_post_feedback(UUID, SMALLINT, TEXT);
DROP FUNCTION IF EXISTS submit_post_feedback(UUID, SMALLINT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION submit_post_feedback(
  p_post_id UUID,
  p_visitor_key TEXT,
  p_vote SMALLINT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_csat_score SMALLINT DEFAULT NULL
)
RETURNS TABLE (
  likes_count INT,
  dislikes_count INT,
  avg_csat NUMERIC,
  csat_count INT,
  user_vote SMALLINT,
  user_csat SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes INT;
  v_dislikes INT;
  v_avg_csat NUMERIC;
  v_csat_count INT;
  v_comment TEXT;
  v_vote SMALLINT;
  v_csat SMALLINT;
BEGIN
  IF p_vote IS NOT NULL AND p_vote NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'INVALID_VOTE';
  END IF;

  IF p_csat_score IS NOT NULL AND (p_csat_score < 0 OR p_csat_score > 5) THEN
    RAISE EXCEPTION 'INVALID_CSAT';
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

  IF p_vote IS NULL AND p_csat_score IS NULL AND v_comment IS NULL THEN
    RAISE EXCEPTION 'EMPTY_FEEDBACK';
  END IF;

  INSERT INTO post_feedback (post_id, visitor_key, vote, comment, csat_score)
  VALUES (p_post_id, p_visitor_key, p_vote, v_comment, p_csat_score)
  ON CONFLICT (post_id, visitor_key)
  DO UPDATE SET
    vote = COALESCE(EXCLUDED.vote, post_feedback.vote),
    comment = COALESCE(EXCLUDED.comment, post_feedback.comment),
    csat_score = COALESCE(EXCLUDED.csat_score, post_feedback.csat_score),
    updated_at = now();

  SELECT vote, csat_score
  INTO v_vote, v_csat
  FROM post_feedback
  WHERE post_id = p_post_id AND visitor_key = p_visitor_key;

  SELECT
    COUNT(*) FILTER (WHERE vote = 1),
    COUNT(*) FILTER (WHERE vote = -1),
    ROUND(AVG(csat_score)::numeric, 1),
    COUNT(*) FILTER (WHERE csat_score IS NOT NULL)
  INTO v_likes, v_dislikes, v_avg_csat, v_csat_count
  FROM post_feedback
  WHERE post_id = p_post_id;

  RETURN QUERY SELECT v_likes, v_dislikes, v_avg_csat, v_csat_count, v_vote, v_csat;
END;
$$;

GRANT EXECUTE ON FUNCTION get_post_feedback_summary(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_post_feedback(UUID, TEXT, SMALLINT, TEXT, SMALLINT) TO anon, authenticated;
