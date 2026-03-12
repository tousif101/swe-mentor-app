import { describe, it, expect } from 'vitest'
import { loginSchema, magicLinkSchema, signupSchema, profileSchema } from '../validation'

describe('loginSchema', () => {
  it('validates correct email and password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        'Please enter a valid email address'
      )
    }
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Password is required'
      )
    }
  })

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('magicLinkSchema', () => {
  it('validates correct email', () => {
    const result = magicLinkSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = magicLinkSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        'Please enter a valid email address'
      )
    }
  })

  it('rejects empty email', () => {
    const result = magicLinkSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })
})

describe('signupSchema', () => {
  const validData = {
    email: 'test@example.com',
    password: 'Password1!',
    confirmPassword: 'Password1!',
  }

  it('validates correct signup data', () => {
    const result = signupSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = signupSchema.safeParse({
      ...validData,
      email: 'invalid',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        'Please enter a valid email address'
      )
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'Pass1',
      confirmPassword: 'Pass1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Password must be at least 8 characters'
      )
    }
  })

  it('rejects password without lowercase letter', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'PASSWORD1!',
      confirmPassword: 'PASSWORD1!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Must contain a lowercase letter'
      )
    }
  })

  it('rejects password without uppercase letter', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'password1!',
      confirmPassword: 'password1!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Must contain an uppercase letter'
      )
    }
  })

  it('rejects password without number', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'Password!',
      confirmPassword: 'Password!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Must contain a number'
      )
    }
  })

  it('rejects mismatched passwords', () => {
    const result = signupSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPassword1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "Passwords don't match"
      )
    }
  })

  it('accepts complex valid password', () => {
    const result = signupSchema.safeParse({
      email: 'user@domain.co.uk',
      password: 'MySecure123Pass!',
      confirmPassword: 'MySecure123Pass!',
    })
    expect(result.success).toBe(true)
  })
})

describe('profileSchema', () => {
  const validProfile = {
    name: 'John Doe',
    role: 'software_engineer_2' as const,
    targetRole: 'senior_engineer' as const,
  }

  it('validates correct profile data', () => {
    const result = profileSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      name: 'J',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain(
        'Name must be at least 2 characters'
      )
    }
  })

  it('rejects empty name', () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      role: 'invalid_role',
    })
    expect(result.success).toBe(false)
  })

  it('rejects target role below current role', () => {
    const result = profileSchema.safeParse({
      name: 'John Doe',
      role: 'senior_engineer',
      targetRole: 'software_engineer_1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.targetRole).toContain(
        'Target role must be at or above your current role'
      )
    }
  })

  it('accepts same role as target (no promotion goal)', () => {
    const result = profileSchema.safeParse({
      name: 'John Doe',
      role: 'senior_engineer',
      targetRole: 'senior_engineer',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all valid role combinations going up', () => {
    const roles = [
      'software_engineer_1',
      'software_engineer_2',
      'senior_engineer',
      'staff_engineer',
      'principal_engineer',
    ] as const

    // Test SE1 can target any role
    roles.forEach((targetRole) => {
      const result = profileSchema.safeParse({
        name: 'Test User',
        role: 'software_engineer_1',
        targetRole,
      })
      expect(result.success).toBe(true)
    })
  })

  it('accepts valid 2-character name', () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      name: 'Jo',
    })
    expect(result.success).toBe(true)
  })

  it('accepts intern as current role', () => {
    const result = profileSchema.safeParse({
      name: 'Jane Intern',
      role: 'intern',
      targetRole: 'intern',
    })
    expect(result.success).toBe(true)
  })

  it('accepts intern targeting SE1', () => {
    const result = profileSchema.safeParse({
      name: 'Jane Intern',
      role: 'intern',
      targetRole: 'software_engineer_1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects SE1 targeting intern (below current)', () => {
    const result = profileSchema.safeParse({
      name: 'John SE1',
      role: 'software_engineer_1',
      targetRole: 'intern',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.targetRole).toContain(
        'Target role must be at or above your current role'
      )
    }
  })

  it('accepts optional company fields', () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      company_name: 'Acme Corp',
      company_size: '50-200',
      career_matrix_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('accepts profile without company fields', () => {
    const result = profileSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
  })

  it('rejects invalid company_size enum value', () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      company_size: 'huge',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid career_matrix_id format', () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      career_matrix_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})
