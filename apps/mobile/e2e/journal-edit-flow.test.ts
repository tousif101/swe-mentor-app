/**
 * Detox E2E Test: Journal Edit Flow
 * Tests editing existing check-ins from the journal tab
 *
 * Converted from: .maestro/journal-edit-flow.yaml
 * Prerequisites: Must have completed at least one check-in
 */

import {
  loginAsTestUser,
  navigateToJournal,
  assertChangesSaved,
  assertOnJournalScreen,
  TEST_CREDENTIALS,
} from './helpers'

describe('Journal Edit Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
  })

  it('should edit a check-in from journal and return to journal tab', async () => {
    // Navigate to Journal tab
    await navigateToJournal()

    // Wait for journal entries to load
    await waitFor(element(by.id(/day-card-.*/)))
      .toBeVisible()
      .withTimeout(5000)

    // Tap the edit button on the first entry
    await element(by.id(/edit-button-.*/)).atIndex(0).tap()

    // Should navigate to check-in screen
    // Wait for edit screen to load
    await waitFor(
      element(by.text(/Edit Morning Check-in|Edit Evening Reflection/))
    )
      .toBeVisible()
      .withTimeout(3000)

    // Verify we're in edit mode
    await expect(element(by.text(/Edit/))).toBeVisible()

    // Modify the daily goal/quick win
    const inputField = element(by.id(/daily-goal-input|quick-win-input/))
    await inputField.tap()
    await inputField.typeText(' - Edited via Detox')

    // Save changes
    await element(by.text('Save Changes')).tap()

    // Verify success message
    await assertChangesSaved()

    // Should return to Journal tab (not Home)
    await assertOnJournalScreen()

    // Verify we can see the updated text
    await waitFor(element(by.text(/Edited via Detox/)))
      .toBeVisible()
      .withTimeout(2000)
  })

  it('should allow editing multiple times', async () => {
    await navigateToJournal()

    // Wait for entries
    await waitFor(element(by.id(/day-card-.*/)))
      .toBeVisible()
      .withTimeout(5000)

    // First edit
    await element(by.id(/edit-button-.*/)).atIndex(0).tap()
    await waitFor(
      element(by.text(/Edit Morning Check-in|Edit Evening Reflection/))
    ).toBeVisible()

    const inputField = element(by.id(/daily-goal-input|quick-win-input/))
    await inputField.clearText()
    await inputField.typeText('First edit')

    await element(by.text('Save Changes')).tap()
    await assertChangesSaved()

    // Verify first edit
    await expect(element(by.text('First edit'))).toBeVisible()

    // Second edit
    await element(by.id(/edit-button-.*/)).atIndex(0).tap()
    await waitFor(
      element(by.text(/Edit Morning Check-in|Edit Evening Reflection/))
    ).toBeVisible()

    await inputField.clearText()
    await inputField.typeText('Second edit')

    await element(by.text('Save Changes')).tap()
    await assertChangesSaved()

    // Verify second edit
    await expect(element(by.text('Second edit'))).toBeVisible()
    await expect(element(by.text('First edit'))).not.toBeVisible()
  })

  it('should discard changes when going back without saving', async () => {
    await navigateToJournal()

    await waitFor(element(by.id(/day-card-.*/)))
      .toBeVisible()
      .withTimeout(5000)

    // Get the original text
    const originalText = await element(by.id('daily-goal-text')).atIndex(0).getAttributes()

    // Start editing
    await element(by.id(/edit-button-.*/)).atIndex(0).tap()
    await waitFor(
      element(by.text(/Edit Morning Check-in|Edit Evening Reflection/))
    ).toBeVisible()

    // Make changes
    const inputField = element(by.id(/daily-goal-input|quick-win-input/))
    await inputField.clearText()
    await inputField.typeText('This should be discarded')

    // Go back without saving
    await element(by.id('back-button')).tap()

    // Should return to journal
    await assertOnJournalScreen()

    // Original text should still be there
    await expect(element(by.text('This should be discarded'))).not.toBeVisible()
  })

  it('should handle editing both morning and evening check-ins', async () => {
    await navigateToJournal()

    await waitFor(element(by.id(/day-card-.*/)))
      .toBeVisible()
      .withTimeout(5000)

    // Find a day with both morning and evening check-ins
    // Edit morning check-in
    await element(by.id('edit-button-morning')).atIndex(0).tap()
    await expect(element(by.text('Edit Morning Check-in'))).toBeVisible()

    await element(by.id('daily-goal-input')).clearText()
    await element(by.id('daily-goal-input')).typeText('Updated morning goal')
    await element(by.text('Save Changes')).tap()
    await assertChangesSaved()

    // Edit evening check-in
    await element(by.id('edit-button-evening')).atIndex(0).tap()
    await expect(element(by.text('Edit Evening Reflection'))).toBeVisible()

    await element(by.id('quick-win-input')).clearText()
    await element(by.id('quick-win-input')).typeText('Updated quick win')
    await element(by.text('Save Changes')).tap()
    await assertChangesSaved()

    // Verify both updates
    await expect(element(by.text('Updated morning goal'))).toBeVisible()
    await expect(element(by.text('Updated quick win'))).toBeVisible()
  })
})
