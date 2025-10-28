import { getCurrentUser } from '@/lib/supabase/auth-utils'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceList } from '@/components/workspaces/workspace_list'
import type { Workspace, WorkspaceMember } from '@/types/database'
import { CreateWorkspaceDialog } from '@/components/workspaces/create_workspace_dialog'
import { FileText, Users, Plus, AlertCircle } from 'lucide-react'
import RefreshButton from '@/components/refresh_button'

type MembershipRow = {
  workspace_id: string
  role: WorkspaceMember['role']
  status: WorkspaceMember['status']
}

type MemberRow = {
  workspace_id: string
  user_id: string
  role: WorkspaceMember['role']
  status: WorkspaceMember['status']
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  try {
    // Paso 1: obtener las memberships activas del usuario (lista simple)
    const { data: memberships, error: membersError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (membersError) {
      console.error('Error fetching memberships:', membersError)
      throw membersError
    }

  const workspaceIds = (memberships || []).map((m: MembershipRow) => m.workspace_id)

    // Paso 2: cargar datos de los workspaces por id
    const { data: workspacesData, error: workspacesError } = await supabase
      .from('workspaces')
      .select('id, name, description, owner_id, created_at, updated_at')
      .in('id', workspaceIds)

    if (workspacesError) {
      console.error('Error fetching workspaces:', workspacesError)
      throw workspacesError
    }

    // Paso 3: obtener todos los miembros activos de esos workspaces para calcular conteos
    const { data: membersList, error: membersListError } = await supabase
      .from('workspace_members')
      .select('workspace_id, user_id, role, status')
      .in('workspace_id', workspaceIds)
      .eq('status', 'active')

    if (membersListError) {
      console.error('Error fetching workspace members list:', membersListError)
      throw membersListError
    }

    // Construir userWorkspaces agregando lista de miembros y conteo
    const userWorkspaces = (workspacesData || []).map((ws: Workspace) => {
      const membersForWs = (membersList || []).filter((mm: MemberRow) => mm.workspace_id === ws.id)
      // buscar role del usuario actual en memberships
      const membership = (memberships || []).find((m: MembershipRow) => m.workspace_id === ws.id)
      return {
        ...ws,
        workspace_members: membersForWs,
        memberCount: membersForWs.length,
        currentUserRole: membership?.role || null,
      }
    }) || []

    const workspaceCount = userWorkspaces.length

    // Contador único de usuarios en todos los workspaces (sin duplicados)
    const uniqueUserIds = new Set((membersList || []).map((m: MemberRow) => m.user_id))
    const uniqueMembersCount = uniqueUserIds.size

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900">{workspaceCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{uniqueMembersCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Quick Action</p>
                  <CreateWorkspaceDialog />
                </div>
              </div>
            </div>
          </div>

          {/* Workspaces Section */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Your Workspaces</h1>
                  <p className="text-gray-600 mt-2">
                    Manage your workspaces and collaborate with your team
                  </p>
                </div>
               {/*  <CreateWorkspaceDialog /> */}
              </div>
            </div>
            
            <div className="p-6">
              <WorkspaceList workspaces={userWorkspaces} />
            </div>
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Dashboard error:', error)
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Workspaces</h1>
          <p className="text-gray-600 mb-4">
            There was a problem loading your workspaces. Please try refreshing the page.
          </p>
          <RefreshButton className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" />
        </div>
      </div>
    )
  }
}
