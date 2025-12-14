import { describe, it, expect, vi, beforeEach } from 'vitest'

// Note: react-native is mocked in vitest.setup.ts
// Full hook testing would require @testing-library/react-native
// These tests verify the module structure and exports

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports useAuth function', async () => {
    const { useAuth } = await import('../useAuth')
    expect(typeof useAuth).toBe('function')
  })

  it('useAuth is a React hook (starts with use)', async () => {
    const { useAuth } = await import('../useAuth')
    expect(useAuth.name).toBe('useAuth')
  })
})

// Integration behavior tests would go here with @testing-library/react-native:
// - Initial state is loading: true
// - After getSession resolves, loading becomes false
// - Session updates when onAuthStateChange fires
// - AppState 'active' calls startAutoRefresh
// - AppState 'background' calls stopAutoRefresh
