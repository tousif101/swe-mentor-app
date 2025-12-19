import type { Tables } from '@swe-mentor/shared'
import { supabase } from '../lib/supabase'

export type CheckIn = Tables<'check_ins'>

export type DayGroup = {
  date: string
  morning: CheckIn | null
  evening: CheckIn | null
}

/**
 * Groups check-ins by date, pairing morning and evening entries.
 * Returns array sorted by date descending (newest first).
 */
export function groupCheckInsByDay(checkIns: CheckIn[]): DayGroup[] {
  if (!checkIns || checkIns.length === 0) {
    return []
  }

  const groupMap = new Map<string, DayGroup>()

  for (const checkIn of checkIns) {
    const date = checkIn.check_in_date
    if (!groupMap.has(date)) {
      groupMap.set(date, { date, morning: null, evening: null })
    }

    const group = groupMap.get(date)!
    if (checkIn.check_in_type === 'morning') {
      group.morning = checkIn
    } else if (checkIn.check_in_type === 'evening') {
      group.evening = checkIn
    }
  }

  return Array.from(groupMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

/**
 * Extracts unique focus areas from check-ins, sorted alphabetically.
 */
export function getUniqueFocusAreas(checkIns: CheckIn[]): string[] {
  const focusAreas = new Set<string>()

  for (const checkIn of checkIns) {
    if (checkIn.focus_area) {
      focusAreas.add(checkIn.focus_area)
    }
  }

  return Array.from(focusAreas).sort()
}

export type FilterOptions = {
  focusArea?: string | null
  searchQuery?: string | null
}

/**
 * Filters check-ins by focus area and/or search query.
 * Search query matches against: daily_goal, quick_win, blocker, tomorrow_carry
 * Uses AND logic when both filters are provided.
 */
export function filterCheckIns(
  checkIns: CheckIn[],
  options: FilterOptions
): CheckIn[] {
  const { focusArea, searchQuery } = options

  return checkIns.filter((checkIn) => {
    // Filter by focus area
    if (focusArea && checkIn.focus_area !== focusArea) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const searchableFields = [
        checkIn.daily_goal,
        checkIn.quick_win,
        checkIn.blocker,
        checkIn.tomorrow_carry,
      ]

      const matches = searchableFields.some(
        (field) => field && field.toLowerCase().includes(query)
      )

      if (!matches) {
        return false
      }
    }

    return true
  })
}

export type DayStatus = 'completed' | 'partial' | 'missed' | 'pending'

/**
 * Determines the status of a day based on goal completion.
 */
export function getDayStatus(group: DayGroup): DayStatus {
  if (!group.evening) {
    return 'pending'
  }

  switch (group.evening.goal_completed) {
    case 'yes':
      return 'completed'
    case 'partially':
      return 'partial'
    case 'no':
      return 'missed'
    default:
      return 'pending'
  }
}

/**
 * Formats a date string as "Dec 17 · Wednesday"
 */
export function formatJournalDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00') // Use noon to avoid timezone issues

  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })

  return `${month} ${day} · ${weekday}`
}

/**
 * Fetches all check-ins for a user, ordered by date descending.
 */
export async function fetchAllCheckIns(userId: string): Promise<CheckIn[]> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided')
  }

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('check_in_date', { ascending: false })
    .order('check_in_type', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}
