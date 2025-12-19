/**
 * Detox E2E Test: Full User Journey
 * Complete end-to-end test covering the main user flow
 *
 * Converted from: .maestro/full-user-journey.yaml
 *
 * This test covers:
 * 1. Login/Onboarding
 * 2. Home page exploration
 * 3. Morning check-in
 * 4. Evening check-in
 * 5. Journal viewing and editing
 * 6. Search and filtering
 */

import {
  loginAsTestUser,
  navigateToHome,
  navigateToJournal,
  assertCheckInComplete,
  assertCelebrationModal,
  assertChangesSaved,
  assertOnJournalScreen,
  clearText,
  TEST_CREDENTIALS,
} from './helpers'

describe('Full User Journey', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  it('should complete full user journey from login to journal editing', async () => {
    // ============================================
    // 1. LOGIN & ONBOARDING
    // ============================================

    // Login as test user
    await element(by.text('Sign in')).tap()
    await expect(element(by.text('Welcome back'))).toBeVisible()

    await element(by.id('email-input')).typeText(TEST_CREDENTIALS.email)
    await element(by.id('password-input')).typeText(TEST_CREDENTIALS.password)
    await element(by.id('sign-in-button')).tap()

    // Wait for home screen
    await waitFor(element(by.text('Welcome')))
      .toBeVisible()
      .withTimeout(10000)

    // ============================================
    // 2. HOME PAGE EXPLORATION
    // ============================================

    // Check hero card
    await expect(element(by.id('hero-card'))).toBeVisible()

    // Check week progress
    await expect(element(by.id('week-progress-card'))).toBeVisible()

    // Scroll to see stats cards
    await element(by.id('home-screen-scroll')).scroll(300, 'down')
    await expect(element(by.id('streak-card'))).toBeVisible()

    // Scroll back to top
    await element(by.id('home-screen-scroll')).scroll(300, 'up')

    // ============================================
    // 3. MORNING CHECK-IN
    // ============================================

    await navigateToHome()

    await element(by.text(/Start Morning Check-in|Begin Morning Check-in/)).tap()

    await waitFor(element(by.text('Morning Check-in')))
      .toBeVisible()
      .withTimeout(3000)

    // Select focus area
    await element(by.text('System Design')).tap()

    // Input daily goal
    await element(by.id('daily-goal-input')).typeText('E2E test - Master suite run')

    // Save
    await element(by.text('Save Changes')).tap()

    await assertCheckInComplete()

    // Verify we're back on home
    await waitFor(element(by.text('Welcome')))
      .toBeVisible()
      .withTimeout(2000)

    // ============================================
    // 4. EVENING CHECK-IN
    // ============================================

    await element(by.text(/Start Evening Reflection|Begin Evening Check-in/)).tap()

    await waitFor(element(by.text('Evening Check-in')))
      .toBeVisible()
      .withTimeout(3000)

    // Answer goal completion
    await element(by.text('Yes, completely')).tap()

    // Quick win
    await element(by.id('quick-win-input')).typeText(
      'Completed full E2E test suite'
    )

    // Tomorrow's carry
    await element(by.id('tomorrow-carry-input')).typeText(
      'Continue improving test coverage'
    )

    // Save
    await element(by.text('Save Changes')).tap()

    // Celebration modal
    await assertCelebrationModal()

    // ============================================
    // 5. JOURNAL VIEWING
    // ============================================

    await navigateToJournal()

    // Wait for entries
    await waitFor(element(by.id(/day-card-.*/)))
      .toBeVisible()
      .withTimeout(5000)

    // Verify today's entry is visible
    await expect(element(by.text('E2E test - Master suite run'))).toBeVisible()

    // ============================================
    // 6. JOURNAL EDITING
    // ============================================

    // Tap edit on the first entry (today's entry)
    await element(by.id(/edit-button-.*/)).atIndex(0).tap()

    // Wait for edit screen
    await waitFor(
      element(by.text(/Edit Morning Check-in|Edit Evening Reflection/))
    )
      .toBeVisible()
      .withTimeout(3000)

    // Modify the text
    const inputField = element(by.id(/daily-goal-input|quick-win-input/))
    await inputField.tap()
    await inputField.typeText(' - EDITED')

    // Save changes
    await element(by.text('Save Changes')).tap()

    // Verify success
    await assertChangesSaved()

    // Should stay on Journal tab
    await assertOnJournalScreen()

    // Verify edited text is visible
    await expect(element(by.text(/EDITED/))).toBeVisible()

    // ============================================
    // 7. JOURNAL SEARCH
    // ============================================

    await element(by.id('journal-search-input')).tap()
    await element(by.id('journal-search-input')).typeText('E2E test')

    // Should show filtered results
    await expect(element(by.text('E2E test'))).toBeVisible()

    // Results count
    await expect(element(by.text(/entries match|entry matches/))).toBeVisible()

    // Clear search
    await clearText(by.id('journal-search-input'))

    // ============================================
    // 8. JOURNAL FILTER BY TAG
    // ============================================

    // Tap on system-design filter chip
    await element(by.text('#system-design')).tap()

    // Verify filtered
    await expect(element(by.id('filter-chip-system-design-selected'))).toBeVisible()

    // Should show only system-design entries
    await expect(element(by.text(/entries match/))).toBeVisible()

    // Clear filter
    await element(by.text('All')).tap()

    // ============================================
    // SUCCESS!
    // ============================================

    await expect(element(by.text('Journal'))).toBeVisible()

    // Test completed successfully!
  })

  it('should handle errors gracefully throughout journey', async () => {
    await device.reloadReactNative()
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Try to save morning check-in without selecting focus area
    await navigateToHome()
    await element(by.text(/Start Morning Check-in|Begin Morning Check-in/)).tap()

    await waitFor(element(by.text('Morning Check-in'))).toBeVisible()

    // Try to save without filling required fields
    await element(by.text('Save Changes')).tap()

    // Should show validation error
    await expect(element(by.text(/required/))).toBeVisible()

    // Now fill correctly
    await element(by.text('System Design')).tap()
    await element(by.id('daily-goal-input')).typeText('Error handling test')

    await element(by.text('Save Changes')).tap()
    await assertCheckInComplete()
  })

  it('should maintain state when navigating between tabs', async () => {
    await device.reloadReactNative()
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Apply a filter on journal
    await navigateToJournal()

    await waitFor(element(by.id(/day-card-.*/)))
      .toBeVisible()
      .withTimeout(5000)

    await element(by.text('#system-design')).tap()
    await expect(element(by.id('filter-chip-system-design-selected'))).toBeVisible()

    // Navigate to home and back
    await navigateToHome()
    await navigateToJournal()

    // Filter should still be applied
    await expect(element(by.id('filter-chip-system-design-selected'))).toBeVisible()
  })
})
