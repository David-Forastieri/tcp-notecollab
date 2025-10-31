'use client'

import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'
import { useDeleteWorkspace } from '@/lib/hooks/use-workspaces'

interface DeleteWorkspaceButtonProps {
  workspaceId: string
}

export default function DeleteWorkspaceButton({ workspaceId }: DeleteWorkspaceButtonProps) {
  const { deleteWorkspace, isLoading } = useDeleteWorkspace()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this workspace? This action cannot be undone.')) return
    await deleteWorkspace(workspaceId)
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
