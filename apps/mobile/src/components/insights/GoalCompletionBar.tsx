import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../../constants'
import type { GoalCompletionStats } from '../../utils/insightsHelpers'

type Props = {
  stats: GoalCompletionStats
}

export function GoalCompletionBar({ stats }: Props) {
  if (stats.total === 0) {
    return (
      <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <Text className="text-white text-lg font-semibold mb-2">Goal Completion</Text>
        <Text className="text-gray-500 text-sm">Complete evening check-ins to track goal completion</Text>
      </View>
    )
  }

  const yesPercent = Math.round((stats.yes / stats.total) * 100)
  const partialPercent = Math.round((stats.partially / stats.total) * 100)
  const noPercent = Math.round((stats.no / stats.total) * 100)

  return (
    <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <Text className="text-white text-lg font-semibold mb-4">Goal Completion</Text>

      {/* Horizontal stacked bar */}
      <View style={styles.barContainer}>
        {stats.yes > 0 && (
          <View style={[styles.segment, { flex: stats.yes, backgroundColor: COLORS.success }]} />
        )}
        {stats.partially > 0 && (
          <View style={[styles.segment, { flex: stats.partially, backgroundColor: COLORS.warning }]} />
        )}
        {stats.no > 0 && (
          <View style={[styles.segment, { flex: stats.no, backgroundColor: COLORS.error }]} />
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={COLORS.success} label="Completed" value={`${yesPercent}%`} />
        <LegendItem color={COLORS.warning} label="Partially" value={`${partialPercent}%`} />
        <LegendItem color={COLORS.error} label="Missed" value={`${noPercent}%`} />
      </View>
    </View>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text className="text-gray-400 text-xs">{label}</Text>
      <Text className="text-white text-xs font-semibold ml-1">{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.trackBackground,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
})
