'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Search,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Link2,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getFileIcon } from '@/lib/file-utils'
import type { SimpleFileType } from '@/types/evidence-types'
import { toast } from 'sonner'
import type { EvidenceFile } from '@/types/compliance-types'
import { Description } from '@radix-ui/react-dialog'

// Add Vite env type
declare global {
  interface ImportMeta {
    env: Record<string, string>
  }
}

interface AssignEvidenceCriteriaButtonProps {
  criteriaId: number | string
  buttonText?: string
  buttonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  buttonIcon?: boolean
  className?: string
  onSuccess?: (file: EvidenceFile) => void
}

export function AssignEvidenceCriteriaButton({
  criteriaId,
  buttonText = 'Assign Evidence',
  buttonVariant = 'default',
  buttonSize = 'default',
  buttonIcon = true,
  className,
  onSuccess,
}: AssignEvidenceCriteriaButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [files, setFiles] = useState<SimpleFileType[]>([])
  const [filteredFiles, setFilteredFiles] = useState<SimpleFileType[]>([])
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [assigning, setAssigning] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchFiles()
    } else {
      // Reset state when modal closes
      resetState()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFiles(files)
      return
    }

    if (!Array.isArray(files)) {
      console.error('Files is not an array', files)
      return
    }

    const filtered = files.filter(
      (file) =>
        file.file_name &&
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    setFilteredFiles(filtered)
  }, [searchQuery, files])

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/api/evidence`)

      const response = await fetch(url.toString(), {
        credentials: 'include',
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }

      const responseData = await response.json()
      // console.log(responseData)

      // Check if the response data is an array or has a data property
      let filesData: SimpleFileType[] = []
      if (Array.isArray(responseData)) {
        filesData = responseData
      } else if (responseData && typeof responseData === 'object') {
        // Try to extract data from common API response structures
        filesData =
          responseData.data || responseData.files || responseData.items || []
      }

      setFiles(filesData)
      setFilteredFiles(filesData)
    } catch (error) {
      console.error('Error fetching files:', error)
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelection = (fileId: number) => {
    setSelectedFileId(fileId === selectedFileId ? null : fileId)
  }

  const handleAssign = async () => {
    if (!selectedFileId) return

    try {
      setAssigning(true)
      setError(null)

      const selectedFile = files.find((file) => file.id === selectedFileId)
      if (!selectedFile) {
        throw new Error('Selected file not found')
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/evidence/e-criteria/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            drive_file_id: selectedFile.drive_file_id,
            criteria_id: criteriaId,
          }),
        },
      )

      const data = await res.json()

      // console.log('Assign Evidence Response:', data)

      if (!res.ok || !data.success) {
        // Extract error message from response if available
        const errorMessage =
          data.message || data.error || 'Failed to assign evidence to criteria'
        setError(errorMessage)
        setAssigning(false)
        return
      }

      setSuccess(true)
      setAssigning(false) // Make sure to reset assigning state

      // Show success message
      toast.success(
        'The evidence has been successfully assigned to the criteria',
        {
          position: 'top-center',
        },
      )

      // Show success state briefly before closing
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            id: data.evidence.id,
            url: data.evidence.file_path,
            name: data.evidence.file_name,
            uploadedAt: data.evidence.uploaded_at,
            uploadedBy: data.evidence.uploaded_by,
            expiryDate: data.evidence.expired_by,
          } as EvidenceFile)
        }
        closeModal()
      }, 200)
    } catch (error) {
      console.error('Error assigning evidence to criteria:', error)
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      )
      setAssigning(false)
    }
  }

  const resetState = () => {
    setSelectedFileId(null)
    setSearchQuery('')
    setSuccess(false)
    setError(null)
    setAssigning(false) // Make sure to reset assigning state
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date'

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Get file extension from file_name
  const getFileExtension = (fileName: string) => {
    const parts = fileName.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : ''
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={openModal}
        className={className}
      >
        {buttonIcon && <Link2 className="h-4 w-4 mr-2" />}
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="sm:max-w-[650px] p-0"
          aria-describedby="evidence selection for criteria"
        >
          <div className="flex flex-col h-[85vh]">
            <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-primary" />
                <DialogTitle>Assign Evidence to Criteria</DialogTitle>
              </div>
              <Description className="text-sm text-muted-foreground hidden" />
              <p className="text-sm text-muted-foreground">
                Select an evidence file to associate with criteria ID:{' '}
                <span className="font-medium">{criteriaId}</span>
              </p>
            </DialogHeader>

            <div className="px-6 py-3 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  className="pl-9 bg-muted/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading || assigning}
                />
              </div>
            </div>

            {error && (
              <div className="px-6 mb-2 flex-shrink-0">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex-grow overflow-hidden px-6">
              {success ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-gray-800" />
                  </div>
                  <h3 className="text-lg font-medium">Successfully Assigned</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    The evidence has been successfully assigned to the criteria.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full pb-4">
                  <div className="pr-4 pb-2">
                    {loading ? (
                      <div className="space-y-4 mt-2 px-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <div className="flex gap-2 mt-2">
                              <Skeleton className="h-6 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredFiles && filteredFiles.length > 0 ? (
                      <div className="space-y-4 mt-2 px-2">
                        {filteredFiles.map((file) => {
                          const isSelected = selectedFileId === file.id
                          const fileExtension = getFileExtension(file.file_name)

                          return (
                            <div
                              key={file.id}
                              className={cn(
                                'p-4 border rounded-xl transition-all cursor-pointer bg-white',
                                isSelected
                                  ? 'outline outline-2 outline-gray-800 outline-offset-2'
                                  : 'hover:shadow-md',
                              )}
                              onClick={() => handleFileSelection(file.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center">
                                  {getFileIcon(fileExtension)}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <h3 className="text-base font-semibold truncate">
                                      {file.file_name}
                                    </h3>
                                    {isSelected && (
                                      <CheckCircle2 className="h-5 w-5 text-gray-800 flex-shrink-0 ml-2" />
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(file.uploaded_at)}
                                    </span>

                                    {fileExtension && (
                                      <span className="text-xs text-muted-foreground">
                                        {fileExtension}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="font-medium text-lg">No files found</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                          {searchQuery
                            ? 'Try adjusting your search query or check for typos'
                            : 'No files are available to assign. Upload files first.'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
              <div className="flex justify-end gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedFileId || assigning || success}
                  className="min-w-[120px]"
                >
                  {assigning ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning...
                    </span>
                  ) : (
                    'Assign Evidence'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AssignEvidenceCriteriaButton
