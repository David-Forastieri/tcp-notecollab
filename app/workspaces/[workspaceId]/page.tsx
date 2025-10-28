import { getCurrentUser } from '@/lib/supabase/auth-utils'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { WorkspaceHeader } from '@/components/workspaces/workspace_header'
import { NotesSection } from '@/components/notes/notes_section'
import { TeamMembersSection } from '@/components/workspaces/team_members_section'

interface WorkspacePageProps {
  params: {
    workspaceId: string
  }
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const resolvedParams = await params
  const workspaceId = resolvedParams.workspaceId

  const user = await getCurrentUser()
  const supabase = await createClient()

  if (!user || !user.id) {
    redirect('/auth/signin')
  }

  // Verify user has access to this workspace
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError) {
    console.error('Error fetching membership:', membershipError)
    redirect('/dashboard')
  }

  if (!membership) {
    redirect('/dashboard')
  }

  // Get workspace details
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()

  if (!workspace) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WorkspaceHeader 
          workspace={workspace} 
          userRole={membership.role}
        />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NotesSection 
              workspaceId={workspaceId}
              userRole={membership.role}
            />
          </div>
          
          <div className="lg:col-span-1">
            <TeamMembersSection 
              workspaceId={workspaceId}
              userRole={membership.role}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
