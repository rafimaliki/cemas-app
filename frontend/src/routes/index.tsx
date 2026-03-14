// src/routes/index.tsx
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useUserStore } from '@/stores/user-store'

export const Route = createFileRoute('/')({
  component: IndexRedirect,
})

function IndexRedirect() {
  const user = useUserStore.getState().getStoredUser()

  if (user) {
    return <Navigate to="/dashboard" />
  } else {
    return <Navigate to="/login" />
  }
}
