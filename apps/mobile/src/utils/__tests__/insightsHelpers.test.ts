import { describe, it, expect } from 'vitest'
import {
  computeEnergyTrend,
  computeGoalCompletionStats,
  computeFocusAreaBreakdown,
  computeWeeklyCompletionRate,
} from '../insightsHelpers'

describe('computeEnergyTrend', () => {
  it('returns empty array for no check-ins', () => {
    expect(computeEnergyTrend([])).toEqual([])
  })

  it('returns energy levels mapped by date', () => {
    const checkIns = [
      { check_in_date: '2026-03-10', energy_level: 4 },
      { check_in_date: '2026-03-09', energy_level: 2 },
      { check_in_date: '2026-03-08', energy_level: 5 },
    ]
    const result = computeEnergyTrend(checkIns)
    expect(result).toEqual([
      { date: '2026-03-08', level: 5 },
      { date: '2026-03-09', level: 2 },
      { date: '2026-03-10', level: 4 },
    ])
  })

  it('filters out check-ins without energy_level', () => {
    const checkIns = [
      { check_in_date: '2026-03-10', energy_level: 4 },
      { check_in_date: '2026-03-09', energy_level: null },
    ]
    const result = computeEnergyTrend(checkIns)
    expect(result).toEqual([{ date: '2026-03-10', level: 4 }])
  })
})

describe('computeGoalCompletionStats', () => {
  it('returns zeros for no check-ins', () => {
    expect(computeGoalCompletionStats([])).toEqual({
      yes: 0,
      partially: 0,
      no: 0,
      total: 0,
    })
  })

  it('counts goal completion statuses', () => {
    const checkIns = [
      { goal_completed: 'yes' },
      { goal_completed: 'yes' },
      { goal_completed: 'partially' },
      { goal_completed: 'no' },
      { goal_completed: null },
    ]
    expect(computeGoalCompletionStats(checkIns)).toEqual({
      yes: 2,
      partially: 1,
      no: 1,
      total: 4,
    })
  })
})

describe('computeFocusAreaBreakdown', () => {
  it('returns empty array for no check-ins', () => {
    expect(computeFocusAreaBreakdown([])).toEqual([])
  })

  it('counts and sorts focus areas by frequency', () => {
    const checkIns = [
      { focus_area: 'React Native' },
      { focus_area: 'TypeScript' },
      { focus_area: 'React Native' },
      { focus_area: 'React Native' },
      { focus_area: 'TypeScript' },
      { focus_area: null },
    ]
    const result = computeFocusAreaBreakdown(checkIns)
    expect(result).toEqual([
      { area: 'React Native', count: 3, percentage: 60 },
      { area: 'TypeScript', count: 2, percentage: 40 },
    ])
  })
})

describe('computeWeeklyCompletionRate', () => {
  it('returns 0 for no check-ins', () => {
    expect(computeWeeklyCompletionRate([], 7)).toBe(0)
  })

  it('calculates percentage of days with check-ins', () => {
    const checkIns = [
      { check_in_date: '2026-03-10' },
      { check_in_date: '2026-03-10' }, // same day, two check-ins
      { check_in_date: '2026-03-09' },
      { check_in_date: '2026-03-08' },
    ]
    // 3 unique days out of 7 = ~43%
    expect(computeWeeklyCompletionRate(checkIns, 7)).toBe(43)
  })
})
