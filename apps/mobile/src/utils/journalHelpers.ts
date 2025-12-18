import type { Tables } from '@swe-mentor/shared'

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
