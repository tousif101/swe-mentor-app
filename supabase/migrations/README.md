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
