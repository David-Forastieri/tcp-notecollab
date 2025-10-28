-- Migration: 006_workspace_owner_permissions.sql
-- Allow workspace owners to delete their workspace and manage member roles

-- NOTE: this migration depends on helper functions defined in migration 002
-- (public.is_workspace_owner(workspace_id))

-- 1) Workspace policies: only owners can DELETE or UPDATE workspaces
DROP POLICY IF EXISTS "Owners can update workspaces" ON public.workspaces;
CREATE POLICY "Owners can update workspaces" ON public.workspaces
  FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete workspaces" ON public.workspaces;
CREATE POLICY "Owners can delete workspaces" ON public.workspaces
  FOR DELETE
  USING (auth.uid() = owner_id);

-- 2) Workspace members policies: only owners can UPDATE or DELETE membership rows
-- This ensures only owners can change roles or remove members.
DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_members;

-- CREATE separate policies for UPDATE and DELETE (Postgres does not accept multiple actions in one FOR clause)
DROP POLICY IF EXISTS "Workspace owners can update members" ON public.workspace_members;
CREATE POLICY "Workspace owners can update members" ON public.workspace_members
  FOR UPDATE
  USING (public.is_workspace_owner(workspace_id));

DROP POLICY IF EXISTS "Workspace owners can delete members" ON public.workspace_members;
CREATE POLICY "Workspace owners can delete members" ON public.workspace_members
  FOR DELETE
  USING (public.is_workspace_owner(workspace_id));

-- Keep a SELECT policy so members can view other members in their workspace
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
CREATE POLICY "Users can view workspace members" ON public.workspace_members
  FOR SELECT
  USING (public.is_workspace_member(workspace_id) OR public.is_workspace_owner(workspace_id));

-- 3) Auditing: record workspace deletions and member role changes
CREATE TABLE IF NOT EXISTS public.workspace_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID,
  action TEXT NOT NULL,
  user_id UUID,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.workspace_audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.workspace_audit(workspace_id, action, user_id, payload)
    VALUES (OLD.id, 'delete_workspace', auth.uid()::uuid, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.workspace_audit(workspace_id, action, user_id, payload)
    VALUES (NEW.id, 'update_workspace', auth.uid()::uuid, json_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS workspace_audit_trigger ON public.workspaces;
CREATE TRIGGER workspace_audit_trigger
  AFTER UPDATE OR DELETE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.workspace_audit_trigger_func();

-- Audit for workspace_members (role changes and removals)
CREATE TABLE IF NOT EXISTS public.workspace_members_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID,
  member_user_id UUID,
  action TEXT NOT NULL,
  performed_by UUID,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.workspace_members_audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.workspace_members_audit(workspace_id, member_user_id, action, performed_by, payload)
    VALUES (OLD.workspace_id, OLD.user_id, 'remove_member', auth.uid()::uuid, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.workspace_members_audit(workspace_id, member_user_id, action, performed_by, payload)
    VALUES (NEW.workspace_id, NEW.user_id, 'update_member', auth.uid()::uuid, json_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.workspace_members_audit(workspace_id, member_user_id, action, performed_by, payload)
    VALUES (NEW.workspace_id, NEW.user_id, 'add_member', auth.uid()::uuid, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS workspace_members_audit_trigger ON public.workspace_members;
CREATE TRIGGER workspace_members_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.workspace_members_audit_trigger_func();
