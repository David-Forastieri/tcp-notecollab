"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SwitchAccountButton() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Error signing out', { description: error.message })
        return
      }
      toast.success('Signed out successfully')
      // Small delay so user sees the toast
      setTimeout(() => router.push('/auth/signin'), 350)
    } catch {
      toast.error('Unexpected error while signing out')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="lg" className="px-8" onClick={handleSignOut} disabled={isLoading}>
      {isLoading ? 'Signing out...' : 'Switch Account'}
    </Button>
  )
}
