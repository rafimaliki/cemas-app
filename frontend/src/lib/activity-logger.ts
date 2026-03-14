import type {
  ActivityLogEntry,
  CriteriaData,
  ComplianceData,
} from '@/types/compliance-types'
import { v4 as uuidv4 } from 'uuid'

let activityLogs: ActivityLogEntry[] = []

export const logActivity = (
  userId: string,
  userName: string,
  action: string,
  criteriaId?: number,
  criteriaNumber?: string,
  details?: string,
  category?: string,
  complianceId?: number,
  complianceName?: string,
): ActivityLogEntry => {
  const logEntry: ActivityLogEntry = {
    id: uuidv4(),
    userId,
    userName,
    action,
    criteriaId,
    details,
    timestamp: new Date().toISOString(),
    category,
    complianceId: complianceId?.toString(),
    complianceName,
  }

  // Add to the log array
  activityLogs = [logEntry, ...activityLogs]

  console.log(`[Activity Log] ${userName} (${userId}): ${action}`, {
    criteriaId,
    criteriaNumber,
    details,
    category,
    complianceId,
    complianceName,
    timestamp: new Date().toLocaleString(),
  })

  return logEntry
}

// Function to get all activity logs
export const getActivityLogs = (): ActivityLogEntry[] => {
  return activityLogs
}

// Function to get activity logs for a specific criteria
export const getCriteriaActivityLogs = (
  criteriaId: number,
): ActivityLogEntry[] => {
  return activityLogs.filter((log) => log.criteriaId === criteriaId)
}

// Function to get activity logs for a specific user
export const getUserActivityLogs = (userId: string): ActivityLogEntry[] => {
  return activityLogs.filter((log) => log.userId === userId)
}

// Function to clear all logs (for testing purposes)
export const clearActivityLogs = (): void => {
  activityLogs = []
}

// Function to find a criteria by ID and return its full path (for better logging)
export const getCriteriaPath = (
  criterias: CriteriaData[],
  criteriaId: number,
): string => {
  const findPath = (items: CriteriaData[], id: number, path = ''): string => {
    for (const item of items) {
      if (item.id === id) {
        return path ? `${path} > ${item.prefix}` : item.prefix
      }

      if (item.children?.length > 0) {
        const childPath = findPath(
          item.children,
          id,
          path ? `${path} > ${item.prefix}` : item.prefix,
        )
        if (childPath) return childPath
      }
    }
    return ''
  }

  return findPath(criterias, criteriaId)
}
