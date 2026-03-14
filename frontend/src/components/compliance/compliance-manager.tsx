import React, { useState, useEffect, forwardRef } from 'react'
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Trash2,
  Edit,
  Plus,
  Upload,
  Eye,
  Search,
  FileText,
  Shield,
  EllipsisVertical,
  UserPlus,
  TicketPercent,
  Download,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { v4 as uuidv4 } from 'uuid'
import type { ReactNode } from 'react'
import { useKeyStore } from '@/stores/key-store'

import type {
  ComplianceData,
  CriteriaData,
  CommentData,
  EvidenceFile,
  AccessLevel,
  ActivityLogEntry,
  UserInfo,
} from '@/types/compliance-types'

import {
  findCriteriaById,
  updateCriteriaInTree,
  getLevelBackgroundColor,
  removeCriteriaById,
} from '@/lib/criteria-operations'

import {
  updateCriteria,
  createCriteria,
  deleteCriteria,
  addComment,
  addEvidence,
  deleteEvidence,
  fetchActivityLogs,
  editComplianceInfo,
  deleteCompliance,
} from '@/lib/api-service'

import { FileUploaderButton } from '../evidence/file-uploader-button'
import { AssignAuditorDialog } from './assign-auditor-dialog'
import TagCriteriaButton from '../buttons/tag-criteria-button'
import AssignEvidenceCriteriaButton from '../buttons/assign-evidence-criteria-button'
import { Description } from '@radix-ui/react-dialog'

import { downloadEvidenceZip } from '@/lib/download-utils'
import { usersData } from '@/data/users-data'

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'compliant':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Compliant
        </Badge>
      )
    case 'non-compliant':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Non-Compliant
        </Badge>
      )
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          In Progress
        </Badge>
      )
  }
}

