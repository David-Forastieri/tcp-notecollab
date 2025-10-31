'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CreateWorkspaceParams {
  name: string
  description?: string
}

interface InviteMemberParams {
  workspaceId: string
  email: string
  role: 'member' | 'admin'
}

export function useCreateWorkspace() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const createWorkspace = async ({ name, description }: CreateWorkspaceParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const message = 'You must be logged in to create a workspace'
        setError(message)
        toast.error(message)
        return { success: false, error: message, data: null }
      }

      // First, ensure the user has a profile
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            },
          ])

        if (createProfileError) {
          const message = 'Error setting up user profile'
          setError(message)
          toast.error(message)
          return { success: false, error: message, data: null }
        }
      } else if (profileError) {
        const message = 'Error verifying user profile'
        setError(message)
        toast.error(message)
        return { success: false, error: message, data: null }
      }

      // Now create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([
          {
            name,
            description,
            owner_id: user.id,
          },
        ])
        .select()
        .single()

      if (workspaceError) {
        setError(workspaceError.message)
        toast.error('Error creating workspace', {
          description: workspaceError.message,
        })
        return { success: false, error: workspaceError.message, data: null }
      }

      toast.success('Workspace created successfully!')
      
      // Redirect to the newly created workspace
      router.push(`/workspaces/${workspace.id}`)
      
      return { success: true, error: null, data: workspace }
    } catch {
      const message = 'An unexpected error occurred'
      setError(message)
      toast.error(message)
      return { success: false, error: message, data: null }
    } finally {
      setIsLoading(false)
    }
  }

  return { createWorkspace, isLoading, error }
}

export function useDeleteWorkspace() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const deleteWorkspace = async (workspaceId: string) => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId)

      if (error) {
        toast.error('Error deleting workspace', { description: error.message })
        return { success: false, error: error.message }
      }

      toast.success('Workspace deleted')
      router.push('/dashboard')
      return { success: true, error: null }
    } catch {
      toast.error('Unexpected error')
      return { success: false, error: 'Unexpected error' }
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteWorkspace, isLoading }
}

export function useInviteMember() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const inviteMember = async ({ workspaceId, email, role }: InviteMemberParams) => {
    setIsLoading(true)
    setError(null)

    try {
      // Lookup profile by email via RPC to avoid RLS blocking the query
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_profile_by_email', { p_email: email })

      if (rpcError) {
        setError(rpcError.message)
        toast.error('Error checking user', {
          description: rpcError.message,
        })
        return { success: false, error: rpcError.message }
      }

      const userData = Array.isArray(rpcData) ? rpcData[0] : rpcData

      // Do not allow pending invites: the user must exist to be invited.
      if (!userData || !userData.id) {
        const message = 'User does not exist. They must register before you can invite them.'
        setError(message)
        toast.error(message)
        return { success: false, error: message }
      }

      // Insert workspace member for existing user
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert([
          {
            workspace_id: workspaceId,
            user_id: userData.id,
            role,
            invited_email: email,
            status: 'active',
          },
        ])

      if (memberError) {
        // Unique violation (already a member) or other DB error
        const msg = memberError.message || 'Error inviting member'
        setError(msg)
        
        if (memberError.code === '23505' || /duplicate key/i.test(msg)) {
          toast.error('User is already a member of this workspace')
        } else {
          toast.error('Error inviting member', {
            description: msg,
          })
        }
        return { success: false, error: msg }
      }

      toast.success('Member invited successfully!')
      router.refresh()
      return { success: true, error: null }
    } catch {
      const message = 'An unexpected error occurred'
      setError(message)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  return { inviteMember, isLoading, error }
}
