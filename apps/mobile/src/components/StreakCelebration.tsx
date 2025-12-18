import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type StreakCelebrationProps = {
  currentStreak: number
}

export function StreakCelebration({ currentStreak }: StreakCelebrationProps) {
  // Only show for streaks of 3 or more
  if (currentStreak < 3) {
    return null
  }

  const fireScale = useRef(new Animated.Value(1)).current
  const dotAnimations = useRef(
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(() => new Animated.Value(0))
  ).current

  useEffect(() => {
    // Fire pulse animation
    const loopAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fireScale, {
          toValue: 1.15,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fireScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    loopAnimation.start()

    // Sequential dot pop-in (stagger handles the delay)
    const animations = dotAnimations.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    )
    Animated.stagger(50, animations).start()

    // Cleanup
    return () => {
      loopAnimation.stop()
    }
  }, [fireScale, dotAnimations])

  const getMessage = () => {
    if (currentStreak >= 30) return "You're unstoppable!"
    if (currentStreak >= 14) return "Two weeks strong!"
    if (currentStreak >= 7) return "One week of consistency!"
    if (currentStreak >= 5) return "Keep it going!"
    return "You're on fire!"
  }

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={['rgba(249, 115, 22, 0.15)', 'rgba(239, 68, 68, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.streakText}>{currentStreak}-day streak!</Text>
          <Animated.Text
            style={[
              styles.fireEmoji,
              { transform: [{ scale: fireScale }] }
            ]}
          >
            🔥
          </Animated.Text>
        </View>

        {/* Week dots visualization */}
        <View style={styles.dotsContainer}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
            const dayNumber = index + 1
            const isFilled = dayNumber <= Math.min(currentStreak, 7)
            const isToday = dayNumber === new Date().getDay() || (new Date().getDay() === 0 && dayNumber === 7)

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  isFilled && styles.dotFilled,
                  isToday && styles.dotToday,
                  {
                    opacity: dotAnimations[index],
                    transform: [
                      {
                        scale: dotAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={[styles.dotText, isFilled && styles.dotTextFilled]}>
                  {day}
                </Text>
              </Animated.View>
            )
          })}
        </View>

        <Text style={styles.message}>{getMessage()}</Text>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  container: {
    borderRadius: 19,
    padding: 20,
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
