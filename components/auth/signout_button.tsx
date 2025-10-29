'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSignOut} isLoading={isLoading}>
      Sign Out
    </Button>
  )
}
