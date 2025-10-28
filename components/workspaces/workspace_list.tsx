import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Edit, Users, FileText } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  description: string | null
  owner_id: string
  memberCount: number
  currentUserRole: string | null
  created_at: string
  workspace_members: Array<{
    user_id: string
    role: string
  }>
}

interface WorkspaceListProps {
  workspaces: Workspace[]
}

export function WorkspaceList({ workspaces }: WorkspaceListProps) {
  if (workspaces.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No workspaces yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Create your first workspace to start collaborating with your team and organizing notes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <Card key={workspace.id} className="hover:shadow-lg transition-shadow duration-200 group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  {workspace.name}
                  <Badge variant={
                    workspace.currentUserRole === 'owner' ? 'default' : 'secondary'
                  }>
                    {workspace.currentUserRole}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-2 line-clamp-2">
                  {workspace.description || 'No description provided'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {workspace.memberCount > 1 &&<div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Team</span>
                </div>}
                <span>
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </span>
              </div>
              <Link href={`/workspaces/${workspace.id}`}>
                <Button className="group-hover:bg-blue-600 transition-colors">
                  Open Workspace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}