/**
 * Types for Profile Settings screens
 */

// Reminder settings stored in user_notification_settings table
export type ReminderSettings = {
  morningEnabled: boolean
  morningTime: string // HH:MM format
  eveningEnabled: boolean
  eveningTime: string // HH:MM format
  pushEnabled: boolean
  timezone: string
}

// Navigation param list for Profile stack
export type ProfileStackParamList = {
  ProfileMain: undefined
  EditProfile: undefined
  CareerGoal: undefined
  ReminderSettings: undefined
}
