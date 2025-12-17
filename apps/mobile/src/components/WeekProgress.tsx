import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

type WeekProgressProps = {
  daysCompleted: number // 0-7
  onViewInsights?: () => void
}

export function WeekProgress({ daysCompleted, onViewInsights }: WeekProgressProps) {
  const progressPercent = Math.round((daysCompleted / 7) * 100)

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.header}>
        <Text style={styles.label}>
          <Text style={styles.emoji}>📊</Text> This Week
        </Text>
        <Text style={styles.count}>{daysCompleted}/7</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%` },
          ]}
        />
      </View>

      {/* View Insights Link */}
      {onViewInsights && (
        <TouchableOpacity onPress={onViewInsights}>
          <Text style={styles.insightsLink}>View Insights →</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  emoji: {
    marginRight: 4,
  },
  count: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  insightsLink: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
    marginTop: 12,
  },
})
