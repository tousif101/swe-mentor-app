// Shared types, constants, and utilities for SWE Mentor

// ============================================
// Theme Constants
// ============================================

export const colors = {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
} as const;

// ============================================
// Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export type UserRole =
  | 'software_engineer_1'
  | 'software_engineer_2'
  | 'senior_software_engineer'
  | 'staff_engineer'
  | 'principal_engineer';

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string; // stored without #, displayed with #
  color?: 'primary' | 'secondary' | 'accent';
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface Insight {
  id: string;
  userId: string;
  type: 'weekly_summary' | 'skill_progress' | 'achievement';
  title: string;
  description: string;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export interface SkillProgress {
  skillName: string;
  percentage: number;
  color: 'primary' | 'green' | 'accent';
}

// ============================================
// Utilities
// ============================================

/**
 * Format a tag name with # prefix
 */
export function formatTag(tagName: string): string {
  return tagName.startsWith('#') ? tagName : `#${tagName}`;
}

/**
 * Parse a tag, removing # prefix if present
 */
export function parseTag(tag: string): string {
  return tag.startsWith('#') ? tag.slice(1) : tag;
}
