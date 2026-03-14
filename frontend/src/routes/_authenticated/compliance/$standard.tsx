import { useEffect, useState } from 'react'
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

import ComplianceManager from '@/components/compliance/compliance-manager'
import { fetchUsers } from '@/lib/api-users'
import { useUserStore } from '@/stores/user-store'
import type { UserInfo } from '@/types/compliance-types'

export const Route = createFileRoute('/_authenticated/compliance/$standard')({
  component: RouteComponent,
})

function LoadingScreen() {
  return (
    <div className="flex flex-col justify-center items-center py-16 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">
        Loading compliance data...
      </p>
    </div>
  )
}

const accessLevelMap = {
  Auditor: 0,
  Contributor: 1,
  Administrator: 2,
}

function RouteComponent() {
  const { standard } = useParams({
    from: '/_authenticated/compliance/$standard',
  })

  const navigate = useNavigate()

  const [usersData, setUsersData] = useState<any[]>([])
  const [complianceData, setComplianceData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const currentUser: UserInfo = useUserStore
    .getState()
    .getStoredUser() as UserInfo

  useEffect(() => {
    async function loadAllData() {
      setComplianceData(null)
      setLoading(true)

      try {
        if (currentUser?.role !== 'Auditor') {
          const users = await fetchUsers()
          setUsersData(users)
        }

        let compliance = null

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/compliance/${standard}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          },
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch compliance')
        }

        compliance = data.data

        if (!compliance) {
          throw new Error('Missing required data')
        }

        setComplianceData(compliance)
      } catch (err) {
        alert('Failed to load compliance or user data. Redirecting...')
        navigate({ to: '/dashboard' })
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [standard])

  if (
    loading ||
    (usersData.length === 0 && currentUser?.role !== 'Auditor') ||
    !complianceData ||
    !currentUser
  )
    return <LoadingScreen />

  return (
    <div className="w-full">
      <ComplianceManager
        complianceDataParam={complianceData}
        usersData={usersData}
        currentUser={currentUser}
        accessLevel={
          accessLevelMap[currentUser?.role || 'Auditor'] as 0 | 1 | 2
        }
      />
    </div>
  )
}
