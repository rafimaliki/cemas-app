import { redirect } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { useUserStore } from '@/stores/user-store'

export const Route = createFileRoute('/_auth/auth-response/success')({
  beforeLoad: async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/me`,
        {
          credentials: 'include',
        },
      )

      if (!res.ok) throw new Error('Fetch user failed')

      const user = await res.json()
      useUserStore.getState().setUser(user)

      throw redirect({ to: '/dashboard' })
    } catch (err) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => null,
})
