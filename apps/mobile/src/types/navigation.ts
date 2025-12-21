import type { NavigatorScreenParams } from '@react-navigation/native'
import type { HomeStackParamList } from '../navigation/HomeStackNavigator'
import type { ProfileStackParamList } from './settings'

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined
  JournalTab: undefined
  InsightsTab: undefined
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined
}

// Extend the global ReactNavigation namespace for type-safe navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainTabParamList {}
  }
}
