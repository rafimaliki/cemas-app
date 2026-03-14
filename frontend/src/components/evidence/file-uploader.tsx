'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { EvidenceFile } from '@/types/compliance-types'

type OnFilesUploaded = (file: EvidenceFile) => void

interface FileUploaderProps {
  onFilesUploaded: OnFilesUploaded
  expiryDate?: string
  onRequestRefreshCriteria?: () => void
  criteriaId?: string
  closeModal?: () => void
}

export function FileUploader({
  onFilesUploaded,
  onRequestRefreshCriteria,
  criteriaId,
  closeModal,
  expiryDate,
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [assigning, setAssigning] = useState(false)

  const assignEvidenceToCriteria = async (
    evidence_id: string,
    criteria_id: string,
    onSuccess?: () => void,
  ) => {
    try {
      setAssigning(true)
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/evidence/e-criteria/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            drive_file_id: evidence_id,
            criteria_id: criteria_id,
          }),
        },
      )

      const data = await res.json()

      if (data.success) {
        toast.success(
          'The evidence has been assigned to the selected criteria.',
          { position: 'top-center' },
        )

        const uploadedFile: EvidenceFile = {
          id: data.evidence.id,
          url: data.evidence.file_path,
          name: data.evidence.file_name,
          uploadedAt: data.evidence.uploaded_at,
          uploadedBy: data.evidence.uploaded_by,
          expiryDate: data.evidence.expired_by,
        }

        onFilesUploaded(uploadedFile)

        onRequestRefreshCriteria?.()
        onSuccess?.()

        if (closeModal) {
          setTimeout(() => closeModal(), 3000)
        }
      } else {
        toast.error(
          `Failed to assign criteria: ${data.message || 'An error occurred while assigning the criteria.'}`,
          { position: 'top-center' },
        )
      }
    } catch (error) {
      console.error('Error assigning criteria:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const handleUpload = async (file: File, expired_date: string) => {
    if (!file) {
      alert('Pilih file terlebih dahulu!')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('expiryDate', expired_date || '')

      // console.log('Uploading file:', {
      //   fileName: file.name,
      //   fileSize: file.size,
      //   expiryDate: expired_date,
      // })

      // // Debug FormData
      // for (const [key, value] of formData.entries()) {
      //   console.log(`FormData: ${key} = ${value}`)
      // }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/drive/upload`,
        {
          credentials: 'include',
          method: 'POST',
          body: formData,
        },
      )

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Upload gagal!')

      if (criteriaId && result.fileId) {
        await assignEvidenceToCriteria(result.fileId, criteriaId)
      } else {
        toast.success('File has been succesfully uploaded to Google Drive!.', {
          position: 'top-center',
        })
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengupload file.')
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
    }
  }

  useEffect(() => {
    if (selectedFile) {
      handleUpload(selectedFile, expiryDate || '')
    }
  }, [selectedFile, expiryDate])

  const handleFileChange = (file: File) => {
    setSelectedFile(file)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileChange(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3 text-center py-4">
          <div className="rounded-full bg-primary/10 p-2">
            <Upload className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="font-medium text-sm">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {criteriaId
                ? 'File will be uploaded and assigned to criteria'
                : 'File will be uploaded to Google Drive'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Max file size: 100 MB</p>
          </div>

          <Button
            onClick={open}
            type="button"
            size="sm"
            disabled={isUploading || assigning}
          >
            {isUploading
              ? 'Uploading...'
              : assigning
                ? 'Assigning...'
                : criteriaId
                  ? 'Upload & Assign'
                  : 'Select Files'}
          </Button>
        </div>
        {(isUploading || assigning) && (
          <Progress value={100} className="h-1.5" />
        )}
      </div>
    </div>
  )
}
