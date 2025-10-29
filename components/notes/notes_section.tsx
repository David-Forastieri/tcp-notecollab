import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateNoteDialog } from './create_note_dialog'
import { NotesList } from './notes_list'
import { NoteShare } from '@/types/database'
import type { Note as UINote } from './notes_list'

interface NotesSectionProps {
  workspaceId: string
  userRole: string
}

export async function NotesSection({ workspaceId, userRole }: NotesSectionProps) {
  const user = await getCurrentUser()
  const supabase = await createClient()
  // Guard: ensure we have a logged-in user before interpolating IDs into the
  // query. If there's no user (server-side or unauthenticated), bail out.
  if (!user || !user.id) {
    console.warn('NotesSection: no authenticated user; skipping notes query')
    return null
  }

  const { data: notes, error } = await supabase
    .from('notes')
    .select(`
      *,
      profiles:author_id (
        id,
        email,
        full_name
      ),
      note_shares (
        shared_with_user_id,
        permission_level
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching notes:', error)
  }
  
  // FILTROS SEGÚN ROL DEL USUARIO
  let userNotes: UINote[] = []
  let sharedNotes: UINote[] = []
  let teamNotes: UINote[] = []

  if (userRole === 'owner' || userRole === 'admin') {
    // OWNER/ADMIN: Puede ver TODAS las notas del workspace
    userNotes = notes?.filter(note => note.author_id === user.id) || []
    teamNotes = notes?.filter(note => 
      note.author_id !== user.id && 
      !note.note_shares?.some((share: NoteShare) => share.shared_with_user_id === user.id)
    ) || []
    sharedNotes = notes?.filter(note => 
      note.note_shares?.some((share: NoteShare) => share.shared_with_user_id === user.id)
    ) || []

  } else {
    // MEMBER: Solo puede ver sus notas + las compartidas específicamente con él
    userNotes = notes?.filter(note => note.author_id === user.id) || []
    sharedNotes = notes?.filter(note => 
      note.author_id !== user.id && 
      (note.is_shared || note.note_shares?.some((share: NoteShare) => share.shared_with_user_id === user.id))
    ) || []
    teamNotes = [] // Members no ven notas del equipo por defecto
  }

  return (
    <div className="space-y-8">
      {/* User's Notes - Siempre visible */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Notes</CardTitle>
            <CardDescription>
              Create and manage your personal notes ({userNotes.length})
            </CardDescription>
          </div>
          <CreateNoteDialog workspaceId={workspaceId} />
        </CardHeader>
        <CardContent>
          <NotesList 
            notes={userNotes} 
            showActions={true}
            type="personal"
            currentUserId={user.id}
            isOwner={userRole === 'owner'}
          />
        </CardContent>
      </Card>

      {/* Team Notes - Solo para owners/admins */}
      {(userRole === 'owner' || userRole === 'admin') && teamNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Notes</CardTitle>
            <CardDescription>
              All notes created by team members ({teamNotes.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotesList 
              notes={teamNotes} 
              showActions={userRole === 'owner'}
              type="team"
              currentUserId={user.id}
              isOwner={userRole === 'owner'}
            />
          </CardContent>
        </Card>
      )}

      {/* Shared Notes - Para todos los roles */}
      {sharedNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'owner' || userRole === 'admin' 
                ? 'Notes Shared with You' 
                : 'Shared with You'
              }
            </CardTitle>
            <CardDescription>
              {userRole === 'owner' || userRole === 'admin'
                ? `Notes specifically shared with you (${sharedNotes.length})`
                : `Notes shared by other team members (${sharedNotes.length})`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotesList 
              notes={sharedNotes} 
              showActions={false}
              type="shared"
              currentUserId={user.id}
              isOwner={userRole === 'owner'}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State para Members cuando no hay notas compartidas */}
      {userRole === 'member' && sharedNotes.length === 0 && userNotes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Create your first note or ask team members to share notes with you.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
