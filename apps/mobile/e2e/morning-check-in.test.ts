/**
 * Detox E2E Test: Morning Check-in Input Flow
 * Tests creating a new morning check-in with all fields
 *
 * Converted from: .maestro/morning-check-in.yaml
 * Prerequisites: User must be logged in and onboarded
 */

import {
  loginAsTestUser,
  navigateToHome,
  startMorningCheckIn,
  assertCheckInComplete,
  assertOnHomeScreen,
  assertMorningCheckInCompleted,
  TEST_CREDENTIALS,
} from './helpers'

describe('Morning Check-in Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    // Login as test user
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
  })

  it('should complete a morning check-in successfully', async () => {
    // Start from Home tab
    await navigateToHome()

    // Tap on morning check-in card
    await element(by.text(/Start Morning Check-in|Begin Morning Check-in/)).tap()

    // Wait for morning check-in screen
    await waitFor(element(by.text('Morning Check-in')))
      .toBeVisible()
      .withTimeout(3000)

    // Verify focus area question is visible
    await expect(element(by.text("What's your focus today?"))).toBeVisible()

    // Select focus area (System Design)
    await element(by.text('System Design')).tap()

    // Verify chip is selected (purple border)
    await expect(element(by.id('chip-system-design-selected'))).toBeVisible()

    // Input daily goal
    await element(by.id('daily-goal-input')).typeText(
      'Complete E2E test setup with Detox'
    )

    // Verify text was entered
    await expect(element(by.text('Complete E2E test setup with Detox'))).toBeVisible()

    // Save the check-in
    await element(by.text('Save Changes')).tap()

    // Verify success message
    await assertCheckInComplete()

    // Should return to home screen
    await assertOnHomeScreen()

    // Verify check-in is now completed
    await assertMorningCheckInCompleted()
  })

  it('should allow changing focus area before saving', async () => {
    await startMorningCheckIn()

    // Select first focus area
    await element(by.text('System Design')).tap()
    await expect(element(by.id('chip-system-design-selected'))).toBeVisible()

    // Change to different focus area
    await element(by.text('Ownership')).tap()
    await expect(element(by.id('chip-ownership-selected'))).toBeVisible()

    // First chip should no longer be selected
    await expect(element(by.id('chip-system-design-selected'))).not.toExist()

    // Input goal and save
    await element(by.id('daily-goal-input')).typeText('Test focus area switching')
    await element(by.text('Save Changes')).tap()

    await assertCheckInComplete()
  })

  it('should show validation error for empty daily goal', async () => {
    await startMorningCheckIn()

    // Select focus area
    await element(by.text('System Design')).tap()

    // Try to save without entering daily goal
    await element(by.text('Save Changes')).tap()

    // Should show validation error
    await expect(element(by.text(/required|empty/i))).toBeVisible()
  })
})
