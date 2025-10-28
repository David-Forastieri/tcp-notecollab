'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DeleteWorkspaceButtonProps {
  workspaceId: string
}

export default function DeleteWorkspaceButton({ workspaceId }: DeleteWorkspaceButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this workspace? This action cannot be undone.')) return
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId)

      if (error) {
        toast.error('Error deleting workspace', { description: error.message })
        return
      }

      toast.success('Workspace deleted')
      router.push('/dashboard')
    } catch {
      toast.error('Unexpected error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
      Delete Workspace
    </Button>
  )
}
