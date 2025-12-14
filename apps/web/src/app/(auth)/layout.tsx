import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - SWE Mentor',
  description: 'Sign in or create an account for SWE Mentor',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {children}
    </main>
  )
}
