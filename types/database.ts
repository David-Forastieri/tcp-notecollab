export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  invited_email: string
  status: 'active' | 'pending' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content: string
  workspace_id: string
  author_id: string
  is_shared: boolean
  shared_at: string | null
  created_at: string
  updated_at: string
}

export interface NoteShare {
  id: string
  note_id: string
  shared_with_user_id: string
  permission_level: 'view' | 'edit'
  created_at: string
}
