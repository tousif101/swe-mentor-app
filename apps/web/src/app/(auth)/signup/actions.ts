'use server'

import { createClient } from '@/lib/supabase/server'
import { signupSchema, type AuthActionState } from '@/types/auth'

export async function signup(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Parse and validate
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Handle specific error cases with generic messages
    if (error.message.includes('already registered')) {
      return {
        status: 'error',
        errors: { _form: ['An account with this email already exists'] },
      }
    }

    return {
      status: 'error',
      errors: { _form: ['Unable to create account. Please try again.'] },
    }
  }

  return {
    status: 'success',
    message: 'Check your email to confirm your account',
  }
}
