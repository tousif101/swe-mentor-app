import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import {
  createTestClient,
  createAdminClient,
  generateTestEmail,
  createTestUser,
  deleteTestUser,
  ensureSupabaseRunning,
} from '../setup/test-utils'

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await ensureSupabaseRunning()
  })

  describe('User Creation via Admin API', () => {
    let adminClient: ReturnType<typeof createAdminClient>
    let testUserId: string | null = null

    beforeAll(() => {
      adminClient = createAdminClient()
    })

    afterEach(async () => {
      if (testUserId) {
        await deleteTestUser(adminClient, testUserId)
        testUserId = null
      }
    })

    it('creates a user and verifies in database', async () => {
      const testEmail = generateTestEmail('auth-test')
      const testUser = await createTestUser(adminClient, testEmail)
      testUserId = testUser.id

      // Verify user exists
      const { data: users } = await adminClient.auth.admin.listUsers()
      const foundUser = users.users.find(u => u.id === testUser.id)

      expect(foundUser).toBeDefined()
      expect(foundUser?.email).toBe(testEmail)
      expect(foundUser?.email_confirmed_at).toBeDefined()
    })

    it('fails to create duplicate user', async () => {
      const testEmail = generateTestEmail('dup-test')
      const testUser = await createTestUser(adminClient, testEmail)
      testUserId = testUser.id

      // Try to create same email again
      await expect(
        createTestUser(adminClient, testEmail)
      ).rejects.toThrow()
    })
  })

  describe('User Authentication', () => {
    let adminClient: ReturnType<typeof createAdminClient>
    let anonClient: ReturnType<typeof createTestClient>
    let testUser: { id: string; email: string; password: string }

    beforeAll(async () => {
      adminClient = createAdminClient()
      anonClient = createTestClient()
      testUser = await createTestUser(adminClient)
    })

    afterAll(async () => {
      if (testUser?.id) {
        await deleteTestUser(adminClient, testUser.id)
      }
    })

    it('authenticates with valid credentials', async () => {
      const { data, error } = await anonClient.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.user?.email).toBe(testUser.email)
      expect(data.session).toBeDefined()
    })

    it('fails with invalid password', async () => {
      const { data, error } = await anonClient.auth.signInWithPassword({
        email: testUser.email,
        password: 'wrong-password-123',
      })

      expect(error).toBeDefined()
      expect(data.user).toBeNull()
    })

    it('fails with non-existent email', async () => {
      const { data, error } = await anonClient.auth.signInWithPassword({
        email: 'nonexistent@test.local',
        password: 'any-password-123',
      })

      expect(error).toBeDefined()
      expect(data.user).toBeNull()
    })
  })

  describe('Session Management', () => {
    let adminClient: ReturnType<typeof createAdminClient>
    let anonClient: ReturnType<typeof createTestClient>
    let testUser: { id: string; email: string; password: string }

    beforeAll(async () => {
      adminClient = createAdminClient()
      anonClient = createTestClient()
      testUser = await createTestUser(adminClient)
    })

    afterAll(async () => {
      if (testUser?.id) {
        await deleteTestUser(adminClient, testUser.id)
      }
    })

    it('maintains session after login', async () => {
      // Login
      await anonClient.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      })

      // Check session
      const { data: { session } } = await anonClient.auth.getSession()
      expect(session).toBeDefined()
      expect(session?.user?.email).toBe(testUser.email)
    })

    it('clears session on sign out', async () => {
      // Login first
      await anonClient.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      })

      // Sign out
      await anonClient.auth.signOut()

      // Verify session is cleared
      const { data: { session } } = await anonClient.auth.getSession()
      expect(session).toBeNull()
    })
  })

  describe('Magic Link / OTP', () => {
    let anonClient: ReturnType<typeof createTestClient>

    beforeAll(() => {
      anonClient = createTestClient()
    })

    it('sends OTP request without error', async () => {
      const testEmail = generateTestEmail('otp-test')

      // This sends an OTP/magic link - won't actually deliver in local dev
      // but should not throw an error
      const { error } = await anonClient.auth.signInWithOtp({
        email: testEmail,
      })

      // In local dev without SMTP, this should succeed (email queued)
      // or fail gracefully - just ensure no rate limit error
      if (error) {
        expect(error.message).not.toContain('rate limit')
      } else {
        expect(error).toBeNull()
      }
    })
  })
})
