// Database role values (must match profiles table CHECK constraint)
export type DbRole =
  | 'software_engineer_1'
  | 'software_engineer_2'
  | 'senior_engineer'
  | 'staff_engineer'
  | 'principal_engineer'

/**
 * Role configuration with display labels and descriptions
 */
export const ROLE_CONFIG: Record<
  DbRole,
  { label: string; description: string; index: number }
> = {
  software_engineer_1: {
    label: 'Software Engineer 1',
    description: 'Learning the fundamentals',
    index: 0,
  },
  software_engineer_2: {
    label: 'Software Engineer 2',
    description: 'Independent contributor',
    index: 1,
  },
  senior_engineer: {
    label: 'Senior Software Engineer',
    description: 'Technical leadership',
    index: 2,
  },
  staff_engineer: {
    label: 'Staff Engineer',
    description: 'Cross-team impact',
    index: 3,
  },
  principal_engineer: {
    label: 'Principal Engineer',
    description: 'Org-wide strategy',
    index: 4,
  },
}

/**
 * Ordered list of roles for dropdowns
 */
export const ROLES_ORDERED: DbRole[] = [
  'software_engineer_1',
  'software_engineer_2',
  'senior_engineer',
  'staff_engineer',
  'principal_engineer',
]

/**
 * Focus areas derived from role transitions.
 * Based on Dropbox Engineering Career Framework competencies.
 */
export const FOCUS_AREAS_BY_TRANSITION: Record<string, string[]> = {
  // SE1 transitions
  'software_engineer_1->software_engineer_2': [
    'Code Fluency',
    'Software Design',
    'Ownership',
  ],
  'software_engineer_1->senior_engineer': [
    'Code Fluency',
    'Software Design',
    'Ownership',
    'Impact',
  ],
  'software_engineer_1->staff_engineer': [
    'Code Fluency',
    'Software Design',
    'Architecture',
    'Impact',
  ],
  'software_engineer_1->principal_engineer': [
    'Code Fluency',
    'Architecture',
    'Technical Vision',
    'Impact',
  ],

  // SE2 transitions
  'software_engineer_2->senior_engineer': [
    'Impact',
    'Ownership',
    'Decision Making',
    'Mentorship',
  ],
  'software_engineer_2->staff_engineer': [
    'Impact',
    'Architecture',
    'Cross-team Influence',
    'Decision Making',
  ],
  'software_engineer_2->principal_engineer': [
    'Impact',
    'Architecture',
    'Technical Vision',
    'Org-wide Influence',
  ],

  // Senior transitions
  'senior_engineer->staff_engineer': [
    'Architecture',
    'Cross-team Influence',
    'Technical Strategy',
  ],
  'senior_engineer->principal_engineer': [
    'Architecture',
    'Technical Vision',
    'Org-wide Impact',
    'Industry Leadership',
  ],

  // Staff transitions
  'staff_engineer->principal_engineer': [
    'Org-wide Impact',
    'Technical Vision',
    'Industry Leadership',
  ],
}

/**
 * Get focus areas for a role transition
 */
export function getFocusAreas(
  currentRole: DbRole,
  targetRole: DbRole
): string[] {
  const key = `${currentRole}->${targetRole}`
  return FOCUS_AREAS_BY_TRANSITION[key] || ['Growth', 'Impact', 'Leadership']
}

/**
 * Get the next role level (for default target role)
 */
export function getNextRole(currentRole: DbRole): DbRole {
  const currentIndex = ROLE_CONFIG[currentRole].index
  const nextIndex = Math.min(currentIndex + 1, ROLES_ORDERED.length - 1)
  return ROLES_ORDERED[nextIndex]
}

/**
 * Check if target role is valid (>= current role)
 */
export function isValidTargetRole(
  currentRole: DbRole,
  targetRole: DbRole
): boolean {
  return ROLE_CONFIG[targetRole].index >= ROLE_CONFIG[currentRole].index
}

/**
 * Get roles that are valid targets (>= given role)
 */
export function getValidTargetRoles(currentRole: DbRole): DbRole[] {
  const currentIndex = ROLE_CONFIG[currentRole].index
  return ROLES_ORDERED.filter((role) => ROLE_CONFIG[role].index >= currentIndex)
}
