import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type TipCardProps = {
  message?: string
}

export function TipCard({ message }: TipCardProps) {
  const tipMessage =
    message || 'Complete both check-ins daily to build your reflection habit'

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="bulb-outline" size={16} color="#A78BFA" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Tip</Text>
        <Text style={styles.message}>{tipMessage}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C4B5FD',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
})
