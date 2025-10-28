'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface InviteMemberDialogProps {
  workspaceId: string
}

export function InviteMemberDialog({ workspaceId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Obtener el rol del usuario actual en este workspace
  useEffect(() => {
    const getCurrentUserRole = async () => {
      if (!open) return
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: memberData, error } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (error) {
          console.error('Error fetching user role:', error)
          return
        }

        setCurrentUserRole(memberData?.role || null)
      } catch (error) {
        console.error('Error getting current user role:', error)
      }
    }

    getCurrentUserRole()
  }, [open, workspaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Lookup profile by email via RPC to avoid RLS blocking the query
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_profile_by_email', { p_email: email })

      if (rpcError) {
        toast.error('Error checking user', {
          description: rpcError.message,
        })
        return
      }

      const userData = Array.isArray(rpcData) ? rpcData[0] : rpcData

      // Do not allow pending invites: the user must exist to be invited.
      if (!userData || !userData.id) {
        toast.error('User does not exist. They must register before you can invite them.')
        return
      }

      // Insert workspace member for existing user
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert([
          {
            workspace_id: workspaceId,
            user_id: userData.id,
            role,
            invited_email: email,
            status: 'active',
          },
        ])

      if (memberError) {
        // Unique violation (already a member) or other DB error
        const msg = memberError.message || 'Error inviting member'
        if (memberError.code === '23505' || /duplicate key/i.test(msg)) {
          toast.error('User is already a member of this workspace')
        } else {
          toast.error('Error inviting member', {
            description: msg,
          })
        }
        return
      }

      toast.success('Member invited successfully!')
      setOpen(false)
      setEmail('')
      setRole('member')
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Solo owners pueden asignar rol de admin
  const canAssignAdmin = currentUserRole === 'owner'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite Member</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite someone to join this workspace. They will receive an invitation email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="team@member.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  {canAssignAdmin && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!canAssignAdmin && (
                <p className="text-xs text-muted-foreground">
                  Only workspace owners can assign Admin role
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Inviting...' : 'Invite Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
