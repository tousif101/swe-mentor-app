import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type ContinueCardProps = {
  type: 'morning' | 'evening'
  startedAt?: string // e.g., "2 hours ago"
  onPress: () => void
}

export function ContinueCard({ type, startedAt, onPress }: ContinueCardProps) {
  const config = {
    morning: {
      icon: 'sunny' as const,
      title: 'Continue morning check-in',
      gradient: ['#d97706', '#f59e0b'],
    },
    evening: {
      icon: 'moon' as const,
      title: 'Continue evening reflection',
      gradient: ['#8b5cf6', '#6366f1'],
    },
  }

  const { icon, title } = config[type]

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, type === 'morning' ? styles.iconMorning : styles.iconEvening]}>
        <Ionicons name={icon} size={20} color="white" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {startedAt && (
          <Text style={styles.subtitle}>You started this {startedAt}</Text>
        )}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMorning: {
    backgroundColor: '#d97706',
  },
  iconEvening: {
    backgroundColor: '#8b5cf6',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  arrow: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
})
