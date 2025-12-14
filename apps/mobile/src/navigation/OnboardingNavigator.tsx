import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ProfileScreen, ReminderSetupScreen, ReadyScreen } from '../screens/onboarding'
import type { DbRole } from '../lib/roleMapping'

export type ReminderSettings = {
  morningEnabled: boolean
  morningTime: string
  eveningEnabled: boolean
  eveningTime: string
  timezone: string
}

export type OnboardingStackParamList = {
  Profile: undefined
  ReminderSetup: {
    name: string
    role: DbRole
    targetRole: DbRole
  }
  Ready: {
    name: string
    role: DbRole
    targetRole: DbRole
    reminderSettings?: ReminderSettings
  }
}

const Stack = createNativeStackNavigator<OnboardingStackParamList>()

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#030712' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ReminderSetup" component={ReminderSetupScreen} />
      <Stack.Screen name="Ready" component={ReadyScreen} />
    </Stack.Navigator>
  )
}
