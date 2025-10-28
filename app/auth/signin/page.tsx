import { SignInForm } from '@/components/auth/signin_form'
import { DashboardNav } from '@/components/layout/dashboard_nav'

export default function SignInPage() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome back — sign in
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your credentials to access your workspaces and notes.
            </p>
          </div>
          <SignInForm />
          <div className="text-sm text-center text-gray-600">
            <span>New here? </span>
            <a href="/auth/signup" className="font-medium text-blue-600 hover:underline">Create an account</a>
          </div>
        </div>
      </div>
    </div>
  )
}
