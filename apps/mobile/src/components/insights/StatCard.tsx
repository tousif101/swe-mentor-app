import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

type Props = {
  label: string
  value: string | number
  subtitle?: string
  icon: ComponentProps<typeof Ionicons>['name']
  iconColor?: string
}

export function StatCard({ label, value, subtitle, icon, iconColor = '#8b5cf6' }: Props) {
  return (
    <View className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-gray-400 text-sm">{label}</Text>
        <Text className="text-white text-2xl font-bold mt-1">{value}</Text>
        {subtitle ? (
          <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
    </View>
  )
}
