import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { loginSchema } from '../utils/validation'
import { AuthStackParamList } from '../navigation/RootNavigator'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>
}

type FormErrors = {
  email?: string
  password?: string
  form?: string
}

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleLogin = async () => {
    setErrors({})

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      })
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword(parsed.data)
    setIsLoading(false)

    if (error) {
      setErrors({ form: 'Invalid email or password' })
    }
    // Success: useAuth hook will detect session change and navigate
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-950"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-6">
          <LinearGradient
            colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-14 h-14 rounded-xl"
          />
        </View>

        {/* Header */}
        <Text className="text-3xl font-bold text-white text-center mb-3">
          Welcome back
        </Text>
        <Text className="text-gray-400 text-center mb-8 text-sm">
          Sign in to continue your journey
        </Text>

        {/* Email Input */}
        <View className="mb-4">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
            autoCorrect={false}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white"
          />
          {errors.email && (
            <Text className="text-red-400 text-sm mt-1">{errors.email}</Text>
          )}
        </View>

        {/* Password Input */}
        <View className="mb-4">
          <View className="flex-row items-center bg-gray-800 border border-gray-700 rounded-xl">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showPassword}
              autoComplete="off"
              textContentType="none"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 px-4 py-3.5 text-white"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="px-4 py-3.5"
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#6b7280"
              />
            </Pressable>
          </View>
          {errors.password && (
            <Text className="text-red-400 text-sm mt-1">{errors.password}</Text>
          )}
        </View>

        {/* Form Error */}
        {errors.form && (
          <View className="mb-4 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <Text className="text-red-400 text-sm">{errors.form}</Text>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleLogin}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-primary-600 items-center mb-4"
          style={{ backgroundColor: '#7c3aed' }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-medium">Sign in</Text>
          )}
        </Pressable>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500 text-sm">Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text className="text-primary-400 text-sm" style={{ color: '#a78bfa' }}>Sign up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
