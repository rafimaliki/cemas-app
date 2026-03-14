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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Search,
  Tag,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Layers,
  Unlink,
  Link,
  FileBarChart,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TagWithCriteria } from '@/types/compliance-types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Description } from '@radix-ui/react-dialog'

interface TagCriteriaButtonProps {
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
  onSuccess?: () => void
}

export function TagCriteriaButton({
  criteriaId,
  buttonText = 'Tag',
  buttonVariant = 'default',
  buttonSize = 'default',
  buttonIcon = true,
  className,
  onSuccess,
}: TagCriteriaButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [tags, setTags] = useState<TagWithCriteria[]>([])
  const [filteredTags, setFilteredTags] = useState<TagWithCriteria[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [associating, setAssociating] = useState<boolean>(false)
  const [disassociating, setDisassociating] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchTags()
    } else {
      // Reset state when modal closes
      resetState()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTags(tags)
      return
    }

    const filtered = tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.criteria.some((c: { name: string }) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    )

    setFilteredTags(filtered)
  }, [searchQuery, tags])

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const fetchTags = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tag/with-criteria`,
        {
          method: 'GET',
          credentials: 'include',
        },
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        // Extract error message from response if available
        const errorMessage =
          data.message || data.error || 'Failed to fetch tags'
        setError(errorMessage)
        return
      }

      setTags(data.tags)
      setFilteredTags(data.tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleTagSelection = (tagId: string) => {
    setSelectedTagId(tagId === selectedTagId ? null : tagId)
  }

  const getSelectedTag = () => {
    if (!selectedTagId) return null
    return tags.find((tag) => tag.id === selectedTagId) || null
  }

  // Check if the current criteriaId is associated with the selected tag
  const isTagAssociatedWithCriteria = () => {
    const selectedTag = getSelectedTag()
    if (!selectedTag) return false

    return selectedTag.criteria.some(
      (criterion: { id: string | number }) =>
        criterion.id.toString() === criteriaId.toString(),
    )
  }

  const handleAssociate = async () => {
    if (!selectedTagId) return

    try {
      setAssociating(true)
      setError(null)

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tag/associate-criteria`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            tag_id: selectedTagId,
            criteria_id: criteriaId,
          }),
        },
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        // Extract error message from response if available
        const errorMessage =
          data.message || data.error || 'Failed to associate tag with criteria'
        setError(errorMessage)
        toast.error(errorMessage, { position: 'top-center' })
        setAssociating(false)
        return
      }

      setSuccess(true)
      setSuccessMessage(
        'The criteria has been successfully associated with the selected tag.',
      )
      setAssociating(false) // Make sure to reset associating state
      toast.success(
        'The criteria has been successfully associated with the selected tag.',
        { position: 'top-center' },
      )

      // Refresh tags to show updated associations
      await fetchTags()

      // Show success state briefly before closing
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
        closeModal()
      }, 2000)
    } catch (error) {
      console.error('Error associating tag with criteria:', error)
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      )
      setAssociating(false)
    }
  }

  const handleDisassociate = async () => {
    if (!selectedTagId) return

    try {
      setDisassociating(true)
      setError(null)

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tag/disassociate-criteria`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            tag_id: selectedTagId,
            criteria_id: criteriaId,
          }),
        },
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        // Extract error message from response if available
        const errorMessage =
          data.message ||
          data.error ||
          'Failed to disassociate tag from criteria'
        setError(errorMessage)
        toast.error(errorMessage, { position: 'top-center' })
        setDisassociating(false)
        return
      }

      setSuccess(true)
      setSuccessMessage(
        'The criteria has been successfully disassociated from the selected tag.',
      )
      setDisassociating(false)
      toast.success(
        'The criteria has been successfully disassociated from the selected tag.',
        {
          position: 'top-center',
        },
      )

      // Refresh tags to show updated associations
      await fetchTags()

      // Show success state briefly before closing
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
        closeModal()
      }, 2000)
    } catch (error) {
      console.error('Error disassociating tag from criteria:', error)
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      )
      setDisassociating(false)
    }
  }

  const resetState = () => {
    setSelectedTagId(null)
    setSearchQuery('')
    setSuccess(false)
    setSuccessMessage('')
    setError(null)
    setAssociating(false)
    setDisassociating(false)
  }

  // Function to get a color based on criteria count
  const getTagColor = (criteriaCount: number) => {
    if (criteriaCount === 0) return 'bg-white'
    if (criteriaCount < 3) return 'bg-white'
    if (criteriaCount < 6) return 'bg-white'
    return 'bg-white'
  }

  const selectedTag = getSelectedTag()
  const isAssociated = isTagAssociatedWithCriteria()

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={openModal}
        className={className}
      >
        {buttonIcon && <Tag className="h-4 w-4 mr-2" />}
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[1000px] p-0">
          <div className="flex h-[85vh]">
            {/* Criteria Info Panel - Always visible */}
            <div className="w-[300px] border-r flex flex-col h-full">
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Tag Criteria</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  View criteria associated with tags
                </p>
              </div>

              <div className="flex-grow overflow-hidden p-6">
                <ScrollArea className="h-full">
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

                        {isAssociated && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Associated
                          </Badge>
                        )}
                      </div>

                      {selectedTag.criteria.length > 0 ? (
                        <div className="space-y-4 mt-4">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Associated Criteria
                          </h4>

                          {Object.entries(
                            selectedTag.criteria.reduce(
                              (acc: Record<string, any[]>, criterion: any) => {
                                const name =
                                  criterion.compliance_name ||
                                  'Unknown Compliance'
                                if (!acc[name]) acc[name] = []
                                acc[name].push(criterion)
                                return acc
                              },
                              {},
                            ),
                          ).map(([complianceName, criteria]) => (
                            <div key={complianceName} className="space-y-4">
                              <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border-l-4 border-primary">
                                <FileBarChart className="h-5 w-5 text-primary" />
                                <h3 className="font-medium text-base">
                                  {complianceName}
                                </h3>
                                <Badge variant="outline" className="ml-2">
                                  {criteria.length}{' '}
                                  {criteria.length === 1
                                    ? 'criterion'
                                    : 'criteria'}
                                </Badge>
                              </div>

                              <div className="space-y-4">
                                {criteria.map((criterion) => (
                                  <div
                                    key={criterion.id}
                                    className={cn(
                                      'border rounded-lg p-4 bg-gray-50',
                                      criterion.id.toString() ===
                                        criteriaId.toString() && 'bg-primary/5',
                                    )}
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <h5 className="font-medium">
                                          {criterion.name}
                                        </h5>
                                        <p className="text-xs text-muted-foreground">
                                          {criterion.compliance_name}
                                        </p>
                                      </div>
                                      {criterion.id.toString() ===
                                        criteriaId.toString() && (
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
                                          {/* <span className="text-muted-foreground">
                                            Level:
                                          </span> */}
                                          <span className="font-medium">
                                            {criterion.prefix}
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
                          ))}
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
                </ScrollArea>
              </div>

              <div className="p-6 border-t">
                <div className="flex justify-center">
                  <Badge variant="outline" className="px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">
                      Criteria ID: {criteriaId}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Main Tag Selection Panel */}
            <div className="flex-1 flex flex-col h-full">
              <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="h-5 w-5 text-primary" />
                  <DialogTitle>Manage Tag Associations</DialogTitle>
                  <Description className="hidden" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Associate or disassociate criteria ID:{' '}
                  <span className="font-medium">{criteriaId}</span> with tags
                </p>
              </DialogHeader>

              <div className="px-6 py-3 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    className="pl-9 bg-muted/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading || associating || disassociating}
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
                    <h3 className="text-lg font-medium">Success</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      {successMessage}
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
                      ) : filteredTags.length > 0 ? (
                        <div className="space-y-4 mt-2 px-2">
                          {filteredTags.map((tag) => {
                            const criteriaCount = tag.criteria.length
                            const isSelected = selectedTagId === tag.id
                            const isLinked = tag.criteria.some(
                              (c: { id: string | number }) =>
                                c.id.toString() === criteriaId.toString(),
                            )

                            return (
                              <div
                                key={tag.id}
                                className={cn(
                                  'p-4 border rounded-xl transition-all cursor-pointer',
                                  getTagColor(criteriaCount),
                                  isSelected
                                    ? 'outline outline-2 outline-gray-800 outline-offset-2'
                                    : 'hover:shadow-md',
                                  isLinked && 'bg-green-50',
                                )}
                                onClick={() => handleTagSelection(tag.id)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-base font-semibold">
                                      {tag.name}
                                    </h3>
                                    {criteriaCount > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="font-normal"
                                      >
                                        {criteriaCount}{' '}
                                        {criteriaCount === 1
                                          ? 'criterion'
                                          : 'criteria'}
                                      </Badge>
                                    )}
                                    {isLinked && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-800 border-green-200"
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Associated
                                      </Badge>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <CheckCircle2 className="h-5 w-5 text-gray-800" />
                                  )}
                                </div>

                                <p className="text-sm text-muted-foreground mt-1">
                                  {tag.description}
                                </p>

                                {criteriaCount === 0 && (
                                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground italic">
                                    <Info className="h-4 w-4" />
                                    <span>
                                      No related criteria for this tag
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                          <h3 className="font-medium text-lg">
                            No matching tags found
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                            Try adjusting your search query or check for typos
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
                    disabled={associating || disassociating}
                  >
                    Cancel
                  </Button>

                  {selectedTagId && isAssociated ? (
                    <Button
                      variant="destructive"
                      onClick={handleDisassociate}
                      disabled={
                        !selectedTagId ||
                        associating ||
                        disassociating ||
                        success
                      }
                      className="min-w-[140px]"
                    >
                      {disassociating ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Removing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Unlink className="h-4 w-4 mr-1" />
                          Remove Association
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAssociate}
                      disabled={
                        !selectedTagId ||
                        associating ||
                        disassociating ||
                        success ||
                        isAssociated
                      }
                      className="min-w-[140px]"
                    >
                      {associating ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Associating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Link className="h-4 w-4 mr-1" />
                          Associate Tag
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TagCriteriaButton
