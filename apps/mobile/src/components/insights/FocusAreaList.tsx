import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../../constants'
import type { FocusAreaItem } from '../../utils'

type Props = {
  areas: FocusAreaItem[]
}

export function FocusAreaList({ areas }: Props) {
  if (areas.length === 0) {
    return (
      <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <Text className="text-white text-lg font-semibold mb-2">Focus Areas</Text>
        <Text className="text-gray-500 text-sm">Complete morning check-ins to see your focus area breakdown</Text>
      </View>
    )
  }

  return (
    <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <Text className="text-white text-lg font-semibold mb-4">Focus Areas</Text>
      <View className="gap-3">
        {areas.map((item) => (
          <View key={item.area}>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-300 text-sm">{item.area}</Text>
              <Text className="text-gray-500 text-xs">{item.count}x ({item.percentage}%)</Text>
            </View>
            <View style={styles.trackBar}>
              <View
                style={[
                  styles.fillBar,
                  { width: `${item.percentage}%`, backgroundColor: COLORS.primary },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  trackBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.trackBackground,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 3,
  },
})
