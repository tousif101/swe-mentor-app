# Technical Debt Register

**Last Updated**: 2025-12-17
**Review Method**: Multi-agent consensus analysis (3 independent code reviewers)
**Overall Quality Score**: 73%
**Branch Reviewed**: `feature/glassmorphism-polish` (16 changed files)

---

## Summary

| Priority | Count | Estimated Effort |
|----------|-------|------------------|
| Critical | 5 | ~1.5 hours |
| High | 8 | ~8 hours |
| Medium | 14 | ~14 hours |
| Low | 8 | ~3 hours |
| **Total** | **35** | **~3-4 days** |

---

## Critical Issues (3/3 Agents Agree)

### 1. Hardcoded Supabase Credentials

- **File**: `src/lib/supabase.ts:6-7`
- **Category**: Security
- **Effort**: ~15 min

**Problem**:
```typescript
const supabaseUrl = 'http://192.168.5.124:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Impact**: API keys exposed in version control, local IP leaks network topology, credentials cannot be rotated without code changes.

**Solution**:
```typescript
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey
```

- [ ] Create `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add `.env` to `.gitignore`
- [ ] Update `app.config.ts` to read env vars
- [ ] Update `supabase.ts` to use config

---

### 2. Unhandled Promise Rejection in Auth Hook

- **File**: `src/hooks/useAuth.ts:21-27`
- **Category**: Error Handling
- **Effort**: ~5 min

**Problem**:
```typescript
supabase.auth.getSession().then(({ data: { session } }) => {
  setState({ session, user: session?.user ?? null, isLoading: false })
})
// No .catch() handler
```

**Impact**: Network errors crash the app or leave it in permanent loading state.

**Solution**:
```typescript
supabase.auth.getSession()
  .then(({ data: { session } }) => {
    setState({ session, user: session?.user ?? null, isLoading: false })
  })
  .catch((error) => {
    console.error('Auth session error:', error)
    setState({ session: null, user: null, isLoading: false })
  })
```

- [ ] Add `.catch()` handler to `getSession()` call

---

### 3. Navigation Props Typed as `any`

- **Files**:
  - `src/screens/main/MorningCheckInScreen.tsx:31`
  - `src/screens/main/EveningCheckInScreen.tsx:22`
- **Category**: Type Safety
- **Effort**: ~20 min

**Problem**:
```typescript
type MorningCheckInScreenProps = {
  navigation: any  // Loses all type safety
}
```

**Impact**: No compile-time safety for navigation calls, possible runtime crashes.

**Solution**:
```typescript
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { HomeStackParamList } from '../../navigation/HomeStackNavigator'

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'MorningCheckIn'>
}
```

- [ ] Fix type in `MorningCheckInScreen.tsx`
- [ ] Fix type in `EveningCheckInScreen.tsx`

---

### 4. Silent Error Handling in JournalScreen

- **File**: `src/screens/main/JournalScreen.tsx:35-47`
- **Category**: Error Handling
- **Effort**: ~30 min

**Problem**:
```typescript
// Errors logged to console but user gets no feedback
try {
  const data = await fetchAllCheckIns(userId)
  setCheckIns(data)
} catch (error) {
  console.error('Failed to fetch check-ins:', error)
  // User sees empty journal with no explanation
}
```

**Impact**: Users won't know why journal is empty if fetch fails. No retry option provided.

**Solution**:
```typescript
const [error, setError] = useState<string | null>(null)

try {
  const data = await fetchAllCheckIns(userId)
  setCheckIns(data)
  setError(null)
} catch (error) {
  console.error('Failed to fetch check-ins:', error)
  setError('Failed to load journal entries')
}

// In render:
{error && (
  <View className="p-4">
    <Text className="text-red-400">{error}</Text>
    <Pressable onPress={refetch}>
      <Text className="text-primary-400">Tap to retry</Text>
    </Pressable>
  </View>
)}
```

- [ ] Add error state to `JournalScreen.tsx`
- [ ] Display error message with retry option

---

### 5. Navigation Type Safety Bypass with `as never`

- **File**: `src/screens/main/JournalScreen.tsx:85-88`
- **Category**: Type Safety
- **Effort**: ~20 min

