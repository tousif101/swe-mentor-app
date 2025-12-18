import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type JournalEmptyStateProps = {
  type: 'no-entries' | 'no-results'
  onAction: () => void
}

const emptyStateConfig = {
  'no-entries': {
    icon: 'book-outline' as const,
    title: 'No entries yet',
    description: 'Complete your first check-in to start building your journal',
    actionText: 'Start Check-in',
  },
  'no-results': {
    icon: 'search-outline' as const,
    title: 'No entries match your search',
    description: 'Try a different tag or search term',
    actionText: 'Clear Filters',
  },
}

export function JournalEmptyState({ type, onAction }: JournalEmptyStateProps) {
  const config = emptyStateConfig[type]

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={config.icon} size={48} color="#6b7280" />
      </View>
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.description}>{config.description}</Text>
      <Pressable style={styles.button} onPress={onAction}>
        <Text style={styles.buttonText}>{config.actionText}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
  },
})
