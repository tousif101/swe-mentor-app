import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { HomeStackNavigator } from './HomeStackNavigator'
import { JournalScreen } from '../screens/main/JournalScreen'
import { InsightsScreen } from '../screens/main/InsightsScreen'
import { ProfileScreen } from '../screens/main/ProfileScreen'
import { CustomTabBar } from '../components/CustomTabBar'

export type MainTabParamList = {
  HomeTab: undefined
  JournalTab: undefined
  InsightsTab: undefined
  ProfileTab: undefined
}

const Tab = createBottomTabNavigator<MainTabParamList>()

// Screens where tab bar should be hidden
const HIDDEN_TAB_BAR_SCREENS = ['MorningCheckIn', 'EveningCheckIn']

export function MainTabNavigator() {
  return (
    <Tab.Navigator
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
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
