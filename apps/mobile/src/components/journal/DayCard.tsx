// apps/mobile/src/components/journal/DayCard.tsx
import React, { useState, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { DayGroup, DayStatus } from '../../utils/journalHelpers'
import { getDayStatus, formatJournalDate } from '../../utils/journalHelpers'
import { formatFocusAreaTag } from '../../utils/formatters'

type IoniconsName = keyof typeof Ionicons.glyphMap

type DayCardProps = {
  dayGroup: DayGroup
  onHashtagPress: (tag: string) => void
  defaultExpanded?: boolean
}

const statusConfig: Record<DayStatus, { icon: string; color: string }> = {
  completed: { icon: 'checkmark-circle', color: '#10b981' },
  partial: { icon: 'ellipse-outline', color: '#f59e0b' },
  missed: { icon: 'close-circle', color: '#ef4444' },
  pending: { icon: 'remove', color: '#6b7280' },
}

export function DayCard({ dayGroup, onHashtagPress, defaultExpanded = false }: DayCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const status = getDayStatus(dayGroup)
  const config = statusConfig[status]

  const focusArea = dayGroup.morning?.focus_area
  const goalPreview = dayGroup.morning?.daily_goal || 'No goal set'

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(!expanded)
  }, [expanded])

  const handleHashtagPress = useCallback((e: any) => {
    e.stopPropagation()
    if (focusArea) {
      onHashtagPress(focusArea)
    }
  }, [focusArea, onHashtagPress])

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Header Row */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatJournalDate(dayGroup.date)}</Text>
        <Ionicons name={config.icon as IoniconsName} size={20} color={config.color} />
      </View>

      {/* Hashtag */}
      {focusArea && (
        <Pressable onPress={handleHashtagPress}>
          <Text style={styles.hashtag}>{formatFocusAreaTag(focusArea)}</Text>
        </Pressable>
      )}

      {/* Goal Preview (collapsed) */}
      {!expanded && (
        <Text style={styles.goalPreview} numberOfLines={1}>
          {goalPreview}
        </Text>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Morning Section */}
          {dayGroup.morning && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Morning</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Focus</Text>
                <Text style={styles.fieldValue}>{dayGroup.morning.focus_area || '—'}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Goal</Text>
                <Text style={styles.fieldValue}>{dayGroup.morning.daily_goal || '—'}</Text>
              </View>
            </View>
          )}

          {/* Evening Section */}
          {dayGroup.evening ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Evening</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Outcome</Text>
                <Text style={styles.fieldValue}>
                  {dayGroup.evening.goal_completed === 'yes'
                    ? 'Completed'
                    : dayGroup.evening.goal_completed === 'partially'
                    ? 'Partially completed'
                    : 'Not completed'}
                </Text>
              </View>
              {dayGroup.evening.quick_win && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Win</Text>
                  <Text style={styles.fieldValue}>{dayGroup.evening.quick_win}</Text>
                </View>
              )}
              {dayGroup.evening.blocker && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Blocker</Text>
                  <Text style={styles.fieldValue}>{dayGroup.evening.blocker}</Text>
                </View>
              )}
              {dayGroup.evening.energy_level != null && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Energy</Text>
                  <Text style={styles.fieldValue}>{dayGroup.evening.energy_level}/5</Text>
                </View>
              )}
              {dayGroup.evening.tomorrow_carry && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Tomorrow</Text>
                  <Text style={styles.fieldValue}>{dayGroup.evening.tomorrow_carry}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.section, styles.pendingSection]}>
              <Text style={styles.pendingText}>Evening reflection not logged</Text>
            </View>
          )}
        </View>
      )}

      {/* Energy indicator for collapsed view with evening */}
      {!expanded && dayGroup.evening?.energy_level != null && (
        <View style={styles.energyBadge}>
          <Ionicons name="flash" size={12} color="#f59e0b" />
          <Text style={styles.energyText}>{dayGroup.evening.energy_level}/5</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  hashtag: {
    color: '#a78bfa',
    fontSize: 14,
    marginBottom: 8,
  },
  goalPreview: {
    color: '#9ca3af',
    fontSize: 14,
  },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fieldLabel: {
    color: '#6b7280',
    fontSize: 14,
    width: 80,
  },
  fieldValue: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  pendingSection: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  pendingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  energyText: {
    color: '#f59e0b',
    fontSize: 12,
  },
})
