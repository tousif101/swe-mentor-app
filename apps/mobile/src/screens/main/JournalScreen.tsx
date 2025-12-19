import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator'
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

type JournalScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>

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

  const handleStartCheckIn = useCallback(() => {
    const timeOfDay = getTimeOfDay()
    if (timeOfDay === 'morning') {
      navigation.navigate('MorningCheckIn')
    } else {
      navigation.navigate('EveningCheckIn')
    }
  }, [navigation])

  const renderItem = useCallback(({ item }: { item: DayGroup }) => (
    <DayCard dayGroup={item} onHashtagPress={handleHashtagPress} />
  ), [handleHashtagPress])

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
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>Your past check-ins and reflections</Text>
      </View>

      {/* Search & Filters - only show if has entries */}
      {checkIns.length > 0 && (
        <JournalSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTag={selectedTag}
          availableTags={availableTags}
          onTagSelect={setSelectedTag}
        />
      )}

      {/* Results count */}
      {(searchQuery || selectedTag) && dayGroups.length > 0 && (
        <Text style={styles.resultsCount}>
          {dayGroups.length} {dayGroups.length === 1 ? 'entry' : 'entries'} match
        </Text>
      )}
    </>
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
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0d23',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0d23',
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
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 4,
  },
  resultsCount: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f0d23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})
