import { View, Text, StyleSheet } from 'react-native'
import type { EnergyTrendPoint } from '../../utils'
import { COLORS, ENERGY_COLORS, INSIGHTS_ENERGY_DISPLAY_DAYS } from '../../constants'

type Props = {
  data: EnergyTrendPoint[]
}

const BAR_MAX_HEIGHT = 60

export function EnergyTrendBar({ data }: Props) {
  if (data.length === 0) {
    return (
      <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <Text className="text-white text-lg font-semibold mb-2">Energy Trend</Text>
        <Text className="text-gray-500 text-sm">Complete evening check-ins to see your energy trend</Text>
      </View>
    )
  }

  // Show last 7 entries
  const recent = data.slice(-INSIGHTS_ENERGY_DISPLAY_DAYS)

  return (
    <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <Text className="text-white text-lg font-semibold mb-4">Energy Trend</Text>
      <View style={styles.barContainer}>
        {recent.map((point) => {
          const height = (point.level / 5) * BAR_MAX_HEIGHT
          const clampedLevel = Math.min(Math.max(point.level, 1), 5)
          const color = ENERGY_COLORS[clampedLevel - 1]
          const dayLabel = new Date(point.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
          return (
            <View key={point.date} style={styles.barWrapper}>
              <Text className="text-gray-500 text-xs mb-1">{point.level}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height, backgroundColor: color }]} />
              </View>
              <Text className="text-gray-500 text-xs mt-1">{dayLabel}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    width: 20,
    borderRadius: 10,
    backgroundColor: COLORS.trackBackground,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 10,
  },
})
