import { Workspace } from '@/types/database'
import { InviteMemberDialog } from './invite_member_dialog'
import dynamic from 'next/dynamic'

const DeleteWorkspaceButton = dynamic(() => import('./delete_workspace_button'))
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface WorkspaceHeaderProps {
  workspace: Workspace
  userRole: string
}

export function WorkspaceHeader({ workspace, userRole }: WorkspaceHeaderProps) {
  const canManageMembers = userRole === 'owner' || userRole === 'admin'

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workspaces
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-gray-600 mt-2">{workspace.description}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          {canManageMembers && (
            <InviteMemberDialog workspaceId={workspace.id} />
          )}
        </div>
      </div>
      
      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
        <span>Created {new Date(workspace.created_at).toLocaleDateString()}</span>
        <span>•</span>
        <span>Your role: <span className="capitalize font-medium">{userRole}</span></span>
      </div>

      {userRole === 'owner' && (
        <div className="mt-6">
          <div className="flex">
            <div className="ml-0">
              <DeleteWorkspaceButton workspaceId={workspace.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
