'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  File,
  Trash2,
  Calendar,
  Info,
  Layers,
  User,
  ChevronRight,
  X,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
  LinkIcon,
  FileBarChart,
} from 'lucide-react'
import type { CriteriaData } from '@/types/evidence-types'
import type { TagWithCriteria } from '@/types/compliance-types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

interface CriteriaModalProps {
  criteria: CriteriaData[] | null
  isOpen: boolean
  onClose: () => void
  evidence_id: string
  onRequestRefreshCriteria?: () => void
}

export function EvidenceCriteriaModal({
  criteria,
  isOpen,
  onClose,
  evidence_id,
  onRequestRefreshCriteria = () => {},
}: CriteriaModalProps) {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [tags, setTags] = useState<TagWithCriteria[]>([])
  const [filteredTags, setFilteredTags] = useState<TagWithCriteria[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingTags, setLoadingTags] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [assigningTag, setAssigningTag] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'info'
    title: string
    message: string
  } | null>(null)
  const [deletingCriteriaIds, setDeletingCriteriaIds] = useState<number[]>([])
  const [criteriaId, setCriteriaId] = useState<string | null>(null)

  const criteriaModalRef = useRef<HTMLDivElement>(null)
  const tagModalRef = useRef<HTMLDivElement>(null)
  const middleSectionRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const openTagModal = async () => {
    setIsTagModalOpen(true)
    await fetchTags()
  }

  const closeTagModal = () => {
    setIsTagModalOpen(false)
    setSelectedTagId(null)
    setAssignSuccess(false)
    setAlertMessage(null)
  }

  useEffect(() => {
    if (
      criteriaModalRef.current &&
      tagModalRef.current &&
      middleSectionRef.current &&
      containerRef.current
    ) {
      if (isTagModalOpen) {
        // Expand container width first
        containerRef.current.style.maxWidth = '95vw'

        // Set initial positions for smooth animations
        criteriaModalRef.current.style.transition =
          'all 400ms cubic-bezier(0.16, 1, 0.3, 1)'
        middleSectionRef.current.style.transition =
          'all 400ms cubic-bezier(0.16, 1, 0.3, 1) 100ms' // Slight delay
        tagModalRef.current.style.transition =
          'all 400ms cubic-bezier(0.16, 1, 0.3, 1) 150ms' // More delay for staggered effect

        // Animate left panel (criteria modal)
        setTimeout(() => {
          criteriaModalRef.current!.style.width = '33%'
          criteriaModalRef.current!.style.left = '0'
          criteriaModalRef.current!.style.transform = 'translateX(0)'
        }, 50)

        // Animate middle panel with fade in and scale
        setTimeout(() => {
          middleSectionRef.current!.style.width = '33%'
          middleSectionRef.current!.style.left = '33.5%'
          middleSectionRef.current!.style.transform = 'translateX(0) scale(1)'
          middleSectionRef.current!.style.opacity = '1'
        }, 150)

        // Animate right panel to slide in from right
        setTimeout(() => {
          tagModalRef.current!.style.width = '33%'
          tagModalRef.current!.style.right = '0'
          tagModalRef.current!.style.left = 'auto'
          tagModalRef.current!.style.transform = 'translateX(0)'
        }, 200)
      } else {
        // Set transitions for closing animations
        criteriaModalRef.current.style.transition =
          'all 350ms cubic-bezier(0.16, 1, 0.3, 1) 150ms' // Delay to let others animate first
        middleSectionRef.current.style.transition =
          'all 300ms cubic-bezier(0.16, 1, 0.3, 1) 50ms'
        tagModalRef.current.style.transition =
          'all 300ms cubic-bezier(0.16, 1, 0.3, 1)'

        // Animate right panel out first
        tagModalRef.current.style.transform = 'translateX(100%)'

        // Then animate middle panel out
        middleSectionRef.current.style.opacity = '0'
        middleSectionRef.current.style.width = '0'
        middleSectionRef.current.style.transform = 'translateX(0) scale(0.95)'

        // Finally animate left panel back to center
        setTimeout(() => {
          criteriaModalRef.current!.style.width = '100%'
          criteriaModalRef.current!.style.left = '50%'
          criteriaModalRef.current!.style.transform = 'translateX(-50%)'

          // Reset container width after animations complete
          setTimeout(() => {
            containerRef.current!.style.maxWidth = '80vw'
          }, 300)
        }, 100)
      }
    }
  }, [isTagModalOpen])

  const fetchTags = async () => {
    try {
      setLoadingTags(true)
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tag/with-criteria`,
        {
          method: 'GET',
          credentials: 'include',
        },
      )
      const data = await res.json()
      // console.log("data from fetchTags or /tag/with-criteria: ", data)

      if (data.success) {
        setTags(data.tags)
        setFilteredTags(data.tags)
      } else {
        console.error('Failed to fetch tags')
        setAlertMessage({
          type: 'error',
          title: 'Error',
          message: 'Failed to load tags. Please try again.',
        })
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      setAlertMessage({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred while loading tags.',
      })
    } finally {
      setLoadingTags(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (query.trim() === '') {
      setFilteredTags(tags)
      return
    }

    const filtered = tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase()) ||
        tag.description.toLowerCase().includes(query.toLowerCase()),
    )

    setFilteredTags(filtered)
  }

  const handleTagSelection = (tagId: string) => {
    setSelectedTagId(tagId === selectedTagId ? null : tagId)
  }

  const getSelectedTag = () => {
    if (!selectedTagId) return null
    return tags.find((tag) => tag.id === selectedTagId) || null
  }

  const handleDeleteCriteria = async (criteriaId: number) => {
    try {
      // First mark this criteria as deleting to trigger animation
      setDeletingCriteriaIds((prev) => [...prev, criteriaId])

      // Wait for animation to complete before making the API call
      setTimeout(async () => {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/evidence/e-criteria/${criteriaId}/delete`,
          {
            method: 'DELETE',
            credentials: 'include',
          },
        )

        const data = await res.json()

        if (!res.ok || !data.success) {
          // If deletion fails, remove from deleting state
          setDeletingCriteriaIds((prev) =>
            prev.filter((id) => id !== criteriaId),
          )
          throw new Error(data.message || 'Failed to delete criteria')
        }

        // Refresh criteria list
        onRequestRefreshCriteria()
      }, 550) // Wait slightly longer than the animation duration
    } catch (error) {
      console.error('Error deleting criteria:', error)
      setAlertMessage({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete this criteria. Please try again.',
      })
    }
  }

  const assignEvidenceToTag = async () => {
    if (!selectedTagId) return

    try {
      setAssigningTag(true)

      // Replace with your actual API endpoint
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/evidence/e-criteria/from-tag`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            drive_file_id: evidence_id,
            tag_id: selectedTagId,
          }),
        },
      )

      const data = await res.json()

      if (data.success) {
        // setAssignSuccess(true)
        toast.success('Tag has been Assigned Succesfully!', {
          position: 'top-center',
        })
        setAlertMessage({
          type: 'success',
          title: 'Success',
          message: 'The evidence has been assigned to the selected tag.',
        })
        onRequestRefreshCriteria()
        // setTimeout(() => {
        //   setAssignSuccess(false)
        // }, 200)
      } else {
        setAlertMessage({
          type: 'error',
          title: 'Failed to assign tag',
          message: data.message || 'An error occurred while assigning the tag.',
        })
      }
    } catch (error) {
      console.error('Error assigning tag:', error)
      setAlertMessage({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      if (!assignSuccess) {
        setAssigningTag(false)
      }
    }
  }

  const selectedTag = getSelectedTag()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div
        ref={containerRef}
        className="relative w-full h-[85vh] flex overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxWidth: isTagModalOpen ? '95vw' : '80vw' }}
      >
        {/* Criteria Modal */}
        <div
          ref={criteriaModalRef}
          className="absolute top-0 h-full bg-background border rounded-lg shadow-lg transition-all duration-300 ease-in-out"
          style={{
            width: '100%',
            maxWidth: '800px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <File className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Criteria Details</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {criteria && criteria.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {criteria.length} criteria items for this
                  certification
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!criteria ||
              !Array.isArray(criteria) ||
              criteria.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/50 rounded-full p-6 mb-4">
                    <File className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No Criteria Found
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    There are no criteria available for this item. Criteria may
                    be added later or this item might not require specific
                    criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {(() => {
                    // Group criteria by compliance name
                    const criteriaByCompliance: Record<string, CriteriaData[]> =
                      {}
                    criteria.forEach((crit) => {
                      const complianceName =
                        crit.compliance_name || 'Uncategorized'
                      if (!criteriaByCompliance[complianceName]) {
                        criteriaByCompliance[complianceName] = []
                      }
                      criteriaByCompliance[complianceName].push(crit)
                    })

                    // Render each compliance group
                    return Object.entries(criteriaByCompliance).map(
                      ([complianceName, criteriaGroup]) => (
                        <div key={complianceName} className="space-y-4">
                          <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border-l-4 border-primary">
                            <FileBarChart className="h-5 w-5 text-primary" />
                            <h3 className="font-medium text-base">
                              {complianceName}
                            </h3>
                            <Badge variant="outline" className="ml-2">
                              {criteriaGroup.length}{' '}
                              {criteriaGroup.length === 1
                                ? 'criterion'
                                : 'criteria'}
                            </Badge>
                          </div>

                          <div className="space-y-4 pl-2">
                            {criteriaGroup.map((crit) => (
                              <div
                                key={crit.id}
                                className={cn(
                                  'group border rounded-lg overflow-hidden transition-all hover:shadow-md',
                                  'transform origin-top',
                                  deletingCriteriaIds.includes(
                                    crit.e_criteria_id,
                                  ) &&
                                    'animate-criteria-delete opacity-0 max-h-0 mt-0 mb-0 border-transparent',
                                )}
                                style={{
                                  transition:
                                    'opacity 500ms ease, max-height 500ms ease, margin 500ms ease, border-color 500ms ease',
                                }}
                              >
                                <div className="bg-muted/30 px-5 py-3 flex items-center justify-between">
                                  <h3 className="font-medium text-base flex items-center gap-2">
                                    {crit.name}
                                  </h3>

                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'capitalize',
                                      getStatusStyles(crit.status),
                                    )}
                                  >
                                    {getStatusIcon(crit.status)}
                                    {crit.status}
                                  </Badge>
                                </div>

                                <div className="p-5">
                                  {crit.description && (
                                    <div className="mb-4">
                                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                                        <Info className="h-4 w-4" />
                                        Description
                                      </div>
                                      <p className="text-sm pl-6">
                                        {crit.description}
                                      </p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {crit.prefix && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Layers className="h-4 w-4 text-muted-foreground" />
                                        {/* <span className="text-muted-foreground">
                                          
                                        </span> */}
                                        <span className="font-medium">
                                          {crit.prefix}
                                        </span>
                                      </div>
                                    )}

                                    {crit.pic_id && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                          PIC ID:
                                        </span>
                                        <span className="font-medium">
                                          {crit.pic_id}
                                        </span>
                                      </div>
                                    )}

                                    {crit.created_at && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                          Created:
                                        </span>
                                        <span className="font-medium">
                                          {new Date(
                                            crit.created_at,
                                          ).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                          })}
                                        </span>
                                      </div>
                                    )}

                                    {/* {crit.parent_id && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                          Parent ID:
                                        </span>
                                        <span className="font-medium">
                                          {crit.parent_id}
                                        </span>
                                      </div>
                                    )} */}
                                  </div>
                                </div>

                                <Separator />

                                <div className="px-5 py-3 flex items-center justify-between bg-muted/10">
                                  <div className="text-xs text-muted-foreground">
                                    Compliance ID: {crit.compliance_id}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                                      onClick={() =>
                                        handleDeleteCriteria(crit.e_criteria_id)
                                      }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Remove
                                    </Button>
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
              )}
            </div>

            <div className="p-6 border-t flex justify-between items-center">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <div className="flex gap-3">
                <Button onClick={openTagModal}>
                  <Tag className="h-4 w-4 mr-2" />
                  Assign Evidence to Tag
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Criteria Information */}
        <div
          ref={middleSectionRef}
          className="absolute top-0 h-full bg-background border rounded-lg shadow-lg transition-all duration-300 ease-in-out overflow-hidden"
          style={{
            width: '0',
            opacity: '0',
            left: '50%',
            transform: 'translateX(0) scale(0.95)',
          }}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Tag Connection</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                View criteria associated with the selected tag
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedTag ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedTag.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTag.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      {selectedTag.criteria.length}{' '}
                      {selectedTag.criteria.length === 1
                        ? 'criterion'
                        : 'criteria'}
                    </Badge>
                  </div>

                  {selectedTag.criteria.length > 0 ? (
                    <div className="space-y-5 mt-4">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Associated Criteria
                      </h4>

                      {(() => {
                        // Group criteria by compliance name
                        const criteriaByCompliance: Record<string, any[]> = {}
                        selectedTag.criteria.forEach((criterion: any) => {
                          const complianceName =
                            criterion.compliance_name || 'Uncategorized'
                          if (!criteriaByCompliance[complianceName]) {
                            criteriaByCompliance[complianceName] = []
                          }
                          criteriaByCompliance[complianceName].push(criterion)
                        })

                        // Render each compliance group
                        return Object.entries(criteriaByCompliance).map(
                          ([complianceName, criteriaGroup]) => (
                            <div key={complianceName} className="space-y-3">
                              <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                <FileBarChart className="h-4 w-4 text-primary" />
                                <h5 className="font-medium text-sm">
                                  {complianceName}
                                </h5>
                                <Badge
                                  variant="outline"
                                  className="ml-auto text-xs"
                                >
                                  {criteriaGroup.length}
                                </Badge>
                              </div>

                              <div className="space-y-3 pl-1">
                                {criteriaGroup.map((criterion: any) => (
                                  <div
                                    key={criterion.id}
                                    className={cn(
                                      'border rounded-lg p-4 bg-gray-50',
                                      criterion.id.toString() ===
                                        criteriaId?.toString() &&
                                        'bg-primary/5 border-primary/20',
                                    )}
                                  >
                                    <div className="flex justify-between items-start">
                                      <h5 className="font-medium">
                                        {criterion.name}
                                      </h5>
                                      {criterion.id.toString() ===
                                        criteriaId?.toString() && (
                                        <Badge
                                          variant="outline"
                                          className="bg-primary/10 text-primary border-primary/20"
                                        >
                                          Current
                                        </Badge>
                                      )}
                                    </div>

                                    {criterion.description && (
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {criterion.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-4 mt-3">
                                      {criterion.level && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-muted-foreground">
                                            Level:
                                          </span>
                                          <span className="font-medium">
                                            {criterion.level}
                                          </span>
                                        </div>
                                      )}
                                      {criterion.created_at && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-muted-foreground">
                                            Created:
                                          </span>
                                          <span className="font-medium">
                                            {new Date(
                                              criterion.created_at,
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
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
                      <h4 className="font-medium">No Criteria</h4>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        This tag doesn't have any associated criteria yet.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-muted/30 rounded-full p-6 mb-4">
                    <Tag className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select a Tag</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Choose a tag from the right panel to view its associated
                    criteria
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <div className="flex justify-center">
                <Badge variant="outline" className="px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">
                    Evidence ID: {evidence_id}
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tag Selection Modal */}
        <div
          ref={tagModalRef}
          className="absolute top-0 right-0 h-full bg-background border rounded-lg shadow-lg transition-all duration-300 ease-in-out"
          style={{
            width: '33%',
            transform: 'translateX(100%)',
          }}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Select Tag</h2>
                </div>
                <button
                  onClick={closeTagModal}
                  className="rounded-full p-1 hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a tag to associate with this evidence
              </p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {alertMessage && (
                <div className="px-6 pt-4">
                  <Alert
                    variant={
                      alertMessage.type === 'error' ? 'destructive' : 'default'
                    }
                  >
                    {alertMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : alertMessage.type === 'error' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                    <AlertTitle>{alertMessage.title}</AlertTitle>
                    <AlertDescription>{alertMessage.message}</AlertDescription>
                  </Alert>
                </div>
              )}

              {assignSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-in fade-in-50 duration-300">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium">
                    Tag Assigned Successfully
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    The evidence has been successfully assigned to the selected
                    tag.
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-6 py-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tags..."
                        className="pl-9 bg-muted/40"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        disabled={loadingTags}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {loadingTags ? (
                      <div className="space-y-4 mt-2">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="p-4 border rounded-xl animate-pulse bg-muted/40"
                          >
                            <div className="h-5 w-1/3 bg-muted rounded mb-3"></div>
                            <div className="h-4 w-full bg-muted rounded mb-3"></div>
                            <div className="h-4 w-2/3 bg-muted rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : filteredTags.length > 0 ? (
                      <div className="space-y-3 mt-2">
                        {filteredTags.map((tag) => {
                          const criteriaCount = tag.criteria.length

                          const isSelected = selectedTagId === tag.id

                          return (
                            <div
                              key={tag.id}
                              className={cn(
                                'p-4 border rounded-xl transition-all cursor-pointer',
                                isSelected
                                  ? 'ring-2 ring-primary ring-offset-1'
                                  : 'hover:shadow-md',
                              )}
                              onClick={() => handleTagSelection(tag.id)}
                            >
                              <div className="flex justify-between items-start">
                                <h3 className="text-base font-semibold flex items-center gap-2">
                                  {tag.name}
                                  {criteriaCount > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 font-normal"
                                    >
                                      {criteriaCount}{' '}
                                      {criteriaCount === 1
                                        ? 'criterion'
                                        : 'criteria'}
                                    </Badge>
                                  )}
                                </h3>
                                {isSelected && (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground mt-1">
                                {tag.description}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Tag className="h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="font-medium text-lg">No tags found</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                          No tags match your search criteria. Try adjusting your
                          search or create a new tag.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="p-6 border-t flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeTagModal}
                  disabled={assigningTag}
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignEvidenceToTag}
                  disabled={!selectedTagId || assigningTag || assignSuccess}
                  className="min-w-[120px]"
                >
                  {assigningTag ? 'Assigning...' : 'Assign Tag'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for status styling
function getStatusStyles(status?: string) {
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
    case 'draft':
    case 'new':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getStatusIcon(status?: string) {
  const iconClass = 'mr-1 h-3 w-3'

  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'completed':
      return (
        <span className={`${iconClass} text-green-500 fill-current`}>●</span>
      )
    case 'inactive':
    case 'rejected':
    case 'failed':
      return <span className={`${iconClass} text-red-500 fill-current`}>●</span>
    case 'pending':
    case 'in progress':
      return (
        <span className={`${iconClass} text-yellow-500 fill-current`}>●</span>
      )
    case 'draft':
    case 'new':
      return (
        <span className={`${iconClass} text-blue-500 fill-current`}>●</span>
      )
    default:
      return (
        <span className={`${iconClass} text-gray-500 fill-current`}>●</span>
      )
  }
}
