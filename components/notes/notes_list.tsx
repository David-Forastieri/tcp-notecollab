'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditNoteDialog } from './edit_note_dialog'
import { ShareNoteDialog } from './share_note_dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export interface Note {
  id: string
  title: string
  workspace_id: string
  content: string
  author_id: string
  is_shared: boolean
  shared_at: string | null
  created_at: string
  updated_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
  }
  note_shares: Array<{
    shared_with_user_id: string
    permission_level: string
  }>
}

interface NotesListProps {
  notes: Note[]
  showActions: boolean
  type: 'personal' | 'shared' | 'team'
  currentUserId?: string
  isOwner?: boolean
}

export function NotesList({ notes, showActions, type, currentUserId, isOwner }: NotesListProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) {
        toast.error('Error deleting note', {
          description: error.message,
        })
        return
      }

      toast.success('Note deleted successfully!')
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    }
  }

   const getAuthorInitials = (profile?: { full_name: string | null; email: string } | null) => {
    if (!profile) return '?' 
    if (profile.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return (profile.email && profile.email[0]) ? profile.email[0].toUpperCase() : '?'
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          {type === 'personal' && 'No personal notes yet. Create your first note!'}
          {type === 'shared' && 'No notes shared with you yet.'}
          {type === 'team' && 'No team notes available.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  {type === 'team' && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getAuthorInitials(note.profiles)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-500">
                        {note.profiles?.full_name || note.profiles?.email || 'Unknown'}
                      </span>
                    </div>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2 flex-wrap">
                  {type === 'shared' && (
                    <span>By {note.profiles?.full_name || note.profiles?.email || 'Unknown'}</span>
                  )}
                  {note.is_shared && (
                    <Badge variant="secondary">Shared</Badge>
                  )}
                  {note.note_shares && note.note_shares.length > 0 && (
                    <Badge variant="outline">
                      {note.note_shares.length} share{note.note_shares.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardDescription>
              </div>
              
              {showActions && (() => {
                const canManage = note.author_id === currentUserId || !!isOwner
                if (!canManage) return null

                return (
                  <div className="flex space-x-2 ml-4">
                    <EditNoteDialog note={note} />
                    <ShareNoteDialog note={note} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )
              })()}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 line-clamp-3">
              {note.content}
            </p>
            <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
              <span>
                Updated {new Date(note.updated_at).toLocaleDateString()}
              </span>
              {type === 'team' && !showActions && (
                <span className="text-xs">
                  Created {new Date(note.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
