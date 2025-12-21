/**
 * Detox E2E Test: Logout Flow
 * Tests signing out and session clearing
 */

import {
  loginAsTestUser,
  TEST_CREDENTIALS,
  navigateToProfile,
  tapSignOut,
  assertOnWelcomeScreen,
} from './helpers'

describe('Logout Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should logout and return to Welcome screen', async () => {
    // Login first
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Navigate to Profile
    await navigateToProfile()

    // Tap sign out
    await tapSignOut()

    // Should be on Welcome screen
    await assertOnWelcomeScreen()

    // Verify login buttons are visible
    await expect(element(by.text('Get Started'))).toBeVisible()
    await expect(element(by.text('Sign in'))).toBeVisible()
  })

  it('should stay logged out after app restart', async () => {
    // Login first
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Navigate to Profile and logout
    await navigateToProfile()
    await tapSignOut()
    await assertOnWelcomeScreen()

    // Relaunch app
    await device.launchApp({ newInstance: true })

    // Should still be on Welcome screen (not auto-logged in)
    await assertOnWelcomeScreen()
  })
})
