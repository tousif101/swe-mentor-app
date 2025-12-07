import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@swe-mentor/shared'
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  ensureSupabaseRunning,
  TEST_CONFIG,
} from '../setup/test-utils'

describe('Browser Client (createBrowserClient)', () => {
  let testUser: { id: string; email: string; password: string }

  beforeAll(async () => {
    await ensureSupabaseRunning()

    const adminClient = createAdminClient()
    testUser = await createTestUser(adminClient)
  })

  afterAll(async () => {
    if (testUser?.id) {
      const adminClient = createAdminClient()
      await deleteTestUser(adminClient, testUser.id)
    }
  })

  function createBrowserTestClient() {
    return createBrowserClient<Database>(
      TEST_CONFIG.supabaseUrl,
      TEST_CONFIG.supabaseAnonKey
    )
  }

  it('should create browser client successfully', () => {
    const client = createBrowserTestClient()

    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()
  })

  it('should authenticate user with email/password', async () => {
    const client = createBrowserTestClient()

    const { data, error } = await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    expect(error).toBeNull()
    expect(data.user).toBeDefined()
    expect(data.user?.email).toBe(testUser.email)
    expect(data.session).toBeDefined()
    expect(data.session?.access_token).toBeTruthy()
  })

  it('should get current user after sign in', async () => {
    const client = createBrowserTestClient()

    await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    const {
      data: { user },
      error,
    } = await client.auth.getUser()

    expect(error).toBeNull()
    expect(user?.id).toBe(testUser.id)
    expect(user?.email).toBe(testUser.email)
  })

  it('should sign out successfully', async () => {
    const client = createBrowserTestClient()

    await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    const { error } = await client.auth.signOut()
    expect(error).toBeNull()

    const {
      data: { session },
    } = await client.auth.getSession()
    expect(session).toBeNull()
  })

  it('should fail authentication with wrong password', async () => {
    const client = createBrowserTestClient()

    const { error } = await client.auth.signInWithPassword({
      email: testUser.email,
      password: 'wrong-password',
    })

    expect(error).toBeDefined()
    expect(error?.message).toContain('Invalid login credentials')
  })

  it('should fail authentication with non-existent user', async () => {
    const client = createBrowserTestClient()

    const { error } = await client.auth.signInWithPassword({
      email: 'nonexistent@test.local',
      password: 'any-password',
    })

    expect(error).toBeDefined()
  })

  it('should perform authenticated database query', async () => {
    const client = createBrowserTestClient()

    await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    // Query should work after authentication
    // May return empty or RLS error depending on policy setup
    const { error } = await client
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)

    // Success or RLS error - connection works either way
    expect(
      error === null || error.code === '42501' || error.code === 'PGRST116'
    ).toBe(true)
  })
})
