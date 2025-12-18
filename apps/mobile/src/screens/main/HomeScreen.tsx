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
  type JourneyStageData,
} from '../../utils/checkInHelpers'
import { useProfileContext } from '../../contexts'
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
  } | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        throw new Error('Unable to load user session')
      }

      const data = await getUserJourneyStage(userData.user.id)
      setJourneyData(data)

      // Check for streak milestones to trigger confetti
      const streak = data.streakData.current_streak
      if (streak === 7 || streak === 30 || streak === 100) {
        setShowConfetti(true)
      }
    } catch (err) {
      console.error('Error loading home data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  // Determine what to show based on journey stage
  const stage = journeyData?.stage ?? 'new'
  const showTip = stage === 'first_done'
  const showWeekProgress = stage === 'building' || stage === 'established'
  const showStreak =
    stage === 'established' && (journeyData?.streakData.current_streak ?? 0) >= 3
  const showInsights = stage === 'established'

  // Determine hero state
  const getHeroState = (): HeroState => {
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
  }

  const heroState = getHeroState()

  // Handle hero press
  const handleHeroPress = () => {
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
  }

  // Get greeting
  const greeting = getGreeting(stage, profile?.name ?? undefined)

  // Navigate to Insights tab
  const handleViewInsights = () => {
    navigation.getParent()?.navigate('InsightsTab')
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    )
  }

  return (
    <View style={styles.screenContainer}>
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      {/* Confetti overlay */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
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
