import { View, Text, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../navigation/RootNavigator'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>
}

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-gray-950 items-center justify-center px-6">
      {/* Animated Logo */}
      <LinearGradient
        colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-24 h-24 rounded-3xl mb-8 items-center justify-center"
      >
        <View className="w-12 h-12 items-center justify-center">
          <Text className="text-white text-2xl">SW</Text>
        </View>
      </LinearGradient>

      <Text className="text-3xl font-bold text-white mb-4">SWE Mentor</Text>
      <Text className="text-gray-400 text-center mb-12">
        Your AI-powered career companion for software engineering growth
      </Text>

      {/* Get Started Button */}
      <Pressable
        onPress={() => navigation.navigate('Signup')}
        className="w-full mb-4"
      >
        <LinearGradient
          colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="py-4 rounded-2xl items-center"
        >
          <Text className="text-white font-semibold text-lg">Get Started</Text>
        </LinearGradient>
      </Pressable>

      {/* Already have account Button */}
      <Pressable
        onPress={() => navigation.navigate('Login')}
        className="w-full py-4 rounded-2xl border border-gray-700 items-center"
      >
        <Text className="text-gray-300">I already have an account</Text>
      </Pressable>
    </View>
  )
}