**Problem**:
```typescript
navigation.navigate('CheckInDetail', { checkIn }) as never
// Bypasses TypeScript navigation checking entirely
```

**Impact**: Typos in route names won't be caught at compile time. Can cause runtime crashes.

**Solution**:
```typescript
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/types'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Journal'>
}

// Then use without `as never`:
navigation.navigate('CheckInDetail', { checkIn })
```

- [ ] Define proper navigation types for JournalScreen
- [ ] Remove `as never` type assertion

---

## High Priority Issues (2/3 Agents Agree)

### 6. Memory Leaks in Animations

- **Files**:
  - `src/components/WeekProgress.tsx:13-19`
  - `src/components/HeroCard.tsx:50-72`
  - `src/components/Confetti.tsx:43-90`
- **Category**: Memory Leak
- **Effort**: ~30 min total

**Problem**: Animations not properly cleaned up on component unmount.

**Solution**:
```typescript
useEffect(() => {
  const animation = Animated.timing(progressAnim, {
    toValue: progressPercent,
    duration: 800,
    useNativeDriver: false,
  })
  animation.start()

  return () => animation.stop()  // Add cleanup
}, [progressPercent])
```

- [ ] Fix cleanup in `WeekProgress.tsx`
- [ ] Fix cleanup in `HeroCard.tsx`
- [ ] Fix cleanup in `Confetti.tsx`

---

### 7. Race Conditions in Data Fetching

- **Files**:
  - `src/screens/main/HomeScreen.tsx:46-67`
  - `src/navigation/RootNavigator.tsx:73-86`
  - `src/hooks/useProfile.ts:53-55`
- **Category**: Race Condition
- **Effort**: ~1.5 hours

**Problem**: Multiple async operations without proper cancellation flags.

**Solution**:
```typescript
useEffect(() => {
  let cancelled = false

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchData()
      if (!cancelled) {
        setData(data)
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false)
      }
    }
  }

  loadData()
  return () => { cancelled = true }
}, [dependency])
```

- [ ] Add cancellation flag to `HomeScreen.tsx` loadData
- [ ] Gate ProfileProvider on auth completion in `RootNavigator.tsx`
- [ ] Add cancellation flag to `useProfile.ts` fetchProfile

---

### 8. Missing Error Boundaries

- **File**: `App.tsx`
- **Category**: Error Handling
- **Effort**: ~1 hour

**Problem**: No error boundary to catch component errors.

**Impact**: Any component error will crash entire app with white screen.

**Solution**:
```typescript
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View className="flex-1 justify-center items-center bg-gray-950">
      <Text className="text-white text-lg mb-4">Something went wrong</Text>
      <Pressable onPress={resetErrorBoundary}>
        <Text className="text-primary-400">Try again</Text>
      </Pressable>
    </View>
  )
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
```

- [ ] Install `react-error-boundary`
- [ ] Create `ErrorFallback` component
- [ ] Wrap `RootNavigator` in `ErrorBoundary`

---

### 9. Silent Failures in SecureStore

- **File**: `src/lib/supabase.ts:14-35`
- **Category**: Error Handling
- **Effort**: ~1 hour

**Problem**:
```typescript
catch (error) {
  console.error('[Supabase] SecureStore getItem failed:', error)
  return null  // Silent failure
}
```

**Impact**: Users may lose authentication sessions without knowing why.

**Solution**:
- Add user-facing error messages for critical operations
- Implement fallback to AsyncStorage with warning
- Track error metrics

- [ ] Add fallback storage mechanism
- [ ] Surface critical auth errors to user
- [ ] Add error tracking/logging

---

### 10. Unnecessary Re-renders in HomeScreen

- **File**: `src/screens/main/HomeScreen.tsx:113-133`
- **Category**: Performance
- **Effort**: ~20 min

**Problem**: Handler functions recreated on every render.

```typescript
const handleHeroPress = () => { ... }  // Recreated every render
const handleViewInsights = () => { ... }
```

