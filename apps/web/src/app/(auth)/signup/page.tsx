'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from './actions'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import type { AuthActionState } from '@/types/auth'

const initialState: AuthActionState = { status: 'idle' }

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, initialState)

  // Success state - email confirmation sent
  if (state.status === 'success') {
    return (
      <div className="flex flex-col items-center px-4 w-full">
        <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900/50 p-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3">Check your email</h1>
            <p className="text-gray-400 mb-8">{state.message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 font-medium transition-colors text-center"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center px-4 w-full">
      {/* Card Container */}
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900/50 p-10">
        {/* Logo - Solid gradient block */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl gradient-bg"></div>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-3">Create an account</h1>
        <p className="text-gray-400 text-center mb-8 text-sm leading-relaxed">
          Start your software engineering journey
        </p>

        {/* Google OAuth */}
        <SocialAuthButtons />

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-gray-500 text-sm">Or</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none placeholder:text-gray-500"
            />
          </div>
          {state.errors?.email && (
            <p className="text-red-400 text-sm">{state.errors.email[0]}</p>
          )}

          {/* Password Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              name="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none placeholder:text-gray-500"
            />
          </div>
          {state.errors?.password && (
            <p className="text-red-400 text-sm">{state.errors.password[0]}</p>
          )}

          {/* Confirm Password Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none placeholder:text-gray-500"
            />
          </div>
          {state.errors?.confirmPassword && (
            <p className="text-red-400 text-sm">{state.errors.confirmPassword[0]}</p>
          )}

          {state.errors?._form && (
            <div role="alert" className="text-sm py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {state.errors._form[0]}
            </div>
          )}

          {/* Create Account Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 font-medium transition-colors"
          >
            Create account
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-400 hover:text-primary-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
