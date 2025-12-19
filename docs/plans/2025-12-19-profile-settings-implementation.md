# Profile Settings Implementation Plan

**Date:** 2025-12-19
**Design:** [2025-12-19-profile-settings-design.md](./2025-12-19-profile-settings-design.md)

---

## Implementation Order

1. Add constants and types
2. Extract ReminderTimeSelector component
3. Create navigation structure
4. Implement EditProfileScreen
5. Implement CareerGoalScreen
6. Implement ReminderSettingsScreen
7. Update ProfileScreen with navigation
8. Add haptic feedback utility

---

## Task 1: Add Constants and Types

**File:** `apps/mobile/src/constants/index.ts`

Add animation and validation constants:

```typescript
// Toast durations (in ms)
export const TOAST_DURATION = {
  short: 2000,
  normal: 3000,
} as const

// Validation requirements
export const NAME_REQUIREMENTS = {
  minLength: 2,
  maxLength: 50,
} as const

// Time options for reminders
export const MORNING_TIME_OPTIONS = [
  { label: '7:00 AM', value: '07:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '9:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
] as const

export const EVENING_TIME_OPTIONS = [
  { label: '5:00 PM', value: '17:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '7:00 PM', value: '19:00' },
] as const

export type TimeOption = {
  label: string
  value: string
}
```

**File:** `apps/mobile/src/types/settings.ts` (new file)

```typescript
export type ReminderSettings = {
  morningEnabled: boolean
  morningTime: string
  eveningEnabled: boolean
  eveningTime: string
  pushEnabled: boolean
  timezone: string
}

export type ProfileStackParamList = {
  ProfileMain: undefined
  EditProfile: undefined
  CareerGoal: undefined
  ReminderSettings: undefined
}
```

---

## Task 2: Extract ReminderTimeSelector Component

**File:** `apps/mobile/src/components/ReminderTimeSelector.tsx`

Extract from `ReminderSetupScreen.tsx`. Clean implementation:

```typescript
import { View, Text, Pressable, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeIn,
  FadeOut,
  Layout
} from 'react-native-reanimated'
import { COLORS } from '../constants'
import type { TimeOption } from '../constants'

type Props = {
  type: 'morning' | 'evening'
  enabled: boolean
  selectedTime: string
  timeOptions: readonly TimeOption[]
  onToggleChange: (enabled: boolean) => void
  onTimeChange: (time: string) => void
}

const CONFIG = {
  morning: {
    icon: 'sunny' as const,
    iconColor: '#fbbf24', // amber-400
    title: 'Morning Check-in',
    subtitle: 'Set your daily intentions',
  },
  evening: {
    icon: 'moon' as const,
    iconColor: COLORS.primary,
    title: 'Evening Check-in',
    subtitle: 'Reflect on your progress',
  },
} as const

export function ReminderTimeSelector({
  type,
  enabled,
  selectedTime,
  timeOptions,
  onToggleChange,
  onTimeChange,
}: Props) {
  const config = CONFIG[type]

  return (
    <View className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
      {/* Header with toggle */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center mb-1">
            <Ionicons name={config.icon} size={20} color={config.iconColor} />
            <Text className="text-white font-semibold text-lg ml-2">
              {config.title}
            </Text>
          </View>
          <Text className="text-gray-400 text-sm">{config.subtitle}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggleChange}
          trackColor={{ false: '#374151', true: '#7c3aed' }}
          thumbColor="#ffffff"
          ios_backgroundColor="#374151"
        />
      </View>

      {/* Time picker chips - animated */}
      {enabled && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={Layout.springify()}
          className="flex-row flex-wrap gap-2"
        >
          {timeOptions.map((time) => (
            <TimeChip
              key={time.value}
              label={time.label}
              selected={time.value === selectedTime}
              onPress={() => onTimeChange(time.value)}
            />
          ))}
        </Animated.View>
      )}
    </View>
  )
}

type TimeChipProps = {
  label: string
  selected: boolean
  onPress: () => void
}

function TimeChip({ label, selected, onPress }: TimeChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2.5 rounded-xl border ${
        selected
          ? 'bg-primary-600/20 border-primary-600'
          : 'bg-gray-800 border-gray-700'
      }`}
    >
      <Text
        className={selected ? 'text-primary-400 font-medium' : 'text-gray-300'}
      >
        {label}
      </Text>
    </Pressable>
  )
}
```

**Update:** `apps/mobile/src/components/index.ts`

```typescript
export { ReminderTimeSelector } from './ReminderTimeSelector'
```

**Update:** `apps/mobile/src/screens/onboarding/ReminderSetupScreen.tsx`

Replace inline time picker with `ReminderTimeSelector` component. Import from components and use with `MORNING_TIME_OPTIONS` and `EVENING_TIME_OPTIONS` from constants.

---

## Task 3: Create Navigation Structure

**File:** `apps/mobile/src/navigation/ProfileStackNavigator.tsx` (new file)

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ProfileScreen } from '../screens/main/ProfileScreen'
import {
  EditProfileScreen,
  CareerGoalScreen,
  ReminderSettingsScreen,
} from '../screens/settings'
import { COLORS } from '../constants'
import type { ProfileStackParamList } from '../types/settings'

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="CareerGoal" component={CareerGoalScreen} />
      <Stack.Screen name="ReminderSettings" component={ReminderSettingsScreen} />
    </Stack.Navigator>
  )
}
```

