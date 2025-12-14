import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-gray-950">
      <div className="w-24 h-24 rounded-3xl gradient-bg mb-8 flex items-center justify-center">
        <span className="text-white text-4xl font-bold">SW</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">SWE Mentor</h1>
      <p className="text-gray-400 text-center mb-8">
        Your AI-powered career companion
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-2xl glass text-gray-300 hover:text-white transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 rounded-2xl gradient-bg font-semibold text-white"
        >
          Sign Up
        </Link>
      </div>
    </main>
  )
}
