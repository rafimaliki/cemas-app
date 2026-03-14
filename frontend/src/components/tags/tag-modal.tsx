'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { TagWithCriteria } from '@/types/compliance-types'
import {
  Search,
  Tag,
  Info,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  FileBarChart,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TagModalProps {
  open: boolean
  onClose: () => void
}

export function TagModal({ open, onClose }: TagModalProps) {
  const [tags, setTags] = useState<TagWithCriteria[]>([])
  const [filteredTags, setFilteredTags] = useState<TagWithCriteria[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  // Add new state variables for edit and delete functionality
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [tagToDelete, setTagToDelete] = useState<TagWithCriteria | null>(null)
  const [tagToEdit, setTagToEdit] = useState<TagWithCriteria | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editFormData, setEditFormData] = useState<{
    name: string
    description: string
  }>({
    name: '',
    description: '',
  })
  const [editFormErrors, setEditFormErrors] = useState<{
    name?: string
    description?: string
  }>({})

  useEffect(() => {
    if (!open) return

    fetchTags()
  }, [open])

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

  const fetchTags = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tag/with-criteria`,
        {
          method: 'GET',
          credentials: 'include',
        },
      )
      const data = await res.json()
      // console.log(data)
      if (data.success) {
        setTags(data.tags)
        setFilteredTags(data.tags)
      } else {
        console.error('Failed to fetch tags with criteria')
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
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

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (tag: TagWithCriteria, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent tag selection when clicking delete
    setTagToDelete(tag)
    setIsDeleteDialogOpen(true)
  }

  // Handle opening the edit dialog
  const handleEditClick = (tag: TagWithCriteria, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent tag selection when clicking edit
    setTagToEdit(tag)
    setEditFormData({
      name: tag.name,
      description: tag.description,
    })
    setEditFormErrors({})
    setIsEditDialogOpen(true)
  }

  // Handle the actual deletion
  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return

    try {
      setIsDeleting(true)
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tag/${tagToDelete.id}/delete`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )

      const data = await res.json()

      if (data.success) {
        toast.success(
          `Tag "${tagToDelete.name}" has been deleted successfully`,
          { position: 'top-center' },
        )

        // Remove the deleted tag from the state
        setTags(tags.filter((tag) => tag.id !== tagToDelete.id))
        setFilteredTags(filteredTags.filter((tag) => tag.id !== tagToDelete.id))

        // If the deleted tag was selected, clear the selection
        if (selectedTagId === tagToDelete.id) {
          setSelectedTagId(null)
        }

        setIsDeleteDialogOpen(false)
      } else {
        toast.error(
          `Failed to delete tag: ${data.message || 'An error occurred'}`,
          { position: 'top-center' },
        )
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('An unexpected error occurred while deleting the tag', {
        position: 'top-center',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Validate edit form
  const validateEditForm = () => {
    const errors: { name?: string; description?: string } = {}

    if (!editFormData.name.trim()) {
      errors.name = 'Tag name is required'
    } else if (editFormData.name.length < 2) {
      errors.name = 'Tag name must be at least 2 characters'
    } else if (editFormData.name.length > 50) {
      errors.name = 'Tag name must be less than 50 characters'
    }

    if (!editFormData.description.trim()) {
      errors.description = 'Description is required'
    } else if (editFormData.description.length < 5) {
      errors.description = 'Description must be at least 5 characters'
    }

    setEditFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle the actual update
  const handleEditSubmit = async () => {
    if (!tagToEdit) return

    if (!validateEditForm()) {
      return
    }

    try {
      setIsEditing(true)
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tag/${tagToEdit.id}/update`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: editFormData.name,
            description: editFormData.description,
          }),
        },
      )

      const data = await res.json()

      if (data.success) {
        toast.success(`Tag "${tagToEdit.name}" has been updated successfully`, {
          position: 'top-center',
        })

        // Update the tag in the state
        const updatedTags = tags.map((tag) =>
          tag.id === tagToEdit.id
            ? {
                ...tag,
                name: editFormData.name,
                description: editFormData.description,
              }
            : tag,
        )

        setTags(updatedTags)
        setFilteredTags(updatedTags)

        // If the edited tag was selected, update the selection
        if (selectedTagId === tagToEdit.id) {
          setSelectedTagId(tagToEdit.id)
        }

        setIsEditDialogOpen(false)
      } else {
        toast.error(
          `Failed to update tag: ${data.message || 'An error occurred'}`,
          { position: 'top-center' },
        )
      }
    } catch (error) {
      console.error('Error updating tag:', error)
      toast.error('An unexpected error occurred while updating the tag', {
        position: 'top-center',
      })
    } finally {
      setIsEditing(false)
    }
  }

  const selectedTag = getSelectedTag()

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-[1000px] p-0"
          aria-describedby="tags related"
        >
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
                                    className="border rounded-lg p-4 bg-gray-50"
                                  >
                                    <h5 className="font-medium">
                                      {criterion.name}
                                    </h5>
                                    {criterion.description && (
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {criterion.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-4 mt-3">
                                      {criterion.level && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
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
            </div>

            {/* Main Tag Selection Panel */}
            <div className="flex-1 flex flex-col h-full">
              <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="h-5 w-5 text-primary" />
                  <DialogTitle>Tags with Related Criteria</DialogTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Browse all tags and their associated compliance criteria
                </p>
              </DialogHeader>

              <div className="px-6 py-3 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags or criteria..."
                    className="pl-9 bg-muted/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-grow overflow-hidden px-6">
                <ScrollArea className="h-full pb-6">
                  {loading ? (
                    <div className="space-y-4 mt-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-6 w-1/3" />
                          <Skeleton className="h-4 w-full" />
                          <div className="flex gap-2 mt-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredTags.length > 0 ? (
                    <div className="space-y-4 mt-2">
                      {filteredTags.map((tag) => {
                        const criteriaCount = tag.criteria.length
                        const isSelected = selectedTagId === tag.id

                        return (
                          <div
                            key={tag.id}
                            className={cn(
                              'p-4 border rounded-xl transition-all cursor-pointer',
                              isSelected
                                ? 'outline outline-2 outline-gray-800 outline-offset-2'
                                : 'hover:shadow-md',
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
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-muted"
                                  onClick={(e) => handleEditClick(tag, e)}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                  onClick={(e) => handleDeleteClick(tag, e)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                {isSelected && (
                                  <CheckCircle2 className="h-5 w-5 text-gray-800" />
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mt-1">
                              {tag.description}
                            </p>

                            {criteriaCount === 0 && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground italic">
                                <Info className="h-4 w-4" />
                                <span>No related criteria for this tag</span>
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
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tag? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {tagToDelete && (
            <div className="py-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium">{tagToDelete.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {tagToDelete.description}
                </p>

                {tagToDelete.criteria.length > 0 && (
                  <div className="mt-3">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        This tag has {tagToDelete.criteria.length} associated
                        criteria. Deleting it will remove these associations.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Tag'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag name and description.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Tag Name</Label>
              <Input
                id="edit-tag-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder="Enter tag name"
                className={cn(
                  editFormErrors.name &&
                    'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {editFormErrors.name && (
                <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{editFormErrors.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tag-description">Description</Label>
              <Textarea
                id="edit-tag-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the purpose of this tag"
                className={cn(
                  'min-h-[100px] resize-none',
                  editFormErrors.description &&
                    'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {editFormErrors.description && (
                <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{editFormErrors.description}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isEditing}>
              {isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TagModal
