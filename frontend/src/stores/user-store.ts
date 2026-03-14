import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useNavigate } from '@tanstack/react-router'

import type { UserInfo } from '@/types/compliance-types'

interface UserStore {
  user: UserInfo | null
  setUser: (user: UserInfo) => void
  logout: () => void
  isAuthenticated: boolean
  getStoredUser: () => UserInfo | null
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      get isAuthenticated() {
        return get().user !== null
      },
      getStoredUser: () => {
        try {
          const storage = localStorage.getItem('user-storage')
          if (!storage) return null

          const parsed = JSON.parse(storage)

          const isExpired =
            (parsed.state?.user as UserInfo)?.exp < Date.now() / 1000

          // console.log(
          //   'Time left before token exp:',
          //   parsed.state?.user?.exp - Date.now() / 1000,
          // )
          if (isExpired) {
            const navigate = useNavigate()
            navigate({ to: '/login' })
            return null
          }

          return parsed.state?.user ?? null
        } catch (e) {
          console.error('Failed to parse stored user:', e)
          return null
        }
      },
    }),
    {
      name: 'user-storage',
    },
  ),
)
