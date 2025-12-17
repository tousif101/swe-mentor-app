import { View, Text, Pressable, ScrollView } from 'react-native'

export type Chip = {
  label: string
  value: string
}

type ChipSelectorProps = {
  chips: Chip[]
  selectedValue: string | null
  onSelect: (value: string) => void
  multiSelect?: boolean
  selectedValues?: string[]
}

/**
 * Chip selector component for selecting one or multiple options.
 * Used for focus areas, time slots, and other discrete choices.
 */
export function ChipSelector({
  chips,
  selectedValue,
  onSelect,
  multiSelect = false,
  selectedValues = [],
}: ChipSelectorProps) {
  const isSelected = (value: string) => {
    if (multiSelect) {
      return selectedValues.includes(value)
    }
    return selectedValue === value
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {chips.map((chip) => {
        const selected = isSelected(chip.value)
        return (
          <Pressable
            key={chip.value}
            onPress={() => onSelect(chip.value)}
            className={`px-4 py-2.5 rounded-xl border ${
              selected
                ? 'bg-primary-600/20 border-primary-600'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <Text
              className={selected ? 'text-primary-400 font-medium' : 'text-gray-300'}
              style={selected ? { color: '#a78bfa' } : {}}
            >
              {chip.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
