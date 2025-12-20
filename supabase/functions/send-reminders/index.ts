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
