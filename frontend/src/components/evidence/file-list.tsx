'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type React from 'react'

import type { FileType } from '@/types/evidence-types'
import type { CriteriaData } from '@/types/evidence-types'
import { getFileIcon as getFileIconByType } from '@/lib/file-utils'
import {
  MoreVertical,
  Download,
  Trash2,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDown,
  ArrowUp,
  FileText,
  SlidersHorizontal,
  Info,
  AlertCircle,
  Loader2,
  HelpCircle,
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
  RefreshCw,
  FileBarChart,
  UserPlus,
  UserMinus,
  Users,
  Shield,
  Edit3,
  UserCheck,
  Globe,
  Lock,
  Mail,
  User,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FileUploaderButton } from './file-uploader-button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

// Update the FileListProps interface to use fetchFiles instead of onFilesUploaded
interface FileListProps {
  files: FileType[]
  onDelete: (id: string) => void
  loading: boolean
  fetchFiles?: () => void
  onShowCriteriaModal?: (certificate: string) => void
  error: string | null
  totalfiles: number
}

// Define the possible status types for a file
type FileStatusType =
  | 'compliant'
  | 'non-compliant'
  | 'partial'
  | 'pending'
  | 'unknown'

// Define the possible role types
type RoleType = 'Administrator' | 'Contributor' | 'Auditor'

// Interface for storing criteria status data
interface CriteriaStatusCache {
  [fileId: string]: {
    status: FileStatusType
    count: {
      total: number
      active: number
      inactive: number
      pending: number
    }
    lastFetched: number
    criteriaData?: CriteriaData[]
  }
}

