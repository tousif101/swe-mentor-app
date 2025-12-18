import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '@swe-mentor/shared'
import { logger } from '../utils/logger'

type ProfileState = {
  profile: Profile | null
  isLoading: boolean
  error: string | null
}

export function useProfile(userId: string | null) {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    isLoading: true,
    error: null,
  })

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setState({ profile: null, isLoading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile might not exist yet for new users
        if (error.code === 'PGRST116') {
          setState({ profile: null, isLoading: false, error: null })
        } else {
          setState({ profile: null, isLoading: false, error: error.message })
        }
        return
      }

      setState({ profile: data, isLoading: false, error: null })
    } catch (err) {
      setState({
        profile: null,
        isLoading: false,
        error: 'Failed to fetch profile',
      })
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Subscribe to realtime profile changes
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Validate payload.new exists and has expected shape before casting
            if (
              payload.new &&
              typeof payload.new === 'object' &&
              'id' in payload.new &&
              'email' in payload.new
            ) {
              setState((prev) => ({
                ...prev,
                profile: payload.new as Profile,
              }))
            } else {
              logger.error('[useProfile] Invalid profile payload received:', payload)
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [userId])

  return {
    ...state,
    refetch: fetchProfile,
  }
}
