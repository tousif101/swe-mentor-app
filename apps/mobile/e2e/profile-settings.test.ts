/**
 * Detox E2E Test: Profile Settings
 * Tests profile and settings screens
 */

import {
  loginAsTestUser,
  TEST_CREDENTIALS,
  navigateToEditProfile,
  navigateToCareerGoal,
  navigateToReminderSettings,
  updateProfileName,
  tapSaveButton,
  tapBackButton,
  assertOnEditProfileScreen,
  assertOnCareerGoalScreen,
  assertOnReminderSettingsScreen,
  assertOnProfileScreen,
  assertSettingsSaved,
  assertValidationError,
} from './helpers'

describe('Profile Settings', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
  })

  describe('Edit Profile', () => {
    it('should change name and save successfully', async () => {
      await navigateToEditProfile()
      await assertOnEditProfileScreen()

      // Change name
      const newName = `Test User ${Date.now()}`
      await updateProfileName(newName)

      // Save
      await tapSaveButton()
      await assertSettingsSaved()

      // Should return to Profile screen
      await assertOnProfileScreen()

      // Verify name updated
      await expect(element(by.text(newName))).toBeVisible()
    })

    it('should show validation error for empty name', async () => {
      await navigateToEditProfile()
      await assertOnEditProfileScreen()

      // Clear name
      await updateProfileName('')

      // Save button should be disabled or show error
      // Try to save anyway
      await tapSaveButton()

      // Should show validation error
      await assertValidationError(/must be at least/i)
    })
  })

  describe('Career Goal', () => {
    it('should update roles and show focus areas', async () => {
      await navigateToCareerGoal()
      await assertOnCareerGoalScreen()

      // Tap current role picker
      await element(by.id('current-role-picker')).tap()

      // Select a role
      await element(by.text('Software Engineer 2')).tap()

      // Tap target role picker
      await element(by.id('target-role-picker')).tap()

      // Select target role
      await element(by.text('Senior Software Engineer')).tap()

      // Verify focus areas preview appears
      await expect(element(by.text('Your Focus Areas'))).toBeVisible()
    })
  })

  describe('Reminder Settings', () => {
    it('should toggle push notifications', async () => {
      await navigateToReminderSettings()
      await assertOnReminderSettingsScreen()

      // Toggle push notifications
      const toggle = element(by.id('push-toggle'))
      await toggle.tap()

      // Save
      await tapSaveButton()
      await assertSettingsSaved()
    })

    it('should navigate back without saving', async () => {
      await navigateToReminderSettings()
      await assertOnReminderSettingsScreen()

      // Go back without saving
      await tapBackButton()

      // Should be on Profile screen
      await assertOnProfileScreen()
    })
  })
})
