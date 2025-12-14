import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, ActivityIndicator, Pressable } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { WelcomeScreen } from '../screens/WelcomeScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { SignupScreen } from '../screens/SignupScreen'
import { supabase } from '../lib/supabase'

export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Signup: undefined
}

export type AppStackParamList = {
  Home: undefined
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()

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

// Placeholder home screen until main app is built
function HomeScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <View className="flex-1 bg-gray-950 items-center justify-center">
      <Text className="text-white text-2xl font-bold mb-4">Welcome!</Text>
      <Text className="text-gray-400 mb-8">You are logged in</Text>
      <Pressable
        onPress={handleLogout}
        className="px-6 py-3 rounded-xl border border-gray-700"
      >
        <Text className="text-gray-300">Sign out</Text>
      </Pressable>
    </View>
  )
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#030712' },
      }}
    >
      <AppStack.Screen name="Home" component={HomeScreen} />
    </AppStack.Navigator>
  )
}

function LoadingScreen() {
  return (
    <View className="flex-1 bg-gray-950 items-center justify-center">
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  )
}

export function RootNavigator() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
