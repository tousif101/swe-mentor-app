import { supabase } from '../lib/supabase'
import { logger } from './logger'

/**
 * Get today's date in local timezone as YYYY-MM-DD string.
 * This ensures morning and evening check-ins on the same calendar day
 * are stored with the same date, regardless of UTC offset.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

type SaveCheckInParams = {
  userId: string
  checkInType: 'morning' | 'evening'
  focusArea?: string
  dailyGoal?: string
  goalCompleted?: 'yes' | 'partially' | 'no'
  quickWin?: string
  blocker?: string
  energyLevel?: number
  tomorrowCarry?: string
}

/**
 * Calculate the difference in days between two dates
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return Math.floor((utc2 - utc1) / msPerDay)
}

/**
 * Save a check-in and update user streaks
 */
export async function saveCheckIn(params: SaveCheckInParams) {
  const {
    userId,
    checkInType,
    focusArea,
    dailyGoal,
    goalCompleted,
    quickWin,
    blocker,
    energyLevel,
    tomorrowCarry,
  } = params

  const today = getLocalDateString()

  // 1. Check if check-in already exists for today
  const { data: existingCheckIn } = await supabase
    .from('check_ins')
    .select('id')
    .eq('user_id', userId)
    .eq('check_in_type', checkInType)
    .eq('check_in_date', today)
    .single()

  let checkInId: string

  if (existingCheckIn) {
    // Update existing check-in
    const { data, error } = await supabase
      .from('check_ins')
      .update({
        focus_area: focusArea,
        daily_goal: dailyGoal,
        goal_completed: goalCompleted,
        quick_win: quickWin,
        blocker: blocker,
        energy_level: energyLevel,
        tomorrow_carry: tomorrowCarry,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCheckIn.id)
      .select('id')
      .single()

    if (error) {
      throw error
    }

    checkInId = data.id
  } else {
    // Create new check-in
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: userId,
        check_in_type: checkInType,
        check_in_date: today,
        input_method: 'app',
        focus_area: focusArea,
        daily_goal: dailyGoal,
        goal_completed: goalCompleted,
        quick_win: quickWin,
        blocker: blocker,
        energy_level: energyLevel,
        tomorrow_carry: tomorrowCarry,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    checkInId = data.id
  }

  // 2. Update user streaks
  await updateUserStreak(userId, today, checkInType)

  return checkInId
}

/**
 * Update user streak after completing a check-in
 */
async function updateUserStreak(
  userId: string,
  checkInDate: string,
  checkInType: 'morning' | 'evening'
) {
  // Get or create user streak record
  const { data: existingStreak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  const today = new Date(checkInDate)
  const lastCheckInDate = existingStreak?.last_check_in_date
    ? new Date(existingStreak.last_check_in_date)
    : null

  let currentStreak = existingStreak?.current_streak || 0
  let longestStreak = existingStreak?.longest_streak || 0
  let totalCheckIns = existingStreak?.total_check_ins || 0
  let totalMorningCheckIns = existingStreak?.total_morning_check_ins || 0
  let totalEveningCheckIns = existingStreak?.total_evening_check_ins || 0

  // Only update streak if this is a new day
  if (!lastCheckInDate || getDaysDifference(lastCheckInDate, today) > 0) {
    // Calculate streak
    if (!lastCheckInDate) {
      // First check-in ever
      currentStreak = 1
    } else {
      const daysSinceLastCheckIn = getDaysDifference(lastCheckInDate, today)

      if (daysSinceLastCheckIn === 1) {
        // Consecutive day - increment streak
        currentStreak += 1
      } else if (daysSinceLastCheckIn > 1) {
        // Gap in check-ins - reset streak to 1
        currentStreak = 1
      }
      // Same day check-ins don't affect streak
    }

    // Update longest streak if current is higher
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak
    }

    totalCheckIns += 1
  }

  // Update type-specific counters
  if (checkInType === 'morning') {
    totalMorningCheckIns += 1
  } else if (checkInType === 'evening') {
    totalEveningCheckIns += 1
  }

  // Upsert user streak
  if (existingStreak) {
    const { error } = await supabase
      .from('user_streaks')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_check_in_date: checkInDate,
        total_check_ins: totalCheckIns,
        total_morning_check_ins: totalMorningCheckIns,
        total_evening_check_ins: totalEveningCheckIns,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  } else {
    const { error } = await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_check_in_date: checkInDate,
      total_check_ins: totalCheckIns,
      total_morning_check_ins: totalMorningCheckIns,
      total_evening_check_ins: totalEveningCheckIns,
    })

    if (error) {
      throw error
    }
  }

  return {
    currentStreak,
    longestStreak,
  }
}

/**
 * Get user's current streak
 */
