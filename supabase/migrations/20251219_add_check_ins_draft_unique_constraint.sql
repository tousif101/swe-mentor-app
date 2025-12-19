-- Add unique constraint for draft check-ins to prevent race conditions
-- This allows the upsert pattern to work correctly in createOrUpdateDraft()
--
-- The constraint ensures that for any given (user_id, check_in_type, check_in_date) combination,
-- only one check-in record can exist. This applies to both:
-- - Draft check-ins (completed_at IS NULL)
-- - Completed check-ins (completed_at IS NOT NULL)
--
-- This prevents the TOCTOU (Time-of-Check-Time-of-Use) race condition where concurrent
-- auto-save calls could both pass the existence check and create duplicate drafts.

CREATE UNIQUE INDEX IF NOT EXISTS check_ins_user_type_date_unique
ON check_ins(user_id, check_in_type, check_in_date);
