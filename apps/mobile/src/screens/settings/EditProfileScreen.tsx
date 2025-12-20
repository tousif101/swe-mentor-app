import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useProfileContext } from '../../contexts'
import { supabase } from '../../lib/supabase'
import { showFeedback } from '../../utils'
import { NAME_REQUIREMENTS, COLORS } from '../../constants'
import type { ProfileStackParamList } from '../../types'

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>
}

export function EditProfileScreen({ navigation }: Props) {
  const { profile, refetch } = useProfileContext()
  const [name, setName] = useState(profile?.name || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation
  const trimmedName = name.trim()
  const isValidName =
    trimmedName.length >= NAME_REQUIREMENTS.minLength &&
    trimmedName.length <= NAME_REQUIREMENTS.maxLength
  const hasChanged = trimmedName !== (profile?.name || '')
  const canSave = isValidName && hasChanged && !isLoading

  const handleSave = useCallback(async () => {
    if (!canSave || !profile) return

    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ name: trimmedName })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Refresh profile data
      await refetch()

      // Show success feedback
      await showFeedback('Profile updated successfully', 'success')

      // Navigate back
      navigation.goBack()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      setError(message)
      await showFeedback('Failed to update profile', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [canSave, profile, trimmedName, refetch, navigation])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-950"
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            className="mr-4 w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text className="text-white text-2xl font-bold">Edit Profile</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-gray-300 text-sm mb-2 font-medium">Name</Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text)
              setError(null)
            }}
            placeholder="Enter your name"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="words"
            autoComplete="name"
            autoFocus
            maxLength={NAME_REQUIREMENTS.maxLength}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-900 border border-gray-800 text-white"
          />
          {trimmedName.length > 0 && trimmedName.length < NAME_REQUIREMENTS.minLength && (
            <Text className="text-red-400 text-sm mt-1">
              Name must be at least {NAME_REQUIREMENTS.minLength} characters
            </Text>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View className="mb-4 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={[
            styles.saveButton,
            canSave ? styles.saveButtonEnabled : styles.saveButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text
              className="font-semibold text-lg"
              style={{ color: canSave ? COLORS.textPrimary : COLORS.textMuted }}
            >
              Save Changes
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonEnabled: {
    backgroundColor: COLORS.primaryDark,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
})
