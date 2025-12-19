# Claude Code Reference - SWE Mentor Mobile App

> Quick reference for maintaining code quality and consistency. Read this before making changes.

---

## Project Structure

```
apps/mobile/
├── App.tsx                 # Entry point with ErrorBoundary
├── src/
│   ├── components/         # Reusable UI components
│   │   └── journal/        # Feature-specific components
│   ├── constants/          # App-wide constants (no magic numbers)
│   ├── contexts/           # React contexts (ProfileContext)
│   ├── hooks/              # Custom hooks (useAuth, useProfile)
│   ├── lib/                # External service clients (Supabase)
│   ├── navigation/         # React Navigation setup
│   ├── screens/            # Screen components
│   │   ├── main/           # Authenticated screens
│   │   └── onboarding/     # Onboarding flow screens
│   └── utils/              # Utility functions
│       └── __tests__/      # Unit tests
packages/shared/            # Monorepo shared types (Database types)
```

---

## Shared Libraries (Key Dependencies)

| Library | Purpose | Import From |
|---------|---------|-------------|
| `@supabase/supabase-js` | Backend/Auth | `src/lib/supabase` |
| `expo-linear-gradient` | Gradient backgrounds | Direct import |
| `@expo/vector-icons` | Icons (Ionicons) | Direct import |
| `react-navigation` | Navigation | `@react-navigation/*` |
| `nativewind` | Tailwind CSS styling | className prop |
| `zod` | Schema validation | Direct import |
| `react-error-boundary` | Error catching | App.tsx only |
| `react-native-reanimated` | Animations | Direct import |
| `expo-secure-store` | Secure storage | Via `src/lib/supabase` |

---

## Shared Modules

### Utils (`src/utils/`)

Always import from barrel file:
```typescript
import { validateEmail, withRetry, logger, formatFocusAreaTag } from '../utils'
```

| Module | Purpose | Example |
|--------|---------|---------|
| `validation.ts` | Zod schemas for forms | `loginSchema.parse(data)` |
| `retry.ts` | Network retry with backoff | `await withRetry(() => fetch(...))` |
| `logger.ts` | Environment-aware logging | `logger.info()`, `logger.error()` |
| `formatters.ts` | Text formatting utilities | `formatFocusAreaTag('React Native')` |
| `checkInHelpers.ts` | Check-in data utilities | `groupCheckInsByDay()`, `getWeekStart()` |
| `journalHelpers.ts` | Journal data utilities | Journal-specific helpers |

### Constants (`src/constants/`)

```typescript
import { STREAK_MILESTONES, ENERGY_LEVELS, ANIMATION_DURATIONS, RETRY_CONFIG } from '../constants'
```

**Never use magic numbers.** Add new constants here.

### Hooks (`src/hooks/`)

```typescript
import { useAuth, useProfile } from '../hooks'
```

| Hook | Returns | Purpose |
|------|---------|---------|
| `useAuth` | `{ session, user, isLoading, error }` | Auth state management |
| `useProfile` | Profile data + loading state | User profile data |

### Contexts (`src/contexts/`)

```typescript
import { ProfileProvider, useProfileContext } from '../contexts'
```

---

## Shared Components

Import from barrel files:
```typescript
import { HeroCard, WeekProgress, ProgressBar, ChipSelector } from '../components'
import { DayCard, JournalSearch, JournalEmptyState } from '../components/journal'
```

### Core Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `HeroCard` | Main CTA card | `state: 'morning' | 'evening' | 'completed'` |
| `WeekProgress` | 7-day progress display | `checkIns`, `onDayPress` |
| `ProgressBar` | Animated progress bar | `progress: number` |
| `ChipSelector` | Multi-select chips | `chips`, `selectedIds`, `onSelect` |
| `Confetti` | Celebration animation | `isActive` |
| `CustomTabBar` | Bottom tab navigator | Used in MainTabNavigator |

---

## Design Standards

### Colors (Tailwind + Custom)

Use Tailwind classes or theme colors:

```typescript
// Backgrounds
className="bg-gray-950"      // Main background (#030712)
className="bg-gray-900"      // Card background
className="bg-gray-800/50"   // Glass effect

// Primary (Purple)
className="text-primary-500" // #8b5cf6
className="bg-primary-600"   // #7c3aed

// Accent (Pink)
className="text-accent-500"  // #d946ef

// Text
className="text-white"       // Primary text
className="text-gray-400"    // Secondary text
className="text-gray-500"    // Muted text
```

### Gradients

Use `expo-linear-gradient` with consistent color sets:

