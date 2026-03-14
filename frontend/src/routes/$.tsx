// src/routes/$.tsx
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  beforeLoad: () => {
    return {}
  },
  component: () => <Navigate to="/dashboard" />,
})
