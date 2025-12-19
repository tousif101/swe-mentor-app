import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../screens/main/HomeScreen'
import { MorningCheckInScreen } from '../screens/main/MorningCheckInScreen'
import { EveningCheckInScreen } from '../screens/main/EveningCheckInScreen'

export type HomeStackParamList = {
  Home: undefined
  MorningCheckIn: {
    checkInId?: string
    returnTo?: 'JournalTab' | 'HomeTab'
    prefill?: {
      focus_area?: string | null
      daily_goal?: string | null
    }
  } | undefined
  EveningCheckIn: {
    checkInId?: string
    returnTo?: 'JournalTab' | 'HomeTab'
    prefill?: {
      goal_completed?: string | null
      quick_win?: string | null
      blocker?: string | null
      energy_level?: number | null
      tomorrow_carry?: string | null
    }
  } | undefined
}

const Stack = createNativeStackNavigator<HomeStackParamList>()

export function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#030712',
        },
        headerTintColor: '#ffffff',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#030712' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MorningCheckIn"
        component={MorningCheckInScreen}
        options={{
          title: 'Morning Check-in',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="EveningCheckIn"
        component={EveningCheckInScreen}
        options={{
          title: 'Evening Check-in',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  )
}
