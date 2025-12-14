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
import { signupSchema } from '../utils/validation'
import { AuthStackParamList } from '../navigation/RootNavigator'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>
}

type FormErrors = {
  email?: string
  password?: string
  confirmPassword?: string
  form?: string
}

export function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSignup = async () => {
    setErrors({})

    const parsed = signupSchema.safeParse({ email, password, confirmPassword })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      })
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    setIsLoading(false)

    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ form: 'An account with this email already exists' })
      } else {
        setErrors({ form: 'Unable to create account. Please try again.' })
      }
      return
    }

    setIsSuccess(true)
  }

  // Success state
  if (isSuccess) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-6">
          <Text className="text-green-400 text-3xl">✓</Text>
        </View>
        <Text className="text-3xl font-bold text-white mb-3">Check your email</Text>
        <Text className="text-gray-400 text-center mb-8">
          We've sent you a confirmation link to verify your account
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Login')}
          className="w-full py-3.5 rounded-xl items-center"
          style={{ backgroundColor: '#7c3aed' }}
        >
          <Text className="text-white font-medium">Back to login</Text>
        </Pressable>
      </View>
    )
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
          Create an account
        </Text>
        <Text className="text-gray-400 text-center mb-8 text-sm">
          Start your software engineering journey
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
              placeholder="Create a password"
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

        {/* Confirm Password Input */}
        <View className="mb-4">
          <View className="flex-row items-center bg-gray-800 border border-gray-700 rounded-xl">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showConfirmPassword}
              autoComplete="off"
              textContentType="none"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 px-4 py-3.5 text-white"
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="px-4 py-3.5"
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#6b7280"
              />
            </Pressable>
          </View>
          {errors.confirmPassword && (
            <Text className="text-red-400 text-sm mt-1">{errors.confirmPassword}</Text>
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
          onPress={handleSignup}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl items-center mb-4"
          style={{ backgroundColor: '#7c3aed' }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-medium">Create account</Text>
          )}
        </Pressable>

        {/* Sign In Link */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500 text-sm">Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text className="text-primary-400 text-sm" style={{ color: '#a78bfa' }}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
