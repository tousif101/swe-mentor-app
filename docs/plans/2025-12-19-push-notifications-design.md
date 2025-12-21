# Push Notifications Design

**Date:** 2025-12-19
**Status:** Draft

## Overview

Implement push notifications for daily check-in reminders using Expo Push Notifications, Supabase Edge Functions, and pg_cron scheduling.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Notification channel | Expo Push (not SMS) | Free, native experience, dev build needed anyway |
| Backend scheduler | Supabase Edge Function + pg_cron | Stays in Supabase ecosystem, direct DB access |
| Scheduling granularity | Every 5 minutes | Good balance of accuracy vs cost |
| Build approach | Local builds (Xcode) | Faster iteration, user has Xcode installed |
| Notification copy | Simple/professional | Matches existing design |

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ App Launch      │───▶│ Get Push Token  │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│                                  ▼                               │
│                         ┌─────────────────┐                     │
│                         │ Store in Supabase│                    │
│                         │ (push_token col) │                    │
│                         └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ pg_cron         │───▶│ Edge Function   │                     │
│  │ (every 5 min)   │    │ send-reminders  │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│                                  ▼                               │
│                         ┌─────────────────┐                     │
│                         │ Query users     │                     │
│                         │ with due times  │                     │
│                         └────────┬────────┘                     │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPO PUSH SERVICE                           │
│                  https://exp.host/--/api/v2/push/send           │
└─────────────────────────────────────────────────────────────────┘
```

### Local Development Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR MACHINE                                  │
│                                                                  │
│  ┌──────────────┐     ┌──────────────────────────────────────┐  │
│  │ Mobile App   │────▶│ Local Supabase (Docker)              │  │
│  │ (Simulator)  │     │                                      │  │
│  └──────────────┘     │  • Postgres + pg_cron  :54322        │  │
│                       │  • Edge Functions      :54321        │  │
│  ┌──────────────┐     │  • Auth, Storage, etc                │  │
│  │ Edge Function│────▶│                                      │  │
│  │ (local serve)│     └──────────────────────────────────────┘  │
│  └──────────────┘                    │                          │
│         │                            │                          │
│         ▼                            ▼                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Expo Push Service (external)                      ││
│  │           https://exp.host/--/api/v2/push/send             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Commands:**
```bash
# Run Edge Function locally
supabase functions serve send-reminders

# Trigger manually (for testing)
curl -X POST http://localhost:54321/functions/v1/send-reminders

# Build dev client (first time only)
npx expo prebuild
npx expo run:ios

# Daily development (hot reload)
npx expo start --dev-client
```

## Database Changes

### Migration: Add push_token column

```sql
-- Add push_token to user_notification_settings
ALTER TABLE user_notification_settings
ADD COLUMN push_token TEXT;

-- Index for querying users with tokens
CREATE INDEX idx_user_notification_settings_push_token
ON user_notification_settings(push_token)
WHERE push_token IS NOT NULL;

-- Index for time-based queries (timezone + time)
CREATE INDEX idx_user_notification_settings_morning
ON user_notification_settings(timezone, morning_time)
WHERE morning_enabled = true AND push_enabled = true AND push_token IS NOT NULL;

CREATE INDEX idx_user_notification_settings_evening
ON user_notification_settings(timezone, evening_time)
WHERE evening_enabled = true AND push_enabled = true AND push_token IS NOT NULL;
```

### Query: Find users with due notifications

```sql
-- Find users whose morning reminder is due (within 5-min window)
SELECT
  push_token,
  timezone,
  morning_time
FROM user_notification_settings
WHERE
  push_enabled = true
  AND morning_enabled = true
  AND push_token IS NOT NULL
  -- Current time in user's timezone matches their morning_time (within 5 min)
  AND (
    (CURRENT_TIME AT TIME ZONE timezone) >= morning_time
    AND (CURRENT_TIME AT TIME ZONE timezone) < morning_time + INTERVAL '5 minutes'
  )
  -- Haven't already done morning check-in today
  AND NOT EXISTS (
    SELECT 1 FROM check_ins
    WHERE check_ins.user_id = user_notification_settings.user_id
    AND check_ins.check_in_type = 'morning'
    AND check_ins.check_in_date = CURRENT_DATE
  );
