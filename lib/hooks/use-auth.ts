'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SignInParams {
  email: string
  password: string
}

interface SignUpParams {
  email: string
  password: string
}

export function useSignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const signIn = async ({ email, password }: SignInParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        toast.error('Error signing in', {
          description: error.message,
        })
        return { success: false, error: error.message }
      }

      toast.success('Successfully signed in!')
      router.push('/dashboard')
      router.refresh()
      return { success: true, error: null }
    } catch {
      const message = 'An unexpected error occurred'
      setError(message)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  return { signIn, isLoading, error }
}

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const signUp = async ({ email, password }: SignUpParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        toast.error('Error registering', {
          description: error.message,
        })
        return { success: false, error: error.message }
      }

      toast.success('Registration successful', {
        description: 'Check your email to confirm your account',
      })

      router.push('/dashboard')
      router.refresh()
      return { success: true, error: null }
    } catch {
      const message = 'An unexpected error occurred'
      setError(message)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  return { signUp, isLoading, error }
}

export function useSignOut() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return { signOut, isLoading }
}
