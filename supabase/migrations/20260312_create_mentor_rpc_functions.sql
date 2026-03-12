-- US-004: Create rate limiting and vector search RPC functions

-- Rate limiting function: checks and increments daily mentor message count
-- Uses atomic UPDATE ... RETURNING to avoid race conditions
CREATE OR REPLACE FUNCTION public.check_and_increment_chat_usage(
  p_user_id UUID,
  p_daily_limit INT DEFAULT 20
)
RETURNS TABLE (allowed BOOLEAN, current_count INT, remaining INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Enforce caller identity
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'User ID mismatch: cannot check usage for another user';
  END IF;

  -- Upsert row for today if not exists
  INSERT INTO daily_metrics (id, user_id, date, mentor_messages)
  VALUES (gen_random_uuid(), p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Atomic increment if under limit, returning the new count
  UPDATE daily_metrics
  SET mentor_messages = mentor_messages + 1,
      updated_at = now()
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE
    AND mentor_messages < p_daily_limit
  RETURNING mentor_messages INTO v_count;

  -- If the UPDATE matched a row, we successfully incremented
  IF v_count IS NOT NULL THEN
    RETURN QUERY SELECT
      true::BOOLEAN AS allowed,
      v_count::INT AS current_count,
      (p_daily_limit - v_count)::INT AS remaining;
  ELSE
    -- Over limit — read current count for the response
    SELECT mentor_messages INTO v_count
    FROM daily_metrics
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    RETURN QUERY SELECT
      false::BOOLEAN AS allowed,
      v_count::INT AS current_count,
      0::INT AS remaining;
  END IF;
END;
$$;

-- Vector similarity search function
-- Always scoped to auth.uid() by default to prevent cross-user data access
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, content TEXT, metadata JSONB, similarity FLOAT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Default to authenticated user if no filter provided
  v_user_id := COALESCE(filter_user_id, auth.uid());

  RETURN QUERY
  SELECT
    de.id,
    de.content,
    de.metadata,
    (1 - (de.embedding <=> query_embedding))::FLOAT AS similarity
  FROM document_embeddings de
  WHERE de.user_id = v_user_id
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
