-- Migration 004: create SECURITY DEFINER function to lookup profile by email
-- This RPC returns id for a given email (case-insensitive) and is SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.get_profile_by_email(p_email text)
RETURNS TABLE(id uuid)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE lower(email) = lower($1) LIMIT 1;
$$;

-- Set owner to postgres if available so function executes with the appropriate privileges
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    ALTER FUNCTION public.get_profile_by_email(text) OWNER TO postgres;
  END IF;
END$$;
