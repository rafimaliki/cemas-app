'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ComplianceInfo {
  id: number
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

interface ComplianceTableProps {
  data: ComplianceInfo[]
  onComplianceClick: (id: number) => void
}

export default function ComplianceTable({
  data,
  onComplianceClick,
}: ComplianceTableProps) {
  return (
    <div className="w-full">
      <div className="border rounded-lg  mt-4  shadow-sm ">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-neutral-100">
              <TableHead className="w-[250px] px-4 py-2 text-left font-medium">
                Compliance
              </TableHead>
              <TableHead className="w-[200px] px-4 py-2 text-left font-medium">
                Evidence Count
              </TableHead>
              <TableHead className="w-[230px] px-4 py-2 text-left font-medium">
                Progress
              </TableHead>
              <TableHead className="w-[120px] px-4 py-2 text-left font-medium">
                Last Updated
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell
                  className="px-4 py-2 font-medium cursor-pointer hover:text-primary hover:underline"
                  onClick={() => onComplianceClick(item.id)}
                >
                  {item.name}
                </TableCell>
                <TableCell className="px-4 py-2 text-left">
                  {item.count_evidences}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {/* Progress Bar */}
                    <div className="relative w-[200px] bg-muted rounded-full h-2.5">
                      <div
                        className={`absolute top-0 left-0 h-2.5 rounded-full ${getProgressColorClass(item.percentage_compliance)}`}
                        style={{ width: `${item.percentage_compliance}%` }}
                      ></div>
                    </div>

                    {/* Percentage Text */}
                    <span className="text-sm font-medium min-w-[40px] text-right">
                      {item.percentage_compliance}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2 text-left">Today</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-4 text-neutral-500"
                >
                  You don't have any compliance yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
