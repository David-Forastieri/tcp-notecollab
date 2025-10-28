-- Allow workspace members to INSERT notes
-- This migration adds a policy that permits active workspace members to create notes
-- provided the note's author_id equals the authenticated user.

DROP POLICY IF EXISTS "Workspace members can create notes" ON public.notes;

CREATE POLICY "Workspace members can create notes" ON public.notes
FOR INSERT WITH CHECK (
  author_id = auth.uid()
  AND public.is_workspace_member(workspace_id)
);
