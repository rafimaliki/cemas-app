import { createFileRoute, redirect } from '@tanstack/react-router'
import { useUserStore } from '@/stores/user-store'

export const Route = createFileRoute('/_authenticated/logout/')({
  beforeLoad: () => {
    useUserStore.getState().logout()

    throw redirect({ to: '/login' })
  },
  component: () => null,
})
