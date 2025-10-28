import { getCurrentUser } from '@/lib/supabase/auth-utils'
import { DashboardNav } from '@/components/layout/dashboard_nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="py-8">
        {children}
      </main>
    </div>
  )
}