**Solution**:
```typescript
const handleHeroPress = useCallback(() => {
  if (heroState === 'completed') return
  if (heroState === 'morning') {
    navigation.navigate('MorningCheckIn')
  } else {
    navigation.navigate('EveningCheckIn')
  }
}, [heroState, navigation])

const handleViewInsights = useCallback(() => {
  navigation.getParent()?.navigate('InsightsTab')
}, [navigation])
```

- [ ] Wrap `handleHeroPress` in `useCallback`
- [ ] Wrap `handleViewInsights` in `useCallback`
- [ ] Wrap `getHeroState` in `useCallback`

---

### 11. Missing Network Retry Logic

- **Files**: All Supabase queries
- **Category**: Error Handling
- **Effort**: ~1.5 hours

**Problem**: No retry logic for transient network failures.

**Solution**:
```typescript
// src/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}
```

- [ ] Create `src/utils/retry.ts` utility
- [ ] Apply to critical Supabase operations (auth, profile, check-ins)

---

### 12. Realtime Subscription Cleanup

- **File**: `src/hooks/useProfile.ts:61-84`
- **Category**: Memory Leak
- **Effort**: ~30 min

**Problem**: Realtime subscription cleanup depends on `userId` changing.

**Solution**:
```typescript
useEffect(() => {
  if (!userId) return

  const channel = supabase
    .channel(`profile:${userId}`)
    .on('postgres_changes', { ... }, handleChange)
    .subscribe()

  return () => {
    channel.unsubscribe()
    supabase.removeChannel(channel)
  }
}, [userId])
```

- [ ] Add explicit `channel.unsubscribe()` before `removeChannel`

---

### 13. Unsafe Type Assertion

- **File**: `src/hooks/useProfile.ts:75`
- **Category**: Type Safety
- **Effort**: ~30 min

**Problem**:
```typescript
profile: payload.new as Profile  // Unsafe assertion
```

**Solution**:
```typescript
if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
  const newProfile = payload.new
  if (newProfile && typeof newProfile === 'object' && 'id' in newProfile) {
    setState((prev) => ({
      ...prev,
      profile: newProfile as Profile,
    }))
  }
}
```

- [ ] Add runtime validation before type assertion

---

## Medium Priority Issues

### 14. Code Duplication - Gradient Button

- **Files**: ~10 screens (Login, Signup, Welcome, Onboarding, etc.)
- **Category**: DRY Violation
- **Effort**: ~2 hours

**Problem**: Same LinearGradient button pattern repeated throughout codebase.

**Solution**: Extract to `src/components/GradientButton.tsx`

```typescript
type Props = {
  onPress: () => void
  title: string
  loading?: boolean
  disabled?: boolean
}

export function GradientButton({ onPress, title, loading, disabled }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}>
      <LinearGradient
        colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        className="py-4 rounded-2xl items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  )
}
```

- [ ] Create `GradientButton` component
- [ ] Refactor `LoginScreen.tsx`
- [ ] Refactor `SignupScreen.tsx`
- [ ] Refactor `WelcomeScreen.tsx`
- [ ] Refactor onboarding screens

---

### 15. Magic Numbers / Hardcoded Colors

- **Files**: Throughout codebase
- **Category**: Maintainability
- **Effort**: ~3 hours

**Problem**: Colors scattered throughout (~50+ occurrences):
- `#030712` (background)
- `#8b5cf6` (primary)
- `#7c3aed` (primary dark)
- `#a78bfa` (primary light)

**Solution**: Create `src/theme/colors.ts`

```typescript
export const colors = {
  gray: {
    950: '#030712',
    900: '#111827',
    800: '#1f2937',
    700: '#374151',
    400: '#9ca3af',
  },
  primary: {
    900: '#4c1d95',
    600: '#7c3aed',
    500: '#8b5cf6',
    400: '#a78bfa',
  },
  // ... etc
} as const

export const gradients = {
  primary: ['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa'],
} as const
```

- [ ] Create `src/theme/colors.ts`
- [ ] Create `src/theme/spacing.ts`
- [ ] Find/replace hardcoded colors throughout codebase

---

### 16. Missing Accessibility Labels

- **Files**: All interactive components
- **Category**: Accessibility
- **Effort**: ~4 hours

**Problem**: No `accessibilityLabel` or `accessibilityRole` on interactive elements.

