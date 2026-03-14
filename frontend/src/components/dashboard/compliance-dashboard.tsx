import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, TrendingUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
interface ComplianceDashboardProps {
  data: {
    summary: ComplianceInfo
    compliances: ComplianceInfo[]
  }
}

export default function ComplianceDashboard({
  data,
}: ComplianceDashboardProps) {
  const [selectedComplianceId, setSelectedComplianceId] =
    useState<string>('all')
  const [filteredData, setFilteredData] = useState<ComplianceInfo>(data.summary)

  useEffect(() => {
    if (selectedComplianceId === 'all') {
      setFilteredData(data.summary)
    } else {
      const selected = data.compliances.find(
        (item: ComplianceInfo) => item.id === Number(selectedComplianceId),
      )
      setFilteredData(selected ? selected : ({} as ComplianceInfo))
    }
  }, [selectedComplianceId, data])

  return (
    <div className="space-y-4 mb-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">
          Overview ({filteredData.name + ' ' + filteredData.description})
        </h2>
        <Select
          value={selectedComplianceId}
          onValueChange={setSelectedComplianceId}
        >
          <SelectTrigger className="w-[165px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All </SelectItem>
            {data.compliances.map((item) => (
              <SelectItem key={item.id} value={item.id?.toString() || ''}>
                {item.name} {item.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Compliance
            </CardTitle>
            <div className="h-4 w-4 text-green-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xl font-bold">
                  {filteredData.percentage_compliance}%
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {filteredData.count_compliant} of{' '}
                  {filteredData.total_compliance}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items fully compliant
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status Distribution
            </CardTitle>
            <div className="h-4 w-4 text-blue-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 w-28 inline-flex items-center justify-start">
                  Compliant
                </Badge>
                <span className="font-medium">
                  {filteredData.status_distribution.compliant}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 hover:bg-amber-100 w-28 inline-flex items-center justify-start"
                >
                  In Progress
                </Badge>
                <span className="font-medium">
                  {filteredData.status_distribution.in_progress}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 w-28 inline-flex items-center justify-start">
                  Non-Compliant
                </Badge>
                <span className="font-medium">
                  {filteredData.status_distribution.non_compliant}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Evidence Coverage
            </CardTitle>
            <div className="h-4 w-4 text-indigo-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredData.count_evidences}
            </div>
            <p className="text-xs text-muted-foreground">
              Total evidence items collected
            </p>
            <div className="mt-2 h-2 w-full bg-muted rounded-full">
              <div
                className={`h-2 rounded-full ${getProgressColorClass(
                  (filteredData.count_evidences /
                    filteredData.total_evidences) *
                    100,
                )}`}
                style={{
                  width: `${Math.min(100, (filteredData.count_evidences / filteredData.total_evidences) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              A total of {filteredData.total_evidences} criteria
              {filteredData.total_evidences > 1 ? '' : 's'} need evidence
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getProgressColorClass(percentage: number) {
  if (percentage === 100) return 'bg-green-500'
  if (percentage >= 90) return 'bg-lime-500'
  if (percentage >= 80) return 'bg-yellow-400'
  if (percentage >= 70) return 'bg-amber-400'
  if (percentage >= 60) return 'bg-orange-400'
  if (percentage >= 50) return 'bg-orange-500'
  if (percentage >= 40) return 'bg-red-400'
  if (percentage >= 30) return 'bg-red-500'
  if (percentage >= 20) return 'bg-red-600'
  return 'bg-red-700'
}
