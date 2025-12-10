/**
 * Cleanup script to delete test users from Supabase
 *
 * Deletes users with emails matching:
 * - @test.local
 * - e2e-test-*
 * - fixture-test-*
 * - test-*@test.local
 * - auth-test-*
 * - cycle-test-*
 * - profile-test-*
 *
 * Usage:
 *   npx tsx scripts/cleanup-test-users.ts
 *   npm run test:cleanup (after adding script to package.json)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
// Default local dev service role key
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const TEST_EMAIL_PATTERNS = [
  /@test\.local$/i,
  /^e2e-test-/i,
  /^fixture-test-/i,
  /^test-/i,
  /^auth-test-/i,
  /^cycle-test-/i,
  /^profile-test-/i,
  /^dup-test-/i,
  /^otp-test-/i,
  /^delete-test-/i,
]

function isTestEmail(email: string): boolean {
  return TEST_EMAIL_PATTERNS.some(pattern => pattern.test(email))
}

async function main() {
  console.log('========================================')
  console.log('Test User Cleanup Script')
  console.log('========================================')
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log('')

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // List all users
  console.log('Fetching users...')
  const { data: usersData, error: listError } = await client.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError.message)
    process.exit(1)
  }

  const allUsers = usersData.users
  console.log(`Found ${allUsers.length} total users`)

  // Filter test users
  const testUsers = allUsers.filter(user => user.email && isTestEmail(user.email))
  console.log(`Found ${testUsers.length} test users to delete`)
  console.log('')

  if (testUsers.length === 0) {
    console.log('No test users found. Nothing to clean up.')
    return
  }

  // Show users to be deleted
  console.log('Users to delete:')
  testUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.id})`)
  })
  console.log('')

  // Delete users
  let deleted = 0
  let failed = 0

  for (const user of testUsers) {
    const { error } = await client.auth.admin.deleteUser(user.id)

    if (error) {
      console.error(`  ✗ Failed to delete ${user.email}: ${error.message}`)
      failed++
    } else {
      console.log(`  ✓ Deleted ${user.email}`)
      deleted++
    }
  }

  console.log('')
  console.log('========================================')
  console.log(`Cleanup complete: ${deleted} deleted, ${failed} failed`)
  console.log('========================================')
}

main().catch(console.error)
