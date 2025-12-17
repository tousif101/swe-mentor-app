# Glassmorphism Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply glassmorphism design system with animations to make the mobile app look modern and premium.

**Architecture:** Update existing components with animations (react-native-reanimated already installed), add ContinueCard component, add Confetti component, apply glass styling across all cards.

**Tech Stack:** React Native, react-native-reanimated (v4.2.0), expo-linear-gradient, TypeScript

---

## Task 1: Update HeroCard with Softer Morning Gradient + Icon Float

**Files:**
- Modify: `apps/mobile/src/components/HeroCard.tsx`

**Step 1: Update morning gradient colors**

Change line 22 from:
```typescript
colors: ['#F97316', '#FBBF24', '#FCD34D'] as const,
```
to:
```typescript
colors: ['#d97706', '#f59e0b', '#fbbf24'] as const,
```

**Step 2: Add icon float animation**

Add useEffect and Animated imports, create float animation:

```typescript
import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native'
```

Inside the component, add float animation after scaleAnim:

```typescript
const floatAnim = useRef(new Animated.Value(0)).current

useEffect(() => {
  Animated.loop(
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
  ).start()
}, [floatAnim])
```

**Step 3: Apply float animation to icon circle**

Change the iconCircle View to Animated.View:

```typescript
<Animated.View
  style={[
    styles.iconCircle,
    { transform: [{ translateY: floatAnim }] }
  ]}
>
  <Ionicons name={config.icon} size={40} color="white" />
</Animated.View>
```

**Step 4: Add glass shine overlay**

Add a View after LinearGradient opens for the shine effect:

```typescript
<LinearGradient
  colors={[...config.colors]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradient}
>
  {/* Glass shine overlay */}
  <View style={styles.shineOverlay} />
  <View style={styles.content}>
```

Add style:
```typescript
shineOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '50%',
  backgroundColor: 'transparent',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  opacity: 0.15,
  backgroundGradient: 'linear-gradient(180deg, white 0%, transparent 100%)',
},
```

Note: Since RN doesn't support CSS gradients in styles, use a nested LinearGradient instead:

```typescript
{/* Glass shine overlay */}
<LinearGradient
  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
  style={styles.shineOverlay}
/>
```

```typescript
shineOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '50%',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
},
```

**Step 5: Verify changes**

Run: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
Expected: No errors

**Step 6: Commit**

```bash
git add apps/mobile/src/components/HeroCard.tsx
git commit -m "feat(mobile): add icon float animation and softer morning gradient to HeroCard"
```

---

## Task 2: Update StreakCelebration with Animations

**Files:**
- Modify: `apps/mobile/src/components/StreakCelebration.tsx`

**Step 1: Add animation imports and refs**

Replace imports at top:
```typescript
import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
```

**Step 2: Add fire pulse animation**

Inside the component, after the early return, add:

```typescript
const fireScale = useRef(new Animated.Value(1)).current
const dotAnimations = useRef(
  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(() => new Animated.Value(0))
).current

useEffect(() => {
  // Fire pulse animation
  Animated.loop(
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
  ).start()

  // Sequential dot pop-in
  const animations = dotAnimations.map((anim, index) =>
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    })
  )
  Animated.stagger(50, animations).start()
}, [fireScale, dotAnimations])
```

**Step 3: Apply fire animation to emoji**

Change:
```typescript
<Text style={styles.fireEmoji}>🔥</Text>
```
to:
```typescript
<Animated.Text
  style={[
    styles.fireEmoji,
    { transform: [{ scale: fireScale }] }
  ]}
>
  🔥
</Animated.Text>
```

**Step 4: Apply sequential animation to week dots**

Change the week dots map to:

```typescript
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
```

**Step 5: Update container to glass style with animated border**

Wrap the LinearGradient with an outer View for the animated border effect:

```typescript
return (
  <View style={styles.outerContainer}>
    <LinearGradient
      colors={['rgba(249, 115, 22, 0.15)', 'rgba(239, 68, 68, 0.15)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* ... existing content ... */}
    </LinearGradient>
  </View>
)
```

