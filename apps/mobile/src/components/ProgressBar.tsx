import { View } from 'react-native'

type Props = {
  /** Current step (1-indexed) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
}

/**
 * Segmented progress bar for onboarding flow.
 * Shows filled segments based on current step.
 */
export function ProgressBar({ currentStep, totalSteps }: Props) {
  return (
    <View className="flex-row gap-2 px-6 py-4">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1
        const isFilled = stepNumber <= currentStep
        return (
          <View
            key={stepNumber}
            className={`flex-1 h-1 rounded-full ${
              isFilled ? 'bg-primary-600' : 'bg-gray-800'
            }`}
          />
        )
      })}
    </View>
  )
}
