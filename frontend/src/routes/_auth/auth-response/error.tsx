import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth/auth-response/error')({
  component: ErrorRedirectPage,
})

function ErrorRedirectPage() {
  const navigate = useNavigate()

  useEffect(() => {
    alert(
      'An error occurred while processing your request. Please try again later.',
    )
    navigate({ to: '/login' })
  }, [navigate])

  return null
}
