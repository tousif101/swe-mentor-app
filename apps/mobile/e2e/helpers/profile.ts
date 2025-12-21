/**
 * Profile and settings helpers for Detox E2E tests
 */

import { navigateToProfile } from './navigation'

/**
 * Navigate to Edit Profile screen
 */
export async function navigateToEditProfile() {
  await navigateToProfile()
  await element(by.id('edit-profile-row')).tap()
  await waitFor(element(by.id('edit-profile-screen')))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Navigate to Career Goal screen
 */
export async function navigateToCareerGoal() {
  await navigateToProfile()
  await element(by.id('career-goal-row')).tap()
  await waitFor(element(by.id('career-goal-screen')))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Navigate to Reminder Settings screen
 */
export async function navigateToReminderSettings() {
  await navigateToProfile()
  await element(by.id('reminder-settings-row')).tap()
  await waitFor(element(by.id('reminder-settings-screen')))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Update the profile name
 */
export async function updateProfileName(name: string) {
  const input = element(by.id('name-input'))
  await input.clearText()
  await input.typeText(name)
}

/**
 * Tap the save button on settings screens
 */
export async function tapSaveButton() {
  await element(by.id('save-button')).tap()
}

/**
 * Tap the back button
 */
export async function tapBackButton() {
  await element(by.id('back-button')).tap()
}

/**
 * Tap sign out button on Profile screen
 */
export async function tapSignOut() {
  await element(by.id('sign-out-button')).tap()
}
