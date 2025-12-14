import { View, Text, ScrollView, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useProfileContext } from '../../contexts'

export function HomeScreen() {
  const { profile } = useProfileContext()

  const currentTime = new Date().getHours()
  const greeting =
    currentTime < 12
      ? 'Good morning'
      : currentTime < 18
      ? 'Good afternoon'
      : 'Good evening'

  return (
    <ScrollView className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="px-6 pt-16 pb-8">
        <Text className="text-gray-400 text-base mb-1">
          {greeting}, {profile?.name || 'there'}
        </Text>
        <Text className="text-white text-3xl font-bold">Daily Check-in</Text>
      </View>

      {/* Content */}
      <View className="px-6">
        {/* Placeholder Card */}
        <View className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <View className="items-center justify-center py-12">
            <View className="w-16 h-16 bg-primary-600/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="home" size={32} color="#8b5cf6" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2">
              Home Tab
            </Text>
            <Text className="text-gray-400 text-center">
              Daily check-in and dashboard coming soon
            </Text>
          </View>
        </View>

        {/* Quick Actions Placeholder */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <Pressable className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800">
              <Ionicons name="sunny" size={24} color="#8b5cf6" />
              <Text className="text-white font-medium mt-2">
                Morning Check-in
              </Text>
            </Pressable>
            <Pressable className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800">
              <Ionicons name="moon" size={24} color="#8b5cf6" />
              <Text className="text-white font-medium mt-2">
                Evening Check-in
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Streak Placeholder */}
        <View className="bg-gradient-to-r from-primary-600/20 to-primary-500/10 rounded-2xl p-6 border border-primary-600/30 mb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-400 text-sm mb-1">Current Streak</Text>
              <Text className="text-white text-3xl font-bold">0 days</Text>
            </View>
            <View className="w-16 h-16 bg-primary-600/30 rounded-full items-center justify-center">
              <Ionicons name="flame" size={32} color="#a78bfa" />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
