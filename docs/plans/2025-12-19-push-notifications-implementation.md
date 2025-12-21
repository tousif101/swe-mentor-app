# Push Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable push notifications for daily check-in reminders using Expo Push, Supabase Edge Functions, and pg_cron.

**Architecture:** Mobile app registers push token on launch, stores in Supabase. pg_cron triggers Edge Function every 5 minutes. Edge Function queries users with due reminders and sends via Expo Push API.

**Tech Stack:** Expo Notifications, Supabase Edge Functions (Deno), pg_cron, TypeScript

**Design Doc:** `docs/plans/2025-12-19-push-notifications-design.md`

---

## Task 1: Database Migration - Add push_token Column

**Files:**
- Create: `supabase/migrations/20251219_add_push_token_column.sql`

**Step 1: Write the migration**

```sql
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
```

**Step 2: Apply migration locally**

```bash
cd /Users/tousif/Documents/projects/swe-mentor-app
supabase db push
```

Expected: Migration applies successfully, no errors.

**Step 3: Verify columns exist**

```bash
supabase db execute --sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_notification_settings' AND column_name IN ('push_token', 'last_morning_notification_at', 'last_evening_notification_at');"
```

Expected: Returns 3 rows with the new column names.

**Step 4: Commit**

```bash
git add supabase/migrations/20251219_add_push_token_column.sql
git commit -m "feat(db): add push_token and notification tracking columns"
```

---

## Task 2: Database Functions - Due Reminder Queries

**Files:**
- Create: `supabase/migrations/20251219_add_reminder_query_functions.sql`

**Step 1: Write the database functions**

These functions encapsulate the timezone-aware query logic for the Edge Function.

```sql
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
    AND (
      (CURRENT_TIME AT TIME ZONE uns.timezone) >= uns.morning_time
      AND (CURRENT_TIME AT TIME ZONE uns.timezone) < uns.morning_time + INTERVAL '5 minutes'
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
    AND (
      (CURRENT_TIME AT TIME ZONE uns.timezone) >= uns.evening_time
      AND (CURRENT_TIME AT TIME ZONE uns.timezone) < uns.evening_time + INTERVAL '5 minutes'
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
```

**Step 2: Apply migration**

```bash
supabase db push
```

Expected: Migration applies successfully.

**Step 3: Test the functions (should return empty for now)**

```bash
supabase db execute --sql "SELECT * FROM get_due_morning_reminders();"
```

Expected: Empty result (no users with push tokens yet).

**Step 4: Commit**

```bash
git add supabase/migrations/20251219_add_reminder_query_functions.sql
git commit -m "feat(db): add timezone-aware reminder query functions"
```

---

## Task 3: Create Edge Function - send-reminders

**Files:**
- Create: `supabase/functions/send-reminders/index.ts`

**Step 1: Initialize Edge Functions directory**

```bash
mkdir -p supabase/functions/send-reminders
```

**Step 2: Write the Edge Function**

```typescript
// supabase/functions/send-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const MAX_BATCH_SIZE = 100 // Expo limit per request

interface DueReminder {
  user_id: string
  push_token: string
}

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data: Record<string, unknown>
  sound: 'default' | null
  priority: 'default' | 'normal' | 'high'
}

interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error: string }
}

/**
 * Send push notifications to Expo Push Service
 * Handles batching for large numbers of recipients
 */
async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) {
    return []
  }

  const tickets: ExpoPushTicket[] = []

  // Batch messages (Expo accepts max 100 per request)
  for (let i = 0; i < messages.length; i += MAX_BATCH_SIZE) {
    const batch = messages.slice(i, i + MAX_BATCH_SIZE)

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    })

    if (!response.ok) {
      console.error(`Expo Push API error: ${response.status} ${response.statusText}`)
      continue
    }

    const result = await response.json()
    tickets.push(...(result.data || []))
  }

  return tickets
}

/**
 * Build notification message for a reminder type
 */
function buildNotificationMessage(
  pushToken: string,
  type: 'morning' | 'evening'
): ExpoPushMessage {
  const content = type === 'morning'
    ? {
        title: 'Morning Check-in',
        body: "What's your focus for today?",
        data: { type: 'morning_reminder', screen: 'MorningCheckIn' },
      }
    : {
        title: 'Evening Check-in',
        body: 'How did your day go?',
        data: { type: 'evening_reminder', screen: 'EveningCheckIn' },
      }

  return {
    to: pushToken,
    title: content.title,
    body: content.body,
    data: content.data,
    sound: 'default',
    priority: 'high',
  }
}

serve(async (req: Request) => {
  // Allow manual triggering via POST or cron via GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get users with due morning reminders
    const { data: morningUsers, error: morningError } = await supabase
      .rpc('get_due_morning_reminders')

    if (morningError) {
      console.error('Error fetching morning reminders:', morningError)
    }

    // Get users with due evening reminders
    const { data: eveningUsers, error: eveningError } = await supabase
      .rpc('get_due_evening_reminders')

    if (eveningError) {
      console.error('Error fetching evening reminders:', eveningError)
    }

    const morningReminders: DueReminder[] = morningUsers || []
    const eveningReminders: DueReminder[] = eveningUsers || []

    console.log(`Found ${morningReminders.length} morning, ${eveningReminders.length} evening reminders`)

    // Build notification messages
    const messages: ExpoPushMessage[] = [
      ...morningReminders.map((r) => buildNotificationMessage(r.push_token, 'morning')),
      ...eveningReminders.map((r) => buildNotificationMessage(r.push_token, 'evening')),
    ]

    if (messages.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        sent: { morning: 0, evening: 0 },
        message: 'No reminders due',
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Send notifications
    const tickets = await sendPushNotifications(messages)

    // Count successful sends
    const successCount = tickets.filter((t) => t.status === 'ok').length
    const errorCount = tickets.filter((t) => t.status === 'error').length

    if (errorCount > 0) {
      const errors = tickets.filter((t) => t.status === 'error')
      console.error('Push notification errors:', JSON.stringify(errors))
    }

    // Mark notifications as sent to prevent duplicates
    if (morningReminders.length > 0) {
      const morningUserIds = morningReminders.map((r) => r.user_id)
      await supabase.rpc('mark_morning_notifications_sent', { user_ids: morningUserIds })
    }

    if (eveningReminders.length > 0) {
      const eveningUserIds = eveningReminders.map((r) => r.user_id)
      await supabase.rpc('mark_evening_notifications_sent', { user_ids: eveningUserIds })
    }

    return new Response(JSON.stringify({
      success: true,
      sent: {
        morning: morningReminders.length,
        evening: eveningReminders.length,
      },
      tickets: {
        success: successCount,
        error: errorCount,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge Function error:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Step 3: Test locally**

```bash
# Start Edge Functions locally
supabase functions serve send-reminders --env-file .env.local

# In another terminal, trigger the function
curl -X POST http://localhost:54321/functions/v1/send-reminders \
  -H "Authorization: Bearer $(supabase auth print-access-token)" \
  -H "Content-Type: application/json"
```

Expected: Returns `{"success":true,"sent":{"morning":0,"evening":0},"message":"No reminders due"}`

**Step 4: Commit**

```bash
git add supabase/functions/send-reminders/index.ts
git commit -m "feat(functions): add send-reminders Edge Function"
```

---

## Task 4: Mobile Hook - usePushNotifications

**Files:**
- Create: `apps/mobile/src/hooks/usePushNotifications.ts`
- Modify: `apps/mobile/src/hooks/index.ts`

**Step 1: Add notification constants**

```typescript
// Add to apps/mobile/src/constants/index.ts

// Push notification configuration
export const PUSH_NOTIFICATION_CONFIG = {
  // Android notification channel
  channelId: 'swe-mentor-reminders',
  channelName: 'Check-in Reminders',
  channelDescription: 'Daily morning and evening check-in reminders',
} as const
```

**Step 2: Write the hook**

```typescript
// apps/mobile/src/hooks/usePushNotifications.ts
import { useEffect, useRef, useCallback } from 'react'
import { Platform, AppState, AppStateStatus } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { logger } from '../utils'
import { PUSH_NOTIFICATION_CONFIG } from '../constants'

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

type NotificationData = {
  type?: 'morning_reminder' | 'evening_reminder'
  screen?: 'MorningCheckIn' | 'EveningCheckIn'
}

type UsePushNotificationsOptions = {
  onNotificationTap?: (data: NotificationData) => void
}

type UsePushNotificationsReturn = {
  expoPushToken: string | null
  isRegistering: boolean
  error: Error | null
  requestPermission: () => Promise<boolean>
}

/**
 * Hook to manage push notification registration and handling.
 * Automatically registers for push notifications when user is authenticated.
 * Stores push token in Supabase for server-side notification sending.
 */
export function usePushNotifications(
  options: UsePushNotificationsOptions = {}
): UsePushNotificationsReturn {
  const { onNotificationTap } = options
  const { user } = useAuth()

  const expoPushTokenRef = useRef<string | null>(null)
  const isRegisteringRef = useRef(false)
  const errorRef = useRef<Error | null>(null)

  // Refs for subscription cleanup
  const notificationListenerRef = useRef<Notifications.Subscription | null>(null)
  const responseListenerRef = useRef<Notifications.Subscription | null>(null)

  /**
   * Register for push notifications and get Expo push token
   */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    // Only works on physical devices
    if (!Device.isDevice) {
      logger.warn('[usePushNotifications] Push notifications require a physical device')
      return null
    }

    try {
      // Check existing permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        logger.info('[usePushNotifications] Permission not granted')
        return null
      }

      // Get project ID from app config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId

      if (!projectId) {
        throw new Error('Missing Expo project ID in app.json')
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      })

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          PUSH_NOTIFICATION_CONFIG.channelId,
          {
            name: PUSH_NOTIFICATION_CONFIG.channelName,
            description: PUSH_NOTIFICATION_CONFIG.channelDescription,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#8B5CF6', // Primary purple
          }
        )
      }

      return tokenData.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to register for push notifications')
      logger.error('[usePushNotifications] Registration failed:', err)
      throw err
    }
  }, [])

  /**
   * Save push token to Supabase
   */
  const savePushToken = useCallback(async (token: string): Promise<void> => {
    if (!user?.id) {
      logger.warn('[usePushNotifications] Cannot save token: no user')
      return
    }

    const { error } = await supabase
      .from('user_notification_settings')
      .upsert(
        {
          user_id: user.id,
          push_token: token,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      logger.error('[usePushNotifications] Failed to save push token:', error)
      throw error
    }

    logger.info('[usePushNotifications] Push token saved successfully')
  }, [user?.id])

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData

      logger.info('[usePushNotifications] Notification tapped:', data)

      if (onNotificationTap && data) {
        onNotificationTap(data)
      }
    },
    [onNotificationTap]
  )

  /**
   * Public method to manually request permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const token = await registerForPushNotifications()
      if (token) {
        expoPushTokenRef.current = token
        await savePushToken(token)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [registerForPushNotifications, savePushToken])

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!user?.id) {
      return
    }

    let isMounted = true

    const register = async () => {
      if (isRegisteringRef.current) {
        return
      }

      isRegisteringRef.current = true
      errorRef.current = null

      try {
        const token = await registerForPushNotifications()

        if (!isMounted) return

        if (token) {
          expoPushTokenRef.current = token
          await savePushToken(token)
        }
      } catch (error) {
        if (isMounted) {
          errorRef.current = error instanceof Error ? error : new Error('Registration failed')
        }
      } finally {
        if (isMounted) {
          isRegisteringRef.current = false
        }
      }
    }

    register()

    return () => {
      isMounted = false
    }
  }, [user?.id, registerForPushNotifications, savePushToken])

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListenerRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        logger.info('[usePushNotifications] Notification received in foreground:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
        })
      }
    )

    // Listener for notification taps
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    )

    return () => {
      if (notificationListenerRef.current) {
        Notifications.removeNotificationSubscription(notificationListenerRef.current)
      }
      if (responseListenerRef.current) {
        Notifications.removeNotificationSubscription(responseListenerRef.current)
      }
    }
  }, [handleNotificationResponse])

  // Handle app state changes - refresh token when app becomes active
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user?.id && expoPushTokenRef.current) {
        // Token might have changed, re-register
        try {
          const token = await registerForPushNotifications()
          if (token && token !== expoPushTokenRef.current) {
            expoPushTokenRef.current = token
            await savePushToken(token)
          }
        } catch (error) {
          logger.error('[usePushNotifications] Token refresh failed:', error)
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [user?.id, registerForPushNotifications, savePushToken])

  return {
    expoPushToken: expoPushTokenRef.current,
    isRegistering: isRegisteringRef.current,
    error: errorRef.current,
    requestPermission,
  }
}
```

**Step 3: Export from barrel file**

```typescript
// apps/mobile/src/hooks/index.ts
export { useAuth } from './useAuth'
export { useProfile } from './useProfile'
export { useCheckInAutoSave } from './useCheckInAutoSave'
export { usePushNotifications } from './usePushNotifications'
```

**Step 4: Run type check**

```bash
cd /Users/tousif/Documents/projects/swe-mentor-app
npx tsc --noEmit
```

Expected: No type errors.

**Step 5: Commit**

```bash
git add apps/mobile/src/hooks/usePushNotifications.ts apps/mobile/src/hooks/index.ts apps/mobile/src/constants/index.ts
git commit -m "feat(mobile): add usePushNotifications hook for token registration"
```

---

## Task 5: Initialize Push Notifications in App

**Files:**
- Modify: `apps/mobile/src/navigation/RootNavigator.tsx`

**Step 1: Create notification navigation handler**

We need to handle notification taps and navigate to the correct screen. This requires access to navigation, so we'll add it in RootNavigatorContent where navigation context is available.

```typescript
// Modify apps/mobile/src/navigation/RootNavigator.tsx

// Add imports at top
import { useRef, useCallback } from 'react'
import { usePushNotifications } from '../hooks'
import type { NavigationContainerRef } from '@react-navigation/native'

// Add navigation ref type
type RootNavigationRef = NavigationContainerRef<ReactNavigation.RootParamList>

// Modify RootNavigatorContent to handle notifications
function RootNavigatorContent() {
  const { session } = useAuth()
  const { profile, isLoading: profileLoading } = useProfileContext()
  const navigationRef = useRef<RootNavigationRef>(null)

  // Handle notification taps - navigate to check-in screen
  const handleNotificationTap = useCallback((data: { screen?: string }) => {
    if (!navigationRef.current?.isReady()) {
      return
    }

    // Only navigate if user is authenticated and onboarded
    if (session && profile?.onboarding_completed) {
      if (data.screen === 'MorningCheckIn') {
        // Navigate to Home tab, then to MorningCheckIn
        navigationRef.current.navigate('HomeTab', {
          screen: 'MorningCheckIn',
        })
      } else if (data.screen === 'EveningCheckIn') {
        navigationRef.current.navigate('HomeTab', {
          screen: 'EveningCheckIn',
        })
      }
    }
  }, [session, profile?.onboarding_completed])

  // Initialize push notifications (only when authenticated)
  usePushNotifications({
    onNotificationTap: handleNotificationTap,
  })

  // ... rest of existing component
```

**Step 2: Update NavigationContainer to use ref**

```typescript
  return (
    <NavigationContainer ref={navigationRef}>
      {getNavigator()}
    </NavigationContainer>
  )
```

**Step 3: Add navigation types for type safety**

```typescript
// Add to apps/mobile/src/types/navigation.ts (create if doesn't exist)
import type { NavigatorScreenParams } from '@react-navigation/native'
import type { HomeStackParamList } from '../navigation/HomeStackNavigator'

// Extend the global ReactNavigation namespace
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      HomeTab: NavigatorScreenParams<HomeStackParamList>
      JournalTab: undefined
      InsightsTab: undefined
      ProfileTab: undefined
    }
  }
}
```

**Step 4: Run type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 5: Commit**

```bash
git add apps/mobile/src/navigation/RootNavigator.tsx apps/mobile/src/types/navigation.ts
git commit -m "feat(mobile): integrate push notifications with deep linking"
```

---

## Task 6: Update app.json with Notifications Plugin

**Files:**
- Modify: `apps/mobile/app.json`

**Step 1: Add expo-notifications plugin configuration**

```json
{
  "expo": {
    "name": "SWE Mentor",
    "slug": "swe-mentor-app",
    "owner": "tacattac",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#030712"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.tacattac.swementor",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#030712"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.tacattac.swementor",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "color": "#8B5CF6",
          "defaultChannel": "swe-mentor-reminders"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "07c00c46-12eb-4c3f-a5ce-4ea0df9cf10a"
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add apps/mobile/app.json
git commit -m "feat(mobile): configure expo-notifications plugin"
```

---

## Task 7: Build Development Client

**Files:** None (build step)

**Step 1: Clean and prebuild**

```bash
cd /Users/tousif/Documents/projects/swe-mentor-app/apps/mobile

# Clean previous builds
rm -rf ios android

# Generate native projects
npx expo prebuild
```

Expected: Creates `ios/` and `android/` directories.

**Step 2: Build and run on iOS simulator**

```bash
npx expo run:ios
```

Expected: App builds and launches in iOS Simulator (~3-5 minutes first time).

**Note:** Push notifications won't work in simulator. For full testing, run on physical device:

```bash
npx expo run:ios --device
```

**Step 3: Verify the app launches correctly**

- App should launch without crashes
- Auth flow should work
- Check-in screens should be accessible

---

## Task 8: Test Push Token Registration

**Files:** None (testing step)

**Step 1: Check that token is saved to database**

After logging in on a physical device, verify the push token was saved:

```bash
supabase db execute --sql "SELECT user_id, push_token, push_enabled FROM user_notification_settings WHERE push_token IS NOT NULL;"
```

Expected: Your user's row should have a push token starting with `ExponentPushToken[...]`.

**Step 2: Test Edge Function manually**

```bash
# Serve the function locally
supabase functions serve send-reminders

# In another terminal, trigger it
curl -X POST http://localhost:54321/functions/v1/send-reminders \
  -H "Authorization: Bearer $(cat .env.local | grep SUPABASE_ANON_KEY | cut -d'=' -f2)"
```

Expected: Returns JSON with sent counts.

**Step 3: Test with Expo Push Tool**

Use Expo's push notification testing tool:
1. Go to https://expo.dev/notifications
2. Enter your push token
3. Send a test notification
4. Verify it appears on device

---

## Task 9: Set Up pg_cron (Production)

**Files:**
- Create: `supabase/migrations/20251219_setup_pg_cron.sql`

**Note:** pg_cron requires the `pg_net` extension to call HTTP endpoints. This works in production Supabase but needs special setup locally.

**Step 1: Write the cron setup migration**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the reminder job every 5 minutes
-- Note: pg_net.http_post is used to call the Edge Function
SELECT cron.schedule(
  'send-reminders-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- View scheduled jobs
-- SELECT * FROM cron.job;

-- View job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To unschedule (if needed):
-- SELECT cron.unschedule('send-reminders-job');
```

**Step 2: For local testing, use a manual approach**

Since pg_cron + pg_net can be tricky locally, for development:
- Manually trigger: `curl http://localhost:54321/functions/v1/send-reminders`
- Or use a local cron: `*/5 * * * * curl http://localhost:54321/functions/v1/send-reminders`

