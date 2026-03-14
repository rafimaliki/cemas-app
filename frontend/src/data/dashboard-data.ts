import type { ComplianceItem } from '@/components/dashboard/compliance-dashboard'
import { subDays, subHours } from 'date-fns'

function randomDate() {
  const now = new Date()
  const randomDays = Math.floor(Math.random() * 90)
  return subDays(now, randomDays)
}

function randomEvidenceCount() {
  return Math.floor(Math.random() * 21)
}

function randomProgress() {
  return Math.floor(Math.random() * 101)
}

function getStatusFromProgress(progress: number): ComplianceItem['status'] {
  if (progress === 100) return 'compliant'
  if (progress < 30) return 'non-compliant'
  return 'in-progress'
}

const standards = ['ISO 27001', 'ISO 9001', 'GDPR', 'HIPAA', 'SOC 2', 'PCI DSS']
const departments = ['IT', 'HR', 'Finance', 'Operations', 'Legal', 'Marketing']

const generateMockData = (count: number): ComplianceItem[] => {
  const items: ComplianceItem[] = []

  for (let i = 1; i <= count; i++) {
    const progress = randomProgress()
    const standard = standards[Math.floor(Math.random() * standards.length)]
    const department =
      departments[Math.floor(Math.random() * departments.length)]

    items.push({
      id: `compliance-${i}`,
      compliance: `${standard} Compliance Requirement ${i}`,
      evidenceCount: randomEvidenceCount(),
      progress,
      status: getStatusFromProgress(progress),
      lastUpdated: randomDate(),
      standard,
      department,
    })
  }

  return items
}

const mockData: ComplianceItem[] = [...generateMockData(5)]

export default mockData
