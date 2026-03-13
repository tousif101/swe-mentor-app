/**
 * App-wide constants
 * Centralizes magic numbers and configuration values for maintainability
 */

// Theme colors for StyleSheet usage (mirrors Tailwind config)
// Use Tailwind classes (e.g., bg-gray-950) when possible
// Use these constants only in StyleSheet.create() objects
export const COLORS = {
  // Backgrounds
  background: '#030712', // gray-950 - main app background
  surface: '#111827', // gray-900 - card backgrounds
  surfaceLight: '#1f2937', // gray-800 - elevated surfaces

  // Primary (Purple)
  primary: '#8b5cf6', // primary-500
  primaryDark: '#7c3aed', // primary-600
  primaryLight: '#a78bfa', // primary-400

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af', // gray-400
  textMuted: '#6b7280', // gray-500

  // Status
  error: '#ef4444', // red-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  amber400: '#fbbf24', // amber-400 - morning icon

  // UI Elements
  trackBackground: 'rgba(255, 255, 255, 0.05)', // progress bar/chart tracks
} as const

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

// Toast durations (in ms)
export const TOAST_DURATION = {
  short: 2000,
  normal: 3000,
} as const

// Name validation requirements
export const NAME_REQUIREMENTS = {
  minLength: 2,
  maxLength: 50,
} as const

// Time option type for reminder pickers
export type TimeOption = {
  readonly label: string
  readonly value: string
}

// Morning reminder time options
export const MORNING_TIME_OPTIONS: readonly TimeOption[] = [
  { label: '7:00 AM', value: '07:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '9:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
] as const

// Evening reminder time options
export const EVENING_TIME_OPTIONS: readonly TimeOption[] = [
  { label: '5:00 PM', value: '17:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '7:00 PM', value: '19:00' },
] as const

// Default reminder times
export const DEFAULT_REMINDER_TIMES = {
  morning: '09:00',
  evening: '18:00',
} as const

// Insights configuration
export const INSIGHTS_CHECK_IN_FETCH_LIMIT = 180
export const INSIGHTS_ENERGY_DISPLAY_DAYS = 7
export const INSIGHTS_WEEKLY_RATE_DAYS = 7
export const ENERGY_COLORS = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#10b981'] as const // 1-5: red, amber, yellow, lime, emerald

// Company size options for onboarding and settings
export const COMPANY_SIZES = ['<50', '50-200', '200-1000', '1000-5000', '5000+'] as const
export type CompanySize = (typeof COMPANY_SIZES)[number]

// Maps company size to the seeded career matrix template name
// In the future, users can upload their own ladders
// <50 and 50-200 both map to Startup; 1000-5000 and 5000+ both map to FAANG
// Generic Intern template is seeded but mapped by role (not size) — future feature
export const COMPANY_SIZE_TO_TEMPLATE: Record<CompanySize, string> = {
  '<50': 'Generic Startup',
  '50-200': 'Generic Startup',
  '200-1000': 'Generic Midsize',
  '1000-5000': 'Generic FAANG',
  '5000+': 'Generic FAANG',
} as const

// Push notification configuration
export const PUSH_NOTIFICATION_CONFIG = {
  // Android notification channel
  channelId: 'swe-mentor-reminders',
  channelName: 'Check-in Reminders',
  channelDescription: 'Daily morning and evening check-in reminders',
} as const
