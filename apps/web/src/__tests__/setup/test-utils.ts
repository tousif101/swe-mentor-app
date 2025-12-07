import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@swe-mentor/shared'

// ============================================
// Configuration
// ============================================

export const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

// ============================================
// Startup Check
// ============================================

console.log('\n========================================')
console.log('SUPABASE INTEGRATION TESTS')
console.log('========================================')
console.log(`Supabase URL: ${TEST_CONFIG.supabaseUrl}`)
console.log('')
console.log('Make sure local Supabase is running:')
console.log('  $ supabase start')
console.log('========================================\n')

// ============================================
// Client Factories
// ============================================

/**
 * Creates a test Supabase client with anon key (simulates browser client)
 */
export function createTestClient(): SupabaseClient<Database> {
  return createClient<Database>(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseAnonKey
  )
}

/**
 * Creates an admin Supabase client with service role key
 * Use for test setup/teardown operations (creating test users, etc.)
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (!TEST_CONFIG.supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createClient<Database>(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseServiceKey
  )
}

// ============================================
// Test User Management
// ============================================

/**
 * Generates a unique test user email to avoid conflicts
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const uniqueId = Math.random().toString(36).substring(2, 10)
  return `${prefix}-${uniqueId}@test.local`
}

/**
 * Creates a test user using admin API and returns credentials
 */
export async function createTestUser(
  adminClient: SupabaseClient<Database>,
  email?: string
): Promise<{ id: string; email: string; password: string }> {
  const testEmail = email || generateTestEmail()
  const password = 'test-password-123!'

  const { data, error } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  return { id: data.user.id, email: testEmail, password }
}

/**
 * Cleans up test user after tests
 */
export async function deleteTestUser(
  adminClient: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    console.warn(`Failed to delete test user ${userId}: ${error.message}`)
  }
}

// ============================================
// Connection Utilities
// ============================================

/**
 * Waits for Supabase to be available (useful for test startup)
 * @param maxAttempts Maximum number of connection attempts
 * @param delayMs Delay between attempts in milliseconds
 */
export async function waitForSupabase(
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<boolean> {
  const client = createTestClient()

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { error } = await client.from('profiles').select('id').limit(1)
      // Success or RLS error (42501) means connection works
      if (!error || error.code === '42501') {
        return true
      }
    } catch {
      // Connection failed, retry
    }

    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return false
}

/**
 * Check if Supabase is running and throw helpful error if not
 */
export async function ensureSupabaseRunning(): Promise<void> {
  const isAvailable = await waitForSupabase(5, 500)

  if (!isAvailable) {
    throw new Error(
      '\n\n' +
      '========================================\n' +
      'ERROR: Supabase is not running!\n' +
      '========================================\n' +
      '\n' +
      'Please start local Supabase before running tests:\n' +
      '\n' +
      '  $ supabase start\n' +
      '\n' +
      'Then run tests again:\n' +
      '\n' +
      '  $ npm test\n' +
      '\n' +
      '========================================'
    )
  }
}
