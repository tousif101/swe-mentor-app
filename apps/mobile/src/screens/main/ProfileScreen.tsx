import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../../hooks'
import { useProfileContext } from '../../contexts'
import { supabase } from '../../lib/supabase'
import { ROLE_CONFIG, type DbRole } from '../../lib/roleMapping'
import type { ProfileStackParamList } from '../../types'

type ProfileNavigation = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigation>()
  const { user } = useAuth()
  const { profile } = useProfileContext()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'Need assistance? Contact us at support@swementor.app',
      [{ text: 'OK' }]
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-950" testID="profile-screen">
      {/* Header */}
      <View className="px-6 pt-16 pb-8">
        <Text className="text-white text-3xl font-bold">Profile</Text>
        <Text className="text-gray-400 text-base mt-2">
          Manage your account and settings
        </Text>
      </View>

      {/* Content */}
      <View className="px-6">
        {/* Profile Card */}
        <View className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-primary-600 rounded-full items-center justify-center mb-3">
              <Text className="text-white text-3xl font-bold">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text className="text-white text-xl font-bold">
              {profile?.name || 'User'}
            </Text>
            <Text className="text-gray-400 text-sm mt-1">{user?.email}</Text>
          </View>

          {/* Career Info */}
          {profile?.role && (
            <View className="border-t border-gray-800 pt-4">
              <View className="mb-3">
                <Text className="text-gray-400 text-sm mb-1">Current Role</Text>
                <Text className="text-white font-medium">
                  {profile.role in ROLE_CONFIG
                    ? ROLE_CONFIG[profile.role as DbRole].label
                    : profile.role}
                </Text>
              </View>
              {profile?.target_role && (
                <View>
                  <Text className="text-gray-400 text-sm mb-1">Target Role</Text>
                  <Text className="text-white font-medium">
                    {profile.target_role in ROLE_CONFIG
                      ? ROLE_CONFIG[profile.target_role as DbRole].label
                      : profile.target_role}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Settings
          </Text>

          {/* Settings Items */}
          <View className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <Pressable
              testID="edit-profile-row"
              onPress={() => navigation.navigate('EditProfile')}
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800"
            >
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={24} color="#8b5cf6" />
                <Text className="text-white ml-3">Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>

            <Pressable
              testID="career-goal-row"
              onPress={() => navigation.navigate('CareerGoal')}
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800"
            >
              <View className="flex-row items-center">
                <Ionicons name="rocket-outline" size={24} color="#8b5cf6" />
                <Text className="text-white ml-3">Career Goal</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>

            <Pressable
              testID="reminder-settings-row"
              onPress={() => navigation.navigate('ReminderSettings')}
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800"
            >
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={24} color="#8b5cf6" />
                <Text className="text-white ml-3">Reminders</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>

            <Pressable
              onPress={handleHelpSupport}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center">
                <Ionicons name="help-circle-outline" size={24} color="#8b5cf6" />
                <Text className="text-white ml-3">Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          testID="sign-out-button"
          onPress={handleLogout}
          className="bg-gray-900 rounded-xl px-6 py-4 border border-red-500/30 mb-8"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-semibold ml-2">Sign Out</Text>
          </View>
        </Pressable>

        {/* App Version */}
        <Text className="text-gray-600 text-center text-sm mb-8">
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  )
}
