import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useInsights } from '../../hooks'
import { StatCard, EnergyTrendBar, GoalCompletionBar, FocusAreaList } from '../../components/insights'
import { COLORS } from '../../constants'

export function InsightsScreen() {
  const insets = useSafeAreaInsets()
  const { data, isLoading, error, refresh } = useInsights()

  if (isLoading && !data) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (error && !data) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center px-6">
        <Ionicons name="cloud-offline" size={48} color={COLORS.textMuted} />
        <Text className="text-white text-lg font-semibold mt-4">Couldn't load insights</Text>
        <Text className="text-gray-400 text-sm text-center mt-2">
          {error.message}
        </Text>
        <Pressable
          onPress={refresh}
          className="mt-6 bg-primary-600 rounded-2xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      </View>
    )
  }

  if (!data) return null

  return (
    <ScrollView
      className="flex-1 bg-gray-950"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Header */}
      <View className="px-6 pb-6" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-white text-2xl font-bold">Insights</Text>
        <Text className="text-gray-400 text-sm mt-1">
          Your check-in analytics
        </Text>
      </View>

      {/* Stats Row */}
      <View className="px-6 gap-3 mb-6">
        <StatCard
          label="Total Check-ins"
          value={data.totalCheckIns}
          subtitle={`${data.totalMorningCheckIns} morning · ${data.totalEveningCheckIns} evening`}
          icon="checkmark-circle"
          iconColor={COLORS.success}
        />
        <StatCard
          label="Current Streak"
          value={`${data.currentStreak} days`}
          subtitle={`Longest: ${data.longestStreak} days`}
          icon="flame"
          iconColor={COLORS.warning}
        />
        <StatCard
          label="Weekly Rate"
          value={`${data.weeklyCompletionRate}%`}
          subtitle="Last 7 days"
          icon="calendar"
          iconColor={COLORS.primaryLight}
        />
        <StatCard
          label="Avg Energy"
          value={data.averageEnergy > 0 ? `${data.averageEnergy}/5` : '—'}
          subtitle="From evening check-ins"
          icon="battery-charging"
          iconColor={COLORS.success}
        />
      </View>

      {/* Energy Trend */}
      <View className="px-6 mb-6">
        <EnergyTrendBar data={data.energyTrend} />
      </View>

      {/* Goal Completion */}
      <View className="px-6 mb-6">
        <GoalCompletionBar stats={data.goalCompletion} />
      </View>

      {/* Focus Areas */}
      <View className="px-6 mb-12">
        <FocusAreaList areas={data.focusAreas} />
      </View>
    </ScrollView>
  )
}
