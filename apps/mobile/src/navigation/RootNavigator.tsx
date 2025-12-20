import { useRef, useCallback } from 'react'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator } from 'react-native'
import { useAuth, usePushNotifications } from '../hooks'
import { ProfileProvider, useProfileContext } from '../contexts'
import { WelcomeScreen } from '../screens/WelcomeScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { SignupScreen } from '../screens/SignupScreen'
import { OnboardingNavigator } from './OnboardingNavigator'
import { MainTabNavigator } from './MainTabNavigator'
import type { MainTabParamList } from '../types'

export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Signup: undefined
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      id="AuthStack"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#030712' },
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  )
}


function LoadingScreen() {
  return (
    <View testID="auth-loading" className="flex-1 bg-gray-950 items-center justify-center">
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  )
}

function RootNavigatorContent() {
  const { session } = useAuth()
  const { profile, isLoading: profileLoading } = useProfileContext()
  const navigationRef = useRef<NavigationContainerRef<MainTabParamList>>(null)

  // Handle notification taps - navigate to check-in screen
  const handleNotificationTap = useCallback((data: { screen?: string }) => {
    if (!navigationRef.current?.isReady()) {
      return
    }

    // Only navigate if user is authenticated and onboarded
    if (session && profile?.onboarding_completed) {
      if (data.screen === 'MorningCheckIn') {
        navigationRef.current.navigate('HomeTab', {
          screen: 'MorningCheckIn',
        })
      } else if (data.screen === 'EveningCheckIn') {
        navigationRef.current.navigate('HomeTab', {
          screen: 'EveningCheckIn',
        })
      }
    }
  }, [session, profile?.onboarding_completed])

  // Initialize push notifications (only when authenticated)
  usePushNotifications({
    onNotificationTap: handleNotificationTap,
  })

  // Show loading while checking profile for authenticated users
  if (session && profileLoading) {
    return <LoadingScreen />
  }

  // Determine which navigator to show
  const getNavigator = () => {
    // Not authenticated -> Auth flow
    if (!session) {
      return <AuthNavigator />
    }

    // Authenticated but onboarding not complete -> Onboarding flow
    if (!profile?.onboarding_completed) {
      return <OnboardingNavigator />
    }

    // Authenticated and onboarded -> Main app
    return <MainTabNavigator />
  }

  return <NavigationContainer ref={navigationRef}>{getNavigator()}</NavigationContainer>
}

export function RootNavigator() {
  const { user, isLoading: authLoading } = useAuth()

  // Gate ProfileProvider on auth completion to prevent race conditions
  // ProfileProvider should only initialize after auth state is determined
  if (authLoading) {
    return <LoadingScreen />
  }

  return (
    <ProfileProvider userId={user?.id ?? null}>
      <RootNavigatorContent />
    </ProfileProvider>
  )
}