// User Selector Component
const UserSelector = ({
  users,
  selectedUserId,
  onChange,
  disabled = false,
}: {
  users: UserInfo[]
  selectedUserId: number | null
  onChange: (userId: number | null) => void
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const usersWithoutAuditors = users.filter((user) => user.role !== 'Auditor')

  const filteredUsers = searchTerm
    ? usersWithoutAuditors.filter(
        (user) =>
          (user.role != 'Auditor' &&
            user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : usersWithoutAuditors

  const selectedUser = users.find((user) => user.id === selectedUserId)

  return (
    <Dialog
      open={isOpen && !disabled}
      onOpenChange={(open) => !disabled && setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          size="sm"
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center max-w-32">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage
                  src={selectedUser.picture}
                  alt={selectedUser.name}
                />
                <AvatarFallback></AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedUser.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Assign PIC</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Person In Charge</DialogTitle>
          <DialogDescription>
            Assign a person responsible for this compliance criteria
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <div className="flex">
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {selectedUserId && (
                <Button
                  onClick={() => {
                    // console.log('Remove PIC')
                    onChange(null)
                    setIsOpen(false)
                  }}
                  className="ml-2"
                >
                  Remove PIC
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => {
                  onChange(user.id)
                  setIsOpen(false)
                }}
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback></AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Evidence Files Component
const EvidenceFiles = ({
  files,
  criteriaId,
  onAddEvidence,
  onDeleteEvidence,
  accessLevel,
  currentUser,
}: {
  files: EvidenceFile[]
  criteriaId: number
  onAddEvidence: (criteriaId: number, file: EvidenceFile) => void
  onDeleteEvidence: (criteriaId: number, fileId: string) => void
  accessLevel: AccessLevel
  currentUser: UserInfo
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const canModify = accessLevel >= 1 // Contributors and Administrators can modify evidence

  const handleFileUpload = (newFile: EvidenceFile) => {
    onAddEvidence(criteriaId, newFile)
  }

  const confirmDeleteFile = (fileId: string) => {
    setFileToDelete(fileId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteFile = () => {
    if (fileToDelete) {
      onDeleteEvidence(criteriaId, fileToDelete)
      setFileToDelete(null)
    }
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {!(currentUser.role === 'Auditor' && files.length === 0) && (
            <Button variant="outline" size="sm">
              {files.length > 0 ? (
                <>
                  <Eye className="h-4 w-4 mr-1" /> Show Files ({files.length})
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add Evidence
                </>
              )}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Evidence Files</DialogTitle>
            <DialogDescription>
              View and manage evidence files for this compliance criteria
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <a
                      className="font-medium truncate hover:underline hover:text-blue-700"
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {file.name}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expired{' '}
                      {file.expiryDate
                        ? new Date(file.expiryDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  {canModify && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDeleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              {files.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No evidence files yet
                </div>
              )}
            </div>
            {canModify && (
              <div className="mt-4 w-full flex justify-center space-x-4">
                {/* <Button onClick={handleFileUpload} className="w-full">
                  <Upload className="h-4 w-4 mr-2" /> Upload New Evidence
                </Button> */}
                <FileUploaderButton
                  criteriaId={criteriaId.toString()}
                  onFilesUploaded={handleFileUpload}
                />
                <AssignEvidenceCriteriaButton
                  criteriaId={criteriaId.toString()}
                  onSuccess={handleFileUpload}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this evidence file. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Comments Component
const CommentsSection = ({
  comments,
  criteriaId,
  onAddComment,
  accessLevel,
  currentUser,
}: {
  comments: CommentData[]
  criteriaId: number
  onAddComment: (criteriaId: number, comment: CommentData) => void
  accessLevel: AccessLevel
  currentUser: UserInfo
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [newComment, setNewComment] = useState('')

  const canAddComments = accessLevel >= 1 // Contributors and Administrators can add comments

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: CommentData = {
      id: uuidv4(),
      userId: currentUser.id.toString(), // Convert number to string
      userName: currentUser.name,
      text: newComment,
      timestamp: new Date().toISOString(),
    }

    onAddComment(criteriaId, comment)
    setNewComment('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription>
            View and add comments for this compliance criteria
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{comment.userName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No comments yet
              </div>
            )}
          </div>
          {canAddComments && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Add Comment
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add/Edit Criteria Component
const CriteriaForm = ({
  isOpen,
  onOpenChange,
  parentId,
  isSibling,
  complianceId,
  existingCriteria,
  onSave,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  parentId: number | null
  isSibling: boolean
  complianceId: number
  existingCriteria?: CriteriaData
  onSave: (criteria: CriteriaData, isEdit: boolean) => void
}) => {
  const [prefix, setPrefix] = useState(existingCriteria?.prefix || '')
  const [name, setName] = useState(existingCriteria?.name || '')
  const [level, setLevel] = useState(
    existingCriteria?.level || (parentId ? 1 : 0),
  )

  const isEdit = !!existingCriteria

  const handleSave = () => {
    if (!prefix.trim() || !name.trim()) return

    const criteriaData: CriteriaData = {
      id: existingCriteria?.id || -1,
      prefix,
      compliance_id: complianceId,
      parent_id: isSibling
        ? (existingCriteria?.parent_id ?? parentId)
        : parentId,
      name,
      description: name,
      level,
      created_at: existingCriteria?.created_at || new Date().toISOString(),
      pic_id: existingCriteria?.pic_id || null,
      status: existingCriteria?.status || 'in-progress',
      evidence: existingCriteria?.evidence || [],
      comments: existingCriteria?.comments || [],
      children: existingCriteria?.children || [],
    }

    onSave(criteriaData, isEdit)
    onOpenChange(false)
  }

  useEffect(() => {
    if (isOpen) {
      setPrefix(existingCriteria?.prefix || '')
      setName(existingCriteria?.name || '')
      setLevel(existingCriteria?.level || (parentId ? 1 : 0))
    }
  }, [isOpen, existingCriteria, parentId])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogDescription className="hidden"></DialogDescription>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Criteria' : 'Add Criteria'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault() // prevent page reload
            if (prefix.trim() && name.trim()) {
              handleSave()
            }
          }}
        >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="prefix" className="text-sm font-medium">
                Criteria Prefix
              </label>
              <Input
                id="prefix"
                autoComplete="off"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g., 5.1.2"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Criteria Name
              </label>
              <Input
                id="name"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Information Security Policy Review"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!prefix.trim() || !name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Compliance Component
const EditComplianceForm = ({
  isOpen,
  onOpenChange,
  complianceId,
  complianceTitle,
  onSave,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  complianceId: number
  complianceTitle: string
  onSave: (title: string) => void
}) => {
  const [title, setTitle] = useState(complianceTitle)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await editComplianceInfo(complianceId, title, title)
      onSave(title)
      useKeyStore.getState().incrementKey()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating criteria:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <Description className="hidden"></Description>
        <DialogHeader>
          <DialogTitle>Edit Compliance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Compliance Name
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., ISO 27001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
// Criteria Row Component
interface CriteriaRowProps {
  criteria: CriteriaData
  level: number
  users: UserInfo[]
  isExpanded: boolean
  onToggleExpand: (id: number) => void
  onUpdateCriteria: (criteria: CriteriaData) => void
  onAddCriteria: (criteria: CriteriaData, isSibling: boolean) => void
  onDeleteCriteria: (id: number) => void
  onAddComment: (criteriaId: number, comment: CommentData) => void
  onAddEvidence: (criteriaId: number, file: EvidenceFile) => void
  onDeleteEvidence: (criteriaId: number, fileId: string) => void
  visibleColumns: {
    criteria: boolean
    tag: boolean
    pic: boolean
    evidence: boolean
    status: boolean
    comments: boolean
    actions: boolean
  }
  accessLevel: AccessLevel
  currentUser: UserInfo
  complianceId: number
}

const CriteriaRow = ({
  criteria,
  level,
  users,
  isExpanded,
  onToggleExpand,
  onUpdateCriteria,
  onAddCriteria,
  onDeleteCriteria,
  onAddComment,
  onAddEvidence,
  onDeleteEvidence,
  visibleColumns,
  accessLevel,
  currentUser,
  complianceId,
}: CriteriaRowProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [addAsSibling, setAddAsSibling] = useState(false)

  const hasChildren = criteria.children && criteria.children.length > 0
  const isLeafNode = !hasChildren

  // Get the specific background color for this level
  const rowBgClass = getLevelBackgroundColor(level)

  // Define permissions based on access level
  const canModifyTag = accessLevel >= 1 // Contributors and Administrators
  const canModifyStatus = accessLevel >= 1 // Contributors and Administrators
  const canModifyPIC = accessLevel >= 1 // Contributors and Administrators
  const canAddEditCriteria = accessLevel >= 1 // Only Administrators
  const canDeleteCriteria = accessLevel >= 1 // Only Administrators
  const canAddComments = accessLevel >= 1 // Contributors and Administrators

  const handleStatusChange = (status: string) => {
    if (!canModifyStatus) return

    const updatedCriteria = {
      ...criteria,
      status: status as 'in-progress' | 'compliant' | 'non-compliant',
    }

    onUpdateCriteria(updatedCriteria)
  }

  const handlePicChange = (userId: number) => {
    if (!canModifyPIC) return

    const updatedCriteria = {
      ...criteria,
      pic_id: userId,
    }

    onUpdateCriteria(updatedCriteria)
  }

  const handleDeleteCriteria = () => {
    if (!canDeleteCriteria) return

    onDeleteCriteria(criteria.id)
    setIsDeleteDialogOpen(false)
  }

  const handleSaveCriteria = (newCriteria: CriteriaData, isEdit: boolean) => {
    if (!canAddEditCriteria) return

    if (isEdit) {
      onUpdateCriteria(newCriteria)
    } else {
      onAddCriteria(newCriteria, addAsSibling)
    }
  }

  return (
    <>
      <tr
        className={`border-b hover:bg-muted/50 transition-colors ${rowBgClass}`}
      >
        <td className="p-2">
          <div className="flex items-center">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onToggleExpand(criteria.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            <div
              className="ml-1"
              style={{
                paddingLeft: `${level * 20 + (!hasChildren ? 24 : 0)}px`,
              }}
            >
              <span className="font-light">{criteria.prefix}.</span>
              <span className="ml-2 ">{criteria.name}</span>
            </div>
          </div>
        </td>
        {visibleColumns.pic && canModifyPIC && (
          <td className="p-2">
            {isLeafNode && (
              <UserSelector
                users={users}
                selectedUserId={criteria.pic_id}
                onChange={handlePicChange}
                disabled={!canModifyPIC}
              />
            )}
          </td>
        )}
        {visibleColumns.tag && canModifyTag && (
          <td className="p-2">
            {isLeafNode && (
              <TagCriteriaButton
                criteriaId={criteria.id}
                className="bg-white border text-black h-8 hover:bg-muted/50"
              />
            )}
          </td>
        )}
        {visibleColumns.evidence && (
          <td className="p-2">
            {isLeafNode && (
              <EvidenceFiles
                files={criteria.evidence || []}
                criteriaId={criteria.id}
                onAddEvidence={onAddEvidence}
                onDeleteEvidence={onDeleteEvidence}
                accessLevel={accessLevel}
                currentUser={currentUser}
              />
            )}
          </td>
        )}
        {visibleColumns.status && (
          <td className="p-2">
            {canModifyStatus ? (
              <Select
                value={criteria.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    <StatusBadge status={criteria.status} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-progress">
                    <StatusBadge status="in-progress" />
                  </SelectItem>
                  <SelectItem value="compliant">
                    <StatusBadge status="compliant" />
                  </SelectItem>
                  <SelectItem value="non-compliant">
                    <StatusBadge status="non-compliant" />
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="w-[140px]">
                <StatusBadge status={criteria.status} />
              </div>
            )}
          </td>
        )}
        {visibleColumns.comments && canAddComments && (
          <td className="p-2">
            {isLeafNode && (
              <CommentsSection
                comments={criteria.comments || []}
                criteriaId={criteria.id}
                onAddComment={onAddComment}
                accessLevel={accessLevel}
                currentUser={currentUser}
              />
            )}
          </td>
        )}
        {visibleColumns.actions && accessLevel > 0 && (
          <td className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canAddEditCriteria && (
                  <DropdownMenuItem
                    onClick={() => {
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Criteria
                  </DropdownMenuItem>
                )}
                {canAddEditCriteria && (
                  <DropdownMenuItem
                    onClick={() => {
                      setAddAsSibling(false)
                      setIsAddDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child Criteria
                  </DropdownMenuItem>
                )}
                {canAddEditCriteria && (
                  <DropdownMenuItem
                    onClick={() => {
                      setAddAsSibling(true)
                      setIsAddDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sibling Criteria
                  </DropdownMenuItem>
                )}
                {canDeleteCriteria && (
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                    Delete Criteria
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        )}
      </tr>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this criteria and all its children.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCriteria}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CriteriaForm
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        parentId={addAsSibling ? criteria.parent_id : criteria.id}
        isSibling={addAsSibling}
        complianceId={complianceId}
        onSave={handleSaveCriteria}
      />

      <CriteriaForm
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        parentId={null}
        isSibling={false}
        complianceId={complianceId}
        existingCriteria={criteria}
        onSave={handleSaveCriteria}
      />
    </>
  )
}

// Activity Log Component
const ActivityLogDialog = ({
  isOpen,
  onOpenChange,
  logs = [],
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  logs: ActivityLogEntry[]
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details &&
        log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.criteriaPrefix &&
        log.criteriaPrefix.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.category &&
        log.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.complianceName &&
        log.complianceName.toLowerCase().includes(searchTerm.toLowerCase()))

    if (filterType === 'all') return matchesSearch
    if (filterType === 'compliance') return matchesSearch && !!log.complianceId
    if (filterType === 'system') return matchesSearch && !log.complianceId
    return (
      matchesSearch &&
      log.action.toLowerCase().includes(filterType.toLowerCase())
    )
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Activity Log</DialogTitle>
          <DialogDescription>
            View all activities performed in the compliance management system
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="compliance">Compliance Actions</SelectItem>
              <SelectItem value="system">System Actions</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="space-y-2">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <Card key={log.id} className="p-0">
                  <CardHeader className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-medium flex items-center">
                          <span className="mr-2">{log.userName}</span>
                          {log.category && (
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                          )}
                          {log.criteriaPrefix && (
                            <Badge className="ml-2 text-xs bg-blue-100 text-blue-800">
                              {log.criteriaPrefix}
                            </Badge>
                          )}
                          {log.complianceName && (
                            <Badge className="ml-2 text-xs bg-green-100 text-green-800">
                              {log.complianceName}
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  {log.details && (
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm">{log.details}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found matching your filters
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const DeleteComplianceConfirmationDialog = ({
  isOpen,
  onOpenChange,
  complianceName,
  onDelete,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  complianceName: string
  onDelete: () => void
}) => {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isOpen) {
      setCountdown(5)
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setCountdown(5)
    }

    return () => clearInterval(timer)
  }, [isOpen])

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Compliance</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the compliance "{complianceName}"?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onClick={onDelete}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `Delete in ${countdown}s` : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Column Filter Component
const ColumnFilter = ({
  visibleColumns,
  setVisibleColumns,
}: {
  visibleColumns: {
    criteria: boolean
    pic: boolean
    evidence: boolean
    status: boolean
    comments: boolean
    actions: boolean
  }
  setVisibleColumns: (columns: any) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <CustomTooltip tip="Filter Colums">
          <Button variant="outline" size="sm" className="cursor-pointer h-9">
            <Eye className="h-4 w-4 " />
          </Button>
        </CustomTooltip>
        {/* <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Columns
        </Button> */}
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-2">
          {/* <h4 className="font-medium">Toggle Columns</h4> */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="column-criteria"
                checked={visibleColumns.criteria}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, criteria: !!checked })
                }
                disabled={true} // Criteria column should always be visible
              />
              <label htmlFor="column-criteria" className="text-sm">
                Criteria
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="column-pic"
                checked={visibleColumns.pic}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, pic: !!checked })
                }
              />
              <label htmlFor="column-pic" className="text-sm">
                PIC
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="column-tag"
                checked={visibleColumns.tag}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, tag: !!checked })
                }
              />
              <label htmlFor="column-tag" className="text-sm">
                Tag
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="column-evidence"
                checked={visibleColumns.evidence}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, evidence: !!checked })
                }
              />
              <label htmlFor="column-evidence" className="text-sm">
                Evidence
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="column-status"
                checked={visibleColumns.status}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, status: !!checked })
                }
              />
              <label htmlFor="column-status" className="text-sm">
                Status
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="column-comments"
                checked={visibleColumns.comments}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, comments: !!checked })
                }
              />
              <label htmlFor="column-comments" className="text-sm">
                Comments
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="column-actions"
                checked={visibleColumns.actions}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, actions: !!checked })
                }
              />
              <label htmlFor="column-actions" className="text-sm">
                Actions
              </label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Main Component
interface ComplianceManagerProps {
  complianceDataParam: ComplianceData
  usersData: UserInfo[]
  accessLevel: AccessLevel
  currentUser: UserInfo
}

export default function ComplianceManager({
  complianceDataParam,
  usersData,
  accessLevel = 0, // Default to Auditor
  currentUser,
}: ComplianceManagerProps) {
  const [complianceData, setComplianceData] =
    useState<ComplianceData>(complianceDataParam)
  const [expandedCriterias, setExpandedCriterias] = useState<Set<number>>(
    new Set(),
  )
  const [showAllCriterias, setShowAllCriterias] = useState(true)
  const [isAddRootDialogOpen, setIsAddRootDialogOpen] = useState(false)
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false)
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([])

  const [isAssignAuditorOpen, setIsAssignAuditorOpen] = useState(false)
  const [existingAuditors, setExistingAuditors] = useState<number[]>([])

  const [isEditComplianceOpen, setIsEditComplianceOpen] = useState(false)
  const [isDeleteComplainceOpen, setIsDeleteComplianceOpen] = useState(false)

  const fetchAuditors = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/compliance-access/compliance/${complianceDataParam.id}`,
        {
          method: 'GET',
          credentials: 'include',
        },
      )

      if (!response.ok) throw new Error('Failed to fetch auditors')

      const data = await response.json()
      const auditorIds = data.data.map((access: any) => access.auditor_id)
      setExistingAuditors(auditorIds)
    } catch (error) {
      console.error('Error fetching auditors:', error)
    }
  }

  useEffect(() => {
    fetchAuditors()
  }, [complianceData.id])

  // Add the column filter component
  const [visibleColumns, setVisibleColumns] = useState({
    criteria: true,
    tag: true,
    pic: true,
    evidence: true,
    status: true,
    comments: true,
    actions: true,
  })

  // Fetch activity logs
  useEffect(() => {
    if (accessLevel < 1) return
    const fetchLogs = async () => {
      try {
        const logs: any = await fetchActivityLogs(complianceData.id)
        // console.log('Fetched logs:', logs.data)
        setActivityLogs(logs.data)
      } catch (error) {
        console.error('Error fetching activity logs:', error)
        setActivityLogs([])
      }
    }

    fetchLogs()
  }, [complianceData.id])

  // Expand all criteria by default
  useEffect(() => {
    const allIds = new Set<number>()

    const collectIds = (criterias: CriteriaData[]) => {
      criterias.forEach((criteria) => {
        if (criteria.children && criteria.children.length > 0) {
          allIds.add(criteria.id)
          collectIds(criteria.children)
        }
      })
    }

    collectIds(complianceData.criterias)
    setExpandedCriterias(allIds)
  }, [])

  // Toggle expand/collapse for a criteria
  const handleToggleExpand = (id: number) => {
    setExpandedCriterias((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Toggle show/hide all criterias
  const handleToggleShowAll = () => {
    if (showAllCriterias) {
      // Collapse all
      setExpandedCriterias(new Set())
    } else {
      // Expand all
      const allIds = new Set<number>()

      const collectIds = (criterias: CriteriaData[]) => {
        criterias.forEach((criteria) => {
          if (criteria.children && criteria.children.length > 0) {
            allIds.add(criteria.id)
            collectIds(criteria.children)
          }
        })
      }

      collectIds(complianceData.criterias)
      setExpandedCriterias(allIds)
    }

    setShowAllCriterias(!showAllCriterias)
  }

  // Update a criteria
  const handleUpdateCriteria = async (updatedCriteria: CriteriaData) => {
    try {
      // Call API to update criteria
      await updateCriteria(updatedCriteria)

      // Update local state
      const { criteria, path } = findCriteriaById(
        complianceData.criterias,
        updatedCriteria.id,
      )

      if (!criteria) return

      const updatedCriterias = updateCriteriaInTree(
        complianceData.criterias,
        path,
        updatedCriteria,
      )

      setComplianceData({
        ...complianceData,
        criterias: updatedCriterias,
      })
    } catch (error) {
      console.error('Error updating criteria:', error)
    }
  }

  // Add a new criteria
  const handleAddCriteria = async (
    newCriteria: CriteriaData,
    isSibling: boolean,
  ) => {
    try {
      // Ensure compliance_id is set
      newCriteria.compliance_id = complianceData.id

      // Call API to create criteria
      const createdCriteria = await createCriteria(newCriteria)

      const criteriaToAdd = {
        ...newCriteria,
        id: createdCriteria.id,
      }

      // Resolve parent ID
      const parentId =
        isSibling && criteriaToAdd.parent_id
          ? criteriaToAdd.parent_id
          : criteriaToAdd.parent_id || -1

      // Find parent and path
      const { criteria: parent, path } = findCriteriaById(
        complianceData.criterias,
        parentId,
      )

      if (!parent) {
        setComplianceData({
          ...complianceData,
          criterias: [...complianceData.criterias, createdCriteria],
        })
      } else {
        // Create updated parent with new child
        const updatedParent = {
          ...parent,
          children: [...(parent.children || []), criteriaToAdd],
        }

        // Update the tree
        const updatedCriterias = updateCriteriaInTree(
          complianceData.criterias,
          path,
          updatedParent,
        )

        // Update state
        setComplianceData({
          ...complianceData,
          criterias: updatedCriterias,
        })

        // Auto-expand parent in UI
        setExpandedCriterias((prev) => new Set([...prev, parentId]))
      }
    } catch (error) {
      console.error('Error adding criteria:', error)
      // Don't update the UI if there was an error
    }
  }

  // Add a comment to a criteria
  const handleAddComment = async (criteriaId: number, comment: CommentData) => {
    try {
      // Call API to add comment with compliance_id
      const createdComment = await addComment(
        criteriaId,
        comment,
        complianceData.id,
      )

      // Update local state
      const { criteria, path } = findCriteriaById(
        complianceData.criterias,
        criteriaId,
      )

      if (!criteria) return

      const updatedCriteria = {
        ...criteria,
        comments: [...(criteria.comments || []), createdComment],
      }

      const updatedCriterias = updateCriteriaInTree(
        complianceData.criterias,
        path,
        updatedCriteria,
      )

      setComplianceData({
        ...complianceData,
        criterias: updatedCriterias,
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      // Don't update the UI if there was an error
    }
  }

  // Add evidence to a criteria
  const handleAddEvidence = async (criteriaId: number, file: EvidenceFile) => {
    try {
      // Call API to add evidence with compliance_id
      // const createdEvidence = await addEvidence(
      //   criteriaId,
      //   file,
      //   complianceData.id,
      // )

      // Update local state
      const { criteria, path } = findCriteriaById(
        complianceData.criterias,
        criteriaId,
      )

      // console.log(
      //   'Adding evidence to criteria "Handle Add Evidence":',
      //   criteriaId,
      //   file,
      // )

      if (!criteria) return

      const updatedCriteria = {
        ...criteria,
        evidence: [...(criteria.evidence || []), file], // Use server-generated evidence
      }

      const updatedCriterias = updateCriteriaInTree(
        complianceData.criterias,
        path,
        updatedCriteria,
      )

      setComplianceData({
        ...complianceData,
        criterias: updatedCriterias,
      })
    } catch (error) {
      console.error('Error adding evidence:', error)
      // Don't update the UI if there was an error
    }
  }

  // Delete evidence from a criteria
  const handleDeleteEvidence = async (criteriaId: number, fileId: string) => {
    try {
      const { criteria, path } = findCriteriaById(
        complianceData.criterias,
        criteriaId,
      )

      if (!criteria) return

      const fileToDelete = criteria.evidence?.find((file) => file.id === fileId)

      // Call API to delete evidence with compliance_id
      await deleteEvidence(criteriaId, fileId, complianceData.id)

      // Update local state
      const updatedCriteria = {
        ...criteria,
        evidence: criteria.evidence?.filter((file) => file.id !== fileId) || [],
      }

      const updatedCriterias = updateCriteriaInTree(
        complianceData.criterias,
        path,
        updatedCriteria,
      )

      setComplianceData({
        ...complianceData,
        criterias: updatedCriterias,
      })
    } catch (error) {
      console.error('Error deleting evidence:', error)
    }
  }

  // Download all evidence for a compliance
  const handleDownloadAllEvidence = async () => {
    try {
      await downloadEvidenceZip(complianceData.criterias, complianceData.title)
    } catch (error) {
      console.error('Error downloading evidence ZIP:', error)
      alert('Failed to download evidence.')
    }
  }

  // Delete a criteria
  const handleDeleteCriteria = async (id: number) => {
    try {
      // Call API to delete criteria with compliance_id
      await deleteCriteria(id, complianceData.id)

      // Update local state
      const updatedCriterias = removeCriteriaById(complianceData.criterias, id)

      setComplianceData({
        ...complianceData,
        criterias: updatedCriterias,
      })

      // console.log('Compliance data after deletion:', updatedCriterias)
    } catch (error) {
      console.error('Error deleting criteria:', error)
    }
  }

  // Add root criteria
  const handleAddRootCriteria = async (newCriteria: CriteriaData) => {
    try {
      // Ensure compliance_id is set
      newCriteria.compliance_id = complianceData.id

      // Call API to create criteria
      const createdCriteria = await createCriteria(newCriteria)

      // Update local state
      setComplianceData({
        ...complianceData,
        criterias: [...complianceData.criterias, createdCriteria],
      })
    } catch (error) {
      console.error('Error adding root criteria:', error)
    }
  }

  const handleShowActivityLog = () => {
    setIsActivityLogOpen(true)
  }

  // Render criteria rows recursively
  const renderCriteriaRows = (
    criterias: CriteriaData[],
    level = 0,
  ): ReactNode[] => {
    return criterias.flatMap((criteria) => {
      const isExpanded = expandedCriterias.has(criteria.id)

      const rows = [
        <CriteriaRow
          key={criteria.id}
          criteria={criteria}
          level={level}
          users={usersData}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
          onUpdateCriteria={handleUpdateCriteria}
          onAddCriteria={handleAddCriteria}
          onDeleteCriteria={handleDeleteCriteria}
          onAddComment={handleAddComment}
          onAddEvidence={handleAddEvidence}
          onDeleteEvidence={handleDeleteEvidence}
          visibleColumns={visibleColumns}
          accessLevel={accessLevel}
          currentUser={currentUser}
          complianceId={complianceData.id}
        />,
      ]

      if (isExpanded && criteria.children && criteria.children.length > 0) {
        rows.push(...renderCriteriaRows(criteria.children, level + 1))
      }

      return rows
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{complianceData.title}</h2>
        </div>
        <div className="flex space-x-2">
          {accessLevel >= 2 && (
            <CustomTooltip tip="Delete Compliance">
              <Button
                variant="outline"
                onClick={() => setIsDeleteComplianceOpen(true)}
                className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CustomTooltip>
          )}
          <CustomTooltip tip="Download All Evidence">
            <Button
              variant="outline"
              onClick={handleDownloadAllEvidence}
              className="cursor-pointer "
            >
              <Download className="h-4 w-4" />
            </Button>
          </CustomTooltip>

          {accessLevel >= 2 && (
            <CustomTooltip tip="Edit Compliance">
              <Button
                variant="outline"
                onClick={() => setIsEditComplianceOpen(true)}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CustomTooltip>
          )}
          {accessLevel >= 2 && (
            <CustomTooltip tip="Assign Auditors">
              <Button
                variant="outline"
                onClick={() => setIsAssignAuditorOpen(true)}
                className="cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </CustomTooltip>
          )}
          {accessLevel >= 1 && (
            <CustomTooltip tip="Activity Log">
              <Button
                variant="outline"
                onClick={handleShowActivityLog}
                className="cursor-pointer"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </CustomTooltip>
          )}
          <ColumnFilter
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
          />
          <Button
            variant="outline"
            onClick={handleToggleShowAll}
            className="w-[100px] cursor-pointer"
          >
            {showAllCriterias ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-2 font-medium">Criteria</th>
                {visibleColumns.pic && accessLevel > 0 && (
                  <th className="text-left p-2 font-medium w-[180px]">PIC</th>
                )}
                {visibleColumns.tag && accessLevel > 0 && (
                  <th className="text-left p-2 font-medium w-[70px]">Tag</th>
                )}
                {visibleColumns.evidence && (
                  <th className="text-left p-2 font-medium w-[150px]">
                    Evidence
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="text-left p-2 font-medium w-[150px]">
                    Status
                  </th>
                )}
                {visibleColumns.comments && accessLevel >= 1 && (
                  <th className="text-left p-2 font-medium w-[80px]">
                    Comments
                  </th>
                )}
                {visibleColumns.actions && accessLevel > 0 && (
                  <th className="text-left p-2 font-medium w-[0px]"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {complianceData.criterias.length > 0 ? (
                renderCriteriaRows(complianceData.criterias)
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground"
                  >
                    <div className="space-y-4">
                      <p>
                        {' '}
                        You don't have any criteria yet. Create one to get
                        started.{' '}
                      </p>
                      {/* {accessLevel >= 2 && (
                          <Button onClick={() => setIsAddRootDialogOpen(true)}>
                            Add Criteria
                          </Button>
                        )} */}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {accessLevel >= 1 && (
        <div className="flex justify-end">
          <Button onClick={() => setIsAddRootDialogOpen(true)}>
            Add Criteria
          </Button>
        </div>
      )}

      <CriteriaForm
        isOpen={isAddRootDialogOpen}
        onOpenChange={setIsAddRootDialogOpen}
        parentId={null}
        isSibling={false}
        complianceId={complianceData.id}
        onSave={(criteria) => {
          handleAddRootCriteria(criteria)
          setIsAddRootDialogOpen(false)
        }}
      />

      <ActivityLogDialog
        isOpen={isActivityLogOpen}
        onOpenChange={setIsActivityLogOpen}
        logs={activityLogs}
      />

      <AssignAuditorDialog
        open={isAssignAuditorOpen}
        onOpenChange={setIsAssignAuditorOpen}
        complianceId={Number(complianceData.id)}
        users={usersData}
        existingAuditors={existingAuditors}
        onSave={() => {
          fetchAuditors()
        }}
      />

      <EditComplianceForm
        isOpen={isEditComplianceOpen}
        onOpenChange={setIsEditComplianceOpen}
        complianceId={complianceData.id}
        complianceTitle={complianceData.title}
        onSave={(title: string) => {
          setComplianceData({ ...complianceData, title })
          setIsEditComplianceOpen(false)
        }}
      />

      <DeleteComplianceConfirmationDialog
        isOpen={isDeleteComplainceOpen}
        onOpenChange={setIsDeleteComplianceOpen}
        complianceName={complianceData.title}
        onDelete={async () => {
          try {
            await deleteCompliance(complianceData.id)
            // Optionally, redirect or update state after deletion
            setIsDeleteComplianceOpen(false)
          } catch (error) {
            console.error('Error deleting compliance:', error)
          }
        }}
      />
    </div>
  )
}

const CustomTooltip = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'> & { tip: string }
>(({ tip, children, ...props }, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      {React.cloneElement(children as React.ReactElement, {
        ref,
        ...props,
      })}
    </TooltipTrigger>
    <TooltipContent>
      <p>{tip}</p>
    </TooltipContent>
  </Tooltip>
))

CustomTooltip.displayName = 'CustomTooltip'
