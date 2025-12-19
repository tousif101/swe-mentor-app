import { formatTimeAgo } from '../checkInHelpers'

describe('formatTimeAgo', () => {
  it('returns "just now" for times less than 1 minute ago', () => {
    const now = new Date()
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)
    expect(formatTimeAgo(thirtySecondsAgo)).toBe('just now')
  })

  it('returns "X minutes ago" for times less than 1 hour ago', () => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    expect(formatTimeAgo(fiveMinutesAgo)).toBe('5 minutes ago')
  })

  it('returns "1 minute ago" for singular', () => {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000)
    expect(formatTimeAgo(oneMinuteAgo)).toBe('1 minute ago')
  })

  it('returns "X hours ago" for times less than 24 hours ago', () => {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    expect(formatTimeAgo(twoHoursAgo)).toBe('2 hours ago')
  })

  it('returns "1 hour ago" for singular', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000)
    expect(formatTimeAgo(oneHourAgo)).toBe('1 hour ago')
  })
})
