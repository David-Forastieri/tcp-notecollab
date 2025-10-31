'use client'

import { Button } from '@/components/ui/button'
import { useSignOut } from '@/lib/hooks/use-auth'

export function SignOutButton() {
  const { signOut, isLoading } = useSignOut()

  return (
    <Button variant="outline" onClick={signOut} isLoading={isLoading}>
      Sign Out
    </Button>
  )
}
