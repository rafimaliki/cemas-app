'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tag, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CreateTagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export const CreateTagModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateTagModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {},
  )
  const [showSuccess, setShowSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Tag name is required'
    } else if (name.length < 2) {
      newErrors.name = 'Tag name must be at least 2 characters'
    } else if (name.length > 50) {
      newErrors.name = 'Tag name must be less than 50 characters'
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required'
    } else if (description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tag/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ name, description }),
        },
      )

      const data = await res.json()
      if (data.success) {
        setShowSuccess(true)

        // Show success state briefly before closing
        setTimeout(() => {
          onOpenChange(false)
          setName('')
          setDescription('')
          setShowSuccess(false)

          if (onSuccess) {
            onSuccess()
          }

          // Success alert instead of toast
          // alert(`Tag created successfully: The tag "${name}" has been created.`)
          toast.success(
            `Tag created successfully: The tag "${name}" has been created.`,
            { position: 'top-center' },
          )
        }, 100)
      } else {
        // Error alert instead of toast
        alert(
          `Failed to create tag: ${data.message || 'An error occurred while creating the tag.'}`,
        )
      }
    } catch (err) {
      console.error('Create tag error:', err)
      // Error alert instead of toast
      alert('An unexpected error occurred. Please try again.')
    } finally {
      if (!showSuccess) {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setErrors({})
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          resetForm()
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[485px]" aria-describedby="createtag">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-5 w-5 text-primary" />
            <DialogTitle>Create New Tag</DialogTitle>
          </div>
          <DialogDescription>
            Create a new tag to categorize and organize your compliance
            criteria.
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Tag Created Successfully</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your new tag has been created and is ready to use.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tag-name" className="text-sm font-medium">
                Tag Name
              </Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tag name"
                className={cn(
                  errors.name && 'border-red-500 focus-visible:ring-red-500',
                )}
                disabled={loading}
              />
              {errors.name && (
                <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="tag-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this tag"
                className={cn(
                  'min-h-[100px] resize-none',
                  errors.description &&
                    'border-red-500 focus-visible:ring-red-500',
                )}
                disabled={loading}
              />
              {errors.description && (
                <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.description}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 min-w-[100px]"
              >
                {loading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Tag'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreateTagModal
