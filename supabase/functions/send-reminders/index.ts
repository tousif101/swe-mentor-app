// supabase/functions/send-reminders/index.ts
//
// TODO(security): Add rate limiting for manual POST triggers to prevent abuse
// TODO(observability): Add structured telemetry for notification success/failure metrics
// TODO(security): SQL injection risk - review SECURITY DEFINER functions in migrations
//   for proper input validation on user_ids array parameter
//
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const MAX_BATCH_SIZE = 100 // Expo limit per request
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000
// TODO(config): Consider making priority configurable per notification type
const NOTIFICATION_PRIORITY = 'high' as const

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
 * Send a batch of push notifications with retry logic
 */
async function sendBatchWithRetry(
  batch: ExpoPushMessage[],
  retryCount = 0
): Promise<ExpoPushTicket[]> {
  try {
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
      // Don't retry on 400 (bad request) - indicates malformed data
      if (response.status === 400) {
        console.error(`[send-reminders] Expo Push API bad request: ${response.status}`)
        return []
      }
      throw new Error(`Expo Push API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount)
      console.log(`[send-reminders] Retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return sendBatchWithRetry(batch, retryCount + 1)
    }
    console.error(`[send-reminders] Max retries exceeded:`, error)
    return []
  }
}

/**
 * Send push notifications to Expo Push Service
 * Handles batching for large numbers of recipients with retry logic
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
    const batchTickets = await sendBatchWithRetry(batch)
    tickets.push(...batchTickets)
  }

  return tickets
}

/**
 * Validate Expo push token format
 * Valid tokens start with ExponentPushToken[ or are in UUID format
 */
function isValidExpoPushToken(token: string | null | undefined): token is string {
  if (!token || typeof token !== 'string') {
    return false
  }
  // Expo tokens start with ExponentPushToken[ or are UUIDs for older format
  return token.startsWith('ExponentPushToken[') ||
         /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(token)
}

/**
 * Build notification message for a reminder type
 */
function buildNotificationMessage(
  pushToken: string,
  type: 'morning' | 'evening'
): ExpoPushMessage | null {
  // Validate token format before building message
  if (!isValidExpoPushToken(pushToken)) {
    console.warn(`[send-reminders] Invalid push token format: ${pushToken?.substring(0, 20)}...`)
    return null
  }
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
    priority: NOTIFICATION_PRIORITY,
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

    // Build notification messages (filter out invalid tokens)
    const messages: ExpoPushMessage[] = [
      ...morningReminders.map((r) => buildNotificationMessage(r.push_token, 'morning')),
      ...eveningReminders.map((r) => buildNotificationMessage(r.push_token, 'evening')),
    ].filter((msg): msg is ExpoPushMessage => msg !== null)

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
      const { error: markMorningError } = await supabase.rpc('mark_morning_notifications_sent', { user_ids: morningUserIds })
      if (markMorningError) {
        console.error('[send-reminders] Failed to mark morning notifications as sent:', markMorningError)
      }
    }

    if (eveningReminders.length > 0) {
      const eveningUserIds = eveningReminders.map((r) => r.user_id)
      const { error: markEveningError } = await supabase.rpc('mark_evening_notifications_sent', { user_ids: eveningUserIds })
      if (markEveningError) {
        console.error('[send-reminders] Failed to mark evening notifications as sent:', markEveningError)
      }
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
