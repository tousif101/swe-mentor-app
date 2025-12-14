import { vi } from 'vitest'

export const AppState = {
  addEventListener: vi.fn(() => ({
    remove: vi.fn(),
  })),
  currentState: 'active' as const,
}

export const Platform = {
  OS: 'ios' as const,
  select: vi.fn((obj: Record<string, unknown>) => obj.ios),
}

export const View = 'View'
export const Text = 'Text'
export const TextInput = 'TextInput'
export const Pressable = 'Pressable'
export const ActivityIndicator = 'ActivityIndicator'
export const ScrollView = 'ScrollView'
export const KeyboardAvoidingView = 'KeyboardAvoidingView'

export const StyleSheet = {
  create: vi.fn((styles: Record<string, unknown>) => styles),
}
