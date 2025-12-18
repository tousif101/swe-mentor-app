import { describe, it, expect } from 'vitest'
import {
  groupCheckInsByDay,
  getUniqueFocusAreas,
  filterCheckIns,
  getDayStatus,
  formatJournalDate,
  type DayGroup,
  type CheckIn
} from '../journalHelpers'

function createMockCheckIn(overrides: Partial<CheckIn>): CheckIn {
  return {
    id: 'test-id',
    user_id: 'test-user',
    check_in_type: 'morning',
    check_in_date: '2025-12-17',
    input_method: null,
    focus_area: null,
    daily_goal: null,
    goal_completed: null,
    quick_win: null,
    blocker: null,
    energy_level: null,
    tomorrow_carry: null,
    ai_feedback: null,
    ai_feedback_generated_at: null,
    completed_at: null,
    created_at: null,
    updated_at: null,
    ...overrides
  }
}

describe('groupCheckInsByDay', () => {
  it('groups morning and evening check-ins for the same day', () => {
    const checkIns = [
      createMockCheckIn({
        id: '1',
        user_id: 'user1',
        check_in_type: 'morning',
        check_in_date: '2025-12-17',
        focus_area: 'System Design',
        daily_goal: 'Build API endpoints',
      }),
      createMockCheckIn({
        id: '2',
        user_id: 'user1',
        check_in_type: 'evening',
        check_in_date: '2025-12-17',
        goal_completed: 'yes',
        quick_win: 'Finished auth',
        blocker: 'None',
        energy_level: 4,
        tomorrow_carry: 'Write tests',
      }),
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
      createMockCheckIn({
        id: '1',
        user_id: 'user1',
        check_in_type: 'morning',
        check_in_date: '2025-12-17',
        focus_area: 'Communication',
        daily_goal: 'Prep for 1:1',
      }),
    ]

    const result = groupCheckInsByDay(checkIns)

    expect(result).toHaveLength(1)
    expect(result[0].morning).not.toBeNull()
    expect(result[0].evening).toBeNull()
  })

  it('sorts by date descending (newest first)', () => {
    const checkIns = [
      createMockCheckIn({
        id: '1',
        user_id: 'user1',
        check_in_type: 'morning',
        check_in_date: '2025-12-15',
        focus_area: 'Code Review',
        daily_goal: 'Review PRs',
      }),
      createMockCheckIn({
        id: '2',
        user_id: 'user1',
        check_in_type: 'morning',
        check_in_date: '2025-12-17',
        focus_area: 'System Design',
        daily_goal: 'Plan architecture',
      }),
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

describe('getUniqueFocusAreas', () => {
  it('extracts unique focus areas from check-ins', () => {
    const checkIns = [
      createMockCheckIn({ focus_area: 'System Design' }),
      createMockCheckIn({ focus_area: 'Communication' }),
      createMockCheckIn({ focus_area: 'System Design' }),
      createMockCheckIn({ focus_area: null }),
      createMockCheckIn({ focus_area: 'Code Review' }),
    ]

    const result = getUniqueFocusAreas(checkIns)

    expect(result).toHaveLength(3)
    expect(result).toContain('System Design')
    expect(result).toContain('Communication')
    expect(result).toContain('Code Review')
  })

  it('returns empty array when no focus areas', () => {
    const checkIns = [
      createMockCheckIn({ focus_area: null }),
      createMockCheckIn({ focus_area: null }),
    ]

    const result = getUniqueFocusAreas(checkIns)

    expect(result).toEqual([])
  })

  it('sorts focus areas alphabetically', () => {
    const checkIns = [
      createMockCheckIn({ focus_area: 'Zebra' }),
      createMockCheckIn({ focus_area: 'Alpha' }),
      createMockCheckIn({ focus_area: 'Middle' }),
    ]

    const result = getUniqueFocusAreas(checkIns)

    expect(result).toEqual(['Alpha', 'Middle', 'Zebra'])
  })
})

describe('filterCheckIns', () => {
  const sampleCheckIns = [
    createMockCheckIn({
      id: '1',
      focus_area: 'System Design',
      daily_goal: 'Build API endpoints',
      quick_win: 'Finished auth module',
      blocker: 'Database migration issues',
      tomorrow_carry: 'Write integration tests',
    }),
    createMockCheckIn({
      id: '2',
      focus_area: 'Communication',
      daily_goal: 'Prepare presentation',
      quick_win: 'Got feedback from team',
      blocker: null,
      tomorrow_carry: 'Schedule meeting',
    }),
    createMockCheckIn({
      id: '3',
      focus_area: 'System Design',
      daily_goal: 'Review architecture',
      quick_win: null,
      blocker: 'Unclear requirements',
      tomorrow_carry: null,
    }),
  ]

  it('filters by focus area (hashtag)', () => {
    const result = filterCheckIns(sampleCheckIns, { focusArea: 'Communication' })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by search query in daily_goal', () => {
    const result = filterCheckIns(sampleCheckIns, { searchQuery: 'API' })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by search query in quick_win', () => {
    const result = filterCheckIns(sampleCheckIns, { searchQuery: 'feedback' })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by search query in blocker', () => {
    const result = filterCheckIns(sampleCheckIns, { searchQuery: 'migration' })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by search query in tomorrow_carry', () => {
    const result = filterCheckIns(sampleCheckIns, { searchQuery: 'integration' })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('combines focus area and search query (AND logic)', () => {
    const result = filterCheckIns(sampleCheckIns, {
      focusArea: 'System Design',
      searchQuery: 'architecture',
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('search is case-insensitive', () => {
    const result = filterCheckIns(sampleCheckIns, { searchQuery: 'API' })
    const resultLower = filterCheckIns(sampleCheckIns, { searchQuery: 'api' })

    expect(result).toHaveLength(1)
    expect(resultLower).toHaveLength(1)
  })

  it('returns all when no filters', () => {
    const result = filterCheckIns(sampleCheckIns, {})

    expect(result).toHaveLength(3)
  })
})

describe('getDayStatus', () => {
  it('returns "completed" when goal_completed is "yes"', () => {
    const group: DayGroup = {
      date: '2025-12-17',
      morning: createMockCheckIn({ focus_area: 'Test' }),
      evening: createMockCheckIn({ goal_completed: 'yes' }),
    }

    expect(getDayStatus(group)).toBe('completed')
  })

  it('returns "partial" when goal_completed is "partially"', () => {
    const group: DayGroup = {
      date: '2025-12-17',
      morning: createMockCheckIn({ focus_area: 'Test' }),
      evening: createMockCheckIn({ goal_completed: 'partially' }),
    }

    expect(getDayStatus(group)).toBe('partial')
  })

  it('returns "missed" when goal_completed is "no"', () => {
    const group: DayGroup = {
      date: '2025-12-17',
      morning: createMockCheckIn({ focus_area: 'Test' }),
      evening: createMockCheckIn({ goal_completed: 'no' }),
    }

    expect(getDayStatus(group)).toBe('missed')
  })

  it('returns "pending" when no evening check-in', () => {
    const group: DayGroup = {
      date: '2025-12-17',
      morning: createMockCheckIn({ focus_area: 'Test' }),
      evening: null,
    }

    expect(getDayStatus(group)).toBe('pending')
  })
})

describe('formatJournalDate', () => {
  it('formats date as "Dec 17 · Wednesday"', () => {
    // Note: This depends on timezone, test with fixed date
    const result = formatJournalDate('2025-12-17')

    expect(result).toMatch(/Dec 17/)
    expect(result).toContain('Wednesday') // 2025-12-17 is a Wednesday
  })

  it('handles different dates correctly', () => {
    const result = formatJournalDate('2025-12-01')

    expect(result).toMatch(/Dec 1/)
    expect(result).toContain('Monday') // 2025-12-01 is a Monday
  })
})
