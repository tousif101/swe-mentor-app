import { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { ProgressBar } from '../../components/ProgressBar'
import { ROLE_CONFIG, getFocusAreas, type DbRole } from '../../lib/roleMapping'
import { supabase } from '../../lib/supabase'
import { useProfileContext } from '../../contexts'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Ready'>
  route: RouteProp<OnboardingStackParamList, 'Ready'>
}

export function ReadyScreen({ navigation, route }: Props) {
  const { name, role, targetRole } = route.params
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refetch } = useProfileContext()

  const focusAreas = getFocusAreas(role, targetRole)
  const currentRoleLabel = ROLE_CONFIG[role].label
  const targetRoleLabel = ROLE_CONFIG[targetRole].label

  const handleStart = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated. Please log in again.')
        setIsLoading(false)
        return
      }

      // Update profile with onboarding data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name,
          role,
          target_role: targetRole,
          focus_areas: focusAreas,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        setError('Failed to save your profile. Please try again.')
        setIsLoading(false)
        return
      }

      // Refetch profile to trigger navigation to main app
      await refetch()
    } catch (err) {
      console.error('Error completing onboarding:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-gray-950">
      <ProgressBar currentStep={2} totalSteps={2} />

      <View className="flex-1 justify-center px-6">
        {/* Celebration Icon */}
        <View className="items-center mb-6">
          <LinearGradient
            colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="rocket" size={40} color="white" />
          </LinearGradient>
        </View>

        {/* Personalized Greeting */}
        <Text className="text-3xl font-bold text-white text-center mb-3">
          Welcome, {name}!
        </Text>

        {/* Journey Description */}
        <Text className="text-gray-400 text-center mb-6 text-sm leading-5">
          For your journey from{' '}
          <Text className="text-white font-medium">{currentRoleLabel}</Text> to{' '}
          <Text className="text-white font-medium">{targetRoleLabel}</Text>,
          I'll help you develop:
        </Text>

        {/* Focus Areas */}
        <View className="flex-row flex-wrap justify-center gap-2 mb-8">
          {focusAreas.map((area) => (
            <View
              key={area}
              className="px-4 py-2 rounded-full bg-primary-600/20 border border-primary-600/40"
            >
              <Text className="text-primary-400" style={{ color: '#a78bfa' }}>
                {area}
              </Text>
            </View>
          ))}
        </View>

        {/* How It Works */}
        <View className="bg-gray-900/50 rounded-2xl p-4 mb-8">
          <Text className="text-gray-400 text-center text-sm leading-5">
            Through daily reflections, I'll learn about your work and give you
            personalized guidance to help you grow.
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View className="mb-4 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          </View>
        )}

        {/* Start Button */}
        <Pressable
          onPress={handleStart}
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-semibold text-lg">
                  Start Your First Entry
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}
