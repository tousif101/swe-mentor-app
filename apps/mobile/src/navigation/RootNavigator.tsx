import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../hooks'
import { ProfileProvider, useProfileContext } from '../contexts'
import { WelcomeScreen } from '../screens/WelcomeScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { SignupScreen } from '../screens/SignupScreen'
import { OnboardingNavigator } from './OnboardingNavigator'
import { MainTabNavigator } from './MainTabNavigator'

export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Signup: undefined
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()

function AuthNavigator() {
  return (
    <AuthStack.Navigator
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
    <View className="flex-1 bg-gray-950 items-center justify-center">
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  )
}

function RootNavigatorContent() {
  const { session } = useAuth()
  const { profile, isLoading: profileLoading } = useProfileContext()

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

  return <NavigationContainer>{getNavigator()}</NavigationContainer>
}

export function RootNavigator() {
  const { user, isLoading: authLoading } = useAuth()

  // Show loading while checking auth
  if (authLoading) {
    return <LoadingScreen />
  }

  return (
    <ProfileProvider userId={user?.id ?? null}>
      <RootNavigatorContent />
    </ProfileProvider>
  )
}
