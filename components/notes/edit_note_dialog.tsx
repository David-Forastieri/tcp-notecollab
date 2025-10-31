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
import { useUpdateNote } from '@/lib/hooks/use-notes'

interface Note {
  id: string
  title: string
  content: string
  is_shared: boolean
  shared_at: string | null
}

interface EditNoteDialogProps {
  note: Note
}

export function EditNoteDialog({ note }: EditNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [isShared, setIsShared] = useState(note.is_shared)
  const { updateNote, isLoading } = useUpdateNote()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = await updateNote({
      noteId: note.id,
      title,
      content,
      isShared,
      previousIsShared: note.is_shared,
      sharedAt: note.shared_at,
    })

    if (result.success) {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update your note content and sharing settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
              Update Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
