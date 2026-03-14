// src/routes/_auth.tsx
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'
import { useUserStore } from '@/stores/user-store'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const user = useUserStore.getState().getStoredUser()

  if (user) {
    return <Navigate to="/dashboard" />
  }

  return <Outlet />
}