**Update:** `apps/mobile/src/navigation/MainTabNavigator.tsx`

Replace direct `ProfileScreen` with `ProfileStackNavigator` in the Profile tab.

---

## Task 4: Implement EditProfileScreen

**File:** `apps/mobile/src/screens/settings/EditProfileScreen.tsx`

```typescript
import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useProfileContext } from '../../contexts'
import { supabase } from '../../lib/supabase'
import { triggerHaptic, showToast } from '../../utils'
import { NAME_REQUIREMENTS, COLORS } from '../../constants'
import { logger } from '../../utils/logger'

export function EditProfileScreen() {
  const navigation = useNavigation()
  const { profile, refreshProfile } = useProfileContext()

  const [name, setName] = useState(profile?.name ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const originalName = profile?.name ?? ''
  const hasChanges = name.trim() !== originalName
  const isValid = name.trim().length >= NAME_REQUIREMENTS.minLength
  const canSave = hasChanges && isValid && !isSaving

  const handleSave = useCallback(async () => {
    if (!canSave || !profile?.id) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', profile.id)

      if (error) throw error

      await refreshProfile()
      triggerHaptic('success')
      showToast('Profile updated')
      navigation.goBack()
    } catch (error) {
      logger.error('Failed to update profile', error)
      showToast('Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [canSave, name, profile?.id, refreshProfile, navigation])

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-950"
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-16 pb-4">
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="text-white text-xl font-semibold ml-2">
          Edit Profile
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {/* Name Input */}
        <View className="mt-6">
          <Text className="text-gray-400 text-sm mb-2">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={COLORS.textMuted}
            maxLength={NAME_REQUIREMENTS.maxLength}
            autoCapitalize="words"
            autoCorrect={false}
            className="bg-gray-900 rounded-xl px-4 py-4 text-white text-base border border-gray-800"
          />
          <Text className="text-gray-500 text-sm mt-2">
            Your name is displayed on your profile and check-ins.
          </Text>
        </View>

        {/* Validation hint */}
        {name.length > 0 && !isValid && (
          <Text className="text-amber-500 text-sm mt-2">
            Name must be at least {NAME_REQUIREMENTS.minLength} characters
          </Text>
        )}
      </ScrollView>

      {/* Save Button */}
      <View className="px-6 pb-8">
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`py-4 rounded-2xl items-center ${
            canSave ? 'bg-primary-600' : 'bg-gray-800'
          }`}
        >
          <Text
            className={`font-semibold text-lg ${
              canSave ? 'text-white' : 'text-gray-500'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
```

---

## Task 5: Implement CareerGoalScreen

**File:** `apps/mobile/src/screens/settings/CareerGoalScreen.tsx`

```typescript
import { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeIn, Layout } from 'react-native-reanimated'
import { useProfileContext } from '../../contexts'
import { supabase } from '../../lib/supabase'
import { ROLE_CONFIG, calculateFocusAreas, type DbRole } from '../../lib/roleMapping'
import { triggerHaptic, showToast } from '../../utils'
import { COLORS } from '../../constants'
import { logger } from '../../utils/logger'

const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, config]) => ({
  value: value as DbRole,
  label: config.label,
}))

