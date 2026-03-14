import { useEffect, useState } from 'react'
import { Search, UserPlus, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface AssignAuditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complianceId: number
  users: Array<{
    id: number
    name: string
    email: string
    role: string
  }>
  existingAuditors: Array<number>
  onSave: () => void
}

export function AssignAuditorDialog({
  open,
  onOpenChange,
  complianceId,
  users,
  existingAuditors,
  onSave,
}: AssignAuditorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAuditors, setSelectedAuditors] =
    useState<Array<number>>(existingAuditors)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setSelectedAuditors(existingAuditors)
  }, [open, existingAuditors])

  // Filter auditors based on search query
  const filteredAuditors = users.filter(
    (user) =>
      user.role === 'Auditor' &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleToggleAuditor = (auditorId: number) => {
    setSelectedAuditors((prev) =>
      prev.includes(auditorId)
        ? prev.filter((id) => id !== auditorId)
        : [...prev, auditorId],
    )
  }

  const handleSave = async () => {
    setIsSubmitting(true)

    try {
      // Get newly added auditors (those not in existingAuditors)
      const newlyAddedAuditors = selectedAuditors.filter(
        (id) => !existingAuditors.includes(id),
      )

      // Get unselected auditors (those in existingAuditors but not in selectedAuditors)
      const unselectedAuditors = existingAuditors.filter(
        (id) => !selectedAuditors.includes(id),
      )

      // Create compliance access for all selected auditors
      await Promise.all(
        selectedAuditors.map((auditorId) =>
          fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/compliance-access/create`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                compliance_id: complianceId,
                auditor_id: auditorId,
                accessible: true,
              }),
            },
          ),
        ),
      )

      // Grant drive access to newly added auditors
      if (newlyAddedAuditors.length > 0) {
        await Promise.all(
          newlyAddedAuditors.map((auditorId) =>
            fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/drive/compliance/${complianceId}/auditor/${auditorId}`,
              {
                method: 'POST',
                credentials: 'include',
              },
            ),
          ),
        )
      }

      // Handle unselected auditors
      if (unselectedAuditors.length > 0) {
        // Remove compliance access
        await Promise.all(
          unselectedAuditors.map((auditorId) =>
            fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/compliance-access/compliance/${complianceId}/auditor/${auditorId}`,
              {
                method: 'DELETE',
                credentials: 'include',
              },
            ),
          ),
        )

        // Revoke drive access for each unselected auditor
        await Promise.all(
          unselectedAuditors.map((auditorId) =>
            fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/drive/compliance/${complianceId}/auditor/${auditorId}`,
              {
                method: 'DELETE',
                credentials: 'include',
              },
            ),
          ),
        )
      }

      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving auditor assignments:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRefreshAccess = async () => {
    setIsRefreshing(true)
    try {
      // Re-grant access for all selected auditors
      await Promise.all(
        selectedAuditors.map((auditorId) =>
          fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/drive/compliance/${complianceId}/auditor/${auditorId}`,
            {
              method: 'POST',
              credentials: 'include',
            },
          ),
        ),
      )

      toast.success('Successfully refreshed access to all evidence files')
    } catch (error) {
      console.error('Error refreshing access:', error)
      toast.error('Failed to refresh access to evidence files')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Auditors</DialogTitle>
          <DialogDescription>
            Select auditors who will have access to this compliance standard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search auditors..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefreshAccess}
            disabled={isRefreshing || selectedAuditors.length === 0}
            title="Refresh access to all evidence files"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {filteredAuditors.map((auditor) => (
              <div key={auditor.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`auditor-${auditor.id}`}
                  checked={selectedAuditors.includes(auditor.id)}
                  onCheckedChange={() => handleToggleAuditor(auditor.id)}
                />
                <label
                  htmlFor={`auditor-${auditor.id}`}
                  className="flex-1 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <div className="font-medium">{auditor.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {auditor.email}
                  </div>
                </label>
              </div>
            ))}
            {filteredAuditors.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                No auditors found
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
