-- Add push_token column to user_notification_settings
ALTER TABLE user_notification_settings
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add column for tracking last notification sent (prevents duplicates)
ALTER TABLE user_notification_settings
ADD COLUMN IF NOT EXISTS last_morning_notification_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_evening_notification_at TIMESTAMPTZ;

-- Index for querying users with valid push tokens
CREATE INDEX IF NOT EXISTS idx_notification_settings_push_token
ON user_notification_settings(push_token)
WHERE push_token IS NOT NULL;

-- Composite index for morning reminder queries (timezone + time + enabled flags)
CREATE INDEX IF NOT EXISTS idx_notification_settings_morning_due
ON user_notification_settings(timezone, morning_time)
WHERE morning_enabled = true
  AND push_enabled = true
  AND push_token IS NOT NULL;

-- Composite index for evening reminder queries
CREATE INDEX IF NOT EXISTS idx_notification_settings_evening_due
ON user_notification_settings(timezone, evening_time)
WHERE evening_enabled = true
  AND push_enabled = true
  AND push_token IS NOT NULL;
