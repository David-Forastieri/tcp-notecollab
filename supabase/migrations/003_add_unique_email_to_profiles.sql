-- Migration 003: Add unique index on profiles.email (case-insensitive)
-- This migration will fail with a helpful message if duplicate emails exist.

DO $$
BEGIN
  IF EXISTS (
    SELECT lower(email) FROM public.profiles
    GROUP BY lower(email)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create unique index: duplicate emails exist (case-insensitive). Please resolve duplicates before running this migration.';
  END IF;

  -- Create a unique index on lower(email) to enforce case-insensitive uniqueness
  CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles (lower(email));
END$$;
