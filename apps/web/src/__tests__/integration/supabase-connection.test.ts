import { describe, it, expect, beforeAll } from 'vitest'
import {
  createTestClient,
  ensureSupabaseRunning,
  TEST_CONFIG,
} from '../setup/test-utils'

describe('Supabase Connection', () => {
  beforeAll(async () => {
    await ensureSupabaseRunning()
  })

  it('should have correct configuration', () => {
    expect(TEST_CONFIG.supabaseUrl).toBe('http://localhost:54321')
    expect(TEST_CONFIG.supabaseAnonKey).toBeTruthy()
    expect(TEST_CONFIG.supabaseAnonKey.length).toBeGreaterThan(100)
  })

  it('should connect to local Supabase instance', async () => {
    const client = createTestClient()

    const { data, error } = await client.auth.getSession()

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should access auth service', async () => {
    const client = createTestClient()

    const { error } = await client.auth.getSession()

    expect(error).toBeNull()
  })

  it('should verify all expected tables exist', async () => {
    const client = createTestClient()
    const tables = [
      'profiles',
      'journal_entries',
      'conversations',
      'messages',
      'daily_metrics',
    ]

    for (const table of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (client.from as any)(table).select('id').limit(0)

      // PGRST204 = no rows (OK), 42501 = RLS policy (table exists), null = success
      const tableExists = error === null || error.code === '42501' || error.code === 'PGRST116'

      expect(tableExists, `Table "${table}" should exist`).toBe(true)
    }
  })

  it('should query profiles table structure', async () => {
    const client = createTestClient()

    // This will fail due to RLS, but proves the table exists and is queryable
    const { error } = await client
      .from('profiles')
      .select('id, email, name, role')
      .limit(1)

    // Either success (empty result) or RLS error - both mean table exists
    expect(
      error === null || error.code === '42501' || error.code === 'PGRST116'
    ).toBe(true)
  })
})
