'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { loginSchema, magicLinkSchema, type AuthActionState } from '@/types/auth'

export async function login(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Parse and validate
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    // Generic error message to prevent account enumeration
    return {
      status: 'error',
      errors: { _form: ['Invalid email or password'] },
    }
  }

  // Check onboarding status
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_completed) {
      redirect('/onboarding')
    }
  }

  redirect('/journal')
}

export async function loginWithMagicLink(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Parse and validate
  const parsed = magicLinkSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return {
      status: 'error',
      errors: { _form: ['Failed to send magic link. Please try again.'] },
    }
  }

  return {
    status: 'success',
  }
}
