import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@swe-mentor/shared'
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  ensureSupabaseRunning,
  TEST_CONFIG,
} from '../setup/test-utils'

// Mock cookie store to simulate Next.js server environment
const mockCookieStore = new Map<string, { value: string; options?: object }>()

// Mock Next.js cookies module
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () =>
      Array.from(mockCookieStore.entries()).map(([name, data]) => ({
        name,
        value: data.value,
      })),
    get: (name: string) => {
      const data = mockCookieStore.get(name)
      return data ? { name, value: data.value } : undefined
    },
    set: (name: string, value: string, options?: object) => {
      mockCookieStore.set(name, { value, options })
    },
    delete: (name: string) => {
      mockCookieStore.delete(name)
    },
  }),
}))

describe('Server Client (createServerClient)', () => {
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

  beforeEach(() => {
    mockCookieStore.clear()
  })

  function createServerTestClient() {
    return createServerClient<Database>(
      TEST_CONFIG.supabaseUrl,
      TEST_CONFIG.supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return Array.from(mockCookieStore.entries()).map(([name, data]) => ({
              name,
              value: data.value,
            }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              mockCookieStore.set(name, { value, options })
            })
          },
        },
      }
    )
  }

  it('should create server client successfully', () => {
    const client = createServerTestClient()

    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()
  })

  it('should handle cookie-based session storage', async () => {
    const client = createServerTestClient()

    // Sign in to create a session
    const { error } = await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    expect(error).toBeNull()

    // Verify cookies were set (session stored)
    expect(mockCookieStore.size).toBeGreaterThan(0)

    // Check for Supabase auth cookies
    const cookieNames = Array.from(mockCookieStore.keys())
    const hasAuthCookie = cookieNames.some(
      name => name.includes('auth-token') || name.includes('sb-')
    )
    expect(hasAuthCookie).toBe(true)
  })

  it('should retrieve session from cookies', async () => {
    const client = createServerTestClient()

    await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    // Create a new client instance (simulating new request)
    const newClient = createServerTestClient()

    const {
      data: { session },
      error,
    } = await newClient.auth.getSession()

    expect(error).toBeNull()
    expect(session).toBeDefined()
    expect(session?.user?.email).toBe(testUser.email)
  })

  it('should validate user with getUser()', async () => {
    const client = createServerTestClient()

    await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    // getUser() validates the JWT with Supabase server
    const {
      data: { user },
      error,
    } = await client.auth.getUser()

    expect(error).toBeNull()
    expect(user?.id).toBe(testUser.id)
    expect(user?.email).toBe(testUser.email)
  })

  it('should perform database queries in server context', async () => {
    const client = createServerTestClient()

    await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    // Query should work with authenticated server client
    const { error } = await client.from('profiles').select('id, email').limit(1)

    // Should either succeed or get RLS error (not connection error)
    expect(
      error === null || error.code === '42501' || error.code === 'PGRST116'
    ).toBe(true)
  })

  it('should handle sign out and clear cookies', async () => {
    const client = createServerTestClient()

    await client.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    expect(mockCookieStore.size).toBeGreaterThan(0)

    await client.auth.signOut()

    // After sign out, session should be null
    const {
      data: { session },
    } = await client.auth.getSession()

    expect(session).toBeNull()
  })
})
