-- Migration: 005_allow_workspace_owner_manage_notes.sql
-- Allow workspace owners to UPDATE/DELETE notes authored by others

-- DROP or replace existing policies that restrict UPDATE/DELETE on notes
DROP POLICY IF EXISTS "Note authors full access" ON public.notes;

-- Create policies which allow note authors or workspace owners to UPDATE and DELETE notes.
-- PostgreSQL's CREATE POLICY does not accept multiple commands separated by commas
-- (FOR UPDATE, DELETE is invalid). Create separate policies for UPDATE and DELETE.
DROP POLICY IF EXISTS "Owners or authors can update notes" ON public.notes;
CREATE POLICY "Owners or authors can update notes" ON public.notes
  FOR UPDATE
  USING (
    auth.uid() = author_id OR public.is_workspace_owner(workspace_id)
  );

DROP POLICY IF EXISTS "Owners or authors can delete notes" ON public.notes;
CREATE POLICY "Owners or authors can delete notes" ON public.notes
  FOR DELETE
  USING (
    auth.uid() = author_id OR public.is_workspace_owner(workspace_id)
  );

-- Optional: create an audit table and trigger to record updates/deletes on notes
-- This is recommended for accountability and debugging.

CREATE TABLE IF NOT EXISTS public.notes_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  note_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.notes_audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.notes_audit(note_id, action, user_id, before_data)
    VALUES (OLD.id, 'delete', auth.uid()::uuid, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.notes_audit(note_id, action, user_id, before_data, after_data)
    VALUES (NEW.id, 'update', auth.uid()::uuid, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS notes_audit_trigger ON public.notes;
CREATE TRIGGER notes_audit_trigger
  AFTER UPDATE OR DELETE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notes_audit_trigger_func();