**Step 3: Commit**

```bash
git add supabase/migrations/20251219_setup_pg_cron.sql
git commit -m "feat(db): add pg_cron job for scheduled reminders"
```

---

## Task 10: Update Types from Database

**Files:**
- Modify: `packages/shared/src/database.types.ts`

**Step 1: Regenerate database types**

```bash
supabase gen types typescript --local > packages/shared/src/database.types.ts
```

**Step 2: Verify new columns are in types**

Check that `user_notification_settings` includes:
- `push_token`
- `last_morning_notification_at`
- `last_evening_notification_at`

**Step 3: Commit**

```bash
git add packages/shared/src/database.types.ts
git commit -m "chore: regenerate database types with push notification columns"
```

---

## Task 11: Final Integration Test

**Step 1: Run the full flow**

1. Start local Supabase: `supabase start`
2. Start Edge Function: `supabase functions serve send-reminders`
3. Build and run app: `cd apps/mobile && npx expo run:ios --device`
4. Log in to the app
5. Check push token saved: `supabase db execute --sql "SELECT push_token FROM user_notification_settings WHERE user_id = 'your-user-id';"`
6. Set reminder time to current time (for testing)
7. Trigger Edge Function: `curl http://localhost:54321/functions/v1/send-reminders`
8. Verify notification appears on device
9. Tap notification → verify it opens correct check-in screen

