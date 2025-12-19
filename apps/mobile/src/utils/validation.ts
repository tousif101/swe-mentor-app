import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain a special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
export type SignupInput = z.infer<typeof signupSchema>

// Onboarding validation
const userRoles = [
  'software_engineer_1',
  'software_engineer_2',
  'senior_engineer',
  'staff_engineer',
  'principal_engineer',
] as const

const roleIndexMap: Record<string, number> = {
  software_engineer_1: 0,
  software_engineer_2: 1,
  senior_engineer: 2,
  staff_engineer: 3,
  principal_engineer: 4,
}

export const profileSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(userRoles, { message: 'Please select your current role' }),
    targetRole: z.enum(userRoles, { message: 'Please select your target role' }),
  })
  .refine(
    (data) => roleIndexMap[data.targetRole] >= roleIndexMap[data.role],
    {
      message: 'Target role must be at or above your current role',
      path: ['targetRole'],
    }
  )

export type ProfileInput = z.infer<typeof profileSchema>
