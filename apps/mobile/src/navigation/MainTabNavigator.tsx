import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { getFocusedRouteNameFromRoute, NavigatorScreenParams } from '@react-navigation/native'
import { HomeStackNavigator, HomeStackParamList } from './HomeStackNavigator'
import { ProfileStackNavigator } from './ProfileStackNavigator'
import type { ProfileStackParamList } from '../types'
import { JournalScreen } from '../screens/main/JournalScreen'
import { InsightsScreen } from '../screens/main/InsightsScreen'
import { CustomTabBar } from '../components/CustomTabBar'

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined
  JournalTab: undefined
  InsightsTab: undefined
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined
}

const Tab = createBottomTabNavigator<MainTabParamList>()

// Screens where tab bar should be hidden
const HIDDEN_TAB_BAR_SCREENS = [
  'MorningCheckIn',
  'EveningCheckIn',
  'EditProfile',
  'CareerGoal',
  'ReminderSettings',
]

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      id="MainTabs"
      tabBar={(props) => {
        // Check if current route should hide tab bar
        const route = props.state.routes[props.state.index]
        const focusedRouteName = getFocusedRouteNameFromRoute(route)

        if (focusedRouteName && HIDDEN_TAB_BAR_SCREENS.includes(focusedRouteName)) {
          return null
        }

        return <CustomTabBar {...props} />
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="JournalTab" component={JournalScreen} />
      <Tab.Screen name="InsightsTab" component={InsightsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  )
}
