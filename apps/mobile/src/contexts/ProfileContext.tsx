import { createContext, useContext, ReactNode } from 'react'
import { useProfile } from '../hooks/useProfile'
import type { Profile } from '@swe-mentor/shared'

type ProfileContextValue = {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

type ProfileProviderProps = {
  userId: string | null
  children: ReactNode
}

export function ProfileProvider({ userId, children }: ProfileProviderProps) {
  const profileState = useProfile(userId)

  return (
    <ProfileContext.Provider value={profileState}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfileContext() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider')
  }
  return context
}
