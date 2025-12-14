-- Create user_notification_settings table
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Morning check-in
  morning_enabled BOOLEAN DEFAULT true,
  morning_time TIME DEFAULT '09:00',

  -- Evening check-in
  evening_enabled BOOLEAN DEFAULT true,
  evening_time TIME DEFAULT '17:00',

  -- Weekly reflection (save preference for future)
  weekly_enabled BOOLEAN DEFAULT false,
  weekly_day TEXT DEFAULT 'friday',
  weekly_time TIME DEFAULT '14:00',

  -- Notification channels
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  phone_number TEXT,

  -- Timezone
  timezone TEXT DEFAULT 'America/New_York',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read their own notification settings
CREATE POLICY "Users can view their own notification settings"
  ON user_notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notification settings
CREATE POLICY "Users can insert their own notification settings"
  ON user_notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification settings
CREATE POLICY "Users can update their own notification settings"
  ON user_notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notification settings
CREATE POLICY "Users can delete their own notification settings"
  ON user_notification_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_notification_settings_user_id ON user_notification_settings(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_notification_settings_updated_at
  BEFORE UPDATE ON user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
