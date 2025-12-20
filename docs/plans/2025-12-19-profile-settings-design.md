# Profile Settings Design

**Date:** 2025-12-19
**Status:** Approved

## Overview

Complete the Profile section with Edit Profile, Career Goal, and Reminder Settings screens. Users can update their name, change roles (with focus area recalculation), and configure reminder times with push notification permissions.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Role change behavior | Recalculate focus areas with confirmation | Role changes are significant; user should see preview before committing |
| Edit Profile scope | Name only | Separates low-risk (name) from high-risk (role) changes |
| Career Goal screen | Dedicated screen with live preview | Shows focus area impact before saving |
| Reminder screen approach | Extract shared component from onboarding | DRY, consistent UI, faster to ship |
| Save behavior | Toast + navigate back | Matches iOS settings pattern |
| Push permissions | Integrated in Reminders screen | Contextual - user understands why permissions needed |
| Menu consolidation | Remove separate Notifications item | Push is part of Reminders; cleaner menu |

---

## ProfileScreen Menu

Updated settings menu structure:

```
┌─────────────────────────────────────┐
│ 👤 Edit Profile              >      │  → EditProfileScreen
├─────────────────────────────────────┤
│ 🎯 Career Goal               >      │  → CareerGoalScreen
├─────────────────────────────────────┤
│ 🔔 Reminders                 >      │  → ReminderSettingsScreen
├─────────────────────────────────────┤
│ ❓ Help & Support            >      │  → (placeholder)
└─────────────────────────────────────┘
```

---

## Screen Designs

### EditProfileScreen

Simple single-field screen for name changes.

```
┌─────────────────────────────────────┐
│  ← Back            Edit Profile     │
├─────────────────────────────────────┤
│                                     │
│  Name                               │
│  ┌─────────────────────────────┐    │
│  │ John Doe                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  Your name is displayed on your     │
│  profile and check-ins.             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Save Changes        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- Pre-fills current name from profile context
- Save button disabled until name changes and is valid
- Validation: required, min 2 characters
- On save: update `profiles.name`, haptic feedback, toast "Profile updated", navigate back

---

### CareerGoalScreen

Dedicated flow for role changes with focus area preview.

```
┌─────────────────────────────────────┐
│  ← Back            Career Goal      │
├─────────────────────────────────────┤
│                                     │
│  Current Role                       │
│  ┌─────────────────────────────┐    │
│  │ Software Engineer II      ▼ │    │
│  └─────────────────────────────┘    │
│                                     │
│  Target Role                        │
│  ┌─────────────────────────────┐    │
│  │ Senior Engineer           ▼ │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ℹ️ Your Focus Areas          │    │
│  │                              │    │
│  │ Based on your role gap:      │    │
│  │ • System Design              │    │
│  │ • Technical Leadership       │    │
│  │ • Code Review                │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       Update Career Goal     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- Pre-fills current role and target role from profile
- Role pickers use iOS action sheet (bottom sheet pattern)
- Focus areas preview updates live as roles change (animated)
- Button states:
  - No changes: "No changes" (disabled)
  - Changes pending: "Update Career Goal" (enabled)
- On tap: native confirmation alert "This will update your focus areas. Continue?"
- On confirm: update `profiles.role`, `profiles.target_role`, `profiles.focus_areas`
- Haptic feedback, toast "Career goal updated", navigate back

**Animations:**
- Focus area chips animate with staggered fade+slide when preview updates
- Button state transitions smoothly (opacity/color)

---

### ReminderSettingsScreen

Configure reminder times and push notifications.

```
┌─────────────────────────────────────┐
│  ← Back              Reminders      │
├─────────────────────────────────────┤
│                                     │
│  ☀️ Morning Check-in         [ON]   │
│  Set your daily intentions          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│  │ 7 AM │ │ 8 AM │ │ 9 AM │ │10AM│ │
│  └──────┘ └──────┘ └──────┘ └────┘ │
│                                     │
│  🌙 Evening Check-in         [ON]   │
│  Reflect on your progress           │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 5 PM │ │ 6 PM │ │ 7 PM │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔔 Push Notifications    [ON] │  │
│  │    Receive reminder alerts    │  │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Save Changes        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- Loads current settings from `user_notification_settings` table
- Toggle switches for morning/evening enable/disable
- Time chips appear when toggle is ON (animated)
- Push notifications toggle:
  - If turning ON and permissions not granted → request permissions
  - If permissions denied → show inline message with link to Settings
- Save: update DB, haptic feedback, toast "Reminders updated", navigate back

**Animations:**
- Time chips: scale + color transition on selection
- Toggle: spring animation
- Time picker section: height animation on show/hide

---

## Component Architecture

### New Shared Component

**ReminderTimeSelector** - Extracted from onboarding `ReminderSetupScreen`:

```typescript
type ReminderTimeSelectorProps = {
  type: 'morning' | 'evening'
  enabled: boolean
  selectedTime: string
  onToggleChange: (enabled: boolean) => void
  onTimeChange: (time: string) => void
}
```

Used by:
- `ReminderSetupScreen` (onboarding)
- `ReminderSettingsScreen` (settings)

### File Structure

```
src/
├── components/
│   ├── ReminderTimeSelector.tsx      # NEW - extracted shared component
│   └── index.ts                      # Updated exports
├── screens/
│   ├── settings/                     # NEW folder
│   │   ├── EditProfileScreen.tsx
│   │   ├── CareerGoalScreen.tsx
│   │   ├── ReminderSettingsScreen.tsx
│   │   └── index.ts
│   └── main/
│       └── ProfileScreen.tsx         # Updated with navigation
```

---

## Navigation

Add to profile navigation stack:

```typescript
type ProfileStackParamList = {
  ProfileMain: undefined
  EditProfile: undefined
  CareerGoal: undefined
  ReminderSettings: undefined
}
```

ProfileScreen navigates to child screens via `navigation.navigate()`.

---

## Database Updates

No schema changes needed. Uses existing tables:

- `profiles` - name, role, target_role, focus_areas
- `user_notification_settings` - morning/evening times and enabled flags

---

## Animation Summary

| Screen | Element | Animation |
|--------|---------|-----------|
| EditProfileScreen | Save button | Opacity/color transition on enable/disable |
| CareerGoalScreen | Focus area chips | Staggered fade+slide on update |
| CareerGoalScreen | Save button | Smooth state transition |
| ReminderSettingsScreen | Time chips | Scale + color on selection |
| ReminderSettingsScreen | Toggle | Spring animation |
| ReminderSettingsScreen | Time section | Height animation on show/hide |
| All screens | Success | Haptic feedback + toast slide from top |

---

## iOS Design Patterns

- Native action sheets for role pickers
- Native `Alert.alert()` for confirmation dialogs
- Haptic feedback on save actions (`expo-haptics`)
- Toast notifications for success feedback
- Standard iOS push navigation transitions
- Keyboard-aware scroll views for input screens
