import { useState, useEffect } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { ProgressBar } from '../../components/ProgressBar'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'ReminderSetup'>
  route: RouteProp<OnboardingStackParamList, 'ReminderSetup'>
}

type TimeOption = {
  label: string
  value: string // HH:MM format
}

const MORNING_TIMES: TimeOption[] = [
  { label: '7:00 AM', value: '07:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '9:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
]

const EVENING_TIMES: TimeOption[] = [
  { label: '5:00 PM', value: '17:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '7:00 PM', value: '19:00' },
]

export function ReminderSetupScreen({ navigation, route }: Props) {
  const { name, role, targetRole } = route.params

  // Morning settings
  const [morningEnabled, setMorningEnabled] = useState(true)
  const [morningTime, setMorningTime] = useState('09:00')

  // Evening settings
  const [eveningEnabled, setEveningEnabled] = useState(true)
  const [eveningTime, setEveningTime] = useState('18:00')

  // Timezone - default to device timezone
  const [timezone, setTimezone] = useState('America/New_York')

  useEffect(() => {
    // Get device timezone
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (deviceTimezone) {
      setTimezone(deviceTimezone)
    }
  }, [])

  const handleContinue = () => {
    // Navigate to Ready screen with all data including reminder preferences
    navigation.navigate('Ready', {
      name,
      role,
      targetRole,
      reminderSettings: {
        morningEnabled,
        morningTime,
        eveningEnabled,
        eveningTime,
        timezone,
      },
    })
  }

  const handleSkip = () => {
    // Navigate to Ready screen without reminder settings
    navigation.navigate('Ready', {
      name,
      role,
      targetRole,
      reminderSettings: {
        morningEnabled: false,
        morningTime: '09:00',
        eveningEnabled: false,
        eveningTime: '18:00',
        timezone,
      },
    })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-950"
    >
      <ProgressBar currentStep={2} totalSteps={3} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-white text-center mb-3">
            Set your reminders
          </Text>
          <Text className="text-gray-400 text-center text-sm leading-5">
            Daily check-ins help you stay accountable and track your growth
          </Text>
        </View>

        {/* Morning Check-in Card */}
        <View className="bg-gray-900/50 rounded-2xl p-5 mb-4 border border-gray-800">
          {/* Header with toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="sunny" size={20} color="#fbbf24" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Morning Check-in
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">
                Set your daily intentions
              </Text>
            </View>
            <Switch
              value={morningEnabled}
              onValueChange={setMorningEnabled}
              trackColor={{ false: '#374151', true: '#7c3aed' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#374151"
            />
          </View>

          {/* Time picker chips */}
          {morningEnabled && (
            <View className="flex-row flex-wrap gap-2">
              {MORNING_TIMES.map((time) => {
                const isSelected = time.value === morningTime
                return (
                  <Pressable
                    key={time.value}
                    onPress={() => setMorningTime(time.value)}
                    className={`px-4 py-2.5 rounded-xl border ${
                      isSelected
                        ? 'bg-primary-600/20 border-primary-600'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <Text
                      className={
                        isSelected ? 'text-primary-400 font-medium' : 'text-gray-300'
                      }
                      style={isSelected ? { color: '#a78bfa' } : {}}
                    >
                      {time.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>

        {/* Evening Check-in Card */}
        <View className="bg-gray-900/50 rounded-2xl p-5 mb-6 border border-gray-800">
          {/* Header with toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="moon" size={20} color="#8b5cf6" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Evening Check-in
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">
                Reflect on your day's progress
              </Text>
            </View>
            <Switch
              value={eveningEnabled}
              onValueChange={setEveningEnabled}
              trackColor={{ false: '#374151', true: '#7c3aed' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#374151"
            />
          </View>

          {/* Time picker chips */}
          {eveningEnabled && (
            <View className="flex-row flex-wrap gap-2">
              {EVENING_TIMES.map((time) => {
                const isSelected = time.value === eveningTime
                return (
                  <Pressable
                    key={time.value}
                    onPress={() => setEveningTime(time.value)}
                    className={`px-4 py-2.5 rounded-xl border ${
                      isSelected
                        ? 'bg-primary-600/20 border-primary-600'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <Text
                      className={
                        isSelected ? 'text-primary-400 font-medium' : 'text-gray-300'
                      }
                      style={isSelected ? { color: '#a78bfa' } : {}}
                    >
                      {time.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>

        {/* Info card */}
        <View className="bg-primary-600/10 rounded-2xl p-4 mb-6 border border-primary-600/20">
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle"
              size={20}
              color="#a78bfa"
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <Text className="text-gray-300 text-sm leading-5 flex-1">
              You can change these settings anytime in your profile
            </Text>
          </View>
        </View>

        <View className="flex-1" />

        {/* Buttons */}
        <View className="gap-3 mt-6">
          {/* Continue Button */}
          <Pressable onPress={handleContinue} style={{ width: '100%' }}>
            <LinearGradient
              colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              <Text className="text-white font-semibold text-lg">Continue</Text>
            </LinearGradient>
          </Pressable>

          {/* Skip Button */}
          <Pressable
            onPress={handleSkip}
            className="py-4 items-center"
          >
            <Text className="text-gray-400 font-medium">Skip for now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
