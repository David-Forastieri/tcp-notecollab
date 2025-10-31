'use client'

import { useState } from 'react'
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
import { useCreateNote } from '@/lib/hooks/use-notes'

interface CreateNoteDialogProps {
  workspaceId: string
}

export function CreateNoteDialog({ workspaceId }: CreateNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isShared, setIsShared] = useState(false)
  const { createNote, isLoading } = useCreateNote()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = await createNote({
      title,
      content,
      workspaceId,
      isShared,
    })

    if (result.success) {
      setOpen(false)
      setTitle('')
      setContent('')
      setIsShared(false)
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
