-- Function to get users with due morning reminders
-- Returns users whose morning_time is within the current 5-minute window in their timezone
-- Excludes users who already received a notification today or completed morning check-in
CREATE OR REPLACE FUNCTION get_due_morning_reminders()
RETURNS TABLE (
  user_id UUID,
  push_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uns.user_id,
    uns.push_token
  FROM user_notification_settings uns
  WHERE
    uns.push_enabled = true
    AND uns.morning_enabled = true
    AND uns.push_token IS NOT NULL
    -- Current time in user's timezone is within 5 min of their morning_time
    -- Note: explicit ::time cast required to compare time with time zone to time without time zone
    AND (
      (CURRENT_TIME AT TIME ZONE uns.timezone)::time >= uns.morning_time
      AND (CURRENT_TIME AT TIME ZONE uns.timezone)::time < uns.morning_time + INTERVAL '5 minutes'
    )
    -- Haven't sent notification in the last 23 hours (prevents duplicate on DST changes)
    AND (
      uns.last_morning_notification_at IS NULL
      OR uns.last_morning_notification_at < NOW() - INTERVAL '23 hours'
    )
    -- Haven't already done morning check-in today (in user's timezone)
    AND NOT EXISTS (
      SELECT 1 FROM check_ins ci
      WHERE ci.user_id = uns.user_id
        AND ci.check_in_type = 'morning'
        AND ci.check_in_date = (CURRENT_DATE AT TIME ZONE uns.timezone)::date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users with due evening reminders
CREATE OR REPLACE FUNCTION get_due_evening_reminders()
RETURNS TABLE (
  user_id UUID,
  push_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uns.user_id,
    uns.push_token
  FROM user_notification_settings uns
  WHERE
    uns.push_enabled = true
    AND uns.evening_enabled = true
    AND uns.push_token IS NOT NULL
    -- Current time in user's timezone is within 5 min of their evening_time
    -- Note: explicit ::time cast required to compare time with time zone to time without time zone
    AND (
      (CURRENT_TIME AT TIME ZONE uns.timezone)::time >= uns.evening_time
      AND (CURRENT_TIME AT TIME ZONE uns.timezone)::time < uns.evening_time + INTERVAL '5 minutes'
    )
    -- Haven't sent notification in the last 23 hours
    AND (
      uns.last_evening_notification_at IS NULL
      OR uns.last_evening_notification_at < NOW() - INTERVAL '23 hours'
    )
    -- Haven't already done evening check-in today (in user's timezone)
    AND NOT EXISTS (
      SELECT 1 FROM check_ins ci
      WHERE ci.user_id = uns.user_id
        AND ci.check_in_type = 'evening'
        AND ci.check_in_date = (CURRENT_DATE AT TIME ZONE uns.timezone)::date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark morning notification as sent (batch update)
CREATE OR REPLACE FUNCTION mark_morning_notifications_sent(user_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE user_notification_settings
  SET last_morning_notification_at = NOW()
  WHERE user_id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark evening notification as sent (batch update)
CREATE OR REPLACE FUNCTION mark_evening_notifications_sent(user_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE user_notification_settings
  SET last_evening_notification_at = NOW()
  WHERE user_id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated and service_role
GRANT EXECUTE ON FUNCTION get_due_morning_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION get_due_evening_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION mark_morning_notifications_sent(UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION mark_evening_notifications_sent(UUID[]) TO service_role;
