import type React from 'react'
import { useState, useRef, type KeyboardEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Upload, Download } from 'lucide-react'
import { useKeyStore } from '@/stores/key-store'
import { Description } from '@radix-ui/react-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { toast } from 'sonner'

interface NewComplianceModalProps {
  onComplianceCreated: () => void
}

export function NewComplianceModal({
  onComplianceCreated,
}: NewComplianceModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [importName, setImportName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSubmit = async () => {
    if (!name) {
      toast.error('Please enter a compliance name', {
        position: 'top-center',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/compliance/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: name,
            description: name,
            standard: 'EMPTY',
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to create compliance')
      }

      setName('')
      setOpen(false)
      useKeyStore.getState().incrementKey()

      onComplianceCreated()
    } catch (error) {
      console.error('Error creating compliance:', error)
      toast.error('Failed to create compliance', { position: 'top-center' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleFileUpload = async () => {
    if (!importName) {
      toast.error('Please enter a compliance name', {
        position: 'top-center',
      })
      return
    }

    if (!selectedFile) {
      toast.error('Please select an Excel file', {
        position: 'top-center',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', importName)
      formData.append('description', importName)
      formData.append('standard', 'EMPTY')

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/compliance/import-excel`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      )

      if (!response.ok) {
        throw new Error('Failed to import compliance')
      }

      setImportName('')
      setSelectedFile(null)
      setOpen(false)
      useKeyStore.getState().incrementKey()
      onComplianceCreated()
    } catch (error) {
      console.error('Error importing compliance:', error)
      toast.error('Failed to import compliance', {
        position: 'top-center',
      })
    } finally {
      setIsSubmitting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    submitFn: () => void,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitFn()
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="cursor-pointer">
        <Plus className="mr-2 h-4 w-4" />
        New Compliance
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="" aria-describedby="create new compliance">
          <Description className="hidden"></Description>
          <DialogHeader>
            <DialogTitle>Create New Compliance</DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Empty Compliance</TabsTrigger>
              <TabsTrigger value="import">Import from Excel</TabsTrigger>
            </TabsList>

            <div className="h-fit flex flex-col">
              <TabsContent
                value="manual"
                className="flex-1 flex flex-col data-[state=inactive]:hidden mt-4"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmit()
                  }}
                  className="flex flex-col flex-1"
                >
                  <div className="grid gap-4 flex-1">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Compliance Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter compliance name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                      />
                    </div>

                    {/* <div className="h-[220px]"></div> */}
                  </div>

                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent
                value="import"
                className="flex-1 flex flex-col data-[state=inactive]:hidden mt-4"
              >
                <div className="flex flex-col flex-1">
                  <div className="grid gap-4 flex-1">
                    <div className="grid gap-2">
                      <Label htmlFor="importName">Compliance Name</Label>
                      <Input
                        id="importName"
                        placeholder="Enter compliance name"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleFileUpload)}
                      />
                    </div>
                    <div className="h-fit">
                      <div className="flex flex-col gap-2 items-center justify-center p-4 border-2 border-dashed rounded-lg h-[148px]">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept=".xlsx,.xls"
                          className="hidden"
                          id="file-upload"
                        />
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-center text-muted-foreground mb-2">
                          {selectedFile
                            ? selectedFile.name
                            : 'Upload your compliance Excel file'}
                        </p>
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select File
                        </Button>
                      </div>

                      <div className="flex justify-center mt-4">
                        <a
                          href="https://drive.google.com/drive/folders/1G4xB-myOxj6fktg8fMxEvY9f9EenDwUO?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            className="flex items-center"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Template
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
