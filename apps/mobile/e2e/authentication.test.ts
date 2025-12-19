/**
 * Detox E2E Test: Authentication & Onboarding Flows
 * Tests signup, login, and onboarding processes
 *
 * Converted from: .maestro/onboarding.yaml and .maestro/login-onboarding.yaml
 */

import {
  signupNewUser,
  loginAsTestUser,
  completeProfileSetup,
  generateTestEmail,
  TEST_CREDENTIALS,
} from './helpers'

describe('Authentication & Onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    // Delete app to clear stored auth session
    await device.launchApp({ delete: true })
  })

  describe('Signup Flow', () => {
    it('should complete full signup and onboarding flow', async () => {
      // Generate unique email
      const testEmail = generateTestEmail()
      const testPassword = 'TestPass123'
      const testName = 'Test User'

      // Start from Welcome Screen
      await expect(element(by.text('Level up your engineering career'))).toBeVisible()
      await expect(element(by.text('Get Started'))).toBeVisible()

      // Navigate to Signup
      await element(by.text('Get Started')).tap()

      // Fill Signup Form
      await expect(element(by.text('Create an account'))).toBeVisible()

      await element(by.id('email-input')).typeText(testEmail)
      await element(by.id('password-input')).typeText(testPassword)
      await element(by.id('confirm-password-input')).typeText(testPassword)

      await element(by.id('create-account-button')).tap()

      // Wait for signup to complete
      await waitFor(element(by.text(/Check your email|Set up your profile/)))
        .toBeVisible()
        .withTimeout(10000)

      // If email confirmation is disabled, continue to onboarding
      try {
        await expect(element(by.text('Set up your profile'))).toBeVisible()

        // Complete profile setup
        await completeProfileSetup(testName)

        // Verify we reached Home
        await waitFor(element(by.text('Welcome')))
          .toBeVisible()
          .withTimeout(5000)
      } catch (e) {
        // Email confirmation required - test ends here
        await expect(element(by.text('Check your email'))).toBeVisible()
      }
    })

    it('should show validation errors for invalid signup input', async () => {
      await element(by.text('Get Started')).tap()
      await expect(element(by.text('Create an account'))).toBeVisible()

      // Try to submit with empty fields
      await element(by.id('create-account-button')).tap()

      // Should show validation errors
      await expect(element(by.text(/required|empty/i))).toBeVisible()
    })

    it('should show error for password mismatch', async () => {
      await element(by.text('Get Started')).tap()

      await element(by.id('email-input')).typeText('test@example.com')
      await element(by.id('password-input')).typeText('Password123')
      await element(by.id('confirm-password-input')).typeText('DifferentPassword')

      await element(by.id('create-account-button')).tap()

      // Should show password mismatch error
      await expect(element(by.text(/passwords.*match/i))).toBeVisible()
    })

    it('should show error for weak password', async () => {
      await element(by.text('Get Started')).tap()

      await element(by.id('email-input')).typeText('test@example.com')
      await element(by.id('password-input')).typeText('weak')
      await element(by.id('confirm-password-input')).typeText('weak')

      await element(by.id('create-account-button')).tap()

      // Should show weak password error
      await expect(element(by.text(/password.*weak|minimum/i))).toBeVisible()
    })
  })

  describe('Login Flow', () => {
    it('should login with existing account', async () => {
      // Use helper function for login flow
      await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
    })

    it('should show error for invalid credentials', async () => {
      await element(by.text('Sign in')).tap()
      await expect(element(by.text('Welcome back'))).toBeVisible()

      await element(by.id('email-input')).typeText('wrong@example.com')
      await element(by.id('password-input')).typeText('wrongpassword')

      await element(by.id('sign-in-button')).tap()

      // Should show error message
      await expect(element(by.text(/invalid.*credentials|incorrect/i))).toBeVisible()
    })

    it('should show validation errors for empty login fields', async () => {
      await element(by.text('Sign in')).tap()

      // Try to submit with empty fields
      await element(by.id('sign-in-button')).tap()

      // Should show validation errors
      await expect(element(by.text(/required|empty/i))).toBeVisible()
    })
  })

  describe('Onboarding Flow', () => {
    it('should complete profile setup after login', async () => {
      // This test assumes account exists but hasn't completed onboarding
      await element(by.text('Sign in')).tap()

      await element(by.id('email-input')).typeText(TEST_CREDENTIALS.email)
      await element(by.id('password-input')).typeText(TEST_CREDENTIALS.password)

      await element(by.id('sign-in-button')).tap()

      // Wait for profile setup or home
      await waitFor(
        element(by.text(/Set up your profile|Welcome/))
      )
        .toBeVisible()
        .withTimeout(10000)

      // If onboarding appears, complete it
      try {
        await expect(element(by.text('Set up your profile'))).toBeVisible()

        await completeProfileSetup('Test User')

        // Verify we reached Home
        await expect(element(by.text('Welcome'))).toBeVisible()
      } catch (e) {
        // Already onboarded - directly at home
        await expect(element(by.text('Welcome'))).toBeVisible()
      }
    })

    it('should require name and role in profile setup', async () => {
      // Assuming we're at profile setup screen
      await element(by.text('Sign in')).tap()
      await element(by.id('email-input')).typeText(TEST_CREDENTIALS.email)
      await element(by.id('password-input')).typeText(TEST_CREDENTIALS.password)
      await element(by.id('sign-in-button')).tap()

      await waitFor(element(by.text('Set up your profile')))
        .toBeVisible()
        .withTimeout(10000)

      // Try to continue without filling fields
      await element(by.id('continue-button')).tap()

      // Should show validation errors
      await expect(element(by.text(/required/i))).toBeVisible()
    })

    it('should allow selecting different roles', async () => {
      // Navigate to profile setup
      await element(by.text('Sign in')).tap()
      await element(by.id('email-input')).typeText(TEST_CREDENTIALS.email)
      await element(by.id('password-input')).typeText(TEST_CREDENTIALS.password)
      await element(by.id('sign-in-button')).tap()

      await waitFor(element(by.text('Set up your profile')))
        .toBeVisible()
        .withTimeout(10000)

      await element(by.id('name-input')).typeText('Test User')

      // Open role selector
      await element(by.id('role-selector')).tap()

      // Should show role options
      await expect(element(by.text('Software Engineer 1'))).toBeVisible()
      await expect(element(by.text('Software Engineer 2'))).toBeVisible()
      await expect(element(by.text('Senior Software Engineer'))).toBeVisible()

      // Select SE2
      await element(by.text('Software Engineer 2')).tap()

      // Continue
      await element(by.id('continue-button')).tap()

      // Should reach ready screen
      await expect(element(by.text('Welcome, Test User!'))).toBeVisible()
    })
  })
})
