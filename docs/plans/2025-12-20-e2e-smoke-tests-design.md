# E2E Smoke Tests Design

**Date:** 2025-12-20
**Status:** Approved
**Goal:** Add smoke tests for logged-in user flows to catch regressions

---

## Overview

Add e2e smoke tests covering all logged-in user flows. Focus on happy paths with key error states to ensure flows don't break when adding features.

**Scope:** Tests assume user is already authenticated (skipping broken auth tests for now).

---

## Test File Structure

```
apps/mobile/e2e/
├── helpers/
│   ├── index.ts              # Re-exports all helpers
│   ├── auth.ts               # (existing)
│   ├── navigation.ts         # (existing) - extend
│   ├── assertions.ts         # (existing) - extend
│   ├── utils.ts              # (existing)
│   └── profile.ts            # NEW - profile/settings helpers
├── profile-settings.test.ts  # NEW - 5 tests
├── navigation-tabs.test.ts   # NEW - 4 tests
└── logout.test.ts            # NEW - 2 tests
```

---

## Test Cases

### profile-settings.test.ts (5 tests)

| Test | Description |
|------|-------------|
| Edit profile - change name | Navigate → change name → save → verify persisted |
| Edit profile - validation error | Empty name shows error, doesn't save |
| Career goal - change roles | Update current/target role → verify focus areas update |
| Reminder settings - toggle times | Change morning/evening times → save → verify |
| Reminder settings - toggle push | Enable/disable push toggle → verify state |

### navigation-tabs.test.ts (4 tests)

| Test | Description |
|------|-------------|
| Tab switching | Tap each tab → verify correct screen loads |
| Header notification button | Tap → lands on ReminderSettings |
| Header settings button | Tap → lands on Profile tab |
| Deep link from home | Home → Journal tab via InsightsPreview |

### logout.test.ts (2 tests)

| Test | Description |
|------|-------------|
| Successful logout | Tap sign out → lands on Welcome screen |
| Session cleared | After logout, relaunch app → still on Welcome |

**Total: 11 smoke tests**

---

## New Helpers

### helpers/profile.ts

```typescript
export async function navigateToEditProfile()
export async function navigateToCareerGoal()
export async function navigateToReminderSettings()
export async function updateProfileName(name: string)
export async function selectRole(rolePickerId: string, role: string)
export async function togglePushNotifications(enabled: boolean)
export async function saveSettings()
```

### Extend helpers/navigation.ts

```typescript
export async function navigateToTab(tab: 'Home' | 'Journal' | 'Insights' | 'Profile')
export async function tapHeaderNotificationButton()
export async function tapHeaderSettingsButton()
```

### Extend helpers/assertions.ts

```typescript
export async function assertOnProfileScreen()
export async function assertOnEditProfileScreen()
export async function assertOnCareerGoalScreen()
export async function assertOnReminderSettingsScreen()
export async function assertSettingsSaved()
export async function assertOnWelcomeScreen()
export async function assertValidationError(pattern?: RegExp)
```

---

## Required TestIDs

### ProfileScreen.tsx
- `profile-screen` - Screen container
- `edit-profile-row` - Edit Profile menu item
- `career-goal-row` - Career Goal menu item
- `reminder-settings-row` - Reminders menu item
- `sign-out-button` - Sign out button

### EditProfileScreen.tsx
- `edit-profile-screen` - Screen container
- `name-input` - Name text input
- `save-button` - Save button

### CareerGoalScreen.tsx
- `career-goal-screen` - Screen container
- `current-role-picker` - Role selector
- `target-role-picker` - Target role selector
- `save-button` - Save button

### ReminderSettingsScreen.tsx
- `reminder-settings-screen` - Screen container
- `push-toggle` - Push notifications toggle
- `morning-time-picker` - Morning time
- `evening-time-picker` - Evening time
- `save-button` - Save button

### MainTabNavigator.tsx
- `tab-home` - Home tab button
- `tab-journal` - Journal tab button
- `tab-insights` - Insights tab button
- `tab-profile` - Profile tab button

### HomeScreen.tsx
- `header-notification-button` - Notification icon button
- `header-settings-button` - Settings icon button

---

## Implementation Pattern

### Shared Test Setup (DRY)

```typescript
beforeAll(async () => {
  await device.launchApp({ newInstance: true })
})

beforeEach(async () => {
  await device.reloadReactNative()
  await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
})
```

### Helper Pattern

```typescript
export async function navigateToEditProfile() {
  await navigateToTab('Profile')
  await element(by.id('edit-profile-row')).tap()
  await waitFor(element(by.id('edit-profile-screen')))
    .toBeVisible()
    .withTimeout(3000)
}
```

### Error Assertion Pattern

```typescript
export async function assertValidationError(pattern: RegExp = /required|invalid/i) {
  await waitFor(element(by.text(pattern)))
    .toBeVisible()
    .withTimeout(2000)
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `e2e/helpers/profile.ts` | Create |
| `e2e/helpers/navigation.ts` | Extend |
| `e2e/helpers/assertions.ts` | Extend |
| `e2e/helpers/index.ts` | Re-export |
| `e2e/profile-settings.test.ts` | Create |
| `e2e/navigation-tabs.test.ts` | Create |
| `e2e/logout.test.ts` | Create |
| `src/screens/main/ProfileScreen.tsx` | Add testIDs |
| `src/screens/main/HomeScreen.tsx` | Add testIDs |
| `src/screens/settings/EditProfileScreen.tsx` | Add testIDs |
| `src/screens/settings/CareerGoalScreen.tsx` | Add testIDs |
| `src/screens/settings/ReminderSettingsScreen.tsx` | Add testIDs |
| `src/navigation/MainTabNavigator.tsx` | Add testIDs |
