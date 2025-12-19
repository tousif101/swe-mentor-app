/**
 * Navigation helpers for Detox E2E tests
 */

export async function navigateToHome() {
  await element(by.id('home-tab')).tap()
  await expect(element(by.text('Welcome'))).toBeVisible()
}

export async function navigateToJournal() {
  await element(by.id('journal-tab')).tap()
  await expect(element(by.text('Journal'))).toBeVisible()
}

export async function navigateToProfile() {
  await element(by.id('profile-tab')).tap()
  await expect(element(by.text('Profile'))).toBeVisible()
}

export async function startMorningCheckIn() {
  await navigateToHome()
  await element(by.text(/Start Morning Check-in|Begin Morning Check-in/)).tap()
  await waitFor(element(by.text('Morning Check-in')))
    .toBeVisible()
    .withTimeout(3000)
}

export async function startEveningCheckIn() {
  await navigateToHome()
  await element(by.text(/Start Evening Reflection|Begin Evening Check-in/)).tap()
  await waitFor(element(by.text('Evening Check-in')))
    .toBeVisible()
    .withTimeout(3000)
}

export async function goBack() {
  await element(by.id('back-button')).tap()
}

export async function dismissAlert() {
  await element(by.text(/OK|Close|Done/)).tap()
}
