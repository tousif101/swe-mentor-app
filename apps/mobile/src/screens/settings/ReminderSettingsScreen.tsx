import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Switch,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../../hooks'
import { supabase } from '../../lib/supabase'
import { ReminderTimeSelector } from '../../components'
import { showFeedback, logger } from '../../utils'
import {
  COLORS,
  MORNING_TIME_OPTIONS,
  EVENING_TIME_OPTIONS,
  DEFAULT_REMINDER_TIMES,
} from '../../constants'
import type { ReminderSettings } from '../../types'
import type { ProfileStackParamList } from '../../types'

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ReminderSettings'>
}

type SettingsState = {
  morningEnabled: boolean
  morningTime: string
  eveningEnabled: boolean
  eveningTime: string
  pushEnabled: boolean
  timezone: string
}

export function ReminderSettingsScreen({ navigation }: Props) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [settings, setSettings] = useState<SettingsState>({
    morningEnabled: true,
    morningTime: DEFAULT_REMINDER_TIMES.morning,
    eveningEnabled: true,
    eveningTime: DEFAULT_REMINDER_TIMES.evening,
    pushEnabled: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const [initialSettings, setInitialSettings] = useState<SettingsState>(settings)

  // Load current settings from database with cleanup to prevent memory leak
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)

        const { data, error } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!isMounted) return

        if (error && error.code !== 'PGRST116') {
          logger.error('Error loading notification settings:', error)
          return
        }

        if (data) {
          const morningTime = data.morning_time?.substring(0, 5) || DEFAULT_REMINDER_TIMES.morning
          const eveningTime = data.evening_time?.substring(0, 5) || DEFAULT_REMINDER_TIMES.evening

          const loadedSettings: SettingsState = {
            morningEnabled: data.morning_enabled ?? true,
            morningTime,
            eveningEnabled: data.evening_enabled ?? true,
            eveningTime,
            pushEnabled: data.push_enabled ?? true,
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          }

          setSettings(loadedSettings)
          setInitialSettings(loadedSettings)
        }
      } catch (err) {
        if (isMounted) {
          logger.error('Error loading settings:', err)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Check if settings have changed
  useEffect(() => {
    const changed =
      settings.morningEnabled !== initialSettings.morningEnabled ||
      settings.morningTime !== initialSettings.morningTime ||
      settings.eveningEnabled !== initialSettings.eveningEnabled ||
      settings.eveningTime !== initialSettings.eveningTime ||
      settings.pushEnabled !== initialSettings.pushEnabled

    setHasChanges(changed)
  }, [settings, initialSettings])

  // Handle push notifications toggle
  const handlePushToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Request permission when enabling
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus !== 'granted') {
          // Permission denied - show alert with option to open settings
          Alert.alert(
            'Permission Required',
            'Push notifications are disabled. Please enable them in your device settings to receive reminders.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:')
                  } else {
                    Linking.openSettings()
                  }
                },
              },
            ]
          )
          return
        }

        // Permission granted
        setSettings((prev) => ({ ...prev, pushEnabled: true }))
      } catch (error) {
        logger.error('Error requesting notification permissions:', error)
        Alert.alert('Error', 'Failed to request notification permissions. Please try again.')
      }
    } else {
      // Disabling - no permission check needed
      setSettings((prev) => ({ ...prev, pushEnabled: false }))
    }
  }, [])

  // Handle save
  const handleSave = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsSaving(true)

      // Add :00 suffix to times for database storage (time without timezone format)
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert(
          {
            user_id: user.id,
            morning_enabled: settings.morningEnabled,
            morning_time: `${settings.morningTime}:00`,
            evening_enabled: settings.eveningEnabled,
            evening_time: `${settings.eveningTime}:00`,
            push_enabled: settings.pushEnabled,
            timezone: settings.timezone,
          },
          { onConflict: 'user_id' }
        )

      if (error) {
        logger.error('Error saving notification settings:', error)
        await showFeedback('Failed to save settings', 'error')
        return
      }

      // Update initial settings to match current (for change detection)
      setInitialSettings(settings)
      setHasChanges(false)

      await showFeedback('Settings saved successfully', 'success')

      // Navigate back after successful save
      navigation.goBack()
    } catch (err) {
      logger.error('Error saving settings:', err)
      await showFeedback('Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, settings, navigation])

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-950">
      <ScrollView className="flex-1 px-6 pt-14" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => navigation.goBack()}
              className="mr-3 w-10 h-10 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </Pressable>
            <Text className="text-2xl font-bold text-white">
              Reminder Settings
            </Text>
          </View>
          <Text className="text-gray-400 text-sm ml-13">
            Customize when you receive check-in reminders
          </Text>
        </View>

        {/* Push Notifications Toggle - Separate Card */}
        <View className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="notifications"
                  size={20}
                  color={settings.pushEnabled ? COLORS.primary : COLORS.textSecondary}
                />
                <Text className="text-white font-semibold text-lg ml-2">
                  Push Notifications
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">
                Receive reminders on this device
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: '#374151', true: COLORS.primaryDark }}
              thumbColor={COLORS.textPrimary}
              ios_backgroundColor="#374151"
            />
          </View>
        </View>

        {/* Morning Check-in */}
        <View className="mb-4">
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

        {/* Evening Check-in */}
        <View className="mb-6">
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

        {/* Info Note */}
        <View className="bg-primary-600/10 border border-primary-600/20 rounded-xl p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle"
              size={20}
              color={COLORS.primary}
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <Text className="text-primary-400 text-sm flex-1">
              Reminders will be sent based on your device's timezone ({settings.timezone})
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Save Button */}
      <View className="px-6 pb-8 pt-4 bg-gray-950 border-t border-gray-800">
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          className={`rounded-2xl py-4 items-center ${
            hasChanges && !isSaving
              ? 'bg-primary-600'
              : 'bg-gray-800'
          }`}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text
              className={`font-semibold text-lg ${
                hasChanges ? 'text-white' : 'text-gray-500'
              }`}
            >
              Save Settings
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}
