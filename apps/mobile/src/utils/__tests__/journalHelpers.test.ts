import { describe, it, expect } from 'vitest'
import { groupCheckInsByDay, getUniqueFocusAreas, filterCheckIns, type DayGroup, type CheckIn } from '../journalHelpers'

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

describe('getUniqueFocusAreas', () => {
  it('extracts unique focus areas from check-ins', () => {
    const checkIns = [
      { focus_area: 'System Design' },
      { focus_area: 'Communication' },
      { focus_area: 'System Design' },
      { focus_area: null },
      { focus_area: 'Code Review' },
    ] as CheckIn[]

    const result = getUniqueFocusAreas(checkIns)

    expect(result).toHaveLength(3)
    expect(result).toContain('System Design')
    expect(result).toContain('Communication')
    expect(result).toContain('Code Review')
  })

  it('returns empty array when no focus areas', () => {
    const checkIns = [
      { focus_area: null },
      { focus_area: null },
    ] as CheckIn[]

    const result = getUniqueFocusAreas(checkIns)

    expect(result).toEqual([])
  })

  it('sorts focus areas alphabetically', () => {
    const checkIns = [
      { focus_area: 'Zebra' },
      { focus_area: 'Alpha' },
      { focus_area: 'Middle' },
    ] as CheckIn[]

    const result = getUniqueFocusAreas(checkIns)

    expect(result).toEqual(['Alpha', 'Middle', 'Zebra'])
  })
})

describe('filterCheckIns', () => {
  const sampleCheckIns = [
    {
      id: '1',
      focus_area: 'System Design',
      daily_goal: 'Build API endpoints',
      quick_win: 'Finished auth module',
      blocker: 'Database migration issues',
      tomorrow_carry: 'Write integration tests',
    },
    {
      id: '2',
      focus_area: 'Communication',
      daily_goal: 'Prepare presentation',
      quick_win: 'Got feedback from team',
      blocker: null,
      tomorrow_carry: 'Schedule meeting',
    },
    {
      id: '3',
      focus_area: 'System Design',
      daily_goal: 'Review architecture',
      quick_win: null,
      blocker: 'Unclear requirements',
      tomorrow_carry: null,
    },
  ] as CheckIn[]

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
