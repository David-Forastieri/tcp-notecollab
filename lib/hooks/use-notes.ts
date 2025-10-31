'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CreateNoteParams {
  title: string
  content: string
  workspaceId: string
  isShared?: boolean
}

interface UpdateNoteParams {
  noteId: string
  title: string
  content: string
  isShared: boolean
  previousIsShared: boolean
  sharedAt: string | null
}

interface ShareNoteParams {
  noteId: string
  userId: string
  permission: 'view' | 'edit'
  currentIsShared: boolean
}

export function useCreateNote() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const createNote = async ({ title, content, workspaceId, isShared = false }: CreateNoteParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const message = 'You must be logged in to create a note'
        setError(message)
        toast.error(message)
        return { success: false, error: message }
      }

      const { error: insertError } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            workspace_id: workspaceId,
            author_id: user.id,
            is_shared: isShared,
            shared_at: isShared ? new Date().toISOString() : null,
          },
        ])

      if (insertError) {
        setError(insertError.message)
        toast.error('Error creating note', {
          description: insertError.message,
        })
        return { success: false, error: insertError.message }
      }

      toast.success('Note created successfully!')
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

  return { createNote, isLoading, error }
}

export function useUpdateNote() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const updateNote = async ({ 
    noteId, 
    title, 
    content, 
    isShared, 
    previousIsShared, 
    sharedAt 
  }: UpdateNoteParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('notes')
        .update({
          title,
          content,
          is_shared: isShared,
          shared_at: isShared && !previousIsShared ? new Date().toISOString() : previousIsShared ? sharedAt : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)

      if (updateError) {
        setError(updateError.message)
        toast.error('Error updating note', {
          description: updateError.message,
        })
        return { success: false, error: updateError.message }
      }

      toast.success('Note updated successfully!')
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

  return { updateNote, isLoading, error }
}

export function useDeleteNote() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const deleteNote = async (noteId: string) => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) {
        toast.error('Error deleting note', {
          description: error.message,
        })
        return { success: false, error: error.message }
      }

      toast.success('Note deleted successfully!')
      router.refresh()
      return { success: true, error: null }
    } catch {
      const message = 'An unexpected error occurred'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteNote, isLoading }
}

export function useShareNote() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const shareNote = async ({ noteId, userId, permission, currentIsShared }: ShareNoteParams) => {
    setIsLoading(true)
    setError(null)

    try {
      // First, ensure the note is marked as shared
      if (!currentIsShared) {
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            is_shared: true,
            shared_at: new Date().toISOString(),
          })
          .eq('id', noteId)

        if (updateError) {
          setError(updateError.message)
          toast.error('Error updating note sharing status')
          return { success: false, error: updateError.message }
        }
      }

      // Then create the share record
      const { error: shareError } = await supabase
        .from('note_shares')
        .insert([
          {
            note_id: noteId,
            shared_with_user_id: userId,
            permission_level: permission,
          },
        ])

      if (shareError) {
        setError(shareError.message)
        toast.error('Error sharing note', {
          description: shareError.message,
        })
        return { success: false, error: shareError.message }
      }

      toast.success('Note shared successfully!')
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

  const removeShare = async (noteId: string, userId: string) => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('note_shares')
        .delete()
        .eq('note_id', noteId)
        .eq('shared_with_user_id', userId)

      if (error) {
        toast.error('Error removing share')
        return { success: false, error: error.message }
      }

      toast.success('Share removed successfully!')
      router.refresh()
      return { success: true, error: null }
    } catch {
      const message = 'An unexpected error occurred'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  return { shareNote, removeShare, isLoading, error }
}
