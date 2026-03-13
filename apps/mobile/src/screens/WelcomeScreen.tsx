import { View, Text, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { AuthStackParamList } from '../navigation/RootNavigator'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>
}

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View testID="welcome-screen" className="flex-1 bg-gray-950 items-center justify-center px-6">
      {/* Logo */}
      <LinearGradient
        colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          marginBottom: 32,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="flash" size={48} color="white" />
      </LinearGradient>

      <Text className="text-3xl font-bold text-white mb-4">SWE Mentor</Text>
      <Text className="text-gray-400 text-center mb-12">
        Your AI-powered career companion for software engineering growth
      </Text>

      {/* Get Started Button */}
      <Pressable
        testID="get-started-button"
        onPress={() => navigation.navigate('Signup')}
        style={{ width: '100%', marginBottom: 16 }}
      >
        <LinearGradient
          colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
          }}
        >
          <Text className="text-white font-semibold text-lg">Get Started</Text>
        </LinearGradient>
      </Pressable>

      {/* Already have account Button */}
      <Pressable
        testID="sign-in-link"
        onPress={() => navigation.navigate('Login')}
        className="w-full py-4 rounded-2xl border border-gray-700 items-center"
      >
        <Text className="text-gray-300">I already have an account</Text>
      </Pressable>
    </View>
  )
}
