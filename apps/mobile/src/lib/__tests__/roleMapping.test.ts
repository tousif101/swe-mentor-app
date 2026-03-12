import { describe, it, expect } from 'vitest'
import {
  ROLE_CONFIG,
  ROLES_ORDERED,
  getFocusAreas,
  getNextRole,
  isValidTargetRole,
  getValidTargetRoles,
} from '../roleMapping'

describe('ROLE_CONFIG', () => {
  it('has all 6 roles defined', () => {
    expect(Object.keys(ROLE_CONFIG)).toHaveLength(6)
  })

  it('has correct indices in ascending order', () => {
    expect(ROLE_CONFIG.intern.index).toBe(0)
    expect(ROLE_CONFIG.software_engineer_1.index).toBe(1)
    expect(ROLE_CONFIG.software_engineer_2.index).toBe(2)
    expect(ROLE_CONFIG.senior_engineer.index).toBe(3)
    expect(ROLE_CONFIG.staff_engineer.index).toBe(4)
    expect(ROLE_CONFIG.principal_engineer.index).toBe(5)
  })

  it('has labels and descriptions for all roles', () => {
    ROLES_ORDERED.forEach((role) => {
      expect(ROLE_CONFIG[role].label).toBeTruthy()
      expect(ROLE_CONFIG[role].description).toBeTruthy()
    })
  })
})

describe('ROLES_ORDERED', () => {
  it('has roles in correct order', () => {
    expect(ROLES_ORDERED).toEqual([
      'intern',
      'software_engineer_1',
      'software_engineer_2',
      'senior_engineer',
      'staff_engineer',
      'principal_engineer',
    ])
  })
})

describe('getFocusAreas', () => {
  it('returns focus areas for SE1 -> SE2', () => {
    const areas = getFocusAreas('software_engineer_1', 'software_engineer_2')
    expect(areas).toContain('Code Fluency')
    expect(areas).toContain('Software Design')
    expect(areas).toContain('Ownership')
  })

  it('returns focus areas for SE2 -> Senior', () => {
    const areas = getFocusAreas('software_engineer_2', 'senior_engineer')
    expect(areas).toContain('Impact')
    expect(areas).toContain('Ownership')
    expect(areas).toContain('Decision Making')
    expect(areas).toContain('Mentorship')
  })

  it('returns focus areas for Senior -> Staff', () => {
    const areas = getFocusAreas('senior_engineer', 'staff_engineer')
    expect(areas).toContain('Architecture')
    expect(areas).toContain('Cross-team Influence')
    expect(areas).toContain('Technical Strategy')
  })

  it('returns focus areas for Staff -> Principal', () => {
    const areas = getFocusAreas('staff_engineer', 'principal_engineer')
    expect(areas).toContain('Org-wide Impact')
    expect(areas).toContain('Technical Vision')
    expect(areas).toContain('Industry Leadership')
  })

  it('returns default areas for undefined transition', () => {
    // Same role (no transition defined)
    const areas = getFocusAreas('software_engineer_1', 'software_engineer_1')
    expect(areas.length).toBeGreaterThan(0)
  })
})

describe('getNextRole', () => {
  it('returns SE1 for Intern', () => {
    expect(getNextRole('intern')).toBe('software_engineer_1')
  })

  it('returns SE2 for SE1', () => {
    expect(getNextRole('software_engineer_1')).toBe('software_engineer_2')
  })

  it('returns Senior for SE2', () => {
    expect(getNextRole('software_engineer_2')).toBe('senior_engineer')
  })

  it('returns Staff for Senior', () => {
    expect(getNextRole('senior_engineer')).toBe('staff_engineer')
  })

  it('returns Principal for Staff', () => {
    expect(getNextRole('staff_engineer')).toBe('principal_engineer')
  })

  it('returns Principal for Principal (top level)', () => {
    expect(getNextRole('principal_engineer')).toBe('principal_engineer')
  })
})

describe('isValidTargetRole', () => {
  it('returns true for same role', () => {
    expect(isValidTargetRole('software_engineer_1', 'software_engineer_1')).toBe(true)
    expect(isValidTargetRole('senior_engineer', 'senior_engineer')).toBe(true)
  })

  it('returns true for higher target role', () => {
    expect(isValidTargetRole('software_engineer_1', 'software_engineer_2')).toBe(true)
    expect(isValidTargetRole('software_engineer_1', 'principal_engineer')).toBe(true)
    expect(isValidTargetRole('software_engineer_2', 'senior_engineer')).toBe(true)
  })

  it('returns false for lower target role', () => {
    expect(isValidTargetRole('senior_engineer', 'software_engineer_1')).toBe(false)
    expect(isValidTargetRole('staff_engineer', 'software_engineer_2')).toBe(false)
    expect(isValidTargetRole('principal_engineer', 'staff_engineer')).toBe(false)
  })
})

describe('getValidTargetRoles', () => {
  it('returns all roles for Intern', () => {
    const targets = getValidTargetRoles('intern')
    expect(targets).toEqual(ROLES_ORDERED)
  })

  it('returns SE1 and above for SE1', () => {
    const targets = getValidTargetRoles('software_engineer_1')
    expect(targets).toEqual([
      'software_engineer_1',
      'software_engineer_2',
      'senior_engineer',
      'staff_engineer',
      'principal_engineer',
    ])
  })

  it('returns SE2 and above for SE2', () => {
    const targets = getValidTargetRoles('software_engineer_2')
    expect(targets).toEqual([
      'software_engineer_2',
      'senior_engineer',
      'staff_engineer',
      'principal_engineer',
    ])
  })

  it('returns Senior and above for Senior', () => {
    const targets = getValidTargetRoles('senior_engineer')
    expect(targets).toEqual([
      'senior_engineer',
      'staff_engineer',
      'principal_engineer',
    ])
  })

  it('returns only Principal for Principal', () => {
    const targets = getValidTargetRoles('principal_engineer')
    expect(targets).toEqual(['principal_engineer'])
  })
})
