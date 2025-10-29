'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CreateNoteDialogProps {
  workspaceId: string
}

export function CreateNoteDialog({ workspaceId }: CreateNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in to create a note')
        return
      }

      const { error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            workspace_id: workspaceId,
            author_id: user.id,
            is_shared: isShared,
            shared_at: isShared ? new Date().toISOString() : null,
          },
        ])

      if (error) {
        toast.error('Error creating note', {
          description: error.message,
        })
        return
      }

      toast.success('Note created successfully!')
      setOpen(false)
      setTitle('')
      setContent('')
      setIsShared(false)
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Note</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Create a new note for your workspace. You can share it with team members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note content here..."
                rows={8}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="shared"
                checked={isShared}
                onCheckedChange={setIsShared}
              />
              <Label htmlFor="shared">Share with workspace members</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={isLoading}>
              Create Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
