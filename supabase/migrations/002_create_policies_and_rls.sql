-- =============================================
-- RLS POLICIES FIXED VERSION
-- =============================================

-- Step 1: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (clean slate)
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view workspaces they are members of or owners" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Note authors can manage notes" ON public.notes;
DROP POLICY IF EXISTS "Workspace members can view shared notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view notes shared with them or authored by them" ON public.notes;
DROP POLICY IF EXISTS "Note authors can manage shares" ON public.note_shares;
DROP POLICY IF EXISTS "Users can view shares of their notes or shares addressed to them" ON public.note_shares;

-- Step 3: Drop existing functions
DROP FUNCTION IF EXISTS public.is_workspace_member CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_owner CASCADE;
DROP FUNCTION IF EXISTS public.is_note_author CASCADE;
DROP FUNCTION IF EXISTS public.is_note_shared_with_user CASCADE;
DROP FUNCTION IF EXISTS public.get_user_workspaces CASCADE;

-- Step 4: Create simplified helper functions
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = $1
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.status = 'active'
  );
$$;

-- Ensure the helper runs with a role that can bypass RLS evaluation to avoid recursion.
-- If your DB has a `postgres` role (Supabase-managed DBs do), set the function owner to postgres.
ALTER FUNCTION public.is_workspace_member(UUID) OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = $1 
    AND workspaces.owner_id = auth.uid()
  );
$$;

ALTER FUNCTION public.is_workspace_owner(UUID) OWNER TO postgres;

-- Step 5: SIMPLIFIED POLICIES - FOCUS ON MAKING INSERT WORK

-- 5.1 Profiles policies
CREATE POLICY "Profiles full access for owners" ON public.profiles
FOR ALL USING (auth.uid() = id);

-- Agregar esta política adicional a la tabla profiles
-- 5.1.2
CREATE POLICY "Users can view workspace members profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm1
    JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = profiles.id
    AND wm2.user_id = auth.uid()
    AND wm2.status = 'active'
  )
);

-- 5.2 Workspaces policies - SIMPLIFIED VERSION
-- Allow users to create workspaces (this is critical)
CREATE POLICY "Anyone can create workspaces" ON public.workspaces
FOR INSERT WITH CHECK (true);

-- Allow users to view workspaces they own or are members of
CREATE POLICY "Users can view owned or member workspaces" ON public.workspaces
FOR SELECT USING (
  auth.uid() = owner_id OR public.is_workspace_member(id)
);

-- Allow owners to update their workspaces
CREATE POLICY "Owners can update workspaces" ON public.workspaces
FOR UPDATE USING (auth.uid() = owner_id);

-- Allow owners to delete their workspaces
CREATE POLICY "Owners can delete workspaces" ON public.workspaces
FOR DELETE USING (auth.uid() = owner_id);

-- 5.3 Workspace members policies
CREATE POLICY "Users can view workspace members" ON public.workspace_members
FOR SELECT USING (
  public.is_workspace_member(workspace_id) OR public.is_workspace_owner(workspace_id)
);

CREATE POLICY "Workspace owners can manage members" ON public.workspace_members
FOR ALL USING (public.is_workspace_owner(workspace_id));

-- Allow users to be added as members (by owners or themselves)
CREATE POLICY "Users can be added as members" ON public.workspace_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR public.is_workspace_owner(workspace_id)
);

CREATE POLICY "Control role assignment permissions" ON public.workspace_members
FOR INSERT WITH CHECK (
  (public.is_workspace_owner(workspace_id))
  OR
  (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = workspace_members.workspace_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
    AND role = 'member'
  )
  OR
  (auth.uid() = user_id AND role = 'member')
);

-- 5.4 Notes policies
CREATE POLICY "Note authors full access" ON public.notes
FOR ALL USING (auth.uid() = author_id);

-- Allow workspace members to view any notes that belong to their workspace.
-- Previously this only allowed notes where is_shared = true; change it so
-- members can see the workspace's notes regardless of the per-note flag.
CREATE POLICY "Workspace members can view notes in their workspace" ON public.notes
FOR SELECT USING (
  public.is_workspace_member(workspace_id)
);

-- 5.5 Note shares policies  
CREATE POLICY "Note authors can manage shares" ON public.note_shares
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_shares.note_id 
    AND notes.author_id = auth.uid()
  )
);

CREATE POLICY "Users can view their shares" ON public.note_shares
FOR SELECT USING (
  shared_with_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_shares.note_id 
    AND notes.author_id = auth.uid()
  )
);

-- Step 6: Create a function to automatically add creator as workspace member
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Automatically add the workspace creator as an owner member
  INSERT INTO public.workspace_members (
    workspace_id,
    user_id,
    role,
    invited_email,
    status
  ) VALUES (
    NEW.id,
    NEW.owner_id,
    'owner',
    (SELECT email FROM public.profiles WHERE id = NEW.owner_id),
    'active'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add creator as member
DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_workspace();

-- =============================================
-- FIX FOREIGN KEY ISSUES - ADD AFTER EXISTING CONTENT
-- =============================================

-- Step 7: Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Also create a function to ensure profile exists for current user
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  profile_count INTEGER;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if profile exists
  SELECT COUNT(*) INTO profile_count 
  FROM public.profiles 
  WHERE id = user_id;
  
  -- If profile doesn't exist, create it
  IF profile_count = 0 THEN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      user_id,
      (SELECT email FROM auth.users WHERE id = user_id),
      COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id),
        split_part((SELECT email FROM auth.users WHERE id = user_id), '@', 1)
      )
    );
  END IF;
  
  RETURN user_id;
END;
$$;

-- Step 9: Update the workspace creation policy to ensure profile exists
DROP POLICY IF EXISTS "Anyone can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces" ON public.workspaces
FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND 
  public.ensure_profile_exists() IS NOT NULL
);

-- =============================================
-- END OF FIXED POLICIES
-- =============================================