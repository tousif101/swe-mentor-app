import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../utils'
import { COMPANY_SIZE_TO_TEMPLATE } from '../constants'
import type { CompanySize } from '../constants'

interface UseCompanyMatchOptions {
  companySize?: string
  careerMatrixId?: string
}

export function useCompanyMatch(initial: UseCompanyMatchOptions = {}) {
  const [companySize, setCompanySizeState] = useState<string | null>(initial.companySize ?? null)
  const [careerMatrixId, setCareerMatrixId] = useState<string | null>(initial.careerMatrixId ?? null)
  const [matchedTemplate, setMatchedTemplate] = useState<string | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  // Populate matchedTemplate on mount for returning users
  useEffect(() => {
    if (initial.companySize) {
      const templateName = COMPANY_SIZE_TO_TEMPLATE[initial.companySize as CompanySize]
      if (templateName) setMatchedTemplate(templateName)
    }
  }, []) // init only

  const setCompanySize = useCallback(async (size: string) => {
    setCompanySizeState(size)

    const templateName = COMPANY_SIZE_TO_TEMPLATE[size as CompanySize]
    if (!templateName) {
      setCareerMatrixId(null)
      setMatchedTemplate(null)
      return
    }

    setIsMatching(true)
    try {
      const { data, error } = await supabase
        .from('career_matrices')
        .select('id, company_name')
        .eq('company_name', templateName)
        .limit(1)
        .maybeSingle()

      if (error) {
        logger.error('Career matrix lookup failed', error)
        return
      }

      if (mountedRef.current) {
        setCareerMatrixId(data?.id ?? null)
        setMatchedTemplate(data?.company_name ?? null)
      }
    } catch (err) {
      logger.error('Career matrix lookup failed', err)
    } finally {
      if (mountedRef.current) setIsMatching(false)
    }
  }, [])

  const getCompanyFields = useCallback(() => ({
    company_size: companySize,
    career_matrix_id: careerMatrixId,
  }), [companySize, careerMatrixId])

  return {
    companySize,
    careerMatrixId,
    matchedTemplate,
    isMatching,
    setCompanySize,
    getCompanyFields,
  }
}