export async function getUserStreak(userId: string) {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // No streak record yet
    if (error.code === 'PGRST116') {
      return {
        current_streak: 0,
        longest_streak: 0,
        total_check_ins: 0,
        total_morning_check_ins: 0,
        total_evening_check_ins: 0,
      }
    }
    throw error
  }

  return data
}

/**
 * Get today's check-in (if exists)
 */
export async function getTodayCheckIn(
  userId: string,
  checkInType: 'morning' | 'evening'
) {
  const today = getLocalDateString()

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('check_in_type', checkInType)
    .eq('check_in_date', today)
    .single()

  if (error) {
    // No check-in yet
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data
}

/**
 * Get recent check-ins for a user
 */
export async function getRecentCheckIns(userId: string, limit = 7) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('check_in_date', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data
}

// ============================================
// Progressive Disclosure - Journey Stage
// ============================================

export type JourneyStage = 'new' | 'first_done' | 'building' | 'established'

export type JourneyStageData = {
  stage: JourneyStage
  streakData: {
    current_streak: number
    longest_streak: number
    total_check_ins: number
    total_morning_check_ins: number
    total_evening_check_ins: number
  }
  todayMorning: boolean
  todayEvening: boolean
  weekProgress: number // days with check-ins this week (0-7)
}

/**
 * Get the start of the current week (Monday) in local timezone
 */
function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(now)
  monday.setDate(diff)
  return getLocalDateString(monday)
}

/**
 * Get count of unique days with check-ins this week
 */
export async function getWeekCheckInDays(userId: string): Promise<number> {
  const weekStart = getWeekStart()
  const today = getLocalDateString()

  const { data, error } = await supabase
    .from('check_ins')
    .select('check_in_date')
    .eq('user_id', userId)
    .gte('check_in_date', weekStart)
    .lte('check_in_date', today)

  if (error) {
    logger.error('Error fetching week check-ins:', error)
    return 0
  }

  // Count unique days
  const uniqueDays = new Set(data?.map((c) => c.check_in_date) || [])
  return uniqueDays.size
}

/**
 * Determine user's journey stage for progressive disclosure
 *
 * Stages:
 * - new: 0 total check-ins
 * - first_done: Has done at least 1 check-in today, but < 3 total
 * - building: 3-7 total check-ins
 * - established: 8+ check-ins OR 5+ day streak
 */
export async function getUserJourneyStage(
  userId: string
): Promise<JourneyStageData> {
  // Fetch all data in parallel
  const [streakData, morningCheckIn, eveningCheckIn, weekProgress] =
    await Promise.all([
      getUserStreak(userId),
      getTodayCheckIn(userId, 'morning'),
      getTodayCheckIn(userId, 'evening'),
      getWeekCheckInDays(userId),
    ])

  const todayMorning = morningCheckIn !== null
  const todayEvening = eveningCheckIn !== null
  const totalCheckIns = streakData.total_check_ins ?? 0
  const currentStreak = streakData.current_streak ?? 0

  // Determine journey stage
  let stage: JourneyStage

  if (totalCheckIns === 0) {
    stage = 'new'
  } else if (totalCheckIns >= 8 || currentStreak >= 5) {
    stage = 'established'
  } else if (totalCheckIns >= 3) {
    stage = 'building'
  } else if (todayMorning || todayEvening) {
    stage = 'first_done'
  } else {
    // 1-2 total check-ins but none today
    stage = 'new'
  }

  // Normalize streak data to ensure non-null values
  const normalizedStreakData = {
    current_streak: streakData.current_streak ?? 0,
    longest_streak: streakData.longest_streak ?? 0,
    total_check_ins: streakData.total_check_ins ?? 0,
    total_morning_check_ins: streakData.total_morning_check_ins ?? 0,
    total_evening_check_ins: streakData.total_evening_check_ins ?? 0,
  }

  return {
    stage,
    streakData: normalizedStreakData,
    todayMorning,
    todayEvening,
    weekProgress,
  }
}

/**
 * Get time of day for hero card selection
 */
export function getTimeOfDay(): 'morning' | 'evening' | 'night' {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return 'morning'
  } else if (hour >= 17 && hour < 23) {
    return 'evening'
  } else {
    return 'night'
  }
}

/**
 * Get greeting based on journey stage
 */
export function getGreeting(
  stage: JourneyStage,
  userName?: string
): { prefix: string; name: string } {
  const name = userName || 'there'

  switch (stage) {
    case 'new':
      return { prefix: 'Welcome,', name: `${name}! Let's begin` }
    case 'first_done':
      return { prefix: 'Great start,', name: `${name}!` }
    case 'building':
      return { prefix: 'Good to see you,', name }
    case 'established':
      return { prefix: 'Amazing work,', name: `${name}!` }
    default:
      return { prefix: 'Hello,', name }
  }
}