**Solution**:
```typescript
<Pressable
  onPress={handleLogin}
  accessibilityRole="button"
  accessibilityLabel="Sign in to your account"
  accessibilityHint="Double tap to sign in"
>
  <Text>Sign in</Text>
</Pressable>

<TextInput
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email address"
  // ...
/>
```

- [ ] Audit all `Pressable` components
- [ ] Audit all `TouchableOpacity` components
- [ ] Audit all `TextInput` components
- [ ] Add labels to icon buttons

---

### 17. Timezone/Date Handling Issues

- **Files**:
  - `src/utils/checkInHelpers.ts:41`
  - `src/utils/journalHelpers.ts:124`
- **Category**: Edge Cases
- **Effort**: ~3 hours

**Problem**:
```typescript
const today = new Date().toISOString().split('T')[0]  // Uses device timezone
```

**Solution**: Use proper date library with timezone support.

```typescript
import { format, formatInTimeZone } from 'date-fns-tz'

const getUserDate = (timezone: string): string => {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
}
```

- [ ] Install `date-fns` and `date-fns-tz`
- [ ] Update date formatting in `checkInHelpers.ts`
- [ ] Update date formatting in `journalHelpers.ts`
- [ ] Consider storing user timezone in profile

---

### 18. Date Object Mutation Bug

- **File**: `src/utils/checkInHelpers.ts:308-314`
- **Category**: Edge Cases
- **Effort**: ~15 min

**Problem**:
```typescript
function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))  // Mutates 'now'!
  return monday.toISOString().split('T')[0]
}
```

**Solution**:
```typescript
function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)  // Clone first
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}
```

- [ ] Fix date mutation in `getWeekStart()`

---

### 19. Weak Password Validation

- **File**: `src/utils/validation.ts:15-20`
- **Category**: Security
- **Effort**: ~15 min

**Problem**: Password regex doesn't require special characters.

**Solution**:
```typescript
password: z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[@$!%*?&#]/, 'Must contain a special character'),
```

- [ ] Update password validation schema
- [ ] Update UI to show password requirements

---

### 20. Empty State Handling

- **File**: `src/utils/journalHelpers.ts:16-36`
- **Category**: Edge Cases
- **Effort**: ~20 min

**Problem**: `groupCheckInsByDay` doesn't explicitly handle empty array.

**Solution**:
```typescript
export function groupCheckInsByDay(checkIns: CheckIn[]): DayGroup[] {
  if (!checkIns || checkIns.length === 0) {
    return []
  }
  // ... rest of function
}
```

- [ ] Add explicit empty array handling
- [ ] Add null/undefined check

---

### 21. Inconsistent Error Handling Patterns

- **Files**: Throughout codebase
- **Category**: Code Quality
- **Effort**: ~2 hours

**Problem**: Mix of error handling approaches:
- Some functions throw errors
- Some use `Alert.alert()`
- Some return error in state

**Solution**: Standardize on error state + user-facing messages.

- [ ] Document error handling pattern in README
- [ ] Refactor to consistent pattern
- [ ] Create `src/utils/errors.ts` with error helpers

---

### 22. Missing useMemo for Expensive Computations

- **File**: `src/screens/main/MorningCheckInScreen.tsx:52-58`
- **Category**: Performance
- **Effort**: ~20 min

**Problem**:
```typescript
const focusAreaChips: Chip[] =
  profile?.focus_areas && profile.focus_areas.length > 0
    ? profile.focus_areas.map((area) => ({ ... }))  // Recreated every render
    : DEFAULT_FOCUS_AREAS
```

**Solution**:
```typescript
const focusAreaChips = useMemo(() =>
  profile?.focus_areas?.length > 0
    ? profile.focus_areas.map((area) => ({ ... }))
    : DEFAULT_FOCUS_AREAS
, [profile?.focus_areas])
```

- [ ] Add `useMemo` to `focusAreaChips` in `MorningCheckInScreen.tsx`
- [ ] Check `EveningCheckInScreen.tsx` for similar issue

---

### 23. Hook Dependency Issues

- **File**: `src/components/Confetti.tsx:90`
- **Category**: React Hooks
- **Effort**: ~15 min

**Problem**: Animated values in dependency array cause unnecessary effect runs.

