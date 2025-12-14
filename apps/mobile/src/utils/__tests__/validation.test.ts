import { describe, it, expect } from 'vitest'
import { loginSchema, magicLinkSchema, signupSchema } from '../validation'

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
    password: 'Password1',
    confirmPassword: 'Password1',
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
      password: 'PASSWORD1',
      confirmPassword: 'PASSWORD1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Password must contain a lowercase letter'
      )
    }
  })

  it('rejects password without uppercase letter', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Password must contain an uppercase letter'
      )
    }
  })

  it('rejects password without number', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'Passwordd',
      confirmPassword: 'Passwordd',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Password must contain a number'
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
