import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type StreakCelebrationProps = {
  currentStreak: number
}

export function StreakCelebration({ currentStreak }: StreakCelebrationProps) {
  // Only show for streaks of 3 or more
  if (currentStreak < 3) {
    return null
  }

  const getMessage = () => {
    if (currentStreak >= 30) return "You're unstoppable!"
    if (currentStreak >= 14) return "Two weeks strong!"
    if (currentStreak >= 7) return "One week of consistency!"
    if (currentStreak >= 5) return "Keep it going!"
    return "You're on fire!"
  }

  return (
    <LinearGradient
      colors={['#F59E0B', '#EF4444']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.streakText}>{currentStreak}-day streak!</Text>
        <Text style={styles.fireEmoji}>🔥</Text>
      </View>

      {/* Week dots visualization */}
      <View style={styles.dotsContainer}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
          const dayNumber = index + 1
          const isFilled = dayNumber <= Math.min(currentStreak, 7)
          const isToday = dayNumber === new Date().getDay() || (new Date().getDay() === 0 && dayNumber === 7)

          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                isToday && styles.dotToday,
              ]}
            >
              <Text style={[styles.dotText, isFilled && styles.dotTextFilled]}>
                {day}
              </Text>
            </View>
          )
        })}
      </View>

      <Text style={styles.message}>{getMessage()}</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  fireEmoji: {
    fontSize: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  dot: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dotToday: {
    borderWidth: 2,
    borderColor: 'white',
  },
  dotText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  dotTextFilled: {
    color: '#F59E0B',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
})
