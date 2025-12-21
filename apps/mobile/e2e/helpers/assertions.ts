/**
 * Custom assertion helpers for Detox E2E tests
 */

export async function assertCheckInComplete() {
  await expect(element(by.text('Check-in Complete!'))).toBeVisible()
  await element(by.text('OK')).tap()
}

export async function assertOnHomeScreen() {
  await expect(element(by.text('Welcome'))).toBeVisible()
}

export async function assertOnJournalScreen() {
  await expect(element(by.text('Journal'))).toBeVisible()
}

export async function assertChangesSaved() {
  await expect(element(by.text('Changes Saved!'))).toBeVisible()
  await element(by.text('OK')).tap()
}

export async function assertCelebrationModal() {
  await expect(element(by.text('Great work today!'))).toBeVisible()
  await element(by.text(/Close|Done|OK/)).tap()
}

export async function assertMorningCheckInCompleted() {
  await expect(
    element(by.id('morning-check-in-completed'))
  ).toBeVisible()
}

export async function assertEveningCheckInCompleted() {
  await expect(
    element(by.id('evening-check-in-completed'))
  ).toBeVisible()
}

export async function assertTextVisible(text: string, timeout = 3000) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout)
}

export async function assertElementVisible(id: string, timeout = 3000) {
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .withTimeout(timeout)
}

export async function assertElementNotVisible(id: string) {
  await expect(element(by.id(id))).not.toBeVisible()
}

/**
 * Assert we're on the Profile screen
 */
export async function assertOnProfileScreen() {
  await waitFor(element(by.id('profile-screen')))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Assert we're on the Edit Profile screen
 */
export async function assertOnEditProfileScreen() {
  await waitFor(element(by.id('edit-profile-screen')))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Assert we're on the Career Goal screen
 */
export async function assertOnCareerGoalScreen() {
  await waitFor(element(by.id('career-goal-screen')))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Assert we're on the Reminder Settings screen
 */
export async function assertOnReminderSettingsScreen() {
  await waitFor(element(by.id('reminder-settings-screen')))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Assert we're on the Welcome screen (after logout)
 */
export async function assertOnWelcomeScreen() {
  await waitFor(element(by.text('Level up your engineering career')))
    .toBeVisible()
    .withTimeout(5000)
}

/**
 * Assert settings were saved successfully
 */
export async function assertSettingsSaved() {
  await waitFor(element(by.text(/saved|updated/i)))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Assert a validation error is visible
 */
export async function assertValidationError(pattern: RegExp = /required|invalid|must be/i) {
  await waitFor(element(by.text(pattern)))
    .toBeVisible()
    .withTimeout(2000)
}

/**
 * Assert we're on the Insights screen
 */
export async function assertOnInsightsScreen() {
  await waitFor(element(by.text('Insights')))
    .toBeVisible()
    .withTimeout(3000)
}