Update styles:
```typescript
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
```

**Step 6: Verify changes**

Run: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
Expected: No errors

**Step 7: Commit**

```bash
git add apps/mobile/src/components/StreakCelebration.tsx
git commit -m "feat(mobile): add fire pulse and sequential dot animations to StreakCelebration"
```

---

## Task 3: Create ContinueCard Component

**Files:**
- Create: `apps/mobile/src/components/ContinueCard.tsx`
- Modify: `apps/mobile/src/components/index.ts`

**Step 1: Create ContinueCard component**

Create file `apps/mobile/src/components/ContinueCard.tsx`:

```typescript
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
```

**Step 2: Export ContinueCard from index**

Add to `apps/mobile/src/components/index.ts`:

```typescript
export { ContinueCard } from './ContinueCard'
```

**Step 3: Verify changes**

Run: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/mobile/src/components/ContinueCard.tsx apps/mobile/src/components/index.ts
git commit -m "feat(mobile): add ContinueCard component for resuming incomplete check-ins"
```

---

## Task 4: Create Confetti Component

**Files:**
- Create: `apps/mobile/src/components/Confetti.tsx`
- Modify: `apps/mobile/src/components/index.ts`

**Step 1: Create Confetti component**

Create file `apps/mobile/src/components/Confetti.tsx`:

```typescript
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
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-20),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 6,
      isCircle: Math.random() > 0.5,
    }))
  ).current

  useEffect(() => {
    if (!active) return

    const animations = pieces.map((piece) => {
      const targetX = piece.x._value + (Math.random() - 0.5) * 200
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

    Animated.stagger(20, animations).start(() => {
      // Reset positions for next trigger
      pieces.forEach((piece) => {
        piece.x.setValue(Math.random() * SCREEN_WIDTH)
        piece.y.setValue(-20)
        piece.rotate.setValue(0)
        piece.opacity.setValue(1)
      })
      onComplete?.()
    })
  }, [active, pieces, onComplete])

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
```

**Step 2: Export Confetti from index**

Add to `apps/mobile/src/components/index.ts`:

```typescript
export { Confetti } from './Confetti'
```

**Step 3: Verify changes**

Run: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/mobile/src/components/Confetti.tsx apps/mobile/src/components/index.ts
git commit -m "feat(mobile): add Confetti celebration component"
```

---

## Task 5: Add Glass Border to WeekProgress

**Files:**
- Modify: `apps/mobile/src/components/WeekProgress.tsx`

**Step 1: Update container styles for glass effect**

Change styles.container:

```typescript
container: {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
},
```

**Step 2: Add animated progress bar fill**

Add imports:
```typescript
import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
```

Inside component, add animation:
```typescript
const progressAnim = useRef(new Animated.Value(0)).current

useEffect(() => {
  Animated.timing(progressAnim, {
    toValue: progressPercent,
    duration: 800,
    useNativeDriver: false, // width animation can't use native driver
  }).start()
}, [progressPercent, progressAnim])
```

Change progress fill View to Animated.View:
```typescript
<Animated.View
  style={[
    styles.progressFill,
    {
      width: progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
      }),
    },
  ]}
/>
```

**Step 3: Verify changes**

Run: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/mobile/src/components/WeekProgress.tsx
git commit -m "feat(mobile): add glass border and animated fill to WeekProgress"
```

---

## Task 6: Add Glass Border to InsightsPreview

**Files:**
- Modify: `apps/mobile/src/components/InsightsPreview.tsx`

**Step 1: Update container styles for purple-tinted glass**

Change styles.container:

```typescript
container: {
  backgroundColor: 'rgba(139, 92, 246, 0.1)',
  borderWidth: 1,
  borderColor: 'rgba(139, 92, 246, 0.2)',
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
},
```

**Step 2: Verify changes**

Run: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/mobile/src/components/InsightsPreview.tsx
git commit -m "feat(mobile): add purple-tinted glass border to InsightsPreview"
```

---

## Task 7: Update HomeScreen with Ambient Glow + ContinueCard + Confetti

**Files:**
- Modify: `apps/mobile/src/screens/main/HomeScreen.tsx`

**Step 1: Add imports for new components**

Update imports:
```typescript
import {
  HeroCard,
  WeekProgress,
  InsightsPreview,
  TipCard,
  StreakCelebration,
  ContinueCard,
  Confetti,
  type HeroState,
} from '../../components'
```

**Step 2: Add state for confetti and continue card**

After existing useState declarations:
```typescript
const [showConfetti, setShowConfetti] = useState(false)
const [partialCheckIn, setPartialCheckIn] = useState<{
  type: 'morning' | 'evening'
  startedAt: string
} | null>(null)
```

**Step 3: Add milestone detection for confetti**

Inside loadData, after setJourneyData, add milestone check:
```typescript
// Check for streak milestones to trigger confetti
const streak = data.streakData.current_streak
if (streak === 7 || streak === 30 || streak === 100) {
  setShowConfetti(true)
}
```

**Step 4: Add ambient glow component**

Create AmbientGlow as a simple View before ScrollView:
```typescript
// Inside the return, wrap everything in a View
return (
  <View style={styles.screenContainer}>
    {/* Ambient Glow */}
    <View style={styles.ambientGlow} />

    {/* Confetti overlay */}
    <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ... existing content ... */}
    </ScrollView>
  </View>
)
```

**Step 5: Add ContinueCard after hero card**

After HeroCard:
```typescript
{/* Continue Card - Show if user has partial check-in */}
{partialCheckIn && (
  <ContinueCard
    type={partialCheckIn.type}
    startedAt={partialCheckIn.startedAt}
    onPress={() => {
      if (partialCheckIn.type === 'morning') {
        navigation.navigate('MorningCheckIn')
      } else {
        navigation.navigate('EveningCheckIn')
      }
    }}
  />
)}
```

**Step 6: Add new styles**

Add to styles:
```typescript
screenContainer: {
  flex: 1,
  backgroundColor: '#030712',
},
ambientGlow: {
  position: 'absolute',
  top: -100,
  left: -100,
  width: 300,
  height: 300,
  borderRadius: 150,
  backgroundColor: 'rgba(139, 92, 246, 0.08)',
},
```

**Step 7: Verify changes**

Run: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
Expected: No errors

**Step 8: Commit**

```bash
git add apps/mobile/src/screens/main/HomeScreen.tsx
git commit -m "feat(mobile): add ambient glow, ContinueCard, and Confetti to HomeScreen"
```

---

## Task 8: Final Verification and Cleanup

**Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
Expected: No errors

**Step 2: Run tests**

Run: `npm run test --workspace=mobile`
Expected: All tests pass

**Step 3: Visual verification**

Start the app: `npm run start --workspace=mobile`
Verify:
- [ ] HeroCard has softer morning gradient
- [ ] HeroCard icon floats gently
- [ ] StreakCelebration fire emoji pulses
- [ ] StreakCelebration dots pop in sequentially
- [ ] WeekProgress bar animates on load
- [ ] Glass borders visible on all cards
- [ ] Ambient purple glow visible in background
- [ ] Confetti triggers on milestone streaks (test with mock data)

**Step 4: Final commit with all changes**

```bash
git add -A
git commit -m "feat(mobile): complete glassmorphism polish implementation"
```

---

## Summary

| Task | Component | Changes |
|------|-----------|---------|
| 1 | HeroCard | Softer morning gradient, icon float, glass shine |
| 2 | StreakCelebration | Fire pulse, sequential dots, glass border |
| 3 | ContinueCard | New component for incomplete check-ins |
| 4 | Confetti | New celebration component |
| 5 | WeekProgress | Glass border, animated fill |
| 6 | InsightsPreview | Purple-tinted glass border |
| 7 | HomeScreen | Ambient glow, ContinueCard, Confetti integration |
| 8 | Verification | TypeScript, tests, visual check |

**Total Files:**
- Create: 2 (ContinueCard.tsx, Confetti.tsx)
- Modify: 6 (HeroCard, StreakCelebration, WeekProgress, InsightsPreview, HomeScreen, index.ts)
