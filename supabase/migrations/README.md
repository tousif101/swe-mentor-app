# Database Migrations

## Applying Migrations

To apply the migrations to your local Supabase database:

```bash
# Option 1: Using psql directly
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f migrations/20251214_create_user_notification_settings.sql

# Option 2: Using Supabase CLI (if configured)
supabase db push
```

## Available Migrations

- `20251214_create_user_notification_settings.sql` - Creates the user_notification_settings table for reminder preferences
- `20251214_create_check_ins_and_streaks.sql` - Creates check_ins and streaks tables
- `20251219_add_check_ins_draft_unique_constraint.sql` - Adds unique constraint for draft check-ins
- `20251219_add_push_token_column.sql` - Adds push_token and notification tracking columns
- `20251219_add_reminder_query_functions.sql` - Adds timezone-aware reminder query functions
- `20251219_setup_pg_cron.sql` - Sets up pg_cron job for scheduled reminders (production only)

---

# Push Notifications - Production Deployment Guide

## Overview

Push notifications use:
- **Expo Push API** - Sends notifications to iOS/Android devices
- **Supabase Edge Functions** - Serverless function that queries due reminders and sends via Expo
- **pg_cron + pg_net** - Scheduled job that triggers the Edge Function every 5 minutes

## Prerequisites

1. Supabase Pro plan (pg_cron requires Pro)
2. Expo project with push notifications configured
3. Edge Function deployed to Supabase

---

## Step 1: Deploy Edge Function

```bash
# From project root
cd /Users/tousif/Documents/projects/swe-mentor-app

# Login to Supabase CLI
supabase login

# Link to your project (get project ref from Supabase dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the Edge Function
supabase functions deploy send-reminders --no-verify-jwt
```

**Verify deployment:**
```bash
# Get your project URL from dashboard
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders \
  -H "Content-Type: application/json"
```

Expected: `{"success":true,"sent":{"morning":0,"evening":0},"message":"No reminders due"}`

---

## Step 2: Apply Database Migrations

```bash
# Push all migrations to production
supabase db push
```

This applies:
- `push_token` column to `user_notification_settings`
- `last_morning_notification_at` / `last_evening_notification_at` columns
- `get_due_morning_reminders()` and `get_due_evening_reminders()` functions
- `mark_morning_notifications_sent()` and `mark_evening_notifications_sent()` functions

---

## Step 3: Enable pg_cron Extension

1. Go to **Supabase Dashboard** → **Database** → **Extensions**
2. Search for `pg_cron` and enable it
3. Search for `pg_net` and enable it (required for HTTP calls from pg_cron)

Or via SQL:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## Step 4: Set Up pg_cron Job

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to **Supabase Dashboard** → **Database** → **Cron Jobs** (under Extensions)
2. Click **Create a new cron job**
3. Configure:
   - **Name:** `send-reminders-job`
   - **Schedule:** `*/5 * * * *` (every 5 minutes)
   - **Command:** See SQL below

**Option B: Via SQL Editor**

```sql
-- First, store your project URL and service role key as database settings
-- Go to Dashboard → Settings → Database → Connection info

-- Schedule the job
SELECT cron.schedule(
  'send-reminders-job',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**IMPORTANT:** Replace:
- `YOUR_PROJECT_REF` - Your Supabase project reference (e.g., `abcdefghijk`)
- `YOUR_SERVICE_ROLE_KEY` - Your service role key from Dashboard → Settings → API

---

## Step 5: Verify pg_cron is Working

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View recent job runs (check for errors)
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

**Expected output in job_run_details:**
- `status`: `succeeded`
- `return_message`: Contains the HTTP response from Edge Function

---

## Step 6: Monitor & Debug

### View Edge Function Logs

```bash
# Stream logs in real-time
supabase functions logs send-reminders --project-ref YOUR_PROJECT_REF
```

Or via Dashboard: **Edge Functions** → **send-reminders** → **Logs**

### Common Issues

| Issue | Solution |
|-------|----------|
| pg_cron job shows `failed` | Check `cron.job_run_details` for error message |
| Edge Function returns 401 | Verify service role key in cron job |
| No notifications sent | Check `get_due_morning_reminders()` returns users |
| Users not in query results | Verify timezone, time window, and `last_*_notification_at` |

### Test Manually

```sql
-- Check if any users are due for reminders right now
SELECT * FROM get_due_morning_reminders();
SELECT * FROM get_due_evening_reminders();

-- Reset a user's notification timestamp for testing
UPDATE user_notification_settings
SET last_morning_notification_at = NULL
WHERE user_id = 'USER_UUID';
```

---

## Step 7: Security Considerations

1. **Never commit service role key** - Use environment variables or Supabase secrets
2. **Edge Function is protected** - Only callable with valid auth or service role
3. **RLS is bypassed** - Edge Function uses service role, so RLS doesn't apply

### Alternative: Use Supabase Vault for Secrets

```sql
-- Store service role key in vault (more secure)
SELECT vault.create_secret('service_role_key', 'YOUR_SERVICE_ROLE_KEY');

-- Reference in cron job
SELECT cron.schedule(
  'send-reminders-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `supabase functions deploy send-reminders` | Deploy Edge Function |
| `supabase functions logs send-reminders` | View function logs |
| `supabase db push` | Apply migrations to production |
| `SELECT * FROM cron.job;` | List all cron jobs |
| `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;` | View recent job runs |
| `SELECT cron.unschedule('send-reminders-job');` | Remove the cron job |

---

## Useful Links

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