```

## Edge Function: send-reminders

### File: `supabase/functions/send-reminders/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface NotificationUser {
  push_token: string
  reminder_type: 'morning' | 'evening'
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get users with due morning reminders
    const { data: morningUsers, error: morningError } = await supabase
      .rpc('get_due_morning_reminders')

    // Get users with due evening reminders
    const { data: eveningUsers, error: eveningError } = await supabase
      .rpc('get_due_evening_reminders')

    if (morningError || eveningError) {
      throw new Error(`Query error: ${morningError?.message || eveningError?.message}`)
    }

    const notifications = [
      ...(morningUsers || []).map((u: NotificationUser) => ({
        to: u.push_token,
        title: 'Morning Check-in',
        body: "What's your focus for today?",
        data: { type: 'morning_reminder' },
      })),
      ...(eveningUsers || []).map((u: NotificationUser) => ({
        to: u.push_token,
        title: 'Evening Check-in',
        body: 'How did your day go?',
        data: { type: 'evening_reminder' },
      })),
    ]

    if (notifications.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Send to Expo Push Service (batch of up to 100)
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notifications),
    })

    const result = await response.json()

    return new Response(JSON.stringify({
      sent: notifications.length,
      result
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

## pg_cron Setup

### Enable extension and schedule job

```sql
-- Enable pg_cron extension (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the reminder job every 5 minutes
SELECT cron.schedule(
  'send-reminders',           -- job name
  '*/5 * * * *',              -- every 5 minutes
  $$
  SELECT net.http_post(
    url := 'http://supabase_kong_swe-mentor-app:8000/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Mobile App Changes

### 1. Register for push notifications on app launch

**File:** `apps/mobile/src/hooks/usePushNotifications.ts`

```typescript
import { useEffect, useRef, useState } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { logger } from '../utils'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function usePushNotifications() {
  const { user } = useAuth()
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const notificationListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    if (!user?.id) return

    registerForPushNotifications()
      .then(token => {
        if (token) {
          setExpoPushToken(token)
          savePushToken(token)
        }
      })
      .catch(err => logger.error('Failed to register for push notifications:', err))

    // Listen for incoming notifications (app in foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        logger.info('Notification received:', notification)
      }
    )

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data
        handleNotificationTap(data)
      }
    )

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [user?.id])

  const savePushToken = async (token: string) => {
    if (!user?.id) return

    const { error } = await supabase
      .from('user_notification_settings')
      .upsert(
        { user_id: user.id, push_token: token },
        { onConflict: 'user_id' }
      )

    if (error) {
      logger.error('Failed to save push token:', error)
    }
  }

  const handleNotificationTap = (data: Record<string, unknown>) => {
    // Navigate based on notification type
    if (data.type === 'morning_reminder') {
      // Navigate to morning check-in
    } else if (data.type === 'evening_reminder') {
      // Navigate to evening check-in
    }
  }

  return { expoPushToken }
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    logger.warn('Push notifications require a physical device')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    logger.warn('Push notification permission not granted')
    return null
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id', // From app.json
  })

  // Android requires notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  return tokenData.data
}
```

### 2. Initialize hook in App.tsx

```typescript
// In App.tsx or a top-level component
import { usePushNotifications } from './src/hooks/usePushNotifications'

function AppContent() {
  usePushNotifications() // Register on app launch

  return <RootNavigator />
}
```

### 3. Update app.json for push notifications

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#8B5CF6"
        }
      ]
    ],
    "ios": {
      "bundleIdentifier": "com.yourcompany.swementor"
    },
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.yourcompany.swementor"
    }
  }
}
```

## Notification Messages

| Type | Title | Body |
|------|-------|------|
| Morning reminder | "Morning Check-in" | "What's your focus for today?" |
| Evening reminder | "Evening Check-in" | "How did your day go?" |
| Streak warning (future) | "Don't break your streak!" | "You're on a X-day streak!" |

## Testing Locally

### 1. Start local Supabase (already running)
```bash
supabase start
```

### 2. Apply migration
```bash
supabase db push
```

### 3. Build dev client (first time)
```bash
npx expo prebuild
npx expo run:ios
```

### 4. Run Edge Function locally
```bash
supabase functions serve send-reminders --env-file .env.local
```

### 5. Test manually
```bash
# Trigger the function
curl -X POST http://localhost:54321/functions/v1/send-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 6. Test with Expo push tool
For quick testing without the full backend:
```bash
# Use Expo's push notification tool
# https://expo.dev/notifications
```

## Comparison: Cron vs Event-Driven

| Approach | How it works | Best for |
|----------|--------------|----------|
| **Cron/Polling** | Check every X minutes for due notifications | Scheduled reminders (our use case) |
| **Message Queue (Kafka, SQS)** | Event triggers notification immediately | "Someone liked your post" |
| **Dedicated Scheduler (Temporal)** | Per-user scheduled jobs | Complex workflows |

**Why Cron is right here:**
- Notifications are time-based, not event-based
- Batch efficiency (all 9 AM users checked together)
- Simple to implement and debug

**Future hybrid approach:**
```
Scheduled reminders → Cron (this design)
Social notifications → Supabase Realtime + Edge Function
```

## Rollout Plan

### Phase 1: Infrastructure
- [ ] Add `push_token` column migration
- [ ] Create database functions for due reminders query
- [ ] Create Edge Function `send-reminders`
- [ ] Set up pg_cron job

### Phase 2: Mobile App
- [ ] Create `usePushNotifications` hook
- [ ] Update app.json with expo-notifications plugin
- [ ] Initialize hook in App.tsx
- [ ] Handle notification taps (deep linking)

### Phase 3: Testing
- [ ] Build dev client with `npx expo run:ios`
- [ ] Test token registration
- [ ] Test manual Edge Function trigger
- [ ] Test pg_cron scheduling

### Phase 4: Polish
- [ ] Add streak warning notifications
- [ ] Handle token refresh
- [ ] Add notification preferences in settings
- [ ] Analytics/logging for notification delivery

## Resolved Questions

1. **Project ID:** `07c00c46-12eb-4c3f-a5ce-4ea0df9cf10a` (`@tacattac/swe-mentor-app`)
2. **Deep linking:** Direct to check-in screen (morning notification → MorningCheckInScreen)

## Remaining Items

1. **Notification icon:** Need to create `notification-icon.png` (96x96, white on transparent) - can defer

---

## Related Documents

- [Daily Check-in Reminders Design](./2025-12-14-daily-checkin-reminders-design.md)
- [Roadmap](../ROADMAP.md)
