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
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function CreateWorkspaceDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in to create a workspace')
        return
      }

      // First, ensure the user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            },
          ])

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError)
          toast.error('Error setting up user profile')
          return
        }
      } else if (profileError) {
        console.error('Error checking profile:', profileError)
        toast.error('Error verifying user profile')
        return
      }

      // Now create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([
          {
            name,
            description,
            owner_id: user.id,
          },
        ])
        .select()
        .single()

      if (workspaceError) {
        console.error('Workspace creation error:', workspaceError)
        toast.error('Error creating workspace', {
          description: workspaceError.message,
        })
        return
      }

      toast.success('Workspace created successfully!')
      setOpen(false)
      setName('')
      setDescription('')
      
      // 🔥 NUEVO: Redirigir al workspace recién creado
      router.push(`/workspaces/${workspace.id}`)
      //router.refresh()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Workspace</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to start collaborating with your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workspace name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter workspace description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={isLoading}>
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
