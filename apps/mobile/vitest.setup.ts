import { vi } from 'vitest'

// Note: react-native is aliased to __mocks__/react-native.ts in vitest.config.ts
// This avoids parsing issues with React Native's Flow syntax

// Mock expo-secure-store
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}))

// Mock @swe-mentor/shared Database type
vi.mock('@swe-mentor/shared', () => ({
  Database: {},
}))

// Global to store createClient config for test verification
declare global {
  var __supabaseClientConfig: {
    url: string
    key: string
    options: unknown
  } | null
}

globalThis.__supabaseClientConfig = null

// Mock @supabase/supabase-js
// This captures the config passed to createClient so tests can verify it
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url: string, key: string, options: unknown) => {
    // Store the config globally so tests can access it
    globalThis.__supabaseClientConfig = { url, key, options }

    return {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(),
      },
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        _table: table,
      })),
    }
  }),
}))

// Set up test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
