'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MoreVertical, User, Shield, UserX } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
interface MemberActionsProps {
  memberId: string
  currentRole: 'owner' | 'admin' | 'member'
}

export default function MemberActions({ memberId, currentRole }: MemberActionsProps) {
  const [role, setRole] = useState<typeof currentRole>(currentRole)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const [memberName, setMemberName] = useState<string>('')
  const [isCurrentUser, setIsCurrentUser] = useState<boolean>(false)
  const [canManageRoles, setCanManageRoles] = useState<boolean>(false)
  const [canRemoveMembers, setCanRemoveMembers] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        // get member row with profile
        const { data: memberData, error: mErr } = await supabase
          .from('workspace_members')
          .select(`*, profiles:user_id ( id, email, full_name )`)
          .eq('id', memberId)
          .single()

        if (mErr || !memberData) return
        if (!mounted) return

  setMemberName(memberData.profiles?.full_name || memberData.invited_email || 'Member')

        // get current user
        const { data: userData } = await supabase.auth.getUser()
        const currentUserId = userData?.user?.id ?? null
        setIsCurrentUser(currentUserId === memberData.user_id)

        // fetch current user's membership for this workspace to determine permissions
        if (currentUserId) {
          const { data: currentMemberRow } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', memberData.workspace_id)
            .eq('user_id', currentUserId)
            .single()

          const currentRole = currentMemberRow?.role ?? null
          const canManage = currentRole === 'owner'
          if (mounted) {
            setCanManageRoles(canManage)
            setCanRemoveMembers(canManage)
          }
        }
      } catch {
        // ignore, UI will fallback
      }
    }

    load()
    return () => { mounted = false }
  }, [memberId, supabase])

  const handleChangeRole = async (newRole: string) => {
    if (newRole === role) return
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) {
        toast.error('Error updating role', { description: error.message })
        return
      }

      toast.success('Member role updated')
      setRole(newRole as MemberActionsProps['currentRole'])
      router.refresh()
    } catch {
      toast.error('Unexpected error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (isCurrentUser) {
      toast.error('You cannot remove yourself from the workspace')
      return
    }

    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        toast.error('Error removing member', { description: error.message })
        return
      }

      toast.success(`${memberName} has been removed from the workspace`)
      router.refresh()
    } catch {
      toast.error('Unexpected error')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="flex items-center gap-3">
      {/* Role Selector - Only show if user can manage roles and it's not the current user */}
      

      {/* Remove Button - Only show if user can remove members and it's not the current user */}
      {canRemoveMembers && !isCurrentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isLoading}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={handleRemove}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <UserX className="h-4 w-4 mr-2" />
              Remove Member
            </DropdownMenuItem>
            <DropdownMenuItem>
              {canManageRoles && !isCurrentUser && (
        <Select value={role} onValueChange={handleChangeRole} disabled={isLoading}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Member
            </SelectItem>
            <SelectItem value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </SelectItem>
          </SelectContent>
        </Select>
      )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Current User Indicator */}
      {isCurrentUser && (
        <Badge variant="outline" className="text-xs">
          You
        </Badge>
      )}
    </div>
  )
}