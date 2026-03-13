import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { ProgressBar } from '../../components/ProgressBar'
import { profileSchema } from '../../utils/validation'
import {
  ROLE_CONFIG,
  ROLES_ORDERED,
  getNextRole,
  getValidTargetRoles,
  type DbRole,
} from '../../lib/roleMapping'
import { useCompanyMatch } from '../../hooks'
import { COMPANY_SIZES } from '../../constants'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Profile'>
}

type FormErrors = {
  name?: string
  role?: string
  targetRole?: string
  form?: string
}

type RolePickerProps = {
  visible: boolean
  roles: DbRole[]
  selectedRole: DbRole | null
  onSelect: (role: DbRole) => void
  onClose: () => void
  title: string
}

function RolePicker({
  visible,
  roles,
  selectedRole,
  onSelect,
  onClose,
  title,
}: RolePickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <Pressable className="bg-gray-900 rounded-t-3xl" onPress={() => {}}>
          <View className="p-4 border-b border-gray-800">
            <Text className="text-white text-lg font-semibold text-center">
              {title}
            </Text>
          </View>
          <ScrollView className="max-h-80">
            {roles.map((role) => {
              const config = ROLE_CONFIG[role]
              const isSelected = role === selectedRole
              return (
                <Pressable
                  key={role}
                  onPress={() => {
                    onSelect(role)
                    onClose()
                  }}
                  className={`p-4 border-b border-gray-800 ${
                    isSelected ? 'bg-primary-600/20' : ''
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-medium">
                        {config.label}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {config.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#7c3aed" />
                    )}
                  </View>
                </Pressable>
              )
            })}
          </ScrollView>
          <Pressable
            onPress={onClose}
            className="p-4 border-t border-gray-800"
          >
            <Text className="text-primary-400 text-center font-medium" style={{ color: '#a78bfa' }}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export function ProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<DbRole | null>(null)
  const [targetRole, setTargetRole] = useState<DbRole | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [showRolePicker, setShowRolePicker] = useState(false)
  const [showTargetPicker, setShowTargetPicker] = useState(false)

  const {
    companySize,
    careerMatrixId,
    matchedTemplate,
    isMatching,
    setCompanySize,
  } = useCompanyMatch()

  // When current role changes, update target role default
  const handleRoleChange = (newRole: DbRole) => {
    setRole(newRole)
    // Default target to next level
    const nextRole = getNextRole(newRole)
    setTargetRole(nextRole)
    setErrors((prev) => ({ ...prev, role: undefined, targetRole: undefined }))
  }

  const handleContinue = async () => {
    setErrors({})

    const parsed = profileSchema.safeParse({
      name: name.trim(),
      role,
      targetRole,
      ...(companySize ? { company_size: companySize } : {}),
      ...(careerMatrixId ? { career_matrix_id: careerMatrixId } : {}),
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        name: fieldErrors.name?.[0],
        role: fieldErrors.role?.[0],
        targetRole: fieldErrors.targetRole?.[0],
      })
      return
    }

    // Navigate to ReminderSetup screen with profile data
    navigation.navigate('ReminderSetup', {
      name: parsed.data.name,
      role: parsed.data.role as DbRole,
      targetRole: parsed.data.targetRole as DbRole,
      ...(companySize ? { companySize } : {}),
      ...(careerMatrixId ? { careerMatrixId } : {}),
    })
  }

  const validTargetRoles = role ? getValidTargetRoles(role) : ROLES_ORDERED

  return (
    <KeyboardAvoidingView
      testID="profile-setup-screen"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-950"
    >
      <ProgressBar currentStep={1} totalSteps={3} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text className="text-3xl font-bold text-white text-center mb-3">
          Set up your profile
        </Text>
        <Text className="text-gray-400 text-center mb-8 text-sm">
          Tell us about yourself so we can personalize your experience
        </Text>

        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-gray-300 text-sm mb-2 font-medium">
            What should I call you?
          </Text>
          <TextInput
            testID="onboarding-name-input"
            value={name}
            onChangeText={(text) => {
              setName(text)
              setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="Enter your name"
            placeholderTextColor="#6b7280"
            autoCapitalize="words"
            autoComplete="name"
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white"
          />
          {errors.name && (
            <Text className="text-red-400 text-sm mt-1">{errors.name}</Text>
          )}
        </View>

        {/* Current Role Selector */}
        <View className="mb-6">
          <Text className="text-gray-300 text-sm mb-2 font-medium">
            What{"'"}s your current role?
          </Text>
          <Pressable
            testID="role-selector"
            onPress={() => setShowRolePicker(true)}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 flex-row items-center justify-between"
          >
            {role ? (
              <View>
                <Text className="text-white">{ROLE_CONFIG[role].label}</Text>
                <Text className="text-gray-500 text-sm">
                  {ROLE_CONFIG[role].description}
                </Text>
              </View>
            ) : (
              <Text className="text-gray-500">Select your current role</Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </Pressable>
          {errors.role && (
            <Text className="text-red-400 text-sm mt-1">{errors.role}</Text>
          )}
        </View>

        {/* Target Role Selector */}
        <View className="mb-8">
          <Text className="text-gray-300 text-sm mb-2 font-medium">
            What role are you working toward?
          </Text>
          <Pressable
            testID="target-role-selector"
            onPress={() => setShowTargetPicker(true)}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 flex-row items-center justify-between"
            disabled={!role}
            style={{ opacity: role ? 1 : 0.5 }}
          >
            {targetRole ? (
              <View>
                <Text className="text-white">
                  {ROLE_CONFIG[targetRole].label}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {ROLE_CONFIG[targetRole].description}
                </Text>
              </View>
            ) : (
              <Text className="text-gray-500">
                {role ? 'Select your target role' : 'Select current role first'}
              </Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </Pressable>
          {errors.targetRole && (
            <Text className="text-red-400 text-sm mt-1">{errors.targetRole}</Text>
          )}
        </View>

        {/* Company Size Selector */}
        <View className="mb-8">
          <Text className="text-gray-300 text-sm mb-2 font-medium">
            Company size <Text className="text-gray-500">(optional)</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {COMPANY_SIZES.map((size) => (
              <Pressable
                key={size}
                testID={`company-size-${size}`}
                onPress={() => setCompanySize(size)}
                className={`px-4 py-2 rounded-lg ${
                  companySize === size
                    ? 'bg-primary-600/20 border border-primary-500'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <Text
                  className={companySize === size ? 'text-primary-400' : 'text-gray-300'}
                  style={companySize === size ? { color: '#a78bfa' } : undefined}
                >
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>
          {/* Matched template confirmation */}
          {matchedTemplate && (
            <View className="mt-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 8 }} />
              <Text className="text-green-400 text-sm">
                Using {matchedTemplate} career framework
              </Text>
            </View>
          )}
        </View>

        {/* Form Error */}
        {errors.form && (
          <View className="mb-4 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <Text className="text-red-400 text-sm">{errors.form}</Text>
          </View>
        )}

        {/* Continue Button */}
        <Pressable
          testID="profile-continue-button"
          onPress={handleContinue}
          disabled={isMatching}
          style={{ width: '100%', opacity: isMatching ? 0.5 : 1 }}
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
            <Text className="text-white font-semibold text-lg">Continue</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {/* Role Picker Modals */}
      <RolePicker
        visible={showRolePicker}
        roles={ROLES_ORDERED}
        selectedRole={role}
        onSelect={handleRoleChange}
        onClose={() => setShowRolePicker(false)}
        title="Select your current role"
      />

      <RolePicker
        visible={showTargetPicker}
        roles={validTargetRoles}
        selectedRole={targetRole}
        onSelect={(r) => {
          setTargetRole(r)
          setErrors((prev) => ({ ...prev, targetRole: undefined }))
        }}
        onClose={() => setShowTargetPicker(false)}
        title="Select your target role"
      />
    </KeyboardAvoidingView>
  )
}
