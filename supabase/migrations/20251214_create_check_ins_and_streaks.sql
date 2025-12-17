-- Create check_ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Type and timing
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('morning', 'evening', 'weekly', 'quarterly', 'mid_year', 'end_year')),
  check_in_date DATE NOT NULL,

  -- Input method (extensible for voice, SMS)
  input_method TEXT DEFAULT 'app' CHECK (input_method IN ('app', 'sms', 'voice')),

  -- Morning fields
  focus_area TEXT,
  daily_goal TEXT,

  -- Evening fields
  goal_completed TEXT CHECK (goal_completed IN ('yes', 'partially', 'no')),
  quick_win TEXT,
  blocker TEXT,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  tomorrow_carry TEXT,

  -- AI feedback (future)
  ai_feedback TEXT,
  ai_feedback_generated_at TIMESTAMPTZ,

  -- Metadata
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying user's check-ins by date
CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, check_in_date);
CREATE INDEX idx_check_ins_user_type ON check_ins(user_id, check_in_type);

-- Create user_streaks table
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in_date DATE,

  total_check_ins INTEGER DEFAULT 0,
  total_morning_check_ins INTEGER DEFAULT 0,
  total_evening_check_ins INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for check_ins
CREATE POLICY "Users can view their own check-ins"
  ON check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins"
  ON check_ins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins"
  ON check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks"
  ON user_streaks FOR DELETE
  USING (auth.uid() = user_id);
