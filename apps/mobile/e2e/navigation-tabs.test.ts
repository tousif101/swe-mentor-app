/**
 * Detox E2E Test: Tab Navigation
 * Tests navigation between tabs and header buttons
 */

import {
  loginAsTestUser,
  TEST_CREDENTIALS,
  navigateToTab,
  navigateToHome,
  tapHeaderNotificationButton,
  tapHeaderSettingsButton,
  assertOnHomeScreen,
  assertOnJournalScreen,
  assertOnInsightsScreen,
  assertOnProfileScreen,
  assertOnReminderSettingsScreen,
} from './helpers'

describe('Tab Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
  })

  describe('Bottom Tabs', () => {
    it('should navigate between all tabs', async () => {
      // Start at Home
      await assertOnHomeScreen()

      // Navigate to Journal
      await navigateToTab('Journal')
      await assertOnJournalScreen()

      // Navigate to Insights
      await navigateToTab('Insights')
      await assertOnInsightsScreen()

      // Navigate to Profile
      await navigateToTab('Profile')
      await assertOnProfileScreen()

      // Back to Home
      await navigateToTab('Home')
      await assertOnHomeScreen()
    })
  })

  describe('Header Buttons', () => {
    it('should navigate to Reminder Settings via notification button', async () => {
      await navigateToHome()

      // Tap notification button
      await tapHeaderNotificationButton()

      // Should be on Reminder Settings
      await assertOnReminderSettingsScreen()
    })

    it('should navigate to Profile via settings button', async () => {
      await navigateToHome()

      // Tap settings button
      await tapHeaderSettingsButton()

      // Should be on Profile
      await assertOnProfileScreen()
    })
  })
})
