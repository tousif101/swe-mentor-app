import { describe, it, expect } from 'vitest'
import { groupCheckInsByDay, type DayGroup } from '../journalHelpers'

describe('groupCheckInsByDay', () => {
  it('groups morning and evening check-ins for the same day', () => {
    const checkIns = [
      {
        id: '1',
        user_id: 'user1',
        check_in_type: 'morning',
        check_in_date: '2025-12-17',
        focus_area: 'System Design',
        daily_goal: 'Build API endpoints',
        goal_completed: null,
        quick_win: null,
        blocker: null,
        energy_level: null,
        tomorrow_carry: null,
      },
      {
        id: '2',
        user_id: 'user1',
        check_in_type: 'evening',
        check_in_date: '2025-12-17',
        focus_area: null,
        daily_goal: null,
        goal_completed: 'yes',
        quick_win: 'Finished auth',
        blocker: 'None',
        energy_level: 4,
        tomorrow_carry: 'Write tests',
      },
    ]

    const result = groupCheckInsByDay(checkIns)

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2025-12-17')
    expect(result[0].morning).not.toBeNull()
    expect(result[0].evening).not.toBeNull()
    expect(result[0].morning?.daily_goal).toBe('Build API endpoints')
    expect(result[0].evening?.quick_win).toBe('Finished auth')
  })

  it('handles days with only morning check-in', () => {
    const checkIns = [
      {
        id: '1',
        user_id: 'user1',
        check_in_type: 'morning',
        check_in_date: '2025-12-17',
        focus_area: 'Communication',
        daily_goal: 'Prep for 1:1',
        goal_completed: null,
        quick_win: null,
        blocker: null,
        energy_level: null,
        tomorrow_carry: null,
      },
    ]

    const result = groupCheckInsByDay(checkIns)

    expect(result).toHaveLength(1)
    expect(result[0].morning).not.toBeNull()
    expect(result[0].evening).toBeNull()
  })

  it('sorts by date descending (newest first)', () => {
    const checkIns = [
      {
        id: '1',
        user_id: 'user1',
        check_in_type: 'morning',
        check_in_date: '2025-12-15',
        focus_area: 'Code Review',
        daily_goal: 'Review PRs',
        goal_completed: null,
        quick_win: null,
        blocker: null,
        energy_level: null,
        tomorrow_carry: null,
      },
      {
        id: '2',
        user_id: 'user1',
        check_in_type: 'morning',
        check_in_date: '2025-12-17',
        focus_area: 'System Design',
        daily_goal: 'Plan architecture',
        goal_completed: null,
        quick_win: null,
        blocker: null,
        energy_level: null,
        tomorrow_carry: null,
      },
    ]

    const result = groupCheckInsByDay(checkIns)

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2025-12-17')
    expect(result[1].date).toBe('2025-12-15')
  })

  it('returns empty array for empty input', () => {
    const result = groupCheckInsByDay([])
    expect(result).toEqual([])
  })
})
