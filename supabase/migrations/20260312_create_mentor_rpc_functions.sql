-- US-004: Create rate limiting and vector search RPC functions

-- Rate limiting function: checks and increments daily mentor message count
CREATE OR REPLACE FUNCTION public.check_and_increment_chat_usage(
  p_user_id UUID,
  p_daily_limit INT DEFAULT 20
)
RETURNS TABLE (allowed BOOLEAN, current_count INT, remaining INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Insert row for today if not exists
  INSERT INTO daily_metrics (id, user_id, date, mentor_messages)
  VALUES (gen_random_uuid(), p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Get current count
  SELECT mentor_messages INTO v_count
  FROM daily_metrics
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  -- Check if under limit
  IF v_count < p_daily_limit THEN
    -- Increment
    UPDATE daily_metrics
    SET mentor_messages = mentor_messages + 1
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    RETURN QUERY SELECT
      true::BOOLEAN AS allowed,
      (v_count + 1)::INT AS current_count,
      (p_daily_limit - v_count - 1)::INT AS remaining;
  ELSE
    RETURN QUERY SELECT
      false::BOOLEAN AS allowed,
      v_count::INT AS current_count,
      0::INT AS remaining;
  END IF;
END;
$$;

-- Vector similarity search function
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, content TEXT, metadata JSONB, similarity FLOAT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.content,
    de.metadata,
    (1 - (de.embedding <=> query_embedding))::FLOAT AS similarity
  FROM document_embeddings de
  WHERE
    CASE WHEN filter_user_id IS NOT NULL
      THEN de.user_id = filter_user_id
      ELSE true
    END
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
