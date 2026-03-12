import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { fetchInsightsData, logger } from '../utils'
import type { InsightsData } from '../utils'
import { useAuth } from './useAuth'

export function useInsights() {
  const { user } = useAuth()
  const [data, setData] = useState<InsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const insights = await fetchInsightsData(user.id)
      setData(insights)
    } catch (err) {
      logger.error('Failed to fetch insights:', err)
      setError(new Error('Failed to load insights'))
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Re-fetch when tab becomes focused (e.g., after completing a check-in on Home tab)
  useFocusEffect(refresh)

  return { data, isLoading, error, refresh }
}