export function FileList({
  files,
  loading,
  error,
  fetchFiles,
  onDelete,
  onShowCriteriaModal,
  totalfiles,
}: FileListProps) {
  const [previewFile, setPreviewFile] = useState<FileType | null>(null)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false)
  const [fileToDelete, setFileToDelete] = useState<FileType | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] =
    useState<boolean>(false)
  const [isDeletingMultiple, setIsDeletingMultiple] = useState<boolean>(false)
  const [criteriaStatusCache, setCriteriaStatusCache] =
    useState<CriteriaStatusCache>({})
  const [loadingStatuses, setLoadingStatuses] = useState<string[]>([])
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false)
  const [selectedStatusFile, setSelectedStatusFile] = useState<FileType | null>(
    null,
  )
  const [isRefreshingStatus, setIsRefreshingStatus] = useState<boolean>(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isTogglingPublic, setIsTogglingPublic] = useState<string[]>([])

  // Role management states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false)
  const [selectedRole, setSelectedRole] = useState<RoleType>('Contributor')
  const [isGrantingRole, setIsGrantingRole] = useState<boolean>(true)
  const [isProcessingRole, setIsProcessingRole] = useState<boolean>(false)
  const [fileForRoleManagement, setFileForRoleManagement] =
    useState<FileType | null>(null)
  const [isMultiRoleManagement, setIsMultiRoleManagement] =
    useState<boolean>(false)

  // Access info modal state
  const [isAccessInfoModalOpen, setIsAccessInfoModalOpen] =
    useState<boolean>(false)
  const [selectedAccessFile, setSelectedAccessFile] = useState<FileType | null>(
    null,
  )

  // Add new state variables for the confirmation dialog
  const [isAccessConfirmOpen, setIsAccessConfirmOpen] = useState<boolean>(false)
  const [fileForAccessChange, setFileForAccessChange] =
    useState<FileType | null>(null)
  const [isMultiAccessChange, setIsMultiAccessChange] = useState<boolean>(false)
  const [makeFilesPublic, setMakeFilesPublic] = useState<boolean>(false)

  // Fetch criteria status for a file
  const fetchCriteriaStatus = useCallback(
    async (fileId: string, forceRefresh = false) => {
      // Check if we already have cached data that's less than 5 minutes old
      const cachedData = criteriaStatusCache[fileId]
      const now = Date.now()
      if (
        !forceRefresh &&
        cachedData &&
        now - cachedData.lastFetched < 5 * 60 * 1000
      ) {
        return cachedData
      }

      // Add to loading state
      setLoadingStatuses((prev) => [...prev, fileId])

      try {
        const url = new URL(
          `${import.meta.env.VITE_BACKEND_URL}/api/evidence/criteria-by-evidence/${fileId}`,
        )
        const res = await fetch(url.toString(), {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!res.ok) {
          toast.error(
            'Failed to fetch criteria, Reason: There(s) a file with non-sychronized local DB with Google Drive',
            { position: 'top-center' },
          )
          throw new Error(`Failed to fetch criteria, status: ${res.status}`)
        }

        const response: { success: boolean; data: CriteriaData[] } =
          await res.json()
        const criteriaData = response.data || []

        // Calculate summary status
        const statusSummary = calculateStatusSummary(criteriaData)

        // Cache the result with the full criteria data
        setCriteriaStatusCache((prev) => ({
          ...prev,
          [fileId]: {
            ...statusSummary,
            criteriaData: criteriaData,
            lastFetched: now,
          },
        }))

        return { ...statusSummary, criteriaData }
      } catch (error) {
        console.error(`Error fetching criteria for file ${fileId}:`, error)

        // Cache a default "unknown" status to prevent repeated failed requests
        const unknownStatus = {
          status: 'unknown' as FileStatusType,
          count: { total: 0, active: 0, inactive: 0, pending: 0 },
          lastFetched: now,
        }

        setCriteriaStatusCache((prev) => ({
          ...prev,
          [fileId]: unknownStatus,
        }))

        return unknownStatus
      } finally {
        // Remove from loading state
        setLoadingStatuses((prev) => prev.filter((id) => id !== fileId))
      }
    },
    [criteriaStatusCache],
  )

  // Calculate status summary from criteria data
  const calculateStatusSummary = (criteriaData: CriteriaData[]) => {
    const count = {
      total: criteriaData.length,
      active: 0,
      inactive: 0,
      pending: 0,
    }

    // Count different statuses
    criteriaData.forEach((criteria) => {
      const status = criteria.status?.toLowerCase() || ''
      if (
        status === 'compliant' ||
        status === 'approved' ||
        status === 'completed'
      ) {
        count.active++
      } else if (
        status === 'non-compliant' ||
        status === 'rejected' ||
        status === 'failed'
      ) {
        count.inactive++
      } else {
        count.pending++
      }
    })

    // Determine overall status
    let status: FileStatusType = 'unknown'

    if (count.total === 0) {
      status = 'unknown'
    } else if (count.active === count.total) {
      status = 'compliant'
    } else if (count.inactive > 0) {
      status = 'non-compliant'
    } else if (count.active > 0 && count.pending > 0) {
      status = 'partial'
    } else {
      status = 'pending'
    }

    return { status, count }
  }

  // Handle hover on status badge to refresh data
  const handleStatusHover = useCallback(
    (fileId: string) => {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }

      // Set a timeout to fetch data after 500ms of hovering
      hoverTimeoutRef.current = setTimeout(() => {
        const cachedData = criteriaStatusCache[fileId]
        const now = Date.now()

        // Only refresh if data is older than 1 minute
        if (!cachedData || now - cachedData.lastFetched > 60 * 1000) {
          fetchCriteriaStatus(fileId, true)
        }
      }, 500)
    },
    [criteriaStatusCache, fetchCriteriaStatus],
  )

  // Handle hover end
  const handleStatusHoverEnd = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  // Handle click on status badge to show detailed modal
  const handleStatusClick = useCallback(
    (file: FileType) => {
      setSelectedStatusFile(file)

      // Fetch fresh data if needed
      const cachedData = criteriaStatusCache[file.id]
      const now = Date.now()

      if (
        !cachedData ||
        !cachedData.criteriaData ||
        now - cachedData.lastFetched > 60 * 1000
      ) {
        fetchCriteriaStatus(file.id, true)
      }

      setIsStatusModalOpen(true)
    },
    [criteriaStatusCache, fetchCriteriaStatus],
  )

  // Refresh status data in the modal
  const handleRefreshStatus = useCallback(async () => {
    if (!selectedStatusFile) return

    setIsRefreshingStatus(true)
    try {
      await fetchCriteriaStatus(selectedStatusFile.id, true)
      toast.success('Status data refreshed', { position: 'top-center' })
    } catch (error) {
      toast.error('Failed to refresh status data', { position: 'top-center' })
    } finally {
      setIsRefreshingStatus(false)
    }
  }, [selectedStatusFile, fetchCriteriaStatus])

  // Open access info modal
  const handleShowAccessInfo = (file: FileType) => {
    setSelectedAccessFile(file)
    setIsAccessInfoModalOpen(true)
  }

  // Fetch statuses for visible files
  useEffect(() => {
    // Only fetch for files that are currently visible and don't have a recent status
    const filesToFetch = files.filter((file) => {
      const cachedData = criteriaStatusCache[file.id]
      const now = Date.now()
      return !cachedData || now - cachedData.lastFetched > 5 * 60 * 1000
    })

    // Limit to 5 concurrent requests to avoid overwhelming the server
    const fetchBatch = async (batch: FileType[]) => {
      await Promise.all(batch.map((file) => fetchCriteriaStatus(file.id)))
    }

    // Split into batches of 5
    const batches: FileType[][] = []
    for (let i = 0; i < filesToFetch.length; i += 5) {
      batches.push(filesToFetch.slice(i, i + 5))
    }

    // Process batches sequentially
    const processBatches = async () => {
      for (const batch of batches) {
        await fetchBatch(batch)
      }
    }

    if (batches.length > 0) {
      processBatches()
    }
  }, [files, criteriaStatusCache, fetchCriteriaStatus])

  // Single file deletion
  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/drive/delete?fileId=${fileToDelete.id}`,
        {
          credentials: 'include',
          method: 'DELETE',
        },
      )

      const result = await response.json()
      if (!response.ok)
        throw new Error(result.message || 'Failed to delete file!')

      toast.success('File successfully deleted from Google Drive!', {
        position: 'top-center',
      })
      onDelete(fileToDelete.id) // callback from props to update UI
      setIsDeleteModalOpen(false)
      setFileToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An error occurred while deleting the file.', {
        position: 'top-center',
      })
      setIsDeleteModalOpen(false)
      setFileToDelete(null)
    }
  }

  // Multiple files deletion
  const handleMultipleDeleteConfirm = async () => {
    if (selectedFiles.length === 0) return

    setIsDeletingMultiple(true)

    try {
      let successCount = 0
      let failCount = 0

      // Process files sequentially to avoid overwhelming the server
      for (const fileId of selectedFiles) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/drive/delete?fileId=${fileId}`,
            {
              credentials: 'include',
              method: 'DELETE',
            },
          )

          const result = await response.json()
          if (response.ok) {
            successCount++
            onDelete(fileId)
          } else {
            failCount++
            console.error(`Failed to delete file ${fileId}:`, result.message)
          }
        } catch (error) {
          failCount++
          console.error(`Error deleting file ${fileId}:`, error)
        }
      }

      // Show appropriate toast based on results
      if (successCount > 0 && failCount === 0) {
        toast.success(
          `Successfully deleted ${successCount} file${successCount !== 1 ? 's' : ''}`,
          {
            position: 'top-center',
          },
        )
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Deleted ${successCount} file${successCount !== 1 ? 's' : ''}, but failed to delete ${failCount} file${failCount !== 1 ? 's' : ''}`,
          { position: 'top-center' },
        )
      } else {
        toast.error(`Failed to delete any files`, { position: 'top-center' })
      }

      // Clear selection after deletion
      setSelectedFiles([])
      setIsMultiDeleteModalOpen(false)
    } catch (error) {
      console.error('Multiple delete error:', error)
      toast.error('An error occurred during the deletion process.', {
        position: 'top-center',
      })
    } finally {
      setIsDeletingMultiple(false)
    }
  }

  // Open role management modal for a single file
  const handleRoleManagement = (file: FileType, isGranting: boolean) => {
    setFileForRoleManagement(file)
    setIsMultiRoleManagement(false)
    setIsGrantingRole(isGranting)
    setIsRoleModalOpen(true)
  }

  // Open role management modal for multiple files
  const handleMultipleRoleManagement = (isGranting: boolean) => {
    if (selectedFiles.length === 0) return
    setIsMultiRoleManagement(true)
    setIsGrantingRole(isGranting)
    setIsRoleModalOpen(true)
  }

  // Process role management (grant or revoke)
  const handleRoleConfirm = async () => {
    setIsProcessingRole(true)

    try {
      const endpoint = isGrantingRole
        ? `${import.meta.env.VITE_BACKEND_URL}/api/drive/grant-access-role`
        : `${import.meta.env.VITE_BACKEND_URL}/api/drive/revoke-access-role`

      const fileIds = isMultiRoleManagement
        ? selectedFiles
        : fileForRoleManagement
          ? [fileForRoleManagement.id]
          : []

      if (fileIds.length === 0) {
        throw new Error('No files selected for role management')
      }

      let successCount = 0
      let failCount = 0

      // Process files sequentially
      for (const fileId of fileIds) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId, role: selectedRole }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
            const errorData = await response.json()
            console.error(
              `Role management error for file ${fileId}:`,
              errorData,
            )
          }
        } catch (error) {
          failCount++
          console.error(`Error processing role for file ${fileId}:`, error)
        }
      }

      // Show appropriate toast based on results
      const action = isGrantingRole ? 'granted' : 'revoked'
      const preposition = isGrantingRole ? 'to' : 'from'

      if (successCount > 0 && failCount === 0) {
        toast.success(
          `Successfully ${action} ${selectedRole} access ${preposition} ${successCount} file${successCount !== 1 ? 's' : ''}`,
          { position: 'top-center' },
        )
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `${action.charAt(0).toUpperCase() + action.slice(1)} ${selectedRole} access ${preposition} ${successCount} file${successCount !== 1 ? 's' : ''}, but failed for ${failCount} file${failCount !== 1 ? 's' : ''}`,
          { position: 'top-center' },
        )
      } else {
        toast.error(
          `Failed to ${action} ${selectedRole} access ${preposition} any files`,
          { position: 'top-center' },
        )
      }

      // Clear selection if it was a multi-file operation
      if (isMultiRoleManagement) {
        setSelectedFiles([])
        setIsSelectMode(false)
      }

      // Close the modal
      setIsRoleModalOpen(false)
    } catch (error) {
      console.error('Role management error:', error)
      toast.error(
        `An error occurred during the role management process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          position: 'top-center',
        },
      )
    } finally {
      setIsProcessingRole(false)
      setFileForRoleManagement(null)
    }
  }

  const handleDelete = (file: FileType) => {
    setFileToDelete(file)
    setIsDeleteModalOpen(true)
  }

  const handleMultipleDelete = () => {
    if (selectedFiles.length === 0) return
    setIsMultiDeleteModalOpen(true)
  }

  const handlePreview = (file: FileType) => {
    setPreviewFile(file)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectFile = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter((id) => id !== fileId))
    } else {
      setSelectedFiles([...selectedFiles, fileId])
    }
  }

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    if (isSelectMode) {
      setSelectedFiles([])
    }
  }

  const selectAllFiles = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map((file) => file.id))
    }
  }

  // Get file status display components
  const getFileStatusDisplay = (fileId: string) => {
    const isLoading = loadingStatuses.includes(fileId)
    const statusData = criteriaStatusCache[fileId]

    if (isLoading) {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-xs bg-muted/50"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Loading...</span>
        </Badge>
      )
    }

    if (!statusData) {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-xs bg-gray-100 text-gray-800"
        >
          <HelpCircle className="h-3 w-3" />
          <span>Unknown</span>
        </Badge>
      )
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1 text-xs cursor-pointer',
                getComplianceStatusColor(statusData.status),
              )}
              onClick={() => {
                const file = files.find((f) => f.id === fileId)
                if (file) handleStatusClick(file)
              }}
              onMouseEnter={() => handleStatusHover(fileId)}
              onMouseLeave={handleStatusHoverEnd}
            >
              {getComplianceStatusIcon(statusData.status)}
              <span className="capitalize">
                {statusData.status.replace('-', ' ')}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-medium">Criteria Status Summary:</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span>Total Criteria:</span>
                <span className="font-medium">{statusData.count.total}</span>

                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>{' '}
                  Compliant:
                </span>
                <span className="font-medium">{statusData.count.active}</span>

                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>{' '}
                  Non-compliant:
                </span>
                <span className="font-medium">{statusData.count.inactive}</span>

                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>{' '}
                  Pending:
                </span>
                <span className="font-medium">{statusData.count.pending}</span>
              </div>
              <div className="pt-1 text-center text-[10px] text-muted-foreground">
                Click for detailed view
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Get file access display component
  const getFileAccessDisplay = (file: FileType) => {
    if (!file.access) {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-xs bg-gray-100 text-gray-800"
        >
          <HelpCircle className="h-3 w-3" />
          <span>Unknown</span>
        </Badge>
      )
    }

    const { isPublic, totalPermissionsCount } = file.access

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1 text-xs cursor-pointer',
                isPublic
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800',
              )}
              onClick={() => handleShowAccessInfo(file)}
            >
              {isPublic ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              <span>{isPublic ? 'Public' : 'Private'}</span>
              {totalPermissionsCount > 0 && (
                <span className="ml-1 text-[10px] opacity-80">
                  ({totalPermissionsCount})
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-medium">Access Information:</p>
              <div className="flex items-center gap-1">
                <span>Status:</span>
                <span className="font-medium">
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Type:</span>
                <span className="font-medium">
                  {file.access.accessType || 'Standard'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Permissions:</span>
                <span className="font-medium">{totalPermissionsCount}</span>
              </div>
              <div className="pt-1 text-center text-[10px] text-muted-foreground">
                Click for detailed view
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Sort files based on current sort field and direction
  const sortedFiles = [...files].sort((a, b) => {
    let aValue, bValue

    switch (sortField) {
      case 'name':
        aValue = a.name?.toLowerCase() || ''
        bValue = b.name?.toLowerCase() || ''
        break
      case 'status':
        // Sort by compliance status
        const aStatus = criteriaStatusCache[a.id]?.status || 'unknown'
        const bStatus = criteriaStatusCache[b.id]?.status || 'unknown'

        // Define status priority for sorting
        const statusPriority: Record<FileStatusType, number> = {
          compliant: 1,
          partial: 2,
          pending: 3,
          'non-compliant': 4,
          unknown: 5,
        }

        aValue = statusPriority[aStatus]
        bValue = statusPriority[bStatus]
        break
      case 'date':
        aValue = a.createdTime || ''
        bValue = b.createdTime || ''
        break
      case 'access':
        // Sort by public/private status
        aValue = a.access?.isPublic ? 0 : 1
        bValue = b.access?.isPublic ? 0 : 1
        break
      case 'expiredBy':
        aValue = a.expiryDate ? new Date(a.expiryDate) : Infinity
        bValue = b.expiryDate ? new Date(b.expiryDate) : Infinity
        break
      default:
        aValue = a.name?.toLowerCase() || ''
        bValue = b.name?.toLowerCase() || ''
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Group files by type for the grid view
  const filesByType = sortedFiles.reduce(
    (acc, file) => {
      const type = file.mimeType.split('/')[0] || 'other'
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(file)
      return acc
    },
    {} as Record<string, FileType[]>,
  )

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading files...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">Error Loading Files</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-muted/50 rounded-full p-6 mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Files Found</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          There are no files available. Upload files to see them listed here.
        </p>
        <FileUploaderButton onFilesUploaded={fetchFiles} />
      </div>
    )
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    )
  }

  // Replace the handleTogglePublicStatus function with this version that shows a confirmation dialog
  const handleTogglePublicStatus = (file: FileType) => {
    setFileForAccessChange(file)
    setIsMultiAccessChange(false)
    setMakeFilesPublic(!file.access?.isPublic)
    setIsAccessConfirmOpen(true)
  }

  // Replace the handleMultipleTogglePublicStatus function with this version that shows a confirmation dialog
  const handleMultipleTogglePublicStatus = (makePublic: boolean) => {
    if (selectedFiles.length === 0) return

    setIsMultiAccessChange(true)
    setMakeFilesPublic(makePublic)
    setIsAccessConfirmOpen(true)
  }

  // Add a new function to process the access change after confirmation
  const processAccessChange = async () => {
    if (isMultiAccessChange) {
      await processMultipleAccessChange()
    } else if (fileForAccessChange) {
      await processSingleAccessChange()
    }

    setIsAccessConfirmOpen(false)
  }

  // Add a function to process a single file access change
  const processSingleAccessChange = async () => {
    if (!fileForAccessChange) return

    // Add file ID to loading state
    setIsTogglingPublic((prev) => [...prev, fileForAccessChange.id])

    try {
      const endpoint = makeFilesPublic
        ? `${import.meta.env.VITE_BACKEND_URL}/api/drive/make-public`
        : `${import.meta.env.VITE_BACKEND_URL}/api/drive/make-private`

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: fileForAccessChange.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update file access')
      }

      toast.success(`File is now ${makeFilesPublic ? 'public' : 'private'}`, {
        position: 'top-center',
      })

      // Refresh the file list
      if (fetchFiles) {
        fetchFiles()
      }
    } catch (error) {
      console.error('Error toggling file access:', error)
      toast.error(
        `Failed to change file access: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          position: 'top-center',
        },
      )
    } finally {
      // Remove file ID from loading state
      setIsTogglingPublic((prev) =>
        prev.filter((id) => id !== fileForAccessChange.id),
      )
      setFileForAccessChange(null)
    }
  }

  // Add a function to process multiple file access changes
  const processMultipleAccessChange = async () => {
    if (selectedFiles.length === 0) return

    // Add all selected files to loading state
    setIsTogglingPublic((prev) => [...prev, ...selectedFiles])

    try {
      const endpoint = makeFilesPublic
        ? `${import.meta.env.VITE_BACKEND_URL}/api/drive/make-public`
        : `${import.meta.env.VITE_BACKEND_URL}/api/drive/make-private`

      let successCount = 0
      let failCount = 0

      // Process files sequentially
      for (const fileId of selectedFiles) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
            const errorData = await response.json()
            console.error(
              `Failed to update access for file ${fileId}:`,
              errorData,
            )
          }
        } catch (error) {
          failCount++
          console.error(`Error processing access for file ${fileId}:`, error)
        }
      }

      // Show appropriate toast based on results
      if (successCount > 0 && failCount === 0) {
        toast.success(
          `Successfully made ${successCount} file${successCount !== 1 ? 's' : ''} ${makeFilesPublic ? 'public' : 'private'}`,
          { position: 'top-center' },
        )
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Made ${successCount} file${successCount !== 1 ? 's' : ''} ${makeFilesPublic ? 'public' : 'private'}, but failed for ${failCount} file${failCount !== 1 ? 's' : ''}`,
          { position: 'top-center' },
        )
      } else {
        toast.error(
          `Failed to make any files ${makeFilesPublic ? 'public' : 'private'}`,
          { position: 'top-center' },
        )
      }

      // Clear selection after operation
      setSelectedFiles([])
      setIsSelectMode(false)

      // Refresh the file list
      if (fetchFiles) {
        fetchFiles()
      }
    } catch (error) {
      console.error('Error in bulk access update:', error)
      toast.error(
        `An error occurred during the access update process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { position: 'top-center' },
      )
    } finally {
      // Remove all selected files from loading state
      setIsTogglingPublic((prev) =>
        prev.filter((id) => !selectedFiles.includes(id)),
      )
    }
  }

  // Update the column headers in the list view to include a dedicated "View Criteria" column
  // Replace the existing column headers with:
  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex justify-between items-center gap-2 mb-4">
          <div className="text-sm text-muted-foreground">
            Showing {sortedFiles.length} of {totalfiles} files
            <div>Per 10 Files</div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(isSelectMode && 'bg-muted')}
                    onClick={toggleSelectMode}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-1" />
                    {isSelectMode ? 'Cancel' : 'Select'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isSelectMode
                      ? 'Exit selection mode'
                      : 'Select multiple files'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(viewMode === 'list' && 'bg-muted')}
                    onClick={() => setViewMode('list')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>List view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(viewMode === 'grid' && 'bg-muted')}
                    onClick={() => setViewMode('grid')}
                  >
                    <div className="grid grid-cols-2 gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-sm bg-current" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-current" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-current" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-current" />
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grid view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Selection toolbar */}
        {isSelectMode && selectedFiles.length > 0 && (
          <div className="bg-muted/50 border rounded-lg p-2 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 pl-2">
              <span className="text-sm font-medium">
                {selectedFiles.length} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-1" />
                    Access
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleMultipleTogglePublicStatus(true)}
                  >
                    <Globe className="mr-2 h-4 w-4 text-amber-600" />
                    Make Public
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleMultipleTogglePublicStatus(false)}
                  >
                    <Lock className="mr-2 h-4 w-4 text-blue-600" />
                    Make Private
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleMultipleRoleManagement(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4 text-green-600" />
                    Grant Access
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleMultipleRoleManagement(false)}
                  >
                    <UserMinus className="mr-2 h-4 w-4 text-red-600" />
                    Revoke Access
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={handleMultipleDelete}
                disabled={isDeletingMultiple}
              >
                {isDeletingMultiple ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="border rounded-lg overflow-hidden shadow-sm">
            {/* Column Headers */}
            <div className="grid grid-cols-13 gap-4 p-3 bg-muted/50 border-b text-sm font-medium">
              {isSelectMode && (
                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-sm"
                    onClick={selectAllFiles}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded-sm border border-primary',
                        selectedFiles.length === sortedFiles.length &&
                          'bg-primary',
                      )}
                    />
                  </Button>
                </div>
              )}
              <div
                className={cn(
                  'flex items-center cursor-pointer',
                  isSelectMode ? 'col-span-3' : 'col-span-4',
                )}
                onClick={() => handleSort('name')}
              >
                <span className="flex items-center">
                  Name
                  <SortIcon field="name" />
                </span>
              </div>
              <div
                className="col-span-2 flex items-center cursor-pointer"
                onClick={() => handleSort('access')}
              >
                <span className="flex items-center">
                  Access
                  <SortIcon field="access" />
                </span>
              </div>
              <div
                className="col-span-2 flex items-center cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <span className="flex items-center">
                  Compliance Status
                  <SortIcon field="status" />
                </span>
              </div>
              <div
                className="col-span-2 flex items-center cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <span className="flex items-center">
                  Upload Date
                  <SortIcon field="date" />
                </span>
              </div>

              <div
                className="col-span-2 flex items-center cursor-pointer"
                onClick={() => handleSort('expiredBy')}
              >
                <span className="flex items-center">
                  Expiry Date
                  <SortIcon field="expiredBy" />
                </span>
              </div>
            </div>

            {/* File Rows */}
            <div className="divide-y">
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    'grid grid-cols-13 gap-4 p-3 items-center transition-colors',
                    selectedFiles.includes(file.id)
                      ? 'bg-primary/5'
                      : 'hover:bg-muted/50',
                  )}
                >
                  {isSelectMode && (
                    <div className="col-span-1 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-sm"
                        onClick={() => toggleSelectFile(file.id)}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 rounded-sm border border-primary',
                            selectedFiles.includes(file.id) && 'bg-primary',
                          )}
                        />
                      </Button>
                    </div>
                  )}

                  <div
                    className={cn(
                      'flex items-center gap-3 min-w-0',
                      isSelectMode ? 'col-span-3' : 'col-span-4',
                    )}
                  >
                    <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center">
                      {getFileIconByType(file.mimeType)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.name}</p>
                      {file.webViewLink ? (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View File
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {file.mimeType || 'Unknown type'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    {getFileAccessDisplay(file)}
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full hover:bg-muted"
                              onClick={() => handleTogglePublicStatus(file)}
                              disabled={isTogglingPublic.includes(file.id)}
                            >
                              {isTogglingPublic.includes(file.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : file.access?.isPublic ? (
                                <Lock className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Globe className="h-4 w-4 text-amber-600" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {file.access?.isPublic
                                ? 'Make Private'
                                : 'Make Public'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-muted"
                        onClick={() => handleShowAccessInfo(file)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="col-span-2">
                    {getFileStatusDisplay(file.id)}
                  </div>

                  <div className="col-span-2 text-xs text-muted-foreground">
                    {file.createdTime ? formatDate(file.createdTime) : ''}
                  </div>

                  <div className="col-span-2 text-xs text-muted-foreground">
                    {file.expiryDate
                      ? new Date(file.expiryDate).toLocaleDateString()
                      : 'N/A'}
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {onShowCriteriaModal && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs flex items-center gap-1.5 hover:bg-primary/10 transition-colors"
                              onClick={() => onShowCriteriaModal(file.id)}
                            >
                              <Eye className="h-4 w-4" />
                              {/* View Criteria */}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Criteria</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Files</TabsTrigger>
              {Object.keys(filesByType).map((type) => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedFiles.map((file) => (
                  <Card
                    key={file.id}
                    className={cn(
                      'overflow-hidden transition-all hover:shadow-md',
                      selectedFiles.includes(file.id) && 'ring-2 ring-primary',
                    )}
                  >
                    <div className="relative">
                      <div className="h-32 bg-muted flex items-center justify-center">
                        <div className="h-16 w-16">
                          {getFileIconByType(file.mimeType)}
                        </div>
                      </div>
                      {isSelectMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 left-2 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => toggleSelectFile(file.id)}
                        >
                          <div
                            className={cn(
                              'h-4 w-4 rounded-sm border border-primary',
                              selectedFiles.includes(file.id) && 'bg-primary',
                            )}
                          />
                        </Button>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {getFileAccessDisplay(file)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <h3 className="font-medium truncate text-sm">
                            {file.name}
                          </h3>
                          {onShowCriteriaModal && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-muted"
                                    onClick={() => onShowCriteriaModal(file.id)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Criteria</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <div className="flex">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => handleTogglePublicStatus(file)}
                                  disabled={isTogglingPublic.includes(file.id)}
                                >
                                  {isTogglingPublic.includes(file.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : file.access?.isPublic ? (
                                    <Lock className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Globe className="h-4 w-4 text-amber-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {file.access?.isPublic
                                    ? 'Make Private'
                                    : 'Make Public'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleShowAccessInfo(file)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {file.mimeType.startsWith('image/') && (
                                <DropdownMenuItem
                                  onClick={() => handlePreview(file)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Preview
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              {onShowCriteriaModal && (
                                <DropdownMenuItem
                                  onClick={() => onShowCriteriaModal(file.id!)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Criteria
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleStatusClick(file)}
                              >
                                <FileBarChart className="mr-2 h-4 w-4" />
                                View Status Details
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleShowAccessInfo(file)}
                              >
                                <Users className="mr-2 h-4 w-4 text-blue-600" />
                                Manage Access
                              </DropdownMenuItem>

                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <UserPlus className="mr-2 h-4 w-4 text-green-600" />
                                  Grant Access
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuRadioGroup
                                    value={selectedRole}
                                    onValueChange={(value) =>
                                      setSelectedRole(value as RoleType)
                                    }
                                  >
                                    <DropdownMenuRadioItem
                                      value="Administrator"
                                      onClick={() =>
                                        handleRoleManagement(file, true)
                                      }
                                    >
                                      <Shield className="mr-2 h-4 w-4" />
                                      Administrator
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                      value="Contributor"
                                      onClick={() =>
                                        handleRoleManagement(file, true)
                                      }
                                    >
                                      <Edit3 className="mr-2 h-4 w-4" />
                                      Contributor
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                      value="Auditor"
                                      onClick={() =>
                                        handleRoleManagement(file, true)
                                      }
                                    />
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Auditor
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>

                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <UserMinus className="mr-2 h-4 w-4 text-red-600" />
                                  Revoke Access
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuRadioGroup
                                    value={selectedRole}
                                    onValueChange={(value) =>
                                      setSelectedRole(value as RoleType)
                                    }
                                  >
                                    <DropdownMenuRadioItem
                                      value="Administrator"
                                      onClick={() =>
                                        handleRoleManagement(file, false)
                                      }
                                    >
                                      <Shield className="mr-2 h-4 w-4" />
                                      Administrator
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                      value="Contributor"
                                      onClick={() =>
                                        handleRoleManagement(file, false)
                                      }
                                    >
                                      <Edit3 className="mr-2 h-4 w-4" />
                                      Contributor
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                      value="Auditor"
                                      onClick={() =>
                                        handleRoleManagement(file, false)
                                      }
                                    />
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Auditor
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(file)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {file.createdTime ? formatDate(file.createdTime) : ''}
                        </div>
                        <div>{getFileStatusDisplay(file.id)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {Object.entries(filesByType).map(([type, typeFiles]) => (
              <TabsContent key={type} value={type} className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {typeFiles.map((file) => (
                    <Card
                      key={file.id}
                      className={cn(
                        'overflow-hidden transition-all hover:shadow-md',
                        selectedFiles.includes(file.id) &&
                          'ring-2 ring-primary',
                      )}
                    >
                      <div className="relative">
                        <div className="h-32 bg-muted flex items-center justify-center">
                          <div className="h-16 w-16">
                            {getFileIconByType(file.mimeType)}
                          </div>
                        </div>
                        {isSelectMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 left-2 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm"
                            onClick={() => toggleSelectFile(file.id)}
                          >
                            <div
                              className={cn(
                                'h-4 w-4 rounded-sm border border-primary',
                                selectedFiles.includes(file.id) && 'bg-primary',
                              )}
                            />
                          </Button>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {getFileAccessDisplay(file)}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <h3 className="font-medium truncate text-sm">
                              {file.name}
                            </h3>
                            {onShowCriteriaModal && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-full hover:bg-muted"
                                      onClick={() =>
                                        onShowCriteriaModal(file.id)
                                      }
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Criteria</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() =>
                                      handleTogglePublicStatus(file)
                                    }
                                    disabled={isTogglingPublic.includes(
                                      file.id,
                                    )}
                                  >
                                    {isTogglingPublic.includes(file.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : file.access?.isPublic ? (
                                      <Lock className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Globe className="h-4 w-4 text-amber-600" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {file.access?.isPublic
                                      ? 'Make Private'
                                      : 'Make Public'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => handleShowAccessInfo(file)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {file.mimeType.startsWith('image/') && (
                                  <DropdownMenuItem
                                    onClick={() => handlePreview(file)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                {onShowCriteriaModal && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onShowCriteriaModal(file.id!)
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Criteria
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleStatusClick(file)}
                                >
                                  <FileBarChart className="mr-2 h-4 w-4" />
                                  View Status Details
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleShowAccessInfo(file)}
                                >
                                  <Users className="mr-2 h-4 w-4 text-blue-600" />
                                  Manage Access
                                </DropdownMenuItem>

                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <UserPlus className="mr-2 h-4 w-4 text-green-600" />
                                    Grant Access
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                      value={selectedRole}
                                      onValueChange={(value) =>
                                        setSelectedRole(value as RoleType)
                                      }
                                    >
                                      <DropdownMenuRadioItem
                                        value="Administrator"
                                        onClick={() =>
                                          handleRoleManagement(file, true)
                                        }
                                      >
                                        <Shield className="mr-2 h-4 w-4" />
                                        Administrator
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem
                                        value="Contributor"
                                        onClick={() =>
                                          handleRoleManagement(file, true)
                                        }
                                      >
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Contributor
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem
                                        value="Auditor"
                                        onClick={() =>
                                          handleRoleManagement(file, true)
                                        }
                                      />
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Auditor
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <UserMinus className="mr-2 h-4 w-4 text-red-600" />
                                    Revoke Access
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                      value={selectedRole}
                                      onValueChange={(value) =>
                                        setSelectedRole(value as RoleType)
                                      }
                                    >
                                      <DropdownMenuRadioItem
                                        value="Administrator"
                                        onClick={() =>
                                          handleRoleManagement(file, false)
                                        }
                                      >
                                        <Shield className="mr-2 h-4 w-4" />
                                        Administrator
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem
                                        value="Contributor"
                                        onClick={() =>
                                          handleRoleManagement(file, false)
                                        }
                                      >
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Contributor
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem
                                        value="Auditor"
                                        onClick={() =>
                                          handleRoleManagement(file, false)
                                        }
                                      />
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Auditor
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleDelete(file)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            {file.createdTime
                              ? formatDate(file.createdTime)
                              : ''}
                          </div>
                          <div>{getFileStatusDisplay(file.id)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={previewFile !== null}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      >
        <DialogContent className="sm:max-w-xl" aria-describedby="preview file">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-6 w-6">
                {previewFile && getFileIconByType(previewFile.mimeType)}
              </div>
              <span className="truncate">{previewFile?.name}</span>
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          {previewFile?.mimeType.startsWith('image/') && (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted/50">
              <img
                src={previewFile.webContentLink || '/placeholder.svg'}
                alt={previewFile.name}
                className="object-contain w-full h-full"
              />
            </div>
          )}
          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {previewFile?.createdTime && (
                <span>
                  Uploaded on{' '}
                  {new Date(previewFile.createdTime).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    },
                  )}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              {previewFile?.id && onShowCriteriaModal && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPreviewFile(null)
                    onShowCriteriaModal(previewFile.id)
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Criteria
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Info Modal */}
      <Dialog
        open={isAccessInfoModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAccessInfoModalOpen(false)
            setSelectedAccessFile(null)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-xl max-h-[85vh]"
          aria-describedby="access info"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Access Information</span>
            </DialogTitle>
            <DialogDescription>
              {selectedAccessFile?.name && (
                <span className="font-medium">{selectedAccessFile.name}</span>
              )}
            </DialogDescription>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <div
            className="overflow-y-auto pr-6"
            style={{ maxHeight: 'calc(85vh - 180px)' }}
          >
            {selectedAccessFile && (
              <div className="space-y-6">
                {/* Access Summary */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        'px-3 py-1.5 text-sm',
                        selectedAccessFile.access?.isPublic
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800',
                      )}
                    >
                      {selectedAccessFile.access?.isPublic ? (
                        <Globe className="h-4 w-4 mr-1" />
                      ) : (
                        <Lock className="h-4 w-4 mr-1" />
                      )}
                      <span>
                        {selectedAccessFile.access?.isPublic
                          ? 'Public'
                          : 'Private'}
                      </span>
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1.5 text-sm">
                      <span>
                        Type:{' '}
                        {selectedAccessFile.access?.accessType || 'Standard'}
                      </span>
                    </Badge>
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="text-sm font-medium mb-3">Access Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedAccessFile.access?.totalPermissionsCount ||
                            0}{' '}
                          total permissions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedAccessFile.access?.emailsWithAccess
                            ?.length || 0}{' '}
                          users with access
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Users with Access */}
                <div>
                  <h3 className="text-base font-medium mb-3">
                    Users with Access
                  </h3>

                  {selectedAccessFile.access?.emailsWithAccess?.length ? (
                    <div className="space-y-3">
                      {selectedAccessFile.access.emailsWithAccess.map(
                        (user, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {user.email.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {user.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {getRoleIcon(user.role)}
                                  <span className="ml-1">{user.role}</span>
                                </p>
                              </div>
                            </div>
                            {/* <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedRole(user.role as RoleType)
                              handleRoleManagement(selectedAccessFile, false)
                              setIsAccessInfoModalOpen(false)
                            }}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Revoke
                          </Button> */}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/20">
                      <User className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="font-medium text-lg">No Users</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        No individual users have been granted access to this
                        file.
                      </p>
                    </div>
                  )}
                </div>

                {/* Add User Section */}
                <div className="border-t pt-4">
                  <Button
                    onClick={() => {
                      setIsGrantingRole(true)
                      handleRoleManagement(selectedAccessFile, true)
                      setIsAccessInfoModalOpen(false)
                    }}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAccessInfoModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Details Modal */}
      <Dialog
        open={isStatusModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsStatusModalOpen(false)
            setSelectedStatusFile(null)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-3xl max-h-[85vh]"
          aria-describedby="status details"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-primary" />
              <span>Compliance Status Details</span>
            </DialogTitle>
            <DialogDescription>
              {selectedStatusFile?.name && (
                <span className="font-medium">{selectedStatusFile.name}</span>
              )}
            </DialogDescription>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <div
            className="overflow-y-auto pr-6"
            style={{ maxHeight: 'calc(85vh - 180px)' }}
          >
            {selectedStatusFile && (
              <>
                {/* Status Summary Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Status Summary</h3>

                  {loadingStatuses.includes(selectedStatusFile.id) ||
                  isRefreshingStatus ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Loading status data...
                      </p>
                    </div>
                  ) : (
                    <>
                      {criteriaStatusCache[selectedStatusFile.id] ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Badge
                              className={cn(
                                'px-3 py-1.5 text-sm',
                                getComplianceStatusColor(
                                  criteriaStatusCache[selectedStatusFile.id]
                                    .status,
                                ),
                              )}
                            >
                              {getComplianceStatusIcon(
                                criteriaStatusCache[selectedStatusFile.id]
                                  .status,
                              )}
                              <span className="ml-1 capitalize">
                                {criteriaStatusCache[
                                  selectedStatusFile.id
                                ].status.replace('-', ' ')}
                              </span>
                            </Badge>

                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-auto"
                              onClick={handleRefreshStatus}
                              disabled={isRefreshingStatus}
                            >
                              <RefreshCw
                                className={cn(
                                  'h-4 w-4 mr-1',
                                  isRefreshingStatus && 'animate-spin',
                                )}
                              />
                              Refresh
                            </Button>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="border rounded-lg p-4 bg-muted/20 text-center">
                              <div className="text-2xl font-bold">
                                {
                                  criteriaStatusCache[selectedStatusFile.id]
                                    .count.total
                                }
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total Criteria
                              </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-green-50 text-center">
                              <div className="text-2xl font-bold text-green-700">
                                {
                                  criteriaStatusCache[selectedStatusFile.id]
                                    .count.active
                                }
                              </div>
                              <div className="text-sm text-green-700">
                                Compliant
                              </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-red-50 text-center">
                              <div className="text-2xl font-bold text-red-700">
                                {
                                  criteriaStatusCache[selectedStatusFile.id]
                                    .count.inactive
                                }
                              </div>
                              <div className="text-sm text-red-700">
                                Non-compliant
                              </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-yellow-50 text-center">
                              <div className="text-2xl font-bold text-yellow-700">
                                {
                                  criteriaStatusCache[selectedStatusFile.id]
                                    .count.pending
                                }
                              </div>
                              <div className="text-sm text-yellow-700">
                                Pending
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Compliance Progress</span>
                              <span className="font-medium">
                                {criteriaStatusCache[selectedStatusFile.id]
                                  .count.total > 0
                                  ? Math.round(
                                      (criteriaStatusCache[
                                        selectedStatusFile.id
                                      ].count.active /
                                        criteriaStatusCache[
                                          selectedStatusFile.id
                                        ].count.total) *
                                        100,
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                criteriaStatusCache[selectedStatusFile.id].count
                                  .total > 0
                                  ? (criteriaStatusCache[selectedStatusFile.id]
                                      .count.active /
                                      criteriaStatusCache[selectedStatusFile.id]
                                        .count.total) *
                                    100
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <HelpCircle className="h-10 w-10 text-muted-foreground mb-3" />
                          <h3 className="font-medium text-lg">
                            No Status Data
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                            No compliance status data is available for this
                            file.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={handleRefreshStatus}
                            disabled={isRefreshingStatus}
                          >
                            <RefreshCw
                              className={cn(
                                'h-4 w-4 mr-1',
                                isRefreshingStatus && 'animate-spin',
                              )}
                            />
                            Refresh Data
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Detailed Criteria List */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Criteria Details</h3>

                  {loadingStatuses.includes(selectedStatusFile.id) ||
                  isRefreshingStatus ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Loading criteria data...
                      </p>
                    </div>
                  ) : (
                    <>
                      {criteriaStatusCache[selectedStatusFile.id]?.criteriaData
                        ?.length ? (
                        <div className="space-y-6">
                          {/* Group criteria by compliance name */}
                          {(() => {
                            // Group criteria by compliance name
                            const criteriaByCompliance: Record<
                              string,
                              CriteriaData[]
                            > = {}
                            criteriaStatusCache[
                              selectedStatusFile.id
                            ].criteriaData?.forEach((criteria) => {
                              const complianceName =
                                criteria.compliance_name || 'Uncategorized'
                              if (!criteriaByCompliance[complianceName]) {
                                criteriaByCompliance[complianceName] = []
                              }
                              criteriaByCompliance[complianceName].push(
                                criteria,
                              )
                            })

                            // Render each compliance group
                            return Object.entries(criteriaByCompliance).map(
                              ([complianceName, criteriaGroup]) => (
                                <div key={complianceName} className="space-y-3">
                                  <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border-l-4 border-primary">
                                    <FileBarChart className="h-5 w-5 text-primary" />
                                    <h4 className="font-medium text-base">
                                      {complianceName}
                                    </h4>
                                    <Badge variant="outline" className="ml-2">
                                      {criteriaGroup.length}{' '}
                                      {criteriaGroup.length === 1
                                        ? 'criterion'
                                        : 'criteria'}
                                    </Badge>
                                  </div>

                                  <div className="pl-2 space-y-3">
                                    {criteriaGroup.map((criteria) => (
                                      <div
                                        key={criteria.id}
                                        className="border rounded-lg overflow-hidden shadow-sm"
                                      >
                                        <div
                                          className={cn(
                                            'px-4 py-3 flex items-center justify-between',
                                            getCriteriaStatusBgColor(
                                              criteria.status,
                                            ),
                                          )}
                                        >
                                          <h4 className="font-medium">
                                            {criteria.name}
                                          </h4>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              'capitalize',
                                              getStatusColor(criteria.status),
                                            )}
                                          >
                                            {getStatusIcon(criteria.status)}
                                            <span className="ml-1">
                                              {criteria.status || 'Unknown'}
                                            </span>
                                          </Badge>
                                        </div>

                                        <div className="p-4 bg-white">
                                          {criteria.description && (
                                            <p className="text-sm text-muted-foreground mb-3">
                                              {criteria.description}
                                            </p>
                                          )}

                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            {criteria.prefix && (
                                              <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">
                                                  Prefix :
                                                </span>
                                                <span className="font-medium">
                                                  {criteria.prefix}
                                                </span>
                                              </div>
                                            )}

                                            {criteria.compliance_id && (
                                              <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">
                                                  Compliance ID:
                                                </span>
                                                <span className="font-medium">
                                                  {criteria.compliance_id}
                                                </span>
                                              </div>
                                            )}

                                            {criteria.created_at && (
                                              <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">
                                                  Created:
                                                </span>
                                                <span className="font-medium">
                                                  {new Date(
                                                    criteria.created_at,
                                                  ).toLocaleDateString()}
                                                </span>
                                              </div>
                                            )}

                                            {criteria.pic_id && (
                                              <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">
                                                  PIC ID:
                                                </span>
                                                <span className="font-medium">
                                                  {criteria.pic_id}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ),
                            )
                          })()}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Info className="h-10 w-10 text-muted-foreground mb-3" />
                          <h3 className="font-medium text-lg">
                            No Criteria Found
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                            This file doesn't have any associated criteria yet.
                          </p>
                          {onShowCriteriaModal && selectedStatusFile && (
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() => {
                                setIsStatusModalOpen(false)
                                onShowCriteriaModal(selectedStatusFile.id)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Manage Criteria
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Close
            </Button>
            {onShowCriteriaModal && selectedStatusFile && (
              <Button
                onClick={() => {
                  setIsStatusModalOpen(false)
                  onShowCriteriaModal(selectedStatusFile.id)
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Full Criteria
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Modal */}
      <Dialog
        open={isRoleModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRoleModalOpen(false)
            setFileForRoleManagement(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isGrantingRole ? (
                <UserPlus className="h-5 w-5 text-green-600" />
              ) : (
                <UserMinus className="h-5 w-5 text-red-600" />
              )}
              <span>{isGrantingRole ? 'Grant Access' : 'Revoke Access'}</span>
            </DialogTitle>
            <DialogDescription>
              {isMultiRoleManagement ? (
                <span>
                  {isGrantingRole ? 'Grant' : 'Revoke'} access for{' '}
                  {selectedFiles.length} selected file
                  {selectedFiles.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  {isGrantingRole ? 'Grant' : 'Revoke'} access for{' '}
                  <span className="font-medium">
                    {fileForRoleManagement?.name}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Select Role:</h4>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as RoleType)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="Administrator" id="administrator" />
                    <Label
                      htmlFor="administrator"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="font-medium">Administrator</span>
                        <p className="text-xs text-muted-foreground">
                          Full access to manage the file
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="Contributor" id="contributor" />
                    <Label
                      htmlFor="contributor"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4 text-green-600" />
                      <div>
                        <span className="font-medium">Contributor</span>
                        <p className="text-xs text-muted-foreground">
                          Can edit and update the file
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="Auditor" id="auditor" />
                    <Label
                      htmlFor="auditor"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="h-4 w-4 text-amber-600" />
                      <div>
                        <span className="font-medium">Auditor</span>
                        <p className="text-xs text-muted-foreground">
                          View-only access to the file
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isMultiRoleManagement && (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                  <div className="max-h-[120px] overflow-y-auto pr-2">
                    {selectedFiles.map((fileId) => {
                      const file = files.find((f) => f.id === fileId)
                      if (!file) return null

                      return (
                        <div
                          key={fileId}
                          className="flex items-center gap-2 py-1.5 border-b last:border-b-0"
                        >
                          <div className="h-5 w-5 shrink-0">
                            {getFileIconByType(file.mimeType)}
                          </div>
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsRoleModalOpen(false)}
              disabled={isProcessingRole}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleConfirm}
              disabled={isProcessingRole}
              variant={isGrantingRole ? 'default' : 'destructive'}
            >
              {isProcessingRole ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isGrantingRole ? (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Grant Access
                    </>
                  ) : (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Revoke Access
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
            <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center">
              {fileToDelete && getFileIconByType(fileToDelete.mimeType)}
            </div>
            <div>
              <p className="font-medium">{fileToDelete?.name}</p>
              <p className="text-xs text-muted-foreground">
                {fileToDelete?.createdTime
                  ? formatDate(fileToDelete.createdTime)
                  : ''}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multiple Delete Confirmation Dialog */}
      <Dialog
        open={isMultiDeleteModalOpen}
        onOpenChange={setIsMultiDeleteModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Multiple Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedFiles.length} selected
              file
              {selectedFiles.length !== 1 ? 's' : ''}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2">
            {selectedFiles.map((fileId) => {
              const file = files.find((f) => f.id === fileId)
              if (!file) return null

              return (
                <div
                  key={fileId}
                  className="flex items-center gap-2 p-2 border-b last:border-b-0"
                >
                  <div className="h-6 w-6 shrink-0 rounded-md bg-muted flex items-center justify-center">
                    {getFileIconByType(file.mimeType)}
                  </div>
                  <span className="text-sm truncate flex-1">{file.name}</span>
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsMultiDeleteModalOpen(false)}
              disabled={isDeletingMultiple}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMultipleDeleteConfirm}
              disabled={isDeletingMultiple}
            >
              {isDeletingMultiple ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Change Confirmation Dialog */}
      <Dialog open={isAccessConfirmOpen} onOpenChange={setIsAccessConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Access Change</DialogTitle>
            <DialogDescription>
              {isMultiAccessChange ? (
                <span>
                  Are you sure you want to make {selectedFiles.length} selected
                  file
                  {selectedFiles.length !== 1 ? 's' : ''}{' '}
                  {makeFilesPublic ? 'public' : 'private'}?
                </span>
              ) : (
                <span>
                  Are you sure you want to make{' '}
                  <span className="font-medium">
                    {fileForAccessChange?.name}
                  </span>{' '}
                  {makeFilesPublic ? 'public' : 'private'}?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {makeFilesPublic && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">
                    Making files public
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Public files can be accessed by anyone with the link. Only
                    make files public if you intend to share them widely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isMultiAccessChange && (
            <div className="max-h-[150px] overflow-y-auto border rounded-lg p-2 my-4">
              {selectedFiles.map((fileId) => {
                const file = files.find((f) => f.id === fileId)
                if (!file) return null

                return (
                  <div
                    key={fileId}
                    className="flex items-center gap-2 p-2 border-b last:border-b-0"
                  >
                    <div className="h-6 w-6 shrink-0 rounded-md bg-muted flex items-center justify-center">
                      {getFileIconByType(file.mimeType)}
                    </div>
                    <span className="text-sm truncate flex-1">{file.name}</span>
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsAccessConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={processAccessChange}
              variant={makeFilesPublic ? 'default' : 'secondary'}
            >
              {makeFilesPublic ? (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Make {isMultiAccessChange ? 'Files' : 'File'} Public
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Make {isMultiAccessChange ? 'Files' : 'File'} Private
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helper functions for status and certificate styling
function getStatusIcon(status?: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'completed':
      return <CheckCircle className="h-3 w-3 text-green-500" />
    case 'inactive':
    case 'rejected':
    case 'failed':
      return <XCircle className="h-3 w-3 text-red-500" />
    case 'pending':
    case 'in progress':
    case 'review':
      return <Clock className="h-3 w-3 text-yellow-500" />
    default:
      return null
  }
}

function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'inactive':
    case 'rejected':
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'pending':
    case 'in progress':
    case 'review':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getCriteriaStatusBgColor(status?: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'completed':
      return 'bg-green-50'
    case 'inactive':
    case 'rejected':
      return 'bg-red-50'
    case 'failed':
    case 'pending':
    case 'in progress':
    case 'review':
      return 'bg-yellow-50'
    default:
      return 'bg-gray-50'
  }
}

// Helper functions for compliance status styling
function getComplianceStatusIcon(status: FileStatusType) {
  switch (status) {
    case 'compliant':
      return <ShieldCheck className="h-3 w-3 text-green-500" />
    case 'non-compliant':
      return <ShieldX className="h-3 w-3 text-red-500" />
    case 'partial':
      return <ShieldCheck className="h-3 w-3 text-yellow-500" />
    case 'pending':
      return <Clock className="h-3 w-3 text-blue-500" />
    case 'unknown':
    default:
      return <ShieldQuestion className="h-3 w-3 text-gray-500" />
  }
}

function getComplianceStatusColor(status: FileStatusType) {
  switch (status) {
    case 'compliant':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'non-compliant':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'pending':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'unknown':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
  }
}

// Helper function to get role icon
function getRoleIcon(role: string) {
  switch (role) {
    case 'Administrator':
      return <Shield className="h-3 w-3 text-blue-600 inline-block mr-1" />
    case 'Contributor':
      return <Edit3 className="h-3 w-3 text-green-600 inline-block mr-1" />
    case 'Auditor':
      return <UserCheck className="h-3 w-3 text-amber-600 inline-block mr-1" />
    default:
      return <User className="h-3 w-3 text-gray-600 inline-block mr-1" />
  }
}

function formatDate(dateString: string): React.ReactNode {
  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return <>❌ Unknown</>
    }

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const timeString = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    if (date.toDateString() === today.toDateString()) {
      return (
        <>
          <span className="">Today</span>
          <br />
          {timeString}
        </>
      )
    } else if (date.toDateString() === yesterday.toDateString()) {
      return (
        <>
          <span className="">Yesterday</span>
          <br />
          {timeString}
        </>
      )
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return (
        <>
          <span className="">
            {date.toLocaleDateString('id-ID', { weekday: 'long' })}
          </span>
          <br />
          {timeString}
        </>
      )
    } else {
      return (
        <>
          {date.toLocaleDateString('id-ID', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          <br />
          {timeString}
        </>
      )
    }
  } catch (error) {
    return <> Unknown</>
  }
}
