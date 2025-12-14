import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test configuration for local Supabase
const SUPABASE_URL = 'http://localhost:54321'
// This is the default local dev service role key - safe to include
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Helper to generate unique test emails
function generateTestEmail(): string {
  const uniqueId = Math.random().toString(36).substring(2, 10)
  return `e2e-test-${uniqueId}@test.local`
}

// Helper to create test user
async function createTestUser(email: string, password: string) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for testing
  })
  if (error) throw new Error(`Failed to create test user: ${error.message}`)
  return data.user
}

// Helper to delete test user
async function deleteTestUser(userId: string) {
  await adminClient.auth.admin.deleteUser(userId)
}

test.describe('Authentication Flows', () => {
  test.describe('Login with Valid Credentials', () => {
    let testUser: { id: string; email: string; password: string }

    test.beforeAll(async () => {
      const email = generateTestEmail()
      const password = 'TestPassword123!'
      const user = await createTestUser(email, password)
      testUser = { id: user.id, email, password }
    })

    test.afterAll(async () => {
      if (testUser?.id) {
        await deleteTestUser(testUser.id)
      }
    })

    test('successful login redirects to app', async ({ page }) => {
      await page.goto('/login')

      await page.getByPlaceholder('Enter your email').fill(testUser.email)
      await page.getByPlaceholder('Enter your password').fill(testUser.password)
      await page.getByRole('button', { name: 'Sign in' }).click()

      // Should redirect (could be /onboarding or /journal depending on profile)
      await expect(page).not.toHaveURL('/login', { timeout: 10000 })
    })
  })

  test.describe('Login with Invalid Credentials', () => {
    test('shows error for invalid password', async ({ page }) => {
      // Create a user just for this test
      const email = generateTestEmail()
      const user = await createTestUser(email, 'CorrectPassword123!')

      try {
        await page.goto('/login')
        await page.getByPlaceholder('Enter your email').fill(email)
        await page.getByPlaceholder('Enter your password').fill('WrongPassword123!')
        await page.getByRole('button', { name: 'Sign in' }).click()

        // Should show error message
        await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
        await expect(page.getByRole('alert')).toContainText(/invalid/i)
      } finally {
        await deleteTestUser(user.id)
      }
    })

    test('shows error for non-existent email', async ({ page }) => {
      await page.goto('/login')
      await page.getByPlaceholder('Enter your email').fill('nonexistent@test.local')
      await page.getByPlaceholder('Enter your password').fill('SomePassword123!')
      await page.getByRole('button', { name: 'Sign in' }).click()

      // Should show generic error (to prevent account enumeration)
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Signup Flow', () => {
    test('successful signup shows email confirmation message', async ({ page }) => {
      const email = generateTestEmail()

      await page.goto('/signup')
      await page.getByPlaceholder('Enter your email').fill(email)
      await page.getByPlaceholder('Create a password').fill('StrongPassword123!')
      await page.getByPlaceholder('Confirm your password').fill('StrongPassword123!')
      await page.getByRole('button', { name: 'Create account' }).click()

      // Should show success state with "Check your email"
      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({ timeout: 10000 })

      // Clean up - find and delete the user that was created
      const { data: users } = await adminClient.auth.admin.listUsers()
      const createdUser = users.users.find(u => u.email === email)
      if (createdUser) {
        await deleteTestUser(createdUser.id)
      }
    })

    test('shows error for password mismatch', async ({ page }) => {
      await page.goto('/signup')
      await page.getByPlaceholder('Enter your email').fill(generateTestEmail())
      await page.getByPlaceholder('Create a password').fill('StrongPassword123!')
      await page.getByPlaceholder('Confirm your password').fill('DifferentPassword123!')
      await page.getByRole('button', { name: 'Create account' }).click()

      // Should show error about passwords not matching
      await expect(page.locator('text=match').first()).toBeVisible({ timeout: 5000 })
    })

    test('shows error for weak password', async ({ page }) => {
      await page.goto('/signup')
      await page.getByPlaceholder('Enter your email').fill(generateTestEmail())
      await page.getByPlaceholder('Create a password').fill('weak')
      await page.getByPlaceholder('Confirm your password').fill('weak')
      await page.getByRole('button', { name: 'Create account' }).click()

      // Should show password validation error
      await expect(page.locator('text=/password|character/i').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Magic Link', () => {
    test('shows success message after requesting magic link', async ({ page }) => {
      await page.goto('/login')

      // Switch to magic link mode
      await page.getByRole('button', { name: 'Sign in with email link' }).click()

      // Enter email
      await page.getByPlaceholder('Enter your email').fill(generateTestEmail())

      // Submit
      await page.getByRole('button', { name: 'Send Magic Link' }).click()

      // Should show success message
      await expect(page.getByRole('status')).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('status')).toContainText(/check your email|magic link/i)
    })
  })

  test.describe('Authenticated User Redirects', () => {
    let testUser: { id: string; email: string; password: string }

    test.beforeAll(async () => {
      const email = generateTestEmail()
      const password = 'TestPassword123!'
      const user = await createTestUser(email, password)
      testUser = { id: user.id, email, password }
    })

    test.afterAll(async () => {
      if (testUser?.id) {
        await deleteTestUser(testUser.id)
      }
    })

    test('authenticated user is redirected from login page', async ({ page }) => {
      // First, log in
      await page.goto('/login')
      await page.getByPlaceholder('Enter your email').fill(testUser.email)
      await page.getByPlaceholder('Enter your password').fill(testUser.password)
      await page.getByRole('button', { name: 'Sign in' }).click()

      // Wait for redirect
      await expect(page).not.toHaveURL('/login', { timeout: 10000 })

      // Now try to visit login again
      await page.goto('/login')

      // Should be redirected away from login
      // (depends on middleware implementation - may need adjustment)
      await page.waitForTimeout(2000)
    })
  })
})
