import { View, Text, Pressable, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
// TODO: Re-enable after native rebuild - Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated'
import { COLORS, type TimeOption } from '../constants'

type ReminderType = 'morning' | 'evening'

type Props = {
  type: ReminderType
  enabled: boolean
  selectedTime: string
  timeOptions: readonly TimeOption[]
  onToggleChange: (enabled: boolean) => void
  onTimeChange: (time: string) => void
}

// Configuration for each reminder type
const REMINDER_CONFIG = {
  morning: {
    icon: 'sunny' as const,
    iconColor: COLORS.amber400,
    title: 'Morning Check-in',
    subtitle: 'Set your daily intentions',
  },
  evening: {
    icon: 'moon' as const,
    iconColor: COLORS.primary,
    title: 'Evening Check-in',
    subtitle: 'Reflect on your progress',
  },
} as const

/**
 * Reusable reminder time selector component
 * Used in both onboarding and settings screens
 */
export function ReminderTimeSelector({
  type,
  enabled,
  selectedTime,
  timeOptions,
  onToggleChange,
  onTimeChange,
}: Props) {
  const config = REMINDER_CONFIG[type]

  return (
    <View className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
      {/* Header with toggle */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center mb-1">
            <Ionicons name={config.icon} size={20} color={config.iconColor} />
            <Text className="text-white font-semibold text-lg ml-2">
              {config.title}
            </Text>
          </View>
          <Text className="text-gray-400 text-sm">{config.subtitle}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggleChange}
          trackColor={{ false: '#374151', true: COLORS.primaryDark }}
          thumbColor={COLORS.textPrimary}
          ios_backgroundColor="#374151"
          accessibilityLabel={`${config.title} reminder toggle`}
          accessibilityRole="switch"
          accessibilityState={{ checked: enabled }}
        />
      </View>

      {/* Time picker chips */}
      {enabled && (
        <View className="flex-row flex-wrap gap-2">
          {timeOptions.map((time) => (
            <TimeChip
              key={time.value}
              label={time.label}
              selected={time.value === selectedTime}
              onPress={() => onTimeChange(time.value)}
            />
          ))}
        </View>
      )}
    </View>
  )
}

type TimeChipProps = {
  label: string
  selected: boolean
  onPress: () => void
}

function TimeChip({ label, selected, onPress }: TimeChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${label} reminder time`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`px-4 py-2.5 rounded-xl border ${
        selected
          ? 'bg-primary-600/20 border-primary-600'
          : 'bg-gray-800 border-gray-700'
      }`}
    >
      <Text
        className={selected ? 'font-medium' : 'text-gray-300'}
        style={selected ? { color: '#a78bfa' } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  )
}
