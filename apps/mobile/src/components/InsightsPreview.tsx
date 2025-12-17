import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type InsightsPreviewProps = {
  totalCheckIns: number
  onViewInsights?: () => void
}

export function InsightsPreview({
  totalCheckIns,
  onViewInsights,
}: InsightsPreviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={16} color="#A78BFA" />
        <Text style={styles.label}>
          You've completed {totalCheckIns} check-ins
        </Text>
      </View>

      {onViewInsights && (
        <TouchableOpacity onPress={onViewInsights}>
          <Text style={styles.link}>View patterns in Insights →</Text>
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F3F4F6',
  },
  link: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
  },
})
