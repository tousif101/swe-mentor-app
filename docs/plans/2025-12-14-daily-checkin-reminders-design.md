# Daily Check-in & Reminders Design

**Date:** 2025-12-14
**Status:** Approved

## Overview

Add daily check-in functionality with push notifications to establish a core habit loop for users. Morning intentions + evening reflections create accountability and closure.

## User Flow

### Onboarding (3 steps)
1. **Profile Setup** (existing) - name, role, target role
2. **Reminder Setup** (new) - morning/evening times, notification preferences
3. **Ready** (existing, modified) - confirm and start

### Daily Check-in Loop

#### Morning Check-in (default 9 AM)
- Push notification: "What's your focus for today?"
- Pick a focus area (tap from skills or yesterday's carry-over)
- "What would make today a win?" (free text)
- Optional: AI tip or quote aligned with goal

#### Evening Check-in (default 5 PM, user-selectable 5-7 PM)
- Push notification: "How did your day go?"
- **Adaptive flow:**
  1. Did you complete your goal? (Yes / Partially / No)
  2. Quick win or insight from today (free text)
  - **If "Partially" or "No":**
    3. What blocked you? (text or common blockers)
    4. Energy/mood rating (1-5 emoji tap)
  5. What's one thing to carry into tomorrow? (free text)

## Database Schema

### Table: `user_notification_settings`
Stores reminder preferences per user.

```sql
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

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
```

### Table: `check_ins`
Core check-in entries supporting multiple types and input methods.

```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

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
```

### Table: `user_streaks`
Gamification and engagement tracking.

```sql
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in_date DATE,

  total_check_ins INTEGER DEFAULT 0,
  total_morning_check_ins INTEGER DEFAULT 0,
  total_evening_check_ins INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `goals` (future)
For weekly/quarterly/yearly goal tracking.

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'quarterly', 'yearly')),
  title TEXT NOT NULL,
  description TEXT,

  start_date DATE,
  end_date DATE,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  completed_at TIMESTAMPTZ,

  source_check_in_id UUID REFERENCES check_ins(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Screen Components

### ReminderSetupScreen (new)
- Progress bar showing step 2 of 3
- "Set your reminders" header
- Morning check-in card:
  - Toggle on/off
  - Time picker (default 9 AM)
- Evening check-in card:
  - Toggle on/off
  - Time selector chips (5 PM, 6 PM, 7 PM)
- Weekly reflection toggle (saves preference for future)
- Continue button

### MorningCheckInScreen (new)
- Greeting based on time of day
- Focus area selector (chips from focus_areas or common options)
- "What would make today a win?" text input
- Optional AI tip card
- Submit button

### EveningCheckInScreen (new)
- "How did your day go?" header
- Goal completion selector (Yes / Partially / No)
- Quick win text input
- Conditional: blocker input + energy rating (if not "yes")
- Tomorrow carry-over input
- Submit button with streak celebration

## Navigation Updates

### OnboardingNavigator
```
Profile → ReminderSetup → Ready
```

### MainNavigator (bottom tabs)
```
Home | Journal | Mentor | More
      + floating search button
```

## Roadmap (Deferred)

1. **SMS Journaling** - Twilio integration, inbound SMS webhook
2. **Weekly Reflection** - Friday summary + goal setting
3. **Voice Input** - Speech-to-text for check-ins
4. **Quarterly/Yearly Reviews** - AI-generated summaries

## RLS Policies

All new tables need row-level security:
- Users can only read/write their own data
- Service role can access all for backend processing

## Success Metrics

- Onboarding completion rate
- Daily check-in completion rate (AM + PM)
- Streak length distribution
- 7-day retention after onboarding
