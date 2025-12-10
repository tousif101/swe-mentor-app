import { test, expect } from '@playwright/test'

test.describe('Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('renders all essential elements', async ({ page }) => {
    // Logo
    await expect(page.locator('.gradient-bg').first()).toBeVisible()

    // Header
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()

    // Email input
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()

    // Password input
    await expect(page.getByPlaceholder('Create a password')).toBeVisible()

    // Confirm password input
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()

    // Sign in link
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('navigates to login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('Google OAuth button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('all inputs have required attribute', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Enter your email')
    const passwordInput = page.getByPlaceholder('Create a password')
    const confirmInput = page.getByPlaceholder('Confirm your password')

    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
    await expect(confirmInput).toHaveAttribute('required')
  })

  test('inputs have correct autocomplete attributes', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Enter your email')
    const passwordInput = page.getByPlaceholder('Create a password')
    const confirmInput = page.getByPlaceholder('Confirm your password')

    await expect(emailInput).toHaveAttribute('autocomplete', 'email')
    await expect(passwordInput).toHaveAttribute('autocomplete', 'new-password')
    await expect(confirmInput).toHaveAttribute('autocomplete', 'new-password')
  })

  test('form prevents submission with empty fields', async ({ page }) => {
    // Click submit without filling fields
    await page.getByRole('button', { name: 'Create account' }).click()

    // Should still be on signup page (native validation prevents submission)
    await expect(page).toHaveURL('/signup')
  })
})
