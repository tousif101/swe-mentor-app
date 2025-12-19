import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@swe-mentor/shared'
import { logger } from '../utils/logger'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  logger.warn('[Supabase] Missing environment variables. Using defaults.')
}

logger.info('[Supabase] Using config:', supabaseUrl)

// SecureStore adapter with error handling
// SecureStore can fail on certain devices/simulators, so we handle errors gracefully
const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (error) {
      logger.error('[Supabase] SecureStore getItem failed for key:', key, 'Error:', error)
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      logger.error('[Supabase] SecureStore setItem failed for key:', key, 'Error:', error)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      logger.error('[Supabase] SecureStore removeItem failed for key:', key, 'Error:', error)
    }
  },
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
})
