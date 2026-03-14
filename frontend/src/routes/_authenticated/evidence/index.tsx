'use client'

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { FileList } from '@/components/evidence/file-list'
import { SearchAndFilter } from '@/components/evidence/search'
import type { FileType } from '@/types/evidence-types'
import type { CriteriaData } from '@/types/evidence-types'
import { TagIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TagModal } from '@/components/tags/tag-modal'
import { CreateTagModal } from '@/components/tags/createtag-modal'
import { FileUploaderButton } from '@/components/evidence/file-uploader-button'
import { EvidenceCriteriaModal } from '@/components/evidence/evidencecriteria-modal'
import { useUserStore } from '@/stores/user-store'

export const Route = createFileRoute('/_authenticated/evidence/')({
  beforeLoad: () => {
    const user = useUserStore.getState().getStoredUser()

    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: window.location.href,
        },
      })
    }

    if (user.role === 'Auditor') {
      throw redirect({
        to: '/dashboard',
      })
    }
  },

  component: RouteComponent,
})
function RouteComponent() {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  )

  // File state
  const [files, setFiles] = useState<FileType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [criteriaData, setCriteriaData] = useState<CriteriaData[] | null>(null)
  const [fileTypeFilter, setFileTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false)
  const [certificateFilter, setCertificateFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Fetch evidences with pagination
  const fetchFiles = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setIsInitialLoad(true)
    }

    setError(null)

    try {
      const { startDate, endDate } = getDateRange(timeFilter)
      const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/api/drive/view`)

      // Add query parameters
      if (searchQuery) url.searchParams.append('query', searchQuery)
      if (startDate) url.searchParams.append('startDate', startDate)
      if (endDate) url.searchParams.append('endDate', endDate)
      if (fileTypeFilter !== 'all') {
        url.searchParams.append('mimeType', fileTypeFilter)
      }

      // Add pagination parameters
      url.searchParams.append('pageSize', '10')
      if (loadMore && nextPageToken) {
        url.searchParams.append('pageToken', nextPageToken)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch files.')

      const data = await response.json()

      // Handle the updated response format with pagination metadata
      const filesList = Array.isArray(data) ? data : data.files || []
      // console.log('Fetched files:', filesList)

      // Update pagination state if the response includes pagination metadata
      if (!Array.isArray(data) && 'nextPageToken' in data) {
        setNextPageToken(data.nextPageToken)
        setHasNextPage(data.hasNextPage || false)
        setTotalCount(data.totalCount || filesList.length)
      } else {
        setNextPageToken(null)
        setHasNextPage(false)
        setTotalCount(filesList.length)
      }

      // If loading more, append to existing files, otherwise replace
      if (loadMore) {
        setFiles((prevFiles) => [...prevFiles, ...filesList])
      } else {
        setFiles(filesList)
      }

      setIsInitialLoad(false)
    } catch (err) {
      setError('Failed to load files.')
      console.error('Error fetching files:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load more files when user clicks "Load More"
  const handleLoadMore = () => {
    if (hasNextPage && nextPageToken) {
      fetchFiles(true)
    }
  }

  useEffect(() => {
    // Reset pagination when search or filters change
    setNextPageToken(null)
    setHasNextPage(false)
    fetchFiles()
  }, [searchQuery, timeFilter, fileTypeFilter])

  const fetchCriteriaByEvidence = async (evidenceId: string) => {
    try {
      setSelectedEvidenceId(evidenceId)
      const url = new URL(
        `${import.meta.env.VITE_BACKEND_URL}/api/evidence/criteria-by-evidence/${evidenceId}`,
      )
      const res = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok)
        throw new Error(`Failed to fetch criteria, status: ${res.status}`)

      const response: { success: boolean; data: CriteriaData[] } =
        await res.json()

      setCriteriaData(response.data || [])
      setIsCriteriaModalOpen(true)
    } catch (err) {
      console.error('Error fetching criteria:', err)
      setCriteriaData([])
    }
  }

  const getDateRange = (filter: string) => {
    const today = new Date()
    let startDate = ''
    let endDate = ''

    if (filter === 'today') {
      startDate = today.toISOString().split('T')[0]
      endDate = startDate
    } else if (filter === 'this-week') {
      const firstDayOfWeek = new Date(today)
      firstDayOfWeek.setDate(today.getDate() - today.getDay())

      startDate = firstDayOfWeek.toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
    } else if (filter === 'this-month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      startDate = firstDayOfMonth.toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
    } else if (filter === 'older') {
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      endDate = thirtyDaysAgo.toISOString().split('T')[0]
    }

    return { startDate, endDate }
  }

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name && file.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFileType =
      fileTypeFilter === 'all' || file.mimeType.startsWith(fileTypeFilter)

    return matchesSearch && matchesFileType
  })

  return (
    <>
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold">Evidence</h1>
        <div className="ml-auto flex space-x-2">
          <Button onClick={() => setIsCreateTagModalOpen(true)}>
            Create Tag
          </Button>
          <Button onClick={() => setIsTagModalOpen(true)}>
            <TagIcon className="h-4 w-4 mr-2" />
            Tag List
          </Button>
          <FileUploaderButton onFilesUploaded={() => fetchFiles(false)} />
        </div>
      </div>

      <div className="grid gap-4">
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          fileTypeFilter={fileTypeFilter}
          onFileTypeChange={setFileTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          certificateFilter={certificateFilter}
          onCertificateChange={setCertificateFilter}
          timeFilter={timeFilter}
          onTimeChange={setTimeFilter}
        />

        <FileList
          files={filteredFiles}
          loading={loading && isInitialLoad}
          error={error}
          onDelete={deleteFile}
          onShowCriteriaModal={fetchCriteriaByEvidence}
          fetchFiles={() => fetchFiles(false)}
          totalfiles={totalCount}
        />

        {/* Load More Button */}
        {hasNextPage && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outline"
              className="min-w-[150px]"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {/* Pagination Summary */}
        {/* {!loading && !error && files.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            Showing {files.length} of {totalCount} files
            {hasNextPage ? " (scroll down to load more)" : ""}
          </div>
        )} */}
      </div>

      {isCriteriaModalOpen && selectedEvidenceId && (
        <EvidenceCriteriaModal
          isOpen={isCriteriaModalOpen}
          criteria={criteriaData}
          onClose={() => {
            setCriteriaData(null)
            setIsCriteriaModalOpen(false)
            setSelectedEvidenceId(null)
          }}
          evidence_id={selectedEvidenceId}
          onRequestRefreshCriteria={() => {
            if (selectedEvidenceId) fetchCriteriaByEvidence(selectedEvidenceId)
          }}
        />
      )}
      {isTagModalOpen && (
        <TagModal
          open={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
        />
      )}
      {isCreateTagModalOpen && (
        <CreateTagModal
          open={isCreateTagModalOpen}
          onOpenChange={setIsCreateTagModalOpen}
        />
      )}
    </>
  )
}
