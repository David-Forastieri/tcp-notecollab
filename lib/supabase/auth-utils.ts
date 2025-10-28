import { createClient } from './server'
import { redirect } from 'next/navigation'

export const getCurrentUser = async () => {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }
  
  return user
}

export const getSession = async () => {
  const supabase = await createClient()
  return supabase.auth.getSession()
}

export const signOut = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}
