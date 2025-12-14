import { View, Text, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export function JournalScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="px-6 pt-16 pb-8">
        <Text className="text-white text-3xl font-bold">Journal</Text>
        <Text className="text-gray-400 text-base mt-2">
          Your past check-ins and reflections
        </Text>
      </View>

      {/* Content */}
      <View className="px-6">
        {/* Placeholder Card */}
        <View className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <View className="items-center justify-center py-12">
            <View className="w-16 h-16 bg-primary-600/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="book" size={32} color="#8b5cf6" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2">
              Journal Tab
            </Text>
            <Text className="text-gray-400 text-center">
              View your past entries and reflections
            </Text>
          </View>
        </View>

        {/* Timeline Preview Placeholder */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Recent Entries
          </Text>

          {/* Empty State */}
          <View className="bg-gray-900 rounded-xl p-8 border border-gray-800 items-center">
            <Ionicons name="calendar-outline" size={48} color="#6b7280" />
            <Text className="text-gray-500 text-center mt-4">
              No entries yet. Complete your first check-in to get started!
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