```typescript
// Morning theme
colors={['#d97706', '#f59e0b', '#fbbf24']}

// Evening theme
colors={['#8B5CF6', '#6366F1', '#3B82F6']}

// Success theme
colors={['#10B981', '#14B8A6', '#06B6D4']}

// Primary CTA
colors={['#8B5CF6', '#6366F1']}
```

### Spacing & Layout

- Use Tailwind classes: `p-4`, `m-2`, `gap-4`
- Border radius: `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-3xl` (24px)
- Cards: `rounded-2xl bg-gray-900 p-4`

### Typography

```typescript
// Headings
className="text-2xl font-bold text-white"      // Screen titles
className="text-xl font-semibold text-white"   // Section headers
className="text-lg font-medium text-white"     // Card titles

// Body
className="text-base text-gray-300"            // Primary body
className="text-sm text-gray-400"              // Secondary/captions
className="text-xs text-gray-500"              // Timestamps/labels
```

---

## TypeScript Best Practices

### Navigation Types

Always type navigation props properly:

```typescript
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../navigation/RootNavigator'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>
}
```

### Icon Types

Use proper Ionicons typing:

```typescript
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

type IoniconsName = ComponentProps<typeof Ionicons>['name']

const icon: IoniconsName = 'checkmark-circle'
```

### Zod Validation

Always infer types from schemas:

```typescript
import { z } from 'zod'

export const mySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export type MyInput = z.infer<typeof mySchema>
```

### Event Handler Types

```typescript
import { GestureResponderEvent } from 'react-native'

const handlePress = (e: GestureResponderEvent) => {
  e.stopPropagation?.()
}
```

---

## React Native Patterns

### Animation Cleanup

Always clean up animations:

```typescript
useEffect(() => {
  const animation = Animated.loop(/* ... */)
  animation.start()
  return () => animation.stop()
}, [animatedValue])
```

### useCallback for Event Handlers

Wrap handlers passed to children:

```typescript
const handlePress = useCallback(() => {
  // handler logic
}, [dependencies])
```

### useMemo for Expensive Computations

```typescript
const processedData = useMemo(() =>
  expensiveComputation(data),
  [data]
)
```

### StyleSheet Outside Components

```typescript
// Good - defined outside
const styles = StyleSheet.create({
  container: { flex: 1 },
})

export function MyComponent() {
  return <View style={styles.container} />
}
```

### Error States with Retry

```typescript
const [error, setError] = useState<Error | null>(null)

if (error) {
  return (
    <View>
      <Text>Something went wrong</Text>
      <Pressable onPress={handleRetry}>
        <Text>Try again</Text>
      </Pressable>
    </View>
  )
}
```

---

## Supabase Patterns

### Client Usage

```typescript
import { supabase } from '../lib/supabase'

// Query with types
const { data, error } = await supabase
  .from('check_ins')
  .select('*')
  .eq('user_id', userId)
```

### Realtime Subscriptions

Always validate payloads and clean up:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('my-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'my_table' },
      (payload) => {
        // Validate payload before using
        if (payload.new && typeof payload.new.id === 'string') {
          // Safe to use
        }
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
    supabase.removeChannel(channel)
  }
}, [])
```

---

## Logging

**Never use `console.log` directly in production code.**

```typescript
import { logger } from '../utils'

logger.info('Informational message')    // Dev only
logger.debug('Debug details')           // Dev only
logger.warn('Warning message')          // Always shown
logger.error('Error occurred', error)   // Always shown
```

---

## Common Mistakes to Avoid

1. **Magic numbers** - Use constants from `src/constants/`
2. **Untyped navigation** - Always use `NativeStackNavigationProp`
3. **Missing animation cleanup** - Always return cleanup in useEffect
4. **Direct console.log** - Use `logger` utility
5. **Inline functions in render** - Use `useCallback`
6. **Unhandled promises** - Always add `.catch()` or try/catch
7. **Missing error states** - Show retry UI on failures
8. **Falsy checks on numbers** - Use `!= null` instead of `!value`
9. **Date mutations** - Clone dates before modifying: `new Date(date)`
10. **Hardcoded colors** - Use Tailwind classes or theme constants

---

## Quick Checklist Before PR

- [ ] No `any` types (use proper TypeScript types)
- [ ] No magic numbers (use constants)
- [ ] No `console.log` (use logger)
- [ ] Animation cleanup in useEffect returns
- [ ] Error states with retry UI for data fetching
- [ ] useCallback for handlers passed to children
- [ ] Proper navigation typing
- [ ] Imports from barrel files where available
- [ ] StyleSheet defined outside component

---

## Related Documentation

- **TECH-DEBT.md** - Known issues and deferred items
- **tailwind.config.js** - Color palette and theme extensions
- **packages/shared/** - Shared types (Database types from Supabase)
