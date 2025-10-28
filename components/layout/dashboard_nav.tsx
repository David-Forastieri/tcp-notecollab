'use client'

import { User } from '@supabase/supabase-js'
//import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/signout_button'
import { useRouter } from 'next/navigation'

interface DashboardNavProps {
  user?: User | null
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 
              className="text-xl font-bold text-gray-900 cursor-pointer"
              onClick={() => router.push('/')}
            >
              NoteCollab
            </h1>
          </div>
          
          {user && <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user.email}
            </span>
            <SignOutButton />
          </div>}
        </div>
      </div>
    </nav>
  )
}
