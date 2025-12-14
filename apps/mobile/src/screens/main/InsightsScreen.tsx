import { View, Text, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export function InsightsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="px-6 pt-16 pb-8">
        <Text className="text-white text-3xl font-bold">Insights</Text>
        <Text className="text-gray-400 text-base mt-2">
          AI-powered career analytics and recommendations
        </Text>
      </View>

      {/* Content */}
      <View className="px-6">
        {/* Placeholder Card */}
        <View className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <View className="items-center justify-center py-12">
            <View className="w-16 h-16 bg-primary-600/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="bulb" size={32} color="#8b5cf6" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2">
              Insights Tab
            </Text>
            <Text className="text-gray-400 text-center">
              Get personalized insights from your check-ins
            </Text>
          </View>
        </View>

        {/* Stats Preview Placeholder */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Your Progress
          </Text>

          <View className="gap-3">
            {/* Stat Card 1 */}
            <View className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between">
              <View>
                <Text className="text-gray-400 text-sm">Total Check-ins</Text>
                <Text className="text-white text-2xl font-bold mt-1">0</Text>
              </View>
              <View className="w-12 h-12 bg-primary-600/20 rounded-full items-center justify-center">
                <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />
              </View>
            </View>

            {/* Stat Card 2 */}
            <View className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between">
              <View>
                <Text className="text-gray-400 text-sm">Longest Streak</Text>
                <Text className="text-white text-2xl font-bold mt-1">0 days</Text>
              </View>
              <View className="w-12 h-12 bg-primary-600/20 rounded-full items-center justify-center">
                <Ionicons name="flame" size={24} color="#8b5cf6" />
              </View>
            </View>

            {/* Stat Card 3 */}
            <View className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between">
              <View>
                <Text className="text-gray-400 text-sm">Focus Areas</Text>
                <Text className="text-white text-2xl font-bold mt-1">0</Text>
              </View>
              <View className="w-12 h-12 bg-primary-600/20 rounded-full items-center justify-center">
                <Ionicons name="star" size={24} color="#8b5cf6" />
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
