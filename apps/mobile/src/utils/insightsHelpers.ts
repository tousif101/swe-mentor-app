import { supabase } from '../lib/supabase'
import { logger } from './logger'
import { getLocalDateString } from './checkInHelpers'
import { INSIGHTS_CHECK_IN_FETCH_LIMIT, INSIGHTS_ENERGY_TREND_DAYS, INSIGHTS_WEEKLY_RATE_DAYS } from '../constants'

// ============================================
// Types
// ============================================

export type EnergyTrendPoint = {
  date: string
  level: number
}

export type GoalCompletionStats = {
  yes: number
  partially: number
  no: number
  total: number
}

export type FocusAreaItem = {
  area: string
  count: number
  percentage: number
}

export type InsightsData = {
  // From user_streaks
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  totalMorningCheckIns: number
  totalEveningCheckIns: number
  // Computed from check_ins
  energyTrend: EnergyTrendPoint[]
  goalCompletion: GoalCompletionStats
  focusAreas: FocusAreaItem[]
  weeklyCompletionRate: number
  averageEnergy: number
}

// ============================================
// Pure Computation Functions (testable)
// ============================================

type EnergyCheckIn = { check_in_date: string; energy_level: number | null }

export function computeEnergyTrend(checkIns: EnergyCheckIn[]): EnergyTrendPoint[] {
  return checkIns
    .filter((c) => c.energy_level != null)
    .map((c) => ({ date: c.check_in_date, level: c.energy_level! }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

type GoalCheckIn = { goal_completed: string | null }

export function computeGoalCompletionStats(checkIns: GoalCheckIn[]): GoalCompletionStats {
  const stats = { yes: 0, partially: 0, no: 0, total: 0 }
  for (const c of checkIns) {
    if (c.goal_completed === 'yes') { stats.yes++; stats.total++ }
    else if (c.goal_completed === 'partially') { stats.partially++; stats.total++ }
    else if (c.goal_completed === 'no') { stats.no++; stats.total++ }
  }
  return stats
}

type FocusCheckIn = { focus_area: string | null }

export function computeFocusAreaBreakdown(checkIns: FocusCheckIn[]): FocusAreaItem[] {
  const counts = new Map<string, number>()
  let total = 0
  for (const c of checkIns) {
    if (c.focus_area) {
      counts.set(c.focus_area, (counts.get(c.focus_area) || 0) + 1)
      total++
    }
  }
  return Array.from(counts.entries())
    .map(([area, count]) => ({
      area,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

type DateCheckIn = { check_in_date: string }

export function computeWeeklyCompletionRate(checkIns: DateCheckIn[], totalDays: number): number {
  if (checkIns.length === 0) return 0
  const uniqueDays = new Set(checkIns.map((c) => c.check_in_date))
  return Math.round((uniqueDays.size / totalDays) * 100)
}

// ============================================
// Supabase Query Functions
// ============================================

export async function fetchInsightsData(userId: string): Promise<InsightsData> {
  if (!userId) {
    throw new Error('Invalid userId provided')
  }

  // Fetch streak data and recent check-ins in parallel
  const [streakResult, checkInsResult] = await Promise.all([
    supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, total_check_ins, total_morning_check_ins, total_evening_check_ins')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('check_ins')
      .select('check_in_date, check_in_type, focus_area, energy_level, goal_completed, completed_at')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('check_in_date', { ascending: false })
      .limit(INSIGHTS_CHECK_IN_FETCH_LIMIT),
  ])

  // Default streak data (PGRST116 = no row found, normal for new users)
  const streak = streakResult.data || {
    current_streak: 0,
    longest_streak: 0,
    total_check_ins: 0,
    total_morning_check_ins: 0,
    total_evening_check_ins: 0,
  }

  if (streakResult.error && streakResult.error.code !== 'PGRST116') {
    logger.error('Error fetching streak data:', streakResult.error)
  }

  if (checkInsResult.error) {
    logger.error('Error fetching check-ins:', checkInsResult.error)
    throw checkInsResult.error
  }

  const checkIns = checkInsResult.data || []

  // Most recent evening check-ins for energy trend (query is DESC, slice takes newest)
  const recentEvening = checkIns
    .filter((c) => c.check_in_type === 'evening')
    .slice(0, INSIGHTS_ENERGY_TREND_DAYS)

  // All evening check-ins for goal completion
  const allEvening = checkIns.filter((c) => c.check_in_type === 'evening')

  // All morning check-ins for focus areas
  const allMorning = checkIns.filter((c) => c.check_in_type === 'morning')

  // Last 7 days for weekly rate
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - (INSIGHTS_WEEKLY_RATE_DAYS - 1))
  const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo)
  const lastWeekCheckIns = checkIns.filter((c) => c.check_in_date >= sevenDaysAgoStr)

  const energyTrend = computeEnergyTrend(recentEvening)
  const energyLevels = energyTrend.map((e) => e.level)
  const averageEnergy = energyLevels.length > 0
    ? Math.round((energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length) * 10) / 10
    : 0

  return {
    currentStreak: streak.current_streak ?? 0,
    longestStreak: streak.longest_streak ?? 0,
    totalCheckIns: streak.total_check_ins ?? 0,
    totalMorningCheckIns: streak.total_morning_check_ins ?? 0,
    totalEveningCheckIns: streak.total_evening_check_ins ?? 0,
    energyTrend,
    goalCompletion: computeGoalCompletionStats(allEvening),
    focusAreas: computeFocusAreaBreakdown(allMorning),
    weeklyCompletionRate: computeWeeklyCompletionRate(lastWeekCheckIns, INSIGHTS_WEEKLY_RATE_DAYS),
    averageEnergy,
  }
}
