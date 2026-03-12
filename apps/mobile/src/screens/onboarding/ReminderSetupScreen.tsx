import { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { ProgressBar, ReminderTimeSelector } from '../../components'
import {
  MORNING_TIME_OPTIONS,
  EVENING_TIME_OPTIONS,
  DEFAULT_REMINDER_TIMES,
} from '../../constants'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'ReminderSetup'>
  route: RouteProp<OnboardingStackParamList, 'ReminderSetup'>
}

export function ReminderSetupScreen({ navigation, route }: Props) {
  const { name, role, targetRole, companyName, companySize, careerMatrixId } = route.params

  // Morning settings
  const [morningEnabled, setMorningEnabled] = useState(true)
  const [morningTime, setMorningTime] = useState<string>(DEFAULT_REMINDER_TIMES.morning)

  // Evening settings
  const [eveningEnabled, setEveningEnabled] = useState(true)
  const [eveningTime, setEveningTime] = useState<string>(DEFAULT_REMINDER_TIMES.evening)

  // Timezone - default to device timezone
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  const handleContinue = () => {
    // Navigate to Ready screen with all data including reminder preferences
    navigation.navigate('Ready', {
      name,
      role,
      targetRole,
      companyName,
      companySize,
      careerMatrixId,
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
      companyName,
      companySize,
      careerMatrixId,
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

        {/* Morning Check-in */}
        <View className="mb-4">
          <ReminderTimeSelector
            type="morning"
            enabled={morningEnabled}
            selectedTime={morningTime}
            timeOptions={MORNING_TIME_OPTIONS}
            onToggleChange={setMorningEnabled}
            onTimeChange={setMorningTime}
          />
        </View>

        {/* Evening Check-in */}
        <View className="mb-6">
          <ReminderTimeSelector
            type="evening"
            enabled={eveningEnabled}
            selectedTime={eveningTime}
            timeOptions={EVENING_TIME_OPTIONS}
            onToggleChange={setEveningEnabled}
            onTimeChange={setEveningTime}
          />
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
