import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../utils'
import { COMPANY_SIZE_TO_TEMPLATE } from '../constants'

interface UseCompanyMatchOptions {
  companySize?: string
  careerMatrixId?: string
}

export function useCompanyMatch(initial: UseCompanyMatchOptions = {}) {
  const [companySize, setCompanySizeState] = useState<string | null>(initial.companySize ?? null)
  const [careerMatrixId, setCareerMatrixId] = useState<string | null>(initial.careerMatrixId ?? null)
  const [matchedTemplate, setMatchedTemplate] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  const setCompanySize = useCallback(async (size: string) => {
    setCompanySizeState(size)

    const templateName = COMPANY_SIZE_TO_TEMPLATE[size]
    if (!templateName) {
      setCareerMatrixId(null)
      setMatchedTemplate(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('career_matrices')
        .select('id, company_name')
        .eq('company_name', templateName)
        .limit(1)
        .single()

      if (error) {
        logger.error('Career matrix lookup failed', error)
      }

      if (mountedRef.current && data) {
        setCareerMatrixId(data.id)
        setMatchedTemplate(data.company_name)
      }
    } catch (err) {
      logger.error('Career matrix lookup failed', err)
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
    setCompanySize,
    getCompanyFields,
  }
}
