import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ProfileScreen } from '../screens/main/ProfileScreen'
import {
  EditProfileScreen,
  CareerGoalScreen,
  ReminderSettingsScreen,
} from '../screens/settings'
import { COLORS } from '../constants'
import type { ProfileStackParamList } from '../types'

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      id="ProfileStack"
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
