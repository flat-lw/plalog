import { useState, useEffect, useCallback } from 'react'
import { db } from '@/db/database'
import type { UserProfile } from '@/db/models'

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    const data = await db.userProfile.get('default')
    setProfile(data ?? null)
    setIsLoading(false)
  }

  const saveProfile = useCallback(
    async (displayName?: string, contact?: string) => {
      const now = new Date()

      if (profile) {
        await db.userProfile.update('default', {
          displayName,
          contact,
          updatedAt: now,
        })
      } else {
        await db.userProfile.add({
          id: 'default',
          displayName,
          contact,
          createdAt: now,
          updatedAt: now,
        })
      }

      await loadProfile()
    },
    [profile]
  )

  return {
    profile,
    isLoading,
    saveProfile,
  }
}
