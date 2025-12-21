# E2E Smoke Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 11 smoke tests covering all logged-in user flows (profile settings, navigation, logout)

**Architecture:** Create reusable test helpers following existing patterns. Add testIDs to screens that need them. Tests assume user is already authenticated via existing `loginAsTestUser` helper.

**Tech Stack:** Detox, Jest, React Native

---

## Task 1: Add TestIDs to CustomTabBar

**Files:**
- Modify: `apps/mobile/src/components/CustomTabBar.tsx:132-164`

**Step 1: Add testID prop to each tab TouchableOpacity**

In `CustomTabBar.tsx`, find the `TouchableOpacity` inside the map function (around line 133) and add the `testID` prop:

```typescript
return (
  <TouchableOpacity
    key={route.key}
    testID={`${route.name.toLowerCase().replace('tab', '-tab')}`}
    accessibilityRole="button"
    // ... rest of props
```

Wait, the existing helpers use `home-tab`, `journal-tab`, etc. Let's match that exactly:

```typescript
// Inside the map callback, around line 132
const testIdMap: Record<string, string> = {
  HomeTab: 'home-tab',
  JournalTab: 'journal-tab',
  InsightsTab: 'insights-tab',
  ProfileTab: 'profile-tab',
}

return (
  <TouchableOpacity
    key={route.key}
    testID={testIdMap[route.name] || route.name.toLowerCase()}
    accessibilityRole="button"
    // ... rest unchanged
```

**Step 2: Verify the change**

Run: `grep -n "testID" apps/mobile/src/components/CustomTabBar.tsx`
Expected: Line showing testID prop added

**Step 3: Commit**

```bash
git add apps/mobile/src/components/CustomTabBar.tsx
git commit -m "feat(e2e): add testIDs to CustomTabBar for navigation tests"
```

---

## Task 2: Add TestIDs to ProfileScreen

**Files:**
- Modify: `apps/mobile/src/screens/main/ProfileScreen.tsx:89-131`

**Step 1: Add testID to screen container and menu items**

Find the settings section Pressables (around line 89-131) and add testIDs:

```typescript
{/* Screen container - add testID to the ScrollView */}
<ScrollView className="flex-1 bg-gray-950" testID="profile-screen">

{/* Edit Profile row - around line 89 */}
<Pressable
  testID="edit-profile-row"
  onPress={() => navigation.navigate('EditProfile')}
  className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800"
>

{/* Career Goal row - around line 100 */}
<Pressable
  testID="career-goal-row"
  onPress={() => navigation.navigate('CareerGoal')}
  className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800"
>

{/* Reminder Settings row - around line 111 */}
<Pressable
  testID="reminder-settings-row"
  onPress={() => navigation.navigate('ReminderSettings')}
  className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800"
>

{/* Sign Out button - around line 136 */}
<Pressable
  testID="sign-out-button"
  onPress={handleLogout}
  className="bg-gray-900 rounded-xl px-6 py-4 border border-red-500/30 mb-8"
>
```

**Step 2: Commit**

```bash
git add apps/mobile/src/screens/main/ProfileScreen.tsx
git commit -m "feat(e2e): add testIDs to ProfileScreen menu items"
```

---

## Task 3: Add TestIDs to EditProfileScreen

**Files:**
- Modify: `apps/mobile/src/screens/settings/EditProfileScreen.tsx`

**Step 1: Add testID to container, input, and save button**

```typescript
{/* Container - KeyboardAvoidingView around line 74 */}
<KeyboardAvoidingView
  testID="edit-profile-screen"
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  className="flex-1 bg-gray-950"
>

{/* Back button - around line 82 */}
<Pressable
  testID="back-button"
  onPress={handleBack}
  className="mr-4 w-10 h-10 items-center justify-center"
>

{/* Name input - around line 99 */}
<TextInput
  testID="name-input"
  value={name}
  onChangeText={(text) => {
    setName(text)
    setError(null)
  }}
  // ... rest unchanged
/>

{/* Save button - around line 128 */}
<Pressable
  testID="save-button"
  onPress={handleSave}
  disabled={!canSave}
  // ... rest unchanged
>
```

**Step 2: Commit**

```bash
git add apps/mobile/src/screens/settings/EditProfileScreen.tsx
git commit -m "feat(e2e): add testIDs to EditProfileScreen"
```

