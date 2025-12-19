/**
 * App-wide constants
 * Centralizes magic numbers and configuration values for maintainability
 */

// Streak milestones that trigger confetti celebrations
export const STREAK_MILESTONES = [7, 30, 100] as const
export type StreakMilestone = (typeof STREAK_MILESTONES)[number]

// Energy level options for check-ins
export const ENERGY_LEVELS = [1, 2, 3, 4, 5] as const
export type EnergyLevel = (typeof ENERGY_LEVELS)[number]

// Animation durations (in ms)
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 200,
  slow: 300,
  progress: 800,
} as const

// API retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
} as const

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
} as const

// Auto-save debounce duration (in ms)
export const AUTO_SAVE_DEBOUNCE_MS = 2000
