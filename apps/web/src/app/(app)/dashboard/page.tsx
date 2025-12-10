import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const timeOfDay = getTimeOfDay()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Welcome back, {firstName}!
      </h1>
      <p className="text-gray-400 mb-8">Good {timeOfDay}</p>

      {/* Empty State Card */}
      <div className="rounded-xl bg-gray-800/30 p-6 max-w-md">
        <p className="text-gray-400 mb-4">
          Start journaling to see your stats here
        </p>
        <Link
          href="/journal"
          className="inline-block px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 font-medium transition-colors text-sm"
        >
          New Entry
        </Link>
      </div>
    </div>
  )
}
