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

/**
 * Navigate to Insights tab
 */
export async function navigateToInsights() {
  await element(by.id('insights-tab')).tap()
  await expect(element(by.text('Insights'))).toBeVisible()
}

/**
 * Navigate to any tab by name
 */
export async function navigateToTab(tab: 'Home' | 'Journal' | 'Insights' | 'Profile') {
  const tabMap = {
    Home: { id: 'home-tab', text: 'Welcome' },
    Journal: { id: 'journal-tab', text: 'Journal' },
    Insights: { id: 'insights-tab', text: 'Insights' },
    Profile: { id: 'profile-tab', text: 'Profile' },
  }

  const config = tabMap[tab]
  await element(by.id(config.id)).tap()
  await waitFor(element(by.text(config.text)))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Tap the notification button in Home header
 */
export async function tapHeaderNotificationButton() {
  await element(by.id('header-notification-button')).tap()
}

/**
 * Tap the settings button in Home header
 */
export async function tapHeaderSettingsButton() {
  await element(by.id('header-settings-button')).tap()
}
