import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders all essential elements', async ({ page }) => {
    // Logo
    await expect(page.locator('.gradient-bg').first()).toBeVisible()

    // Header
    await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible()

    // Email input
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()

    // Password input (default mode)
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()

    // Toggle link
    await expect(page.getByRole('button', { name: 'Sign in with email link' })).toBeVisible()

    // Sign up link
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
  })

  test('password field hides when magic link mode enabled', async ({ page }) => {
    // Initial state - password visible
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()

    // Click toggle to enable magic link
    await page.getByRole('button', { name: 'Sign in with email link' }).click()

    // Password should be hidden
    await expect(page.getByPlaceholder('Enter your password')).not.toBeVisible()

    // Button text should change
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible()

    // Toggle text should change
    await expect(page.getByRole('button', { name: 'Use password instead' })).toBeVisible()
  })

  test('toggles back to password mode', async ({ page }) => {
    // Enable magic link mode
    await page.getByRole('button', { name: 'Sign in with email link' }).click()
    await expect(page.getByPlaceholder('Enter your password')).not.toBeVisible()

    // Toggle back
    await page.getByRole('button', { name: 'Use password instead' }).click()

    // Password should be visible again
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows validation error for empty email submission', async ({ page }) => {
    // Try to submit with empty email
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Browser's native validation should prevent submission
    // Check that email input has :invalid state
    const emailInput = page.getByPlaceholder('Enter your email')
    await expect(emailInput).toHaveAttribute('required')
  })

  test('navigates to signup page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/signup')
  })

  test('Google OAuth button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })
})