export function CareerGoalScreen() {
  const navigation = useNavigation()
  const { profile, refreshProfile } = useProfileContext()

  const [currentRole, setCurrentRole] = useState<DbRole>(
    (profile?.role as DbRole) ?? 'software_engineer_1'
  )
  const [targetRole, setTargetRole] = useState<DbRole>(
    (profile?.target_role as DbRole) ?? 'senior_engineer'
  )
  const [isSaving, setIsSaving] = useState(false)

  const originalRole = profile?.role as DbRole
  const originalTargetRole = profile?.target_role as DbRole
  const hasChanges = currentRole !== originalRole || targetRole !== originalTargetRole

  // Calculate focus areas based on selected roles
  const focusAreas = useMemo(
    () => calculateFocusAreas(currentRole, targetRole),
    [currentRole, targetRole]
  )

  const showRolePicker = useCallback(
    (type: 'current' | 'target') => {
      const currentValue = type === 'current' ? currentRole : targetRole
      const setter = type === 'current' ? setCurrentRole : setTargetRole
      const title = type === 'current' ? 'Current Role' : 'Target Role'

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', ...ROLE_OPTIONS.map((r) => r.label)],
            cancelButtonIndex: 0,
            title,
          },
          (buttonIndex) => {
            if (buttonIndex > 0) {
              setter(ROLE_OPTIONS[buttonIndex - 1].value)
            }
          }
        )
      } else {
        // Android: Use Alert with buttons (or implement bottom sheet)
        Alert.alert(
          title,
          undefined,
          [
            { text: 'Cancel', style: 'cancel' },
            ...ROLE_OPTIONS.map((role) => ({
              text: role.label,
              onPress: () => setter(role.value),
            })),
          ]
        )
      }
    },
    [currentRole, targetRole]
  )

  const handleSave = useCallback(() => {
    if (!hasChanges) return

    Alert.alert(
      'Update Career Goal',
      'This will update your focus areas based on your new role gap. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setIsSaving(true)
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  role: currentRole,
                  target_role: targetRole,
                  focus_areas: focusAreas,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', profile?.id)

              if (error) throw error

              await refreshProfile()
              triggerHaptic('success')
              showToast('Career goal updated')
              navigation.goBack()
            } catch (error) {
              logger.error('Failed to update career goal', error)
              showToast('Failed to update', 'error')
            } finally {
              setIsSaving(false)
            }
          },
        },
      ]
    )
  }, [hasChanges, currentRole, targetRole, focusAreas, profile?.id, refreshProfile, navigation])

  const getRoleLabel = (role: DbRole) => ROLE_CONFIG[role]?.label ?? role

  return (
    <View className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-16 pb-4">
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="text-white text-xl font-semibold ml-2">
          Career Goal
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Current Role Picker */}
        <View className="mt-6">
          <Text className="text-gray-400 text-sm mb-2">Current Role</Text>
          <Pressable
            onPress={() => showRolePicker('current')}
            className="bg-gray-900 rounded-xl px-4 py-4 flex-row items-center justify-between border border-gray-800"
          >
            <Text className="text-white text-base">
              {getRoleLabel(currentRole)}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {/* Target Role Picker */}
        <View className="mt-6">
          <Text className="text-gray-400 text-sm mb-2">Target Role</Text>
          <Pressable
            onPress={() => showRolePicker('target')}
            className="bg-gray-900 rounded-xl px-4 py-4 flex-row items-center justify-between border border-gray-800"
          >
            <Text className="text-white text-base">
              {getRoleLabel(targetRole)}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {/* Focus Areas Preview */}
        <Animated.View
          layout={Layout.springify()}
          className="mt-8 bg-primary-600/10 rounded-2xl p-4 border border-primary-600/20"
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="information-circle" size={20} color="#a78bfa" />
            <Text className="text-white font-medium ml-2">Your Focus Areas</Text>
          </View>
          <Text className="text-gray-400 text-sm mb-3">
            Based on your role gap:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {focusAreas.map((area, index) => (
              <Animated.View
                key={area}
                entering={FadeIn.delay(index * 50).duration(200)}
                className="bg-primary-600/20 rounded-lg px-3 py-1.5"
              >
                <Text className="text-primary-300 text-sm">{area}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Save Button */}
      <View className="px-6 pb-8">
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          className={`py-4 rounded-2xl items-center ${
            hasChanges ? 'bg-primary-600' : 'bg-gray-800'
          }`}
        >
          <Text
            className={`font-semibold text-lg ${
              hasChanges ? 'text-white' : 'text-gray-500'
            }`}
          >
            {isSaving
              ? 'Updating...'
              : hasChanges
              ? 'Update Career Goal'
              : 'No Changes'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
```

---

## Task 6: Implement ReminderSettingsScreen

**File:** `apps/mobile/src/screens/settings/ReminderSettingsScreen.tsx`

```typescript
import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../../hooks'
import { supabase } from '../../lib/supabase'
import { ReminderTimeSelector } from '../../components'
import { triggerHaptic, showToast } from '../../utils'
import {
  COLORS,
  MORNING_TIME_OPTIONS,
  EVENING_TIME_OPTIONS,
} from '../../constants'
import { logger } from '../../utils/logger'
import type { ReminderSettings } from '../../types/settings'

export function ReminderSettingsScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()

  const [settings, setSettings] = useState<ReminderSettings>({
    morningEnabled: true,
    morningTime: '09:00',
    eveningEnabled: true,
    eveningTime: '18:00',
    pushEnabled: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [originalSettings, setOriginalSettings] = useState<ReminderSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load current settings
  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (data) {
          const loaded: ReminderSettings = {
            morningEnabled: data.morning_enabled ?? true,
            morningTime: data.morning_time?.slice(0, 5) ?? '09:00',
            eveningEnabled: data.evening_enabled ?? true,
            eveningTime: data.evening_time?.slice(0, 5) ?? '18:00',
            pushEnabled: data.push_enabled ?? true,
            timezone: data.timezone ?? settings.timezone,
          }
          setSettings(loaded)
          setOriginalSettings(loaded)
        } else {
          setOriginalSettings(settings)
        }
      } catch (error) {
        logger.error('Failed to load reminder settings', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [user?.id])

  const hasChanges = originalSettings
    ? JSON.stringify(settings) !== JSON.stringify(originalSettings)
    : false

  const handlePushToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()

        if (status !== 'granted') {
          Alert.alert(
            'Notifications Disabled',
            'To receive reminders, enable notifications in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          )
          return
        }
      }
    }

    setSettings((prev) => ({ ...prev, pushEnabled: enabled }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!hasChanges || !user?.id) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          morning_enabled: settings.morningEnabled,
          morning_time: settings.morningTime + ':00',
          evening_enabled: settings.eveningEnabled,
          evening_time: settings.eveningTime + ':00',
          push_enabled: settings.pushEnabled,
          timezone: settings.timezone,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      triggerHaptic('success')
      showToast('Reminders updated')
      navigation.goBack()
    } catch (error) {
      logger.error('Failed to save reminder settings', error)
      showToast('Failed to save', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [hasChanges, user?.id, settings, navigation])

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-16 pb-4">
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="text-white text-xl font-semibold ml-2">Reminders</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Morning Reminder */}
        <View className="mt-4">
          <ReminderTimeSelector
            type="morning"
            enabled={settings.morningEnabled}
            selectedTime={settings.morningTime}
            timeOptions={MORNING_TIME_OPTIONS}
            onToggleChange={(enabled) =>
              setSettings((prev) => ({ ...prev, morningEnabled: enabled }))
            }
            onTimeChange={(time) =>
              setSettings((prev) => ({ ...prev, morningTime: time }))
            }
          />
        </View>

        {/* Evening Reminder */}
        <View className="mt-4">
          <ReminderTimeSelector
            type="evening"
            enabled={settings.eveningEnabled}
            selectedTime={settings.eveningTime}
            timeOptions={EVENING_TIME_OPTIONS}
            onToggleChange={(enabled) =>
              setSettings((prev) => ({ ...prev, eveningEnabled: enabled }))
            }
            onTimeChange={(time) =>
              setSettings((prev) => ({ ...prev, eveningTime: time }))
            }
          />
        </View>

        {/* Push Notifications */}
        <View className="mt-6 bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
                <Text className="text-white font-semibold text-lg ml-2">
                  Push Notifications
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">
                Receive reminder alerts on your device
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: '#374151', true: '#7c3aed' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#374151"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="px-6 pb-8">
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          className={`py-4 rounded-2xl items-center ${
            hasChanges ? 'bg-primary-600' : 'bg-gray-800'
          }`}
        >
          <Text
            className={`font-semibold text-lg ${
              hasChanges ? 'text-white' : 'text-gray-500'
            }`}
          >
            {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
```

**File:** `apps/mobile/src/screens/settings/index.ts`

```typescript
export { EditProfileScreen } from './EditProfileScreen'
export { CareerGoalScreen } from './CareerGoalScreen'
export { ReminderSettingsScreen } from './ReminderSettingsScreen'
```

---

## Task 7: Update ProfileScreen with Navigation

**File:** `apps/mobile/src/screens/main/ProfileScreen.tsx`

Update to add navigation handlers:

```typescript
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { ProfileStackParamList } from '../../types/settings'

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>()
  // ... existing code ...

  // Update the settings Pressables:
  // Edit Profile → navigation.navigate('EditProfile')
  // Career Goal → navigation.navigate('CareerGoal')
  // Reminders → navigation.navigate('ReminderSettings')
}
```

Update settings menu items:
- Replace "Notifications" with "Career Goal" (icon: `flag-outline`)
- Keep "Reminders" (icon: `time-outline`)
- Keep "Edit Profile" (icon: `person-outline`)
- Keep "Help & Support" (icon: `help-circle-outline`)

---

## Task 8: Add Haptic Feedback and Toast Utilities

**File:** `apps/mobile/src/utils/feedback.ts` (new file)

```typescript
import * as Haptics from 'expo-haptics'
import { Platform, ToastAndroid } from 'react-native'
// For iOS toast, you may need a library like react-native-toast-message
// or implement a custom toast component

type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium'

const HAPTIC_MAP: Record<HapticType, Haptics.NotificationFeedbackType | Haptics.ImpactFeedbackStyle> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
}

export async function triggerHaptic(type: HapticType = 'success'): Promise<void> {
  try {
    const feedback = HAPTIC_MAP[type]
    if (type === 'success' || type === 'warning' || type === 'error') {
      await Haptics.notificationAsync(feedback as Haptics.NotificationFeedbackType)
    } else {
      await Haptics.impactAsync(feedback as Haptics.ImpactFeedbackStyle)
    }
  } catch {
    // Haptics not available (e.g., simulator)
  }
}

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  } else {
    // iOS: Use a toast library or custom implementation
    // For now, console.log as placeholder - implement with react-native-toast-message
    console.log(`[Toast ${type}]: ${message}`)
  }
}
```

**Update:** `apps/mobile/src/utils/index.ts`

```typescript
export { triggerHaptic, showToast } from './feedback'
```

---

## Dependencies to Install

```bash
npx expo install expo-haptics expo-notifications
```

---

## Testing Checklist

- [ ] EditProfileScreen: Save disabled when no changes
- [ ] EditProfileScreen: Validation shows for short names
- [ ] EditProfileScreen: Save updates DB and shows toast
- [ ] CareerGoalScreen: Role pickers open action sheet
- [ ] CareerGoalScreen: Focus areas update live when roles change
- [ ] CareerGoalScreen: Confirmation dialog appears before save
- [ ] CareerGoalScreen: Focus areas saved to DB correctly
- [ ] ReminderSettingsScreen: Loads current settings from DB
- [ ] ReminderSettingsScreen: Time chips animate on selection
- [ ] ReminderSettingsScreen: Push toggle requests permissions
- [ ] ReminderSettingsScreen: Save updates DB correctly
- [ ] ProfileScreen: All menu items navigate correctly
- [ ] Navigation: Back button works on all screens
- [ ] Haptics: Feedback triggers on save actions
