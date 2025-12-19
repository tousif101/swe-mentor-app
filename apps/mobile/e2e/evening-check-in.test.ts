/**
 * Detox E2E Test: Evening Check-in Input Flow
 * Tests creating a new evening reflection with all answer types
 *
 * Converted from: .maestro/evening-check-in.yaml
 * Prerequisites: User must be logged in, onboarded, and completed morning check-in
 */

import {
  loginAsTestUser,
  navigateToHome,
  startEveningCheckIn,
  assertCelebrationModal,
  assertOnHomeScreen,
  assertEveningCheckInCompleted,
  TEST_CREDENTIALS,
} from './helpers'

describe('Evening Check-in Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
  })

  it('should complete evening check-in with "Yes, completely" answer', async () => {
    await navigateToHome()

    // Tap on evening check-in card
    await element(by.text(/Start Evening Reflection|Begin Evening Check-in/)).tap()

    // Wait for evening check-in screen
    await waitFor(element(by.text('Evening Check-in')))
      .toBeVisible()
      .withTimeout(3000)

    // Answer "Did you complete your goal?"
    await expect(element(by.text('Did you complete your goal?'))).toBeVisible()
    await element(by.text('Yes, completely')).tap()

    // Quick win should be visible
    await expect(element(by.text('What was your quick win?'))).toBeVisible()
    await element(by.id('quick-win-input')).typeText(
      'Successfully set up automated E2E tests'
    )

    // Tomorrow's carry forward
    await expect(
      element(by.text('What will you carry forward tomorrow?'))
    ).toBeVisible()
    await element(by.id('tomorrow-carry-input')).typeText(
      'Expand test coverage to all features'
    )

    // Save the check-in
    await element(by.text('Save Changes')).tap()

    // Should show celebration modal
    await assertCelebrationModal()

    // Should return to home screen
    await assertOnHomeScreen()

    // Verify both check-ins are completed
    await assertEveningCheckInCompleted()
  })

  it('should complete evening check-in with "Partially" answer', async () => {
    await startEveningCheckIn()

    // Select partially
    await element(by.text('Partially')).tap()

    // Blocker field should appear
    await expect(element(by.text('What blocked you?'))).toBeVisible()
    await element(by.id('blocker-input')).typeText('Needed more time for testing')

    // Quick win
    await element(by.id('quick-win-input')).typeText('Made good progress on tests')

    // Tomorrow's carry
    await element(by.id('tomorrow-carry-input')).typeText(
      'Complete remaining test coverage'
    )

    // Energy level slider should appear
    await expect(element(by.text('Energy level'))).toBeVisible()

    // Save
    await element(by.text('Save Changes')).tap()
    await assertCelebrationModal()
  })

  it('should complete evening check-in with "No" answer', async () => {
    await startEveningCheckIn()

    // Select No
    await element(by.text("No, didn't make progress")).tap()

    // Blocker and energy level should appear
    await expect(element(by.text('What blocked you?'))).toBeVisible()
    await element(by.id('blocker-input')).typeText('Had unexpected meetings')

    // Quick win (still required even if no progress)
    await element(by.id('quick-win-input')).typeText('Learned about meeting importance')

    // Tomorrow
    await element(by.id('tomorrow-carry-input')).typeText('Block focus time tomorrow')

    // Energy level
    await expect(element(by.text('Energy level'))).toBeVisible()

    // Save
    await element(by.text('Save Changes')).tap()
    await assertCelebrationModal()
  })

  it('should show validation errors for incomplete fields', async () => {
    await startEveningCheckIn()

    // Select goal completion but don't fill other fields
    await element(by.text('Yes, completely')).tap()

    // Try to save without filling required fields
    await element(by.text('Save Changes')).tap()

    // Should show validation errors
    await expect(element(by.text(/required|empty/i))).toBeVisible()
  })

  it('should allow editing answers before saving', async () => {
    await startEveningCheckIn()

    // Select "Yes" first
    await element(by.text('Yes, completely')).tap()

    // Fill quick win
    await element(by.id('quick-win-input')).typeText('Initial answer')

    // Change to "Partially"
    await element(by.text('Partially')).tap()

    // Blocker field should now appear
    await expect(element(by.text('What blocked you?'))).toBeVisible()

    // Previous quick win should still be there
    await expect(element(by.text('Initial answer'))).toBeVisible()

    // Complete the form
    await element(by.id('blocker-input')).typeText('Changed my mind about progress')
    await element(by.id('tomorrow-carry-input')).typeText('Be more realistic tomorrow')

    await element(by.text('Save Changes')).tap()
    await assertCelebrationModal()
  })
})
