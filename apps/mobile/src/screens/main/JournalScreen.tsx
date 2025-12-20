import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator'
import type { MainTabParamList } from '../../navigation/MainTabNavigator'
import { DayCard, JournalSearch, JournalEmptyState } from '../../components'
import {
  fetchAllCheckIns,
  groupCheckInsByDay,
  getUniqueFocusAreas,
  filterCheckIns,
  type CheckIn,
  type DayGroup,
} from '../../utils'
import { useAuth } from '../../hooks/useAuth'
import { getTimeOfDay } from '../../utils/checkInHelpers'
import { logger } from '../../utils/logger'
import { COLORS } from '../../constants'

// Memoized header component to prevent unnecessary re-renders
type JournalHeaderProps = {
  hasEntries: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTag: string | null
  availableTags: string[]
  onTagSelect: (tag: string | null) => void
  resultsCount: number
  hasActiveFilters: boolean
}

const JournalHeader = React.memo(function JournalHeader({
  hasEntries,
  searchQuery,
  onSearchChange,
  selectedTag,
  availableTags,
  onTagSelect,
  resultsCount,
  hasActiveFilters,
}: JournalHeaderProps) {
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>Your past check-ins and reflections</Text>
      </View>

      {/* Search & Filters - only show if has entries */}
      {hasEntries && (
        <JournalSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedTag={selectedTag}
          availableTags={availableTags}
          onTagSelect={onTagSelect}
        />
      )}

      {/* Results count */}
      {hasActiveFilters && resultsCount > 0 && (
        <Text style={styles.resultsCount}>
          {resultsCount} {resultsCount === 1 ? 'entry' : 'entries'} match
        </Text>
      )}
    </>
  )
})

// Composite type for navigating from Tab to nested HomeStack
type JournalScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'JournalTab'>,
  NativeStackNavigationProp<HomeStackParamList>
>

export function JournalScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<JournalScreenNavigationProp>()

  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const loadCheckIns = useCallback(async () => {
    if (!user?.id) return

    try {
      const data = await fetchAllCheckIns(user.id)
      setCheckIns(data)
      setError(null)
    } catch (error) {
      logger.error('Failed to load check-ins:', error)
      setError('Failed to load journal entries')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      loadCheckIns()
    }, [loadCheckIns])
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadCheckIns()
  }, [loadCheckIns])

  // Derived data
  const availableTags = useMemo(() => getUniqueFocusAreas(checkIns), [checkIns])

  const filteredCheckIns = useMemo(
    () => filterCheckIns(checkIns, { focusArea: selectedTag, searchQuery }),
    [checkIns, selectedTag, searchQuery]
  )

  const dayGroups = useMemo(
    () => groupCheckInsByDay(filteredCheckIns),
    [filteredCheckIns]
  )

  const handleHashtagPress = useCallback((tag: string) => {
    setSelectedTag(tag)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedTag(null)
  }, [])

  const handleEditPress = useCallback((dayGroup: DayGroup) => {
    const hasMorning = !!dayGroup.morning
    const hasEvening = !!dayGroup.evening

    const navigateToEdit = (type: 'morning' | 'evening') => {
      if (type === 'morning' && dayGroup.morning) {
        // Navigate to HomeTab stack, then to MorningCheckIn screen
        navigation.navigate('HomeTab', {
          screen: 'MorningCheckIn',
          params: {
            checkInId: dayGroup.morning.id,
            returnTo: 'JournalTab',
            prefill: {
              focus_area: dayGroup.morning.focus_area,
              daily_goal: dayGroup.morning.daily_goal,
            },
          },
        })
      } else if (type === 'evening' && dayGroup.evening) {
        navigation.navigate('HomeTab', {
          screen: 'EveningCheckIn',
          params: {
            checkInId: dayGroup.evening.id,
            returnTo: 'JournalTab',
            prefill: {
              goal_completed: dayGroup.evening.goal_completed,
              quick_win: dayGroup.evening.quick_win,
              blocker: dayGroup.evening.blocker,
              energy_level: dayGroup.evening.energy_level,
              tomorrow_carry: dayGroup.evening.tomorrow_carry,
            },
          },
        })
      }
    }

    if (hasMorning && hasEvening) {
      // Show action sheet to choose
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: 'Edit which check-in?',
            options: ['Edit Morning Check-in', 'Edit Evening Reflection', 'Cancel'],
            cancelButtonIndex: 2,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) navigateToEdit('morning')
            else if (buttonIndex === 1) navigateToEdit('evening')
          }
        )
      } else {
        // Android: use Alert as simple alternative
        Alert.alert('Edit which check-in?', undefined, [
          { text: 'Morning Check-in', onPress: () => navigateToEdit('morning') },
          { text: 'Evening Reflection', onPress: () => navigateToEdit('evening') },
          { text: 'Cancel', style: 'cancel' },
        ])
      }
    } else if (hasMorning) {
      navigateToEdit('morning')
    } else if (hasEvening) {
      navigateToEdit('evening')
    }
  }, [navigation])

  const handleStartCheckIn = useCallback(() => {
    const timeOfDay = getTimeOfDay()
    if (timeOfDay === 'morning') {
      navigation.navigate('HomeTab', { screen: 'MorningCheckIn', params: undefined })
    } else {
      navigation.navigate('HomeTab', { screen: 'EveningCheckIn', params: undefined })
    }
  }, [navigation])

  const renderItem = useCallback(({ item }: { item: DayGroup }) => (
    <DayCard dayGroup={item} onHashtagPress={handleHashtagPress} onEditPress={handleEditPress} />
  ), [handleHashtagPress, handleEditPress])

  const renderEmpty = () => {
    if (loading) return null

    if (checkIns.length === 0) {
      return <JournalEmptyState type="no-entries" onAction={handleStartCheckIn} />
    }

    if (dayGroups.length === 0) {
      return <JournalEmptyState type="no-results" onAction={handleClearFilters} />
    }

    return null
  }

  const renderHeader = useCallback(() => (
    <JournalHeader
      hasEntries={checkIns.length > 0}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedTag={selectedTag}
      availableTags={availableTags}
      onTagSelect={setSelectedTag}
      resultsCount={dayGroups.length}
      hasActiveFilters={!!(searchQuery || selectedTag)}
    />
  ), [checkIns.length, searchQuery, selectedTag, availableTags, dayGroups.length])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadCheckIns}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={dayGroups}
        renderItem={renderItem}
        keyExtractor={(item) => item.date}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
  resultsCount: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
})
