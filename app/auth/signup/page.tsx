import { SignUpForm } from '@/components/auth/signup_form'
import { DashboardNav } from '@/components/layout/dashboard_nav'

export default function SignUpPage() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Start collaborating — set up your workspace and invite teammates.
            </p>
          </div>
          <SignUpForm />
          <div className="text-sm text-center text-gray-600">
            <span>Already have an account? </span>
            <a href="/auth/signin" className="font-medium text-blue-600 hover:underline">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  )
}
