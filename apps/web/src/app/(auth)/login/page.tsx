'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { login, loginWithMagicLink } from './actions'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import type { AuthActionState } from '@/types/auth'

const initialState: AuthActionState = { status: 'idle' }

export default function LoginPage() {
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [passwordState, passwordAction] = useActionState(login, initialState)
  const [magicLinkState, magicLinkAction] = useActionState(loginWithMagicLink, initialState)

  const errors = useMagicLink ? magicLinkState.errors : passwordState.errors

  return (
    <div className="flex flex-col items-center px-4 w-full">
      {/* Card Container */}
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900/50 p-10">
        {/* Logo - Solid gradient block */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl gradient-bg"></div>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-3">Welcome back!</h1>
        <p className="text-gray-400 text-center mb-8 text-sm leading-relaxed">
          Sign in to continue your journey
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
        <form action={useMagicLink ? magicLinkAction : passwordAction} className="space-y-4">
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
          {errors?.email && (
            <p className="text-red-400 text-sm">{errors.email[0]}</p>
          )}

          {/* Password Input - only shown when not using magic link */}
          {!useMagicLink && (
            <>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none placeholder:text-gray-500"
                />
              </div>
              {errors?.password && (
                <p className="text-red-400 text-sm">{errors.password[0]}</p>
              )}
            </>
          )}

          {errors?._form && (
            <div role="alert" className="text-sm py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {errors._form[0]}
            </div>
          )}

          {magicLinkState.status === 'success' && useMagicLink && (
            <div role="status" className="text-sm py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              Check your email for the magic link!
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 font-medium transition-colors"
          >
            {useMagicLink ? 'Send Magic Link' : 'Sign in'}
          </button>

          {/* Toggle between password and magic link */}
          <button
            type="button"
            onClick={() => setUseMagicLink(!useMagicLink)}
            className="w-full text-center text-primary-400 hover:text-primary-300 text-sm"
          >
            {useMagicLink ? 'Use password instead' : 'Sign in with email link'}
          </button>

          {useMagicLink && (
            <p className="text-center text-gray-500 text-xs">
              New here? We&apos;ll create an account for you automatically.
            </p>
          )}
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary-400 hover:text-primary-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