**Step 2: Clean up test data if needed**

```bash
supabase db execute --sql "UPDATE user_notification_settings SET last_morning_notification_at = NULL, last_evening_notification_at = NULL;"
```

---

## Summary of Files Created/Modified

### Created
- `supabase/migrations/20251219_add_push_token_column.sql`
- `supabase/migrations/20251219_add_reminder_query_functions.sql`
- `supabase/migrations/20251219_setup_pg_cron.sql`
- `supabase/functions/send-reminders/index.ts`
- `apps/mobile/src/hooks/usePushNotifications.ts`
- `apps/mobile/src/types/navigation.ts`

### Modified
- `apps/mobile/src/hooks/index.ts` - export new hook
- `apps/mobile/src/constants/index.ts` - add notification config
- `apps/mobile/src/navigation/RootNavigator.tsx` - integrate push notifications
- `apps/mobile/app.json` - add notifications plugin
- `packages/shared/src/database.types.ts` - regenerate types

---

## Verification Checklist

- [ ] Database migration applied (push_token column exists)
- [ ] Database functions created (get_due_morning_reminders, etc.)
- [ ] Edge Function deployed and callable
- [ ] Mobile hook registers push token on login
- [ ] Push token saved to database
- [ ] Notification taps navigate to correct screen
- [ ] Dev build runs without crashes
- [ ] Test notification received on physical device
