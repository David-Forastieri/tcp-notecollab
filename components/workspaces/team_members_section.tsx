import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import dynamic from 'next/dynamic'

const MemberActions = dynamic(() => import('./member_actions'))

interface TeamMembersSectionProps {
  workspaceId: string
  userRole: string
}

export async function TeamMembersSection({ workspaceId, userRole }: TeamMembersSectionProps) {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .order('role', { ascending: false })

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email[0].toUpperCase()
  }

  // get current user id so owner cannot change/remove themselves
  const { data: currentUserData } = await supabase.auth.getUser()
  const currentUserId = currentUserData?.user?.id ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          {members?.length || 0} member(s) in this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="text-sm">
                    {getInitials(member.profiles?.full_name, member.invited_email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold leading-5">
                    {member.profiles?.full_name || member.invited_email}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {member.profiles?.email || member.invited_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="px-3 py-1 text-sm" variant={
                  member.role === 'owner' ? 'default' : 
                  member.role === 'admin' ? 'secondary' : 'outline'
                }>
                  {member.role}
                </Badge>
                {/* Only owners can manage members, but prevent the owner from changing/removing themselves */}
                {userRole === 'owner' && member.user_id !== currentUserId && (
                  <MemberActions memberId={member.id} currentRole={member.role} />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
