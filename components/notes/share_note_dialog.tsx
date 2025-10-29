'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { InviteMemberDialog } from '@/components/workspaces/invite_member_dialog'

interface Note {
  id: string
  title: string
  workspace_id: string
  author_id: string
  is_shared: boolean
  note_shares: Array<{
    shared_with_user_id: string
    permission_level: string
  }>
}

interface WorkspaceMember {
  id: string
  user_id: string
  role: string
  profiles: {
    id: string
    email: string
    full_name: string | null
  }
}

export function ShareNoteDialog({ note }: { note: Note }) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [selectedMember, setSelectedMember] = useState('')
  const [permission, setPermission] = useState('view')
  const [isLoading, setIsLoading] = useState(false)
  const [currentShares, setCurrentShares] = useState(note.note_shares || [])
  const router = useRouter()
  const supabase = createClient()

  // loadWorkspaceMembers is stable in this component; disable exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadWorkspaceMembers = useCallback(async () => {
    try {
      const { data: membersData, error } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          role,
          profiles:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('workspace_id', note.workspace_id)
        .eq('status', 'active')

      if (error) {
        toast.error('Error loading members')
        return
      }

      const raw = (membersData || []) as unknown as Array<Record<string, unknown>>

      const normalizedMembers = raw.map((m) => {
        const profilesField = m['profiles'] as unknown
        const profileObj = Array.isArray(profilesField)
          ? (profilesField as Array<Record<string, unknown>>)[0]
          : (profilesField as Record<string, unknown> | undefined)

        return {
          id: String(m['id'] ?? ''),
          user_id: String(m['user_id'] ?? ''),
          role: String(m['role'] ?? ''),
          profiles: {
            id: String(profileObj?.['id'] ?? ''),
            email: String(profileObj?.['email'] ?? ''),
            full_name: (profileObj?.['full_name'] as string) ?? null,
          },
        }
      }) as WorkspaceMember[]

      setMembers(normalizedMembers)
    } catch {
      toast.error('Error loading workspace members')
    }
  }, [supabase, note.workspace_id])

  useEffect(() => {
    if (open) {
      loadWorkspaceMembers()
    }
  }, [open, loadWorkspaceMembers])

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    setIsLoading(true)

    try {
      // First, ensure the note is marked as shared
      if (!note.is_shared) {
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            is_shared: true,
            shared_at: new Date().toISOString(),
          })
          .eq('id', note.id)

        if (updateError) {
          toast.error('Error updating note sharing status')
          return
        }
      }

      // Then create the share record
      const { error: shareError } = await supabase
        .from('note_shares')
        .insert([
          {
            note_id: note.id,
            shared_with_user_id: selectedMember,
            permission_level: permission,
          },
        ])

      if (shareError) {
        toast.error('Error sharing note', {
          description: shareError.message,
        })
        return
      }

      toast.success('Note shared successfully!')
      setSelectedMember('')
      setPermission('view')
      router.refresh()
      
      // Update current shares locally
      setCurrentShares(prev => [
        ...prev,
        { shared_with_user_id: selectedMember, permission_level: permission }
      ])
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveShare = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('note_shares')
        .delete()
        .eq('note_id', note.id)
        .eq('shared_with_user_id', userId)

      if (error) {
        toast.error('Error removing share')
        return
      }

      toast.success('Share removed successfully!')
      setCurrentShares(prev => prev.filter(share => share.shared_with_user_id !== userId))
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    }
  }

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId)
    return member?.profiles.full_name || member?.profiles.email || userId
  }

  // Filter out members who already have access and the note author
  const availableMembers = members.filter(member => {
    const isAuthor = member.user_id === note.author_id
    const access = !currentShares.some(share => share.shared_with_user_id === member.user_id)
    return !isAuthor && access
})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Share &quot;{note.title}&quot; with workspace members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Shares */}
          {currentShares.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Currently shared with:
              </Label>
              <div className="space-y-2">
                {currentShares.map((share) => (
                  <div key={share.shared_with_user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">
                        {getMemberName(share.shared_with_user_id)}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {share.permission_level}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveShare(share.shared_with_user_id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Share */}
          <form onSubmit={handleShare} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="member">Select Member</Label>
              {availableMembers.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    There are no other members in this workspace. You must first add members in order to share the note.
                  </p>
                  <div className="mt-3">
                    <InviteMemberDialog workspaceId={note.workspace_id} />
                  </div>
                </div>
              ) : (
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.user_id}>
                        {member.profiles.full_name || member.profiles.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

           {/*  {availableMembers.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="permission">Permission Level</Label>
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can View</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )} */}

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={!selectedMember}
                isLoading={isLoading}
              >
                Share Note
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
