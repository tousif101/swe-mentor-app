import { useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

type AuthState = {
  session: Session | null
  user: User | null
  isLoading: boolean
  error: Error | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setState({
          session,
          user: session?.user ?? null,
          isLoading: false,
          error: null,
        })
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('Failed to get session')
        logger.error('[useAuth] Failed to get session:', error)
        setState({
          session: null,
          user: null,
          isLoading: false,
          error,
        })
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          session,
          user: session?.user ?? null,
          isLoading: false,
          error: null,
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Handle AppState changes for token refresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => subscription.remove()
  }, [])

  return state
}
