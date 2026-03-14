// components/evidence/file-uploader-button.tsx
import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileUploader } from '@/components/evidence/file-uploader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
interface FileUploaderButtonProps {
  buttonText?: string
  showIcon?: boolean
  onFilesUploaded?: (file: any) => void
  className?: string
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  criteriaId?: number | string | null
  dialogTitle?: string
  dialogDescription?: string
}

export function FileUploaderButton({
  buttonText = 'Upload Files',
  showIcon = true,
  onFilesUploaded,
  className = '',
  variant = 'default',
  criteriaId = null,
  dialogTitle = 'Upload Files',
  dialogDescription = 'Drag and drop files or select them from your device.',
}: FileUploaderButtonProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date>(() => {
    const now = new Date()
    now.setFullYear(now.getFullYear() + 1)
    return now
  })
  return (
    <>
      <Button
        onClick={() => setIsUploadOpen(true)}
        className={className}
        variant={variant}
      >
        {showIcon && <Upload className="h-4 w-4 mr-2" />}
        {buttonText}
      </Button>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="upload files">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date{' '}
              <span className="text-neutral-400">(choose first)</span>
            </label>
            <input
              type="date"
              value={expiryDate ? expiryDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setExpiryDate(new Date(e.target.value))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-neutral-300"
              required
            />
          </div>
          <FileUploader
            onFilesUploaded={(file) => {
              if (onFilesUploaded) {
                onFilesUploaded(file)
              }
              setIsUploadOpen(false)
            }}
            criteriaId={criteriaId != null ? String(criteriaId) : undefined}
            expiryDate={expiryDate.toISOString() || undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
