import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

export type HeroState = 'morning' | 'evening' | 'completed'

type HeroCardProps = {
  state: HeroState
  onPress: () => void
  disabled?: boolean
}

const heroConfig = {
  morning: {
    colors: ['#d97706', '#f59e0b', '#fbbf24'] as const,
    icon: 'sunny' as const,
    title: 'Morning Check-in',
    subtitle: 'Set your focus for the day ahead',
    contextTime: 'This morning',
  },
  evening: {
    colors: ['#8B5CF6', '#6366F1', '#3B82F6'] as const,
    icon: 'moon' as const,
    title: 'Evening Check-in',
    subtitle: 'Reflect and set up tomorrow',
    contextTime: 'This evening',
  },
  completed: {
    colors: ['#10B981', '#14B8A6', '#06B6D4'] as const,
    icon: 'checkmark-circle' as const,
    title: 'All done today!',
    subtitle: 'Great work on both check-ins',
    contextTime: 'See you tomorrow morning',
  },
}

export function HeroCard({ state, onPress, disabled }: HeroCardProps) {
  const config = heroConfig[state]
  const scaleAnim = React.useRef(new Animated.Value(1)).current
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loopAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    loopAnimation.start()
    return () => loopAnimation.stop()
  }, [floatAnim])

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || state === 'completed'}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={[...config.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Glass shine overlay */}
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
              style={styles.shineOverlay}
            />
            <View style={styles.content}>
              {/* Icon Circle */}
              <Animated.View
                style={[
                  styles.iconCircle,
                  { transform: [{ translateY: floatAnim }] }
                ]}
              >
                <Ionicons name={config.icon} size={40} color="white" />
              </Animated.View>

              {/* Title & Subtitle */}
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.subtitle}>{config.subtitle}</Text>

              {/* View Journal button for completed state */}
              {state === 'completed' && (
                <TouchableOpacity style={styles.secondaryButton} onPress={onPress}>
                  <Text style={styles.secondaryButtonText}>View Journal</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Context time text below card */}
      <Text style={styles.contextTime}>
        {config.contextTime} &bull; ~3 min
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  gradient: {
    borderRadius: 24,
    padding: 24,
    minHeight: 280,
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  contextTime: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 16,
  },
})
