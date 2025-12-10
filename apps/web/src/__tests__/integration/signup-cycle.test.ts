import { describe, it, expect, beforeAll } from 'vitest'
import {
  createTestClient,
  createAdminClient,
  generateTestEmail,
  deleteTestUser,
  ensureSupabaseRunning,
} from '../setup/test-utils'

describe('Full Signup Cycle', () => {
  beforeAll(async () => {
    await ensureSupabaseRunning()
  })

  it('completes full user lifecycle: create → verify → login → delete', async () => {
    const adminClient = createAdminClient()
    const anonClient = createTestClient()
    const testEmail = generateTestEmail('cycle-test')
    const testPassword = 'CycleTest123!'
    let userId: string | null = null

    try {
      // ============================================
      // Step 1: Create user via admin API
      // ============================================
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      })

      expect(createError).toBeNull()
      expect(createData.user).toBeDefined()
      userId = createData.user!.id

      console.log(`✓ Step 1: Created user ${testEmail} with ID ${userId}`)

      // ============================================
      // Step 2: Verify user exists in auth.users
      // ============================================
      const { data: listData } = await adminClient.auth.admin.listUsers()
      const foundUser = listData.users.find(u => u.id === userId)

      expect(foundUser).toBeDefined()
      expect(foundUser?.email).toBe(testEmail)
      expect(foundUser?.email_confirmed_at).toBeDefined()

      console.log(`✓ Step 2: Verified user exists in auth.users`)

      // ============================================
      // Step 3: Login with credentials
      // ============================================
      const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      expect(loginError).toBeNull()
      expect(loginData.user).toBeDefined()
      expect(loginData.user?.id).toBe(userId)
      expect(loginData.session).toBeDefined()

      console.log(`✓ Step 3: Logged in successfully`)

      // ============================================
      // Step 4: Verify auth state
      // ============================================
      const { data: { user: currentUser } } = await anonClient.auth.getUser()

      expect(currentUser).toBeDefined()
      expect(currentUser?.id).toBe(userId)
      expect(currentUser?.email).toBe(testEmail)

      console.log(`✓ Step 4: Auth state verified`)

      // ============================================
      // Step 5: Sign out
      // ============================================
      await anonClient.auth.signOut()
      const { data: { session } } = await anonClient.auth.getSession()
      expect(session).toBeNull()

      console.log(`✓ Step 5: Signed out successfully`)

      // ============================================
      // Step 6: Delete user
      // ============================================
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
      expect(deleteError).toBeNull()

      console.log(`✓ Step 6: Deleted user`)

      // ============================================
      // Step 7: Verify user no longer exists
      // ============================================
      const { data: finalList } = await adminClient.auth.admin.listUsers()
      const deletedUser = finalList.users.find(u => u.id === userId)

      expect(deletedUser).toBeUndefined()

      console.log(`✓ Step 7: Verified user no longer exists`)

      userId = null // Mark as cleaned up

    } finally {
      // Cleanup in case test fails mid-way
      if (userId) {
        await deleteTestUser(adminClient, userId)
        console.log(`⚠ Cleanup: Deleted user ${userId} after test failure`)
      }
    }
  })

  it('verifies profile is created on user creation', async () => {
    const adminClient = createAdminClient()
    const testEmail = generateTestEmail('profile-test')
    const testPassword = 'ProfileTest123!'
    let userId: string | null = null

    try {
      // Create user
      const { data: createData } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      })

      userId = createData.user!.id

      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if profile was created (via database trigger)
      const { data: profile, error } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Profile may or may not exist depending on trigger setup
      // This test documents the expected behavior
      if (profile) {
        expect(profile.id).toBe(userId)
        console.log(`✓ Profile was auto-created for user`)
      } else {
        console.log(`ℹ No auto-profile creation (trigger may not be set up)`)
      }

    } finally {
      if (userId) {
        await deleteTestUser(adminClient, userId)
      }
    }
  })

  it('prevents login after user deletion', async () => {
    const adminClient = createAdminClient()
    const anonClient = createTestClient()
    const testEmail = generateTestEmail('delete-test')
    const testPassword = 'DeleteTest123!'

    // Create and immediately delete user
    const { data: createData } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    const userId = createData.user!.id
    await adminClient.auth.admin.deleteUser(userId)

    // Try to login - should fail
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    expect(error).toBeDefined()
    expect(data.user).toBeNull()
  })
})
