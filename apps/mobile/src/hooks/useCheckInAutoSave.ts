import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { createOrUpdateDraft } from '../utils/checkInHelpers'
import { logger } from '../utils/logger'
import { AUTO_SAVE_DEBOUNCE_MS } from '../constants'

type MorningFields = {
  focusArea: string | null
  dailyGoal: string
}

type EveningFields = {
  goalCompleted: 'yes' | 'partially' | 'no' | null
  quickWin: string
  blocker: string
  energyLevel: number | null
  tomorrowCarry: string
}

type UseCheckInAutoSaveParams = {
  checkInType: 'morning' | 'evening'
  isEditMode: boolean
  fields: MorningFields | EveningFields
  /** Function to check if there's meaningful data to save */
  hasMeaningfulData: () => boolean
}

type UseCheckInAutoSaveResult = {
  draftId: string | null
  isSaving: boolean
}

export function useCheckInAutoSave({
  checkInType,
  isEditMode,
  fields,
  hasMeaningfulData,
}: UseCheckInAutoSaveParams): UseCheckInAutoSaveResult {
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const isMountedRef = useRef(true)
  const isFirstInteraction = useRef(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const autoSave = useCallback(async () => {
    // Skip if no meaningful data
    if (!hasMeaningfulData()) return

    // Skip in edit mode
    if (isEditMode) return

    // Check if mounted
    if (!isMountedRef.current) return

    try {
      setIsSaving(true)

      const { data: userData, error } = await supabase.auth.getUser()
      if (error || !userData.user) {
        logger.warn('Auto-save skipped: user not authenticated')
        return
      }

      if (!isMountedRef.current) return

      // Build draft params based on check-in type
      const draftParams = checkInType === 'morning'
        ? {
            userId: userData.user.id,
            checkInType: 'morning' as const,
            focusArea: (fields as MorningFields).focusArea ?? undefined,
            dailyGoal: (fields as MorningFields).dailyGoal.trim() || undefined,
          }
        : {
            userId: userData.user.id,
            checkInType: 'evening' as const,
            goalCompleted: (fields as EveningFields).goalCompleted ?? undefined,
            quickWin: (fields as EveningFields).quickWin.trim() || undefined,
            blocker: (fields as EveningFields).blocker.trim() || undefined,
            energyLevel: (fields as EveningFields).energyLevel ?? undefined,
            tomorrowCarry: (fields as EveningFields).tomorrowCarry.trim() || undefined,
          }

      const id = await createOrUpdateDraft(draftParams)

      if (id && !draftId && isMountedRef.current) {
        setDraftId(id)
      }
    } catch (error) {
      logger.error('Auto-save failed:', error)
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }, [checkInType, isEditMode, fields, hasMeaningfulData, draftId])

  // Debounced auto-save effect
  useEffect(() => {
    // Skip on first interaction
    if (isFirstInteraction.current) {
      isFirstInteraction.current = false
      return
    }

    // Only save if meaningful data
    if (!hasMeaningfulData()) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      autoSave()
    }, AUTO_SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [autoSave, hasMeaningfulData])

  return { draftId, isSaving }
}
