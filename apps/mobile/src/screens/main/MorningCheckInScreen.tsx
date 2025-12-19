import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useRoute, RouteProp } from '@react-navigation/native'
import { useProfileContext } from '../../contexts'
import { ChipSelector, type Chip } from '../../components/ChipSelector'
import { supabase } from '../../lib/supabase'
import { saveCheckIn, createOrUpdateDraft } from '../../utils/checkInHelpers'
import { HomeStackParamList } from '../../navigation/HomeStackNavigator'
import { logger } from '../../utils/logger'

type MorningCheckInRouteProp = RouteProp<HomeStackParamList, 'MorningCheckIn'>

// Default focus areas if user doesn't have any defined
const DEFAULT_FOCUS_AREAS: Chip[] = [
  { label: 'Coding', value: 'coding' },
  { label: 'System Design', value: 'system_design' },
  { label: 'Algorithms', value: 'algorithms' },
  { label: 'Leadership', value: 'leadership' },
  { label: 'Communication', value: 'communication' },
  { label: 'Learning', value: 'learning' },
]

type MorningCheckInScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'MorningCheckIn'>
}

export function MorningCheckInScreen({ navigation }: MorningCheckInScreenProps) {
  const { profile } = useProfileContext()
  const route = useRoute<MorningCheckInRouteProp>()
  const { checkInId, prefill } = route.params ?? {}
  const isEditMode = !!checkInId

  const [focusArea, setFocusArea] = useState<string | null>(prefill?.focus_area ?? null)
  const [dailyGoal, setDailyGoal] = useState(prefill?.daily_goal ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ focusArea?: string; dailyGoal?: string }>({})

  // Track draft ID for auto-save
  const [draftId, setDraftId] = useState<string | null>(checkInId ?? null)
  const isFirstInteraction = useRef(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get greeting based on time of day
  const currentTime = new Date().getHours()
  const greeting =
    currentTime < 12
      ? 'Good morning'
      : currentTime < 18
      ? 'Good afternoon'
      : 'Good evening'

  // Convert user's focus_areas to chips, or use defaults
  const focusAreaChips: Chip[] = useMemo(
    () =>
      profile?.focus_areas && profile.focus_areas.length > 0
        ? profile.focus_areas.map((area) => ({
            label: area.charAt(0).toUpperCase() + area.slice(1).replace(/_/g, ' '),
            value: area,
          }))
        : DEFAULT_FOCUS_AREAS,
    [profile?.focus_areas]
  )

  const validateForm = () => {
    const newErrors: { focusArea?: string; dailyGoal?: string } = {}

    if (!focusArea) {
      newErrors.focusArea = 'Please select a focus area'
    }

    if (!dailyGoal.trim()) {
      newErrors.dailyGoal = 'Please enter your daily goal'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Auto-save function
  const autoSave = useCallback(async (focus: string | null, goal: string) => {
    // Skip if no meaningful data yet
    if (!focus && !goal.trim()) return

    // Skip auto-save in edit mode (already has completed_at)
    if (isEditMode) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const id = await createOrUpdateDraft({
      userId: userData.user.id,
      checkInType: 'morning',
      focusArea: focus ?? undefined,
      dailyGoal: goal.trim() || undefined,
    })

    if (id && !draftId) {
      setDraftId(id)
    }
  }, [isEditMode, draftId])

  // Trigger auto-save on field changes (debounced)
  useEffect(() => {
    // Skip on initial mount with prefilled data
    if (isFirstInteraction.current && (prefill?.focus_area || prefill?.daily_goal)) {
      isFirstInteraction.current = false
      return
    }
    isFirstInteraction.current = false

    // Only auto-save if we have meaningful data
    if (!focusArea && !dailyGoal.trim()) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(focusArea, dailyGoal)
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [focusArea, dailyGoal, autoSave, prefill])

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('User not authenticated')
      }

      await saveCheckIn({
        userId: userData.user.id,
        checkInType: 'morning',
        focusArea: focusArea!,
        dailyGoal: dailyGoal.trim(),
      })

      // Success - navigate back or show success message
      Alert.alert(
        isEditMode ? 'Changes Saved!' : 'Check-in Complete!',
        isEditMode
          ? 'Your morning check-in has been updated.'
          : 'Your morning intentions have been saved. Have a great day!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      )
    } catch (error) {
      logger.error('Error saving check-in:', error)
      Alert.alert(
        'Error',
        'Failed to save your check-in. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-950"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-gray-400 text-base mb-1">
            {greeting}, {profile?.name || 'there'}!
          </Text>
          <Text className="text-white text-3xl font-bold mb-2">
            {isEditMode ? 'Edit Morning Check-in' : 'Morning Check-in'}
          </Text>
          <Text className="text-gray-400 text-sm leading-5">
            Set your intentions for the day ahead
          </Text>
        </View>

        {/* Focus Area Selector */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="locate-outline" size={20} color="#a78bfa" />
            <Text className="text-gray-300 text-base font-medium ml-2">
              What's your focus today?
            </Text>
          </View>
          <ChipSelector
            chips={focusAreaChips}
            selectedValue={focusArea}
            onSelect={(value) => {
              setFocusArea(value)
              setErrors((prev) => ({ ...prev, focusArea: undefined }))
            }}
          />
          {errors.focusArea && (
            <Text className="text-red-400 text-sm mt-2">{errors.focusArea}</Text>
          )}
        </View>

        {/* Daily Goal Input */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3">
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text className="text-gray-300 text-base font-medium ml-2">
              What would make today a win?
            </Text>
          </View>
          <TextInput
            value={dailyGoal}
            onChangeText={(text) => {
              setDailyGoal(text)
              setErrors((prev) => ({ ...prev, dailyGoal: undefined }))
            }}
            placeholder="E.g., Complete the authentication feature, Review 3 PRs..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white min-h-[100px]"
          />
          {errors.dailyGoal && (
            <Text className="text-red-400 text-sm mt-2">{errors.dailyGoal}</Text>
          )}
        </View>

        {/* Optional: AI Tip Card (Placeholder for future) */}
        <View className="bg-primary-600/10 rounded-2xl p-4 mb-8 border border-primary-600/20">
          <View className="flex-row items-start">
            <Ionicons
              name="bulb"
              size={20}
              color="#a78bfa"
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <View className="flex-1">
              <Text className="text-gray-300 text-sm leading-5">
                <Text className="font-semibold">Tip: </Text>
                Break your goal into smaller, actionable tasks for better focus and momentum.
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1" />

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
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
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                {isEditMode ? 'Save Changes' : 'Complete Check-in'}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
