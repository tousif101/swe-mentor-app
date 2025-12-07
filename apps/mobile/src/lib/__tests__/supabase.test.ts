import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '../supabase'

describe('Supabase Mobile Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a supabase client with correct URL and key', () => {
    const config = globalThis.__supabaseClientConfig
    expect(config).toBeDefined()
    expect(config?.url).toBe('http://localhost:54321')
    expect(config?.key).toBe('test-anon-key')
  })

  it('configures a storage adapter that uses SecureStore', () => {
    const config = globalThis.__supabaseClientConfig
    const options = config?.options as { auth?: { storage?: unknown } }

    // Storage should be an object with getItem, setItem, removeItem
    expect(options?.auth?.storage).toBeDefined()
    expect(typeof (options?.auth?.storage as Record<string, unknown>)?.getItem).toBe('function')
    expect(typeof (options?.auth?.storage as Record<string, unknown>)?.setItem).toBe('function')
    expect(typeof (options?.auth?.storage as Record<string, unknown>)?.removeItem).toBe('function')
  })

  it('has autoRefreshToken enabled', () => {
    const config = globalThis.__supabaseClientConfig
    const options = config?.options as { auth?: { autoRefreshToken?: boolean } }

    expect(options?.auth?.autoRefreshToken).toBe(true)
  })

  it('has persistSession enabled', () => {
    const config = globalThis.__supabaseClientConfig
    const options = config?.options as { auth?: { persistSession?: boolean } }

    expect(options?.auth?.persistSession).toBe(true)
  })

  it('has detectSessionInUrl disabled for React Native', () => {
    const config = globalThis.__supabaseClientConfig
    const options = config?.options as { auth?: { detectSessionInUrl?: boolean } }

    expect(options?.auth?.detectSessionInUrl).toBe(false)
  })

  it('exports a supabase client with auth and from methods', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })

  it('storage adapter calls SecureStore.getItemAsync', async () => {
    const config = globalThis.__supabaseClientConfig
    const storage = (config?.options as { auth?: { storage?: { getItem: (key: string) => Promise<string | null> } } })?.auth?.storage

    vi.mocked(SecureStore.getItemAsync).mockResolvedValue('test-value')

    const result = await storage?.getItem('test-key')

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key')
    expect(result).toBe('test-value')
  })

  it('storage adapter handles SecureStore errors gracefully', async () => {
    const config = globalThis.__supabaseClientConfig
    const storage = (config?.options as { auth?: { storage?: { getItem: (key: string) => Promise<string | null> } } })?.auth?.storage

    vi.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('SecureStore unavailable'))

    // Should not throw, should return null
    const result = await storage?.getItem('test-key')
    expect(result).toBeNull()
  })
})
