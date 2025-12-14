import { View, Text, ScrollView, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks'
import { useProfileContext } from '../../contexts'
import { supabase } from '../../lib/supabase'
import { ROLE_CONFIG, type DbRole } from '../../lib/roleMapping'

export function ProfileScreen() {
  const { user } = useAuth()
  const { profile } = useProfileContext()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <ScrollView className="flex-1 bg-gray-950">
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
                  {ROLE_CONFIG[profile.role as DbRole]?.label || profile.role}
                </Text>
              </View>
              {profile?.target_role && (
                <View>
                  <Text className="text-gray-400 text-sm mb-1">Target Role</Text>
                  <Text className="text-white font-medium">
                    {ROLE_CONFIG[profile.target_role as DbRole]?.label ||
                      profile.target_role}
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
            <Pressable className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={24} color="#8b5cf6" />
                <Text className="text-white ml-3">Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>

            <Pressable className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={24} color="#8b5cf6" />
                <Text className="text-white ml-3">Reminders</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>

            <Pressable className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={24} color="#8b5cf6" />
                <Text className="text-white ml-3">Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>

            <Pressable className="flex-row items-center justify-between px-4 py-4">
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
