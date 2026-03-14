import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import mockDashboardData from '@/data/dashboard-data'
import ComplianceDashboard from '@/components/dashboard/compliance-dashboard'
import ComplianceTable from '@/components/dashboard/compliance-table'
import { NewComplianceModal } from '@/components/dashboard/new-compliance-modal'
import { useNavigate } from '@tanstack/react-router'
import { set } from 'date-fns'
import { useUserStore } from '@/stores/user-store'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: RouteComponent,
})

interface ComplianceInfo {
  id: number | null
  name: string | null
  description: string | null
  created_at: string | null
  count_compliant: number
  total_compliance: number
  percentage_compliance: number
  status_distribution: {
    compliant: number
    non_compliant: number
    in_progress: number
  }
  count_evidences: number
  total_evidences: number
  percentage_evidences: number
}

async function fetchDashboardData() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/dashboard`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
}

function RouteComponent() {
  const [dashboardData, setDashBoardData] = useState({
    summary: {},
    compliances: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const handleComplianceCreated = () => {
    fetchDashboardData()
      .then((data) => {
        if (data) {
          setDashBoardData(data.data)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error)
      })
  }
  const navigate = useNavigate()
  const user = useUserStore.getState().getStoredUser()

  useEffect(() => {
    fetchDashboardData()
      .then((data) => {
        if (data) {
          setDashBoardData(data.data)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error)
      })
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {dashboardData.compliances.length > 0 ? (
        <ComplianceDashboard
          data={{
            summary: dashboardData.summary as ComplianceInfo,
            compliances: dashboardData.compliances as ComplianceInfo[],
          }}
        />
      ) : null}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Compliances</h2>
        {user?.role === 'Administrator' && (
          <NewComplianceModal onComplianceCreated={handleComplianceCreated} />
        )}
      </div>
      <ComplianceTable
        data={dashboardData.compliances}
        onComplianceClick={(complianceId: number) => {
          navigate({ to: `/compliance/${complianceId}` })
        }}
      />
    </div>
  )
}