---

## Task 4: Add TestIDs to CareerGoalScreen

**Files:**
- Modify: `apps/mobile/src/screens/settings/CareerGoalScreen.tsx`

**Step 1: Add testID to container, pickers, and save button**

```typescript
{/* Container - ScrollView around line 167 */}
<ScrollView style={styles.container} testID="career-goal-screen">

{/* Back button - around line 172 */}
<Pressable
  testID="back-button"
  onPress={() => navigation.goBack()}
  style={styles.backButton}
>

{/* Current role picker - around line 188 */}
<Pressable
  testID="current-role-picker"
  onPress={handleCurrentRolePress}
  style={styles.picker}
>

{/* Target role picker - around line 210 */}
<Pressable
  testID="target-role-picker"
  onPress={handleTargetRolePress}
  style={[styles.picker, !currentRole && styles.pickerDisabled]}
  disabled={!currentRole}
>

{/* Save button - around line 255 */}
<Pressable
  testID="save-button"
  onPress={handleSave}
  disabled={!hasChanges || isSaving || !currentRole || !targetRole}
  // ... rest unchanged
>
```

**Step 2: Commit**

```bash
git add apps/mobile/src/screens/settings/CareerGoalScreen.tsx
git commit -m "feat(e2e): add testIDs to CareerGoalScreen"
```

---

## Task 5: Add TestIDs to ReminderSettingsScreen

**Files:**
- Modify: `apps/mobile/src/screens/settings/ReminderSettingsScreen.tsx`

**Step 1: Add testID to container, toggle, and save button**

```typescript
{/* Container - outer View around line 232 */}
<View className="flex-1 bg-gray-950" testID="reminder-settings-screen">

{/* Back button - around line 237 */}
<Pressable
  testID="back-button"
  onPress={() => navigation.goBack()}
  className="mr-3 w-10 h-10 items-center justify-center"
>

{/* Push notifications switch - around line 270 */}
<Switch
  testID="push-toggle"
  value={settings.pushEnabled}
  onValueChange={handlePushToggle}
  // ... rest unchanged
/>

{/* Save button - around line 330 */}
<Pressable
  testID="save-button"
  onPress={handleSave}
  disabled={!hasChanges || isSaving}
  // ... rest unchanged
>
```

**Step 2: Commit**

```bash
git add apps/mobile/src/screens/settings/ReminderSettingsScreen.tsx
git commit -m "feat(e2e): add testIDs to ReminderSettingsScreen"
```

---

## Task 6: Add TestIDs to HomeScreen Header Buttons

**Files:**
- Modify: `apps/mobile/src/screens/main/HomeScreen.tsx:237-255`

**Step 1: Add testID to notification and settings buttons**

```typescript
{/* Header icons - around line 236 */}
<View style={styles.headerIcons}>
  <TouchableOpacity
    testID="header-notification-button"
    style={styles.iconButton}
    onPress={() => {
      navigation.getParent()?.navigate('ProfileTab', {
        screen: 'ReminderSettings',
      })
    }}
  >
    <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
  </TouchableOpacity>
  <TouchableOpacity
    testID="header-settings-button"
    style={styles.iconButton}
    onPress={() => {
      navigation.getParent()?.navigate('ProfileTab')
    }}
  >
    <Ionicons name="settings-outline" size={20} color="#9CA3AF" />
  </TouchableOpacity>
</View>
```

**Step 2: Commit**

```bash
git add apps/mobile/src/screens/main/HomeScreen.tsx
git commit -m "feat(e2e): add testIDs to HomeScreen header buttons"
```

---

## Task 7: Create Profile Helpers Module

**Files:**
- Create: `apps/mobile/e2e/helpers/profile.ts`

**Step 1: Create the helpers file**

```typescript
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
```

**Step 2: Commit**

```bash
git add apps/mobile/e2e/helpers/profile.ts
git commit -m "feat(e2e): create profile helpers module"
```

---

## Task 8: Extend Navigation Helpers

**Files:**
- Modify: `apps/mobile/e2e/helpers/navigation.ts`

**Step 1: Add new navigation helpers**

Add these functions to the end of the file:

```typescript
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
```

**Step 2: Commit**

