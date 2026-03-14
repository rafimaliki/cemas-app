import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { FileText, ImageIcon, Music, Video, FileIcon } from 'lucide-react'
import type { JSX } from 'react'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(type: string): JSX.Element {
  switch (type) {
    case 'image':
      return <ImageIcon className="w-4 h-4" />
    case 'video':
      return <Video className="w-4 h-4" />
    case 'audio':
      return <Music className="w-4 h-4" />
    case 'application':
    case 'text':
      return <FileText className="w-4 h-4" />
    default:
      return <FileIcon className="w-4 h-4" />
  }
}
