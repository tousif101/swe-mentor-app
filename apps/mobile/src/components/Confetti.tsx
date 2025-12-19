import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native'

type ConfettiProps = {
  active: boolean
  onComplete?: () => void
}

const CONFETTI_COUNT = 50
const COLORS = ['#f97316', '#fbbf24', '#ef4444', '#8b5cf6', '#10b981']
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

type ConfettiPiece = {
  x: Animated.Value
  y: Animated.Value
  rotate: Animated.Value
  opacity: Animated.Value
  color: string
  size: number
  isCircle: boolean
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const pieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, () => {
      const startX = Math.random() * SCREEN_WIDTH
      return {
        x: new Animated.Value(startX),
        y: new Animated.Value(-20),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 6,
        isCircle: Math.random() > 0.5,
      }
    })
  ).current

  const initialX = useRef<number[]>(
    pieces.map(() => Math.random() * SCREEN_WIDTH)
  ).current

  useEffect(() => {
    if (!active) return

    const animations = pieces.map((piece, index) => {
      const targetX = initialX[index] + (Math.random() - 0.5) * 200
      const duration = Math.random() * 1000 + 1500

      return Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: targetX,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotate, {
          toValue: 720,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(piece.opacity, {
          toValue: 0,
          duration,
          delay: duration * 0.7,
          useNativeDriver: true,
        }),
      ])
    })

    const animation = Animated.stagger(20, animations)
    animation.start(() => {
      // Reset positions for next trigger
      pieces.forEach((piece, index) => {
        const newX = Math.random() * SCREEN_WIDTH
        initialX[index] = newX
        piece.x.setValue(newX)
        piece.y.setValue(-20)
        piece.rotate.setValue(0)
        piece.opacity.setValue(1)
      })
      onComplete?.()
    })
    return () => animation.stop()
  }, [active, onComplete])

  if (!active) return null

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.piece,
            {
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.isCircle ? piece.size / 2 : 2,
              opacity: piece.opacity,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotate.interpolate({
                    inputRange: [0, 720],
                    outputRange: ['0deg', '720deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  piece: {
    position: 'absolute',
  },
})
