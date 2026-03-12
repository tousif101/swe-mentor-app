import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface UseCompanyMatchOptions {
  companyName?: string
  companySize?: string
  careerMatrixId?: string
}

export interface CompanySuggestion {
  id: string
  company_name: string
}

export function useCompanyMatch(initial: UseCompanyMatchOptions = {}) {
  const [companyName, setCompanyNameState] = useState(initial.companyName ?? '')
  const [companySize, setCompanySizeState] = useState<string | null>(initial.companySize ?? null)
  const [careerMatrixId, setCareerMatrixId] = useState<string | null>(initial.careerMatrixId ?? null)
  const [matchedCompany, setMatchedCompany] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const setCompanyName = useCallback((text: string) => {
    setCompanyNameState(text)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (text.length < 2) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('career_matrices')
        .select('id, company_name')
        .ilike('company_name', `%${text}%`)
        .limit(5)

      setSuggestions(data ?? [])
      setIsSearching(false)
    }, 300)
  }, [])

  const selectCompany = useCallback((name: string, matrixId: string) => {
    setCompanyNameState(name)
    setCareerMatrixId(matrixId)
    setMatchedCompany(name)
    setSuggestions([])
  }, [])

  const setCompanySize = useCallback((size: string) => {
    setCompanySizeState(size)
  }, [])

  const clearMatch = useCallback(() => {
    setCareerMatrixId(null)
    setMatchedCompany(null)
  }, [])

  const getCompanyFields = useCallback(() => ({
    company_name: companyName || null,
    company_size: companySize,
    career_matrix_id: careerMatrixId,
  }), [companyName, companySize, careerMatrixId])

  return {
    companyName,
    companySize,
    careerMatrixId,
    matchedCompany,
    suggestions,
    isSearching,
    setCompanyName,
    selectCompany,
    setCompanySize,
    clearMatch,
    getCompanyFields,
  }
}