```typescript
}, [active, pieces, initialX, onComplete])
```

**Solution**:
```typescript
}, [active, onComplete])  // Remove Animated value refs
```

- [ ] Fix dependency array in `Confetti.tsx`

---

### 24. LayoutAnimation Android Compatibility

- **File**: `src/components/DayCard.tsx:27`
- **Category**: Cross-Platform
- **Effort**: ~15 min

**Problem**:
```typescript
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
// Not configured for Android - may crash or silently fail
```

**Impact**: LayoutAnimation may crash or silently fail on Android devices.

**Solution**:
```typescript
import { UIManager, Platform, LayoutAnimation } from 'react-native'

// Add to app initialization (App.tsx or index.ts)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}
```

- [ ] Add Android LayoutAnimation initialization to `App.tsx`

---

### 25. Type Safety - `as any` for Ionicons

- **File**: `src/components/DayCard.tsx:39`
- **Category**: Type Safety
- **Effort**: ~15 min

**Problem**:
```typescript
<Ionicons name={iconName as any} />
// Invalid icon names only caught at runtime
```

**Impact**: Typos in icon names won't be caught at compile time.

**Solution**:
```typescript
import { Ionicons } from '@expo/vector-icons'

type IoniconsName = keyof typeof Ionicons.glyphMap

const iconName: IoniconsName = expanded ? 'chevron-up' : 'chevron-down'
<Ionicons name={iconName} />
```

- [ ] Create proper type for Ionicons names
- [ ] Remove `as any` assertion

---

### 26. Performance - Inline Functions in Components

- **Files**: Multiple locations
  - `src/screens/main/JournalScreen.tsx` (handleHashtagPress, renderItem)
  - `src/components/DayCard.tsx` (onPress handlers)
  - `src/components/JournalSearch.tsx` (formatTagLabel)
- **Category**: Performance
- **Effort**: ~45 min

**Problem**: Callbacks not wrapped in `useCallback`, recreated on every render.

**Solution**:
```typescript
const handleHashtagPress = useCallback((tag: string) => {
  // handler logic
}, [dependencies])

const renderItem = useCallback(({ item }: { item: DayGroup }) => (
  <DayCard {...item} />
), [])
```

- [ ] Wrap `handleHashtagPress` in `useCallback`
- [ ] Wrap `renderItem` in `useCallback`
- [ ] Wrap `formatTagLabel` in `useMemo` or move outside component

---

### 27. renderHeader Causes Re-renders

- **File**: `src/screens/main/JournalScreen.tsx:109-135`
- **Category**: Performance
- **Effort**: ~20 min

**Problem**: `renderHeader` function recreated every render, causing SectionList header to re-render unnecessarily.

**Solution**:
```typescript
const renderHeader = useCallback(() => (
  <JournalSearch
    searchText={searchText}
    onSearchChange={setSearchText}
    // ...
  />
), [searchText, selectedTags, uniqueFocusAreas])
```

- [ ] Wrap `renderHeader` in `useCallback` with proper dependencies

---

## Low Priority Issues

### 28. Unused State Variable

- **File**: `src/screens/main/HomeScreen.tsx:41-44`
- **Category**: Dead Code
- **Effort**: ~5 min

**Problem**:
```typescript
const [partialCheckIn, setPartialCheckIn] = useState<{
  type: 'morning' | 'evening'
  startedAt: string
} | null>(null)  // Never set, only read
```

- [ ] Remove unused state or implement feature

---

### 29. Console Logs in Production

- **Files**:
  - `src/lib/supabase.ts:9`
  - `src/screens/onboarding/ReadyScreen.tsx:59, 80, 88`
- **Category**: Code Quality
- **Effort**: ~30 min

**Problem**: `console.log` and `console.error` calls in production code.

- [ ] Remove or replace with proper logging library
- [ ] Consider `react-native-logs` for environment-based logging

---

### 30. Missing Return Key Behavior in Forms

- **Files**: `LoginScreen.tsx`, `SignupScreen.tsx`
- **Category**: User Experience
- **Effort**: ~30 min

**Problem**: Pressing "return" on keyboard doesn't submit form or move to next field.