```bash
git add apps/mobile/e2e/helpers/navigation.ts
git commit -m "feat(e2e): extend navigation helpers with tab and header button functions"
```

---

## Task 9: Extend Assertions Helpers

**Files:**
- Modify: `apps/mobile/e2e/helpers/assertions.ts`

**Step 1: Add new assertion helpers**

Add these functions to the end of the file:

```typescript
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
```

**Step 2: Commit**

```bash
git add apps/mobile/e2e/helpers/assertions.ts
git commit -m "feat(e2e): extend assertions with profile, settings, and welcome screen checks"
```

---

## Task 10: Update Helpers Index

**Files:**
- Modify: `apps/mobile/e2e/helpers/index.ts`

**Step 1: Export the new profile helpers**

```typescript
/**
 * Export all test helpers
 */

export * from './auth'
export * from './navigation'
export * from './assertions'
export * from './utils'
export * from './profile'
```

**Step 2: Commit**

```bash
git add apps/mobile/e2e/helpers/index.ts
git commit -m "feat(e2e): export profile helpers from index"
```

---

## Task 11: Create Profile Settings Tests

**Files:**
- Create: `apps/mobile/e2e/profile-settings.test.ts`

**Step 1: Create the test file**

```typescript
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
```

**Step 2: Commit**

```bash
git add apps/mobile/e2e/profile-settings.test.ts
git commit -m "feat(e2e): add profile settings smoke tests"
```

---

## Task 12: Create Navigation Tabs Tests

**Files:**
- Create: `apps/mobile/e2e/navigation-tabs.test.ts`

**Step 1: Create the test file**

```typescript
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
```

**Step 2: Commit**

```bash
git add apps/mobile/e2e/navigation-tabs.test.ts
git commit -m "feat(e2e): add tab navigation smoke tests"
```

---

## Task 13: Create Logout Tests

**Files:**
- Create: `apps/mobile/e2e/logout.test.ts`

**Step 1: Create the test file**

```typescript
/**
 * Detox E2E Test: Logout Flow
 * Tests signing out and session clearing
 */

import {
  loginAsTestUser,
  TEST_CREDENTIALS,
  navigateToProfile,
  tapSignOut,
  assertOnWelcomeScreen,
} from './helpers'

describe('Logout Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should logout and return to Welcome screen', async () => {
    // Login first
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Navigate to Profile
    await navigateToProfile()

    // Tap sign out
    await tapSignOut()

    // Should be on Welcome screen
    await assertOnWelcomeScreen()

    // Verify login buttons are visible
    await expect(element(by.text('Get Started'))).toBeVisible()
    await expect(element(by.text('Sign in'))).toBeVisible()
  })

  it('should stay logged out after app restart', async () => {
    // Login first
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Navigate to Profile and logout
    await navigateToProfile()
    await tapSignOut()
    await assertOnWelcomeScreen()

    // Relaunch app
    await device.launchApp({ newInstance: true })

    // Should still be on Welcome screen (not auto-logged in)
    await assertOnWelcomeScreen()
  })
})
```

**Step 2: Commit**

```bash
git add apps/mobile/e2e/logout.test.ts
git commit -m "feat(e2e): add logout smoke tests"
```

---

## Task 14: Final Verification

**Step 1: Run TypeScript check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: No errors

**Step 2: List all e2e tests**

Run: `ls -la apps/mobile/e2e/*.test.ts`
Expected: See all test files including new ones

**Step 3: Final commit with all files**

```bash
git add -A
git commit -m "feat(e2e): complete smoke test suite for logged-in user flows

- Add testIDs to CustomTabBar, ProfileScreen, settings screens, HomeScreen
- Create profile helpers module
- Extend navigation and assertion helpers
- Add profile-settings.test.ts (5 tests)
- Add navigation-tabs.test.ts (4 tests)
- Add logout.test.ts (2 tests)

Total: 11 new smoke tests"
```

---

## Summary

| Task | Files | Tests |
|------|-------|-------|
| 1-6 | Add testIDs to 6 components | - |
| 7-10 | Create/extend 4 helper files | - |
| 11 | profile-settings.test.ts | 5 |
| 12 | navigation-tabs.test.ts | 4 |
| 13 | logout.test.ts | 2 |
| 14 | Verification | - |

**Total: 14 tasks, 11 new tests**
