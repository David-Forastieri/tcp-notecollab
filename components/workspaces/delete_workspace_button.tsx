'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'
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
    <Button
      onClick={handleDelete}
      disabled={isLoading}
      className="bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors text-sm px-3 py-1 rounded"
    >
      <Trash className="h-4 w-4 mr-2" />
      Delete Workspace
    </Button>
  )
}
