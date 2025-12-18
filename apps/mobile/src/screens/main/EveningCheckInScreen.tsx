import { useEffect, useRef, useState } from 'react'
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
  Modal,
  Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useProfileContext } from '../../contexts'
import { supabase } from '../../lib/supabase'
import { saveCheckIn } from '../../utils/checkInHelpers'
import { HomeStackParamList } from '../../navigation/HomeStackNavigator'

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'EveningCheckIn'>
}

const ENERGY_LEVELS = [1, 2, 3, 4, 5]

export function EveningCheckInScreen({ navigation }: Props) {
  const { profile } = useProfileContext()

  const [goalCompleted, setGoalCompleted] = useState<
    'yes' | 'partially' | 'no' | null
  >(null)
  const [quickWin, setQuickWin] = useState('')
  const [blocker, setBlocker] = useState('')
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)
  const [tomorrowCarry, setTomorrowCarry] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    goalCompleted?: string
    quickWin?: string
    blocker?: string
    energyLevel?: string
  }>({})
  const [showCelebration, setShowCelebration] = useState(false)

  const celebrationScale = useRef(new Animated.Value(0.9)).current
  const celebrationOpacity = useRef(new Animated.Value(0)).current

  const greeting = 'Good evening'

  const validateForm = () => {
    const newErrors: {
      goalCompleted?: string
      quickWin?: string
      blocker?: string
      energyLevel?: string
    } = {}

    if (!goalCompleted) {
      newErrors.goalCompleted = 'How did your goal go?'
    }

    if (!quickWin.trim()) {
      newErrors.quickWin = 'Share a quick win or insight'
    }

    if (goalCompleted && goalCompleted !== 'yes') {
      if (!blocker.trim()) {
        newErrors.blocker = 'What got in the way?'
      }
      if (!energyLevel) {
        newErrors.energyLevel = 'Rate your energy'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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
        checkInType: 'evening',
        goalCompleted: goalCompleted!,
        quickWin: quickWin.trim(),
        blocker: goalCompleted === 'yes' ? undefined : blocker.trim(),
        energyLevel: goalCompleted === 'yes' ? undefined : energyLevel ?? undefined,
        tomorrowCarry: tomorrowCarry.trim() || undefined,
      })

      setShowCelebration(true)
    } catch (error) {
      console.error('Error saving check-in:', error)
      Alert.alert(
        'Error',
        'Failed to save your check-in. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCelebrateClose = () => {
    setShowCelebration(false)
    navigation.goBack()
  }

  useEffect(() => {
    if (showCelebration) {
      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      celebrationScale.setValue(0.9)
      celebrationOpacity.setValue(0)
    }
  }, [showCelebration, celebrationOpacity, celebrationScale])

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
            Evening Check-in
          </Text>
          <Text className="text-gray-400 text-sm leading-5">
            Reflect on your day and set up tomorrow for success
          </Text>
        </View>

        {/* Goal completion */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="checkmark-circle" size={20} color="#34d399" />
            <Text className="text-gray-300 text-base font-medium ml-2">
              Did you complete your goal?
            </Text>
          </View>
          <View className="flex-row gap-3">
            {[
              { label: 'Yes', value: 'yes' as const },
              { label: 'Partially', value: 'partially' as const },
              { label: 'No', value: 'no' as const },
            ].map((option) => {
              const isSelected = goalCompleted === option.value
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setGoalCompleted(option.value)
                    setErrors((prev) => ({ ...prev, goalCompleted: undefined }))
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl border ${
                    isSelected
                      ? 'bg-primary-600/20 border-primary-600'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <Text
                    className={
                      isSelected ? 'text-primary-400 font-medium' : 'text-gray-300'
                    }
                    style={isSelected ? { color: '#a78bfa' } : {}}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {errors.goalCompleted && (
            <Text className="text-red-400 text-sm mt-2">{errors.goalCompleted}</Text>
          )}
        </View>

        {/* Quick win */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="sparkles" size={20} color="#fbbf24" />
            <Text className="text-gray-300 text-base font-medium ml-2">
              Quick win or insight
            </Text>
          </View>
          <TextInput
            value={quickWin}
            onChangeText={(text) => {
              setQuickWin(text)
              setErrors((prev) => ({ ...prev, quickWin: undefined }))
            }}
            placeholder="What went well today?"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white min-h-[80px]"
          />
          {errors.quickWin && (
            <Text className="text-red-400 text-sm mt-2">{errors.quickWin}</Text>
          )}
        </View>

        {/* Blocker + energy rating (conditional) */}
        {goalCompleted && goalCompleted !== 'yes' && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="alert-circle" size={20} color="#f87171" />
              <Text className="text-gray-300 text-base font-medium ml-2">
                What blocked you?
              </Text>
            </View>
            <TextInput
              value={blocker}
              onChangeText={(text) => {
                setBlocker(text)
                setErrors((prev) => ({ ...prev, blocker: undefined }))
              }}
              placeholder="Describe blockers or obstacles"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white min-h-[80px]"
            />
            {errors.blocker && (
              <Text className="text-red-400 text-sm mt-2">{errors.blocker}</Text>
            )}

            <View className="mt-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="battery-charging" size={20} color="#60a5fa" />
                <Text className="text-gray-300 text-base font-medium ml-2">
                  Energy level
                </Text>
              </View>
              <View className="flex-row gap-2">
                {ENERGY_LEVELS.map((level) => {
                  const isSelected = energyLevel === level
                  return (
                    <Pressable
                      key={level}
                      onPress={() => {
                        setEnergyLevel(level)
                        setErrors((prev) => ({ ...prev, energyLevel: undefined }))
                      }}
                      className={`flex-1 py-3 rounded-xl border items-center ${
                        isSelected
                          ? 'bg-primary-600/20 border-primary-600'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    >
                      <Text
                        className={
                          isSelected ? 'text-primary-400 font-semibold' : 'text-gray-300'
                        }
                        style={isSelected ? { color: '#a78bfa' } : {}}
                      >
                        {level}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              {errors.energyLevel && (
                <Text className="text-red-400 text-sm mt-2">
                  {errors.energyLevel}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Tomorrow carry */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3">
            <Ionicons name="arrow-forward-circle" size={20} color="#a78bfa" />
            <Text className="text-gray-300 text-base font-medium ml-2">
              What to carry into tomorrow?
            </Text>
          </View>
          <TextInput
            value={tomorrowCarry}
            onChangeText={(text) => setTomorrowCarry(text)}
            placeholder="A small action or reminder for tomorrow"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white min-h-[80px]"
          />
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
                Complete Check-in
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {/* Celebration modal */}
      <Modal visible={showCelebration} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/70 items-center justify-center px-6"
          onPress={handleCelebrateClose}
        >
          <Animated.View
            style={{
              transform: [{ scale: celebrationScale }],
              opacity: celebrationOpacity,
              width: '100%',
            }}
          >
            <LinearGradient
              colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 24,
                borderRadius: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#a78bfa40',
              }}
            >
              <View className="w-14 h-14 rounded-full bg-white/15 items-center justify-center mb-3">
                <Ionicons name="sparkles" size={28} color="#fff" />
              </View>
              <Text className="text-white text-2xl font-bold mb-2">
                Streak locked in!
              </Text>
              <Text className="text-white/80 text-sm text-center mb-4">
                Evening check-in saved. Keep the momentum going tomorrow.
              </Text>
              <View className="flex-row items-center bg-black/20 px-3 py-2 rounded-full border border-white/10">
                <Ionicons name="flame" size={18} color="#fbbf24" />
                <Text className="text-white text-sm font-semibold ml-2">
                  Keep your streak alive
                </Text>
              </View>
              <Pressable
                className="mt-6 bg-white/15 rounded-2xl px-4 py-3 border border-white/10"
                onPress={handleCelebrateClose}
              >
                <Text className="text-white font-semibold">Nice!</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}
