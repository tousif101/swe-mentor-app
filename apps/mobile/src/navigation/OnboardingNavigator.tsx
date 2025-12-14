import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ProfileScreen, ReadyScreen } from '../screens/onboarding'
import type { DbRole } from '../lib/roleMapping'

export type OnboardingStackParamList = {
  Profile: undefined
  Ready: {
    name: string
    role: DbRole
    targetRole: DbRole
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
      <Stack.Screen name="Ready" component={ReadyScreen} />
    </Stack.Navigator>
  )
}
