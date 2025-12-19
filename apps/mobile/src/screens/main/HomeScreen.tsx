import { useCallback, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../../lib/supabase'
import {
  getUserJourneyStage,
  getTimeOfDay,
  getGreeting,
  getIncompleteCheckIn,
  formatTimeAgo,
  type JourneyStageData,
} from '../../utils/checkInHelpers'
import { useProfileContext } from '../../contexts'
import { logger } from '../../utils/logger'
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
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator'
import { STREAK_MILESTONES } from '../../constants'

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { profile } = useProfileContext()
  const [isLoading, setIsLoading] = useState(true)
  const [journeyData, setJourneyData] = useState<JourneyStageData | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [partialCheckIn, setPartialCheckIn] = useState<{
    type: 'morning' | 'evening'
    startedAt: string
    checkInId: string
    prefill: Record<string, unknown>
  } | null>(null)

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController()

      const loadData = async () => {
        setIsLoading(true)
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (controller.signal.aborted) return

          if (userError || !userData.user) {
            throw new Error('Unable to load user session')
          }

          const data = await getUserJourneyStage(userData.user.id)

          if (!controller.signal.aborted) {
            setJourneyData(data)

            // Check for streak milestones to trigger confetti
            const streak = data.streakData.current_streak
            if (STREAK_MILESTONES.includes(streak as typeof STREAK_MILESTONES[number])) {
              setShowConfetti(true)
            }

            // Check for incomplete (draft) check-ins
            const [incompleteMorning, incompleteEvening] = await Promise.all([
              getIncompleteCheckIn(userData.user.id, 'morning'),
              getIncompleteCheckIn(userData.user.id, 'evening'),
            ])

            // Determine which partial check-in to show (if any)
            // Only show if the corresponding completed check-in doesn't exist
            if (incompleteMorning && !data.todayMorning) {
              setPartialCheckIn({
                type: 'morning',
                startedAt: incompleteMorning.created_at
                  ? formatTimeAgo(new Date(incompleteMorning.created_at))
                  : 'just now',
                checkInId: incompleteMorning.id,
                prefill: {
                  focus_area: incompleteMorning.focus_area,
                  daily_goal: incompleteMorning.daily_goal,
                },
              })
            } else if (incompleteEvening && !data.todayEvening) {
              setPartialCheckIn({
                type: 'evening',
                startedAt: incompleteEvening.created_at
                  ? formatTimeAgo(new Date(incompleteEvening.created_at))
                  : 'just now',
                checkInId: incompleteEvening.id,
                prefill: {
                  goal_completed: incompleteEvening.goal_completed,
                  quick_win: incompleteEvening.quick_win,
                  blocker: incompleteEvening.blocker,
                  energy_level: incompleteEvening.energy_level,
                  tomorrow_carry: incompleteEvening.tomorrow_carry,
                },
              })
            } else {
              setPartialCheckIn(null)
            }
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            logger.error('Error loading home data:', err)
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false)
          }
        }
      }

      loadData()
      return () => controller.abort()
    }, [])
  )

  // Determine what to show based on journey stage
  const stage = journeyData?.stage ?? 'new'
  const showTip = stage === 'first_done'
  const showWeekProgress = stage === 'building' || stage === 'established'
  const showStreak =
    stage === 'established' && (journeyData?.streakData.current_streak ?? 0) >= 3
  const showInsights = stage === 'established'

  // Determine hero state
  const getHeroState = useCallback((): HeroState => {
    if (!journeyData) return 'morning'

    const { todayMorning, todayEvening } = journeyData

    // Both done = completed
    if (todayMorning && todayEvening) {
      return 'completed'
    }

    // Morning done = show evening
    if (todayMorning) {
      return 'evening'
    }

    // Check time of day
    const timeOfDay = getTimeOfDay()
    if (timeOfDay === 'evening' || timeOfDay === 'night') {
      // Evening time but morning not done - still show morning
      // Or show evening if that's the priority
      return 'evening'
    }

    return 'morning'
  }, [journeyData])

  const heroState = getHeroState()

  // Handle hero press
  const handleHeroPress = useCallback(() => {
    if (heroState === 'completed') {
      // Navigate to Journal tab
      navigation.getParent()?.navigate('JournalTab')
      return
    }

    if (heroState === 'morning') {
      navigation.navigate('MorningCheckIn')
    } else {
      navigation.navigate('EveningCheckIn')
    }
  }, [heroState, navigation])

  // Get greeting
  const greeting = getGreeting(stage, profile?.name ?? undefined)

  // Navigate to Insights tab
  const handleViewInsights = useCallback(() => {
    navigation.getParent()?.navigate('InsightsTab')
  }, [navigation])

  if (isLoading) {
    return (
      <View testID="home-screen-loading" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    )
  }

  return (
    <View testID="home-screen" style={styles.screenContainer}>
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      {/* Confetti overlay */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View testID="home-greeting">
            <Text style={styles.greetingPrefix}>{greeting.prefix}</Text>
            <Text style={styles.greetingName}>{greeting.name}</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="settings-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card - Always shown */}
        <HeroCard state={heroState} onPress={handleHeroPress} />

        {/* ContinueCard - Show when there's an incomplete check-in */}
        {partialCheckIn && (
          <ContinueCard
            type={partialCheckIn.type}
            startedAt={partialCheckIn.startedAt}
            onPress={() => {
              if (partialCheckIn.type === 'morning') {
                navigation.navigate('MorningCheckIn', {
                  checkInId: partialCheckIn.checkInId,
                  prefill: partialCheckIn.prefill as {
                    focus_area?: string | null
                    daily_goal?: string | null
                  },
                })
              } else {
                navigation.navigate('EveningCheckIn', {
                  checkInId: partialCheckIn.checkInId,
                  prefill: partialCheckIn.prefill as {
                    goal_completed?: string | null
                    quick_win?: string | null
                    blocker?: string | null
                    energy_level?: number | null
                    tomorrow_carry?: string | null
                  },
                })
              }
            }}
          />
        )}

        {/* Tip Card - Only for first_done stage */}
        {showTip && <TipCard />}

        {/* Week Progress - For building and established stages */}
        {showWeekProgress && (
          <WeekProgress
            daysCompleted={journeyData?.weekProgress ?? 0}
            onViewInsights={handleViewInsights}
          />
        )}

        {/* Streak Celebration - For established users with 3+ day streak */}
        {showStreak && (
          <StreakCelebration
            currentStreak={journeyData?.streakData.current_streak ?? 0}
          />
        )}

        {/* Insights Preview - For established users */}
        {showInsights && (
          <InsightsPreview
            totalCheckIns={journeyData?.streakData.total_check_ins ?? 0}
            onViewInsights={handleViewInsights}
          />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: '#030712', // gray-950
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greetingPrefix: {
    fontSize: 14,
    color: '#9CA3AF', // gray-400
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB', // gray-50
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
