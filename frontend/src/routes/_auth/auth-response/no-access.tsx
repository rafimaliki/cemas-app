import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth/auth-response/no-access')({
  component: NoAccessPage,
})

function NoAccessPage() {
  const navigate = useNavigate()

  useEffect(() => {
    alert(
      'Access denied. You do not have permission to access this page. Please contact the administrator if you believe this is an error.',
    )
    navigate({ to: '/login' })
  }, [navigate])

  return null
}