**Solution**:
```typescript
<TextInput
  onSubmitEditing={() => passwordInputRef.current?.focus()}
  returnKeyType="next"
  blurOnSubmit={false}
  ref={emailInputRef}
/>
<TextInput
  onSubmitEditing={handleLogin}
  returnKeyType="go"
  ref={passwordInputRef}
/>
```

- [ ] Add refs and `onSubmitEditing` to form inputs
- [ ] Set appropriate `returnKeyType`

---

### 31. Energy Level Falsy Check Bug

- **File**: `src/components/DayCard.tsx:105, 127`
- **Category**: Edge Cases
- **Effort**: ~10 min

**Problem**:
```typescript
{checkIn.energy_level && (
  <EnergyBadge level={checkIn.energy_level} />
)}
// Fails for energy_level = 0 (falsy but valid)
```

**Impact**: Energy badge won't display if energy level is 0.

**Solution**:
```typescript
{checkIn.energy_level != null && (
  <EnergyBadge level={checkIn.energy_level} />
)}
```

- [ ] Fix falsy check in `DayCard.tsx` line 105
- [ ] Fix falsy check in `DayCard.tsx` line 127

---

### 32. Code Duplication - Hashtag Formatting

- **Files**:
  - `src/components/DayCard.tsx:50`
  - `src/components/JournalSearch.tsx:22`
- **Category**: DRY Violation
- **Effort**: ~20 min

**Problem**: Hashtag formatting logic duplicated in multiple files.

**Solution**: Extract to shared utility:
```typescript
// src/utils/formatters.ts
export function formatFocusAreaTag(area: string): string {
  return `#${area.replace(/_/g, ' ')}`
}
```

- [ ] Create `formatFocusAreaTag` utility
- [ ] Update `DayCard.tsx` to use shared utility
- [ ] Update `JournalSearch.tsx` to use shared utility

---

### 33. Missing userId Validation

- **File**: `src/utils/journalHelpers.ts:136`
- **Category**: Edge Cases
- **Effort**: ~10 min

**Problem**: No validation before DB query in `fetchAllCheckIns`.

**Solution**:
```typescript
export async function fetchAllCheckIns(userId: string): Promise<CheckIn[]> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided')
  }
  // ... rest of function
}
```

- [ ] Add userId validation in `fetchAllCheckIns`

---

### 34. No Tests for fetchAllCheckIns

- **File**: `src/utils/journalHelpers.ts`
- **Category**: Testing
- **Effort**: ~1 hour

**Problem**: Database function `fetchAllCheckIns` has no test coverage.

**Solution**: Add test file:
```typescript
// src/utils/__tests__/journalHelpers.test.ts
describe('fetchAllCheckIns', () => {
  it('should return empty array for user with no check-ins', async () => {
    // ...
  })

  it('should throw error for invalid userId', async () => {
    // ...
  })
})
```

- [ ] Add test cases for `fetchAllCheckIns`
- [ ] Add mock for Supabase client

---

### 35. stopPropagation Optional Chaining

- **File**: `src/components/DayCard.tsx:46`
- **Category**: Code Quality
- **Effort**: ~5 min

**Problem**:
```typescript
e?.stopPropagation?.()
// Optional chaining unnecessary - stopPropagation always exists on event
```

**Solution**:
```typescript
e.stopPropagation()
```

- [ ] Remove unnecessary optional chaining

---

## Positive Patterns to Maintain

These are things the codebase does well - keep doing them:

1. **Strong TypeScript foundation** - Good use of generics and union types
2. **Clean component architecture** - Well-separated screens, components, hooks
3. **Zod validation** - Runtime validation with TypeScript inference
4. **Proper auth subscription cleanup** - `useAuth.ts:40-41`
5. **Progressive disclosure** - Well-designed user journey stages
6. **Smooth animations** - Good use of Animated API with native driver
7. **StyleSheet outside components** - Proper pattern for performance

---

## Tracking

Use this section to track progress:

```
[ ] Critical issues fixed: 0/5
[ ] High priority fixed: 0/8
[ ] Medium priority fixed: 0/14
[ ] Low priority fixed: 0/8
```

**Total Issues**: 35
**Next Review Date**: _____________
