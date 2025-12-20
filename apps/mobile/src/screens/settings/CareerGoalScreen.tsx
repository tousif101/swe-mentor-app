import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  ActionSheetIOS,
  Alert,
  StyleSheet,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
// TODO: Re-enable after native rebuild - Animated, { FadeIn, Layout } from 'react-native-reanimated'
import { useProfileContext } from '../../contexts'
import { supabase } from '../../lib/supabase'
import { ROLE_CONFIG, getFocusAreas, type DbRole, getValidTargetRoles, ROLES_ORDERED } from '../../lib/roleMapping'
import { showFeedback } from '../../utils'
import { COLORS } from '../../constants'
import type { ProfileStackParamList } from '../../types'

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'CareerGoal'>
}

export function CareerGoalScreen({ navigation }: Props) {
  const { profile, refetch } = useProfileContext()

  const [currentRole, setCurrentRole] = useState<DbRole | null>(
    (profile?.role as DbRole) || null
  )
  const [targetRole, setTargetRole] = useState<DbRole | null>(
    (profile?.target_role as DbRole) || null
  )
  const [isSaving, setIsSaving] = useState(false)

  // Calculate focus areas preview
  const focusAreasPreview = useMemo(() => {
    if (!currentRole || !targetRole) return []
    return getFocusAreas(currentRole, targetRole)
  }, [currentRole, targetRole])

  // Check if there are changes from the original profile
  const hasChanges = useMemo(() => {
    return (
      currentRole !== profile?.role ||
      targetRole !== profile?.target_role
    )
  }, [currentRole, targetRole, profile?.role, profile?.target_role])

  // Role options for pickers
  const roleOptions = useMemo(
    () =>
      Object.entries(ROLE_CONFIG).map(([value, config]) => ({
        value: value as DbRole,
        label: config.label,
      })),
    []
  )

  const validTargetRoles = useMemo(() => {
    return currentRole ? getValidTargetRoles(currentRole) : ROLES_ORDERED
  }, [currentRole])

  // Reusable role picker that handles platform differences
  const showRolePicker = useCallback(
    (
      title: string,
      options: Array<{ value: DbRole; label: string }>,
      onSelect: (role: DbRole) => void
    ) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title,
            options: [...options.map((r) => r.label), 'Cancel'],
            cancelButtonIndex: options.length,
          },
          (buttonIndex) => {
            if (buttonIndex < options.length) {
              onSelect(options[buttonIndex].value)
            }
          }
        )
      } else {
        Alert.alert(title, undefined, [
          ...options.map((r) => ({
            text: r.label,
            onPress: () => onSelect(r.value),
          })),
          { text: 'Cancel', style: 'cancel' },
        ])
      }
    },
    []
  )

  const handleCurrentRolePress = useCallback(() => {
    showRolePicker('Select your current role', roleOptions, (selected) => {
      setCurrentRole(selected)
      // Auto-update target role if it becomes invalid
      if (targetRole && ROLE_CONFIG[targetRole].index < ROLE_CONFIG[selected].index) {
        setTargetRole(selected)
      }
    })
  }, [showRolePicker, roleOptions, targetRole])

  const handleTargetRolePress = useCallback(() => {
    if (!currentRole) return

    const validOptions = validTargetRoles.map((role) => ({
      value: role,
      label: ROLE_CONFIG[role].label,
    }))

    showRolePicker('Select your target role', validOptions, setTargetRole)
  }, [currentRole, validTargetRoles, showRolePicker])

  const handleSave = useCallback(async () => {
    if (!hasChanges || !currentRole || !targetRole) return

    // Show confirmation alert
    Alert.alert(
      'Update Career Goal',
      'This will update your focus areas. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            if (!profile?.id) {
              await showFeedback('Profile not found', 'error')
              return
            }

            setIsSaving(true)
            try {
              const newFocusAreas = getFocusAreas(currentRole, targetRole)

              const { error } = await supabase
                .from('profiles')
                .update({
                  role: currentRole,
                  target_role: targetRole,
                  focus_areas: newFocusAreas,
                })
                .eq('id', profile.id)

              if (error) throw error

              await refetch()
              await showFeedback('Career goal updated successfully', 'success')
              navigation.goBack()
            } catch (error) {
              await showFeedback('Failed to update career goal', 'error')
            } finally {
              setIsSaving(false)
            }
          },
        },
      ]
    )
  }, [hasChanges, currentRole, targetRole, refetch, navigation, profile])

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Career Goal</Text>
          </View>
          <Text style={styles.subtitle}>
            Define your current role and target to get personalized focus areas
          </Text>
        </View>

        {/* Role Pickers */}
        <View style={styles.section}>
          <Text style={styles.label}>Current Role</Text>
          <Pressable
            onPress={handleCurrentRolePress}
            style={styles.picker}
          >
            {currentRole ? (
              <View style={styles.pickerContent}>
                <Text style={styles.pickerText}>
                  {ROLE_CONFIG[currentRole].label}
                </Text>
                <Text style={styles.pickerDescription}>
                  {ROLE_CONFIG[currentRole].description}
                </Text>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>Select your current role</Text>
            )}
            <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Target Role</Text>
          <Pressable
            onPress={handleTargetRolePress}
            style={[styles.picker, !currentRole && styles.pickerDisabled]}
            disabled={!currentRole}
          >
            {targetRole ? (
              <View style={styles.pickerContent}>
                <Text style={styles.pickerText}>
                  {ROLE_CONFIG[targetRole].label}
                </Text>
                <Text style={styles.pickerDescription}>
                  {ROLE_CONFIG[targetRole].description}
                </Text>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>
                {currentRole ? 'Select your target role' : 'Select current role first'}
              </Text>
            )}
            <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {/* Focus Areas Preview */}
        {focusAreasPreview.length > 0 && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="flag-outline" size={20} color={COLORS.primary} />
              <Text style={styles.previewTitle}>Your Focus Areas</Text>
            </View>
            <Text style={styles.previewSubtitle}>
              Based on your journey from {currentRole && ROLE_CONFIG[currentRole].label} to{' '}
              {targetRole && ROLE_CONFIG[targetRole].label}
            </Text>
            <View style={styles.chipContainer}>
              {focusAreasPreview.map((area) => (
                <View key={area} style={styles.chip}>
                  <Text style={styles.chipText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || isSaving || !currentRole || !targetRole}
          style={[
            styles.saveButton,
            (!hasChanges || !currentRole || !targetRole) && styles.saveButtonDisabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>
              {hasChanges ? 'Update Career Goal' : 'No Changes'}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  picker: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerContent: {
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  pickerDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  previewCard: {
    backgroundColor: `${COLORS.primaryDark}1A`, // 10% opacity
    borderWidth: 1,
    borderColor: `${COLORS.primaryDark}33`, // 20% opacity
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    marginBottom: 32,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  previewSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: `${COLORS.primaryDark}33`, // 20% opacity
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.primaryLight,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
})
