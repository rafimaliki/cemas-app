import { createFileRoute, redirect } from '@tanstack/react-router'
import { useUserStore } from '@/stores/user-store'

export const Route = createFileRoute('/_authenticated/manage-user/')({
  beforeLoad: () => {
    const user = useUserStore.getState().getStoredUser()

    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: window.location.href,
        },
      })
    }

    if (user.role !== 'Administrator') {
      throw redirect({
        to: '/dashboard',
      })
    }
  },

  component: RouteComponent,
})

function RouteComponent() {
  return <UserManagementPage />
}

import { useState, useEffect } from 'react'
import {
  Check,
  Edit,
  EllipsisVertical,
  Search,
  Shield,
  Trash2,
  UserPlus,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type UserStatus = 'Active' | 'Suspended'
type UserRole = 'Administrator' | 'Contributor' | 'Auditor'
type SortDirection = 'asc' | 'desc'
type SortField = 'name' | 'role' | 'status' | 'lastLogin'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLogin: string | null
  createdAt: string
}

interface SortConfig {
  field: SortField
  direction: SortDirection
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

const apiService = {
  // Fetch all users: Udah oke
  fetchUsers: async (): Promise<ApiResponse<User[]>> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching users:', error)
      return { success: false, message: 'Failed to connect to the server' }
    }
  },

  // Whitelist a new user: Udah oke
  whitelistUser: async (
    email: string,
    role: UserRole,
  ): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/whitelist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, role }),
          credentials: 'include',
        },
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error whitelisting user:', error)
      return { success: false, message: 'Failed to connect to the server' }
    }
  },

  // Update user role: Udah oke
  updateUserRole: async (
    userId: string,
    role: UserRole,
  ): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/role`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
          credentials: 'include',
        },
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error updating user role:', error)
      return { success: false, message: 'Failed to connect to the server' }
    }
  },

  // Delete user: Udah oke
  deleteUser: async (userId: string): Promise<ApiResponse<null>> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error deleting user:', error)
      return { success: false, message: 'Failed to connect to the server' }
    }
  },

  // Update user status
  updateUserStatus: async (
    userId: string,
    status: UserStatus,
  ): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
          credentials: 'include',
        },
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error updating user status:', error)
      return { success: false, message: 'Failed to connect to the server' }
    }
  },
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All')
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc',
  })
  const [isLoading, setIsLoading] = useState(true)

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)

  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('Contributor')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editUserRole, setEditUserRole] = useState<UserRole>('Contributor')

  useEffect(() => {
    let result = [...users]

    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== 'All') {
      result = result.filter((user) => user.status === statusFilter)
    }

    if (roleFilter !== 'All') {
      result = result.filter((user) => user.role === roleFilter)
    }

    result.sort((a, b) => {
      let aValue: any = a[sortConfig.field]
      let bValue: any = b[sortConfig.field]

      if (sortConfig.field === 'lastLogin') {
        aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
        bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    setFilteredUsers(result)
  }, [users, searchTerm, statusFilter, roleFilter, sortConfig])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    const response = await apiService.fetchUsers()

    if (response.success && response.data) {
      setUsers(response.data)
    } else {
      toast.error('Failed to fetch users', { position: 'top-center' })
    }
    setIsLoading(false)
  }

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail)) {
      toast.error('Invalid email format', {
        position: 'top-center',
      })
      return
    }

    if (
      users.some(
        (user) => user.email.toLowerCase() === newUserEmail.toLowerCase(),
      )
    ) {
      toast.error('Email already exists', {
        position: 'top-center',
      })
      return
    }

    const response = await apiService.whitelistUser(newUserEmail, newUserRole)

    if (response.success) {
      toast.success('User has been whitelisted successfully', {
        position: 'top-center',
      })

      if (response.data) {
        setUsers((prevUsers) => [...prevUsers, response.data as User])
      } else {
        await fetchUsers()
      }

      setNewUserEmail('')
      setNewUserRole('Contributor')
      setIsAddUserDialogOpen(false)
    } else {
      toast.error(response.message || 'Failed to whitelist user', {
        position: 'top-center',
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    const response = await apiService.updateUserRole(
      selectedUser.id,
      editUserRole,
    )

    if (response.success) {
      toast.success('User role has been updated successfully', {
        position: 'top-center',
      })
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, role: editUserRole } : user,
        ),
      )

      setIsEditUserDialogOpen(false)
    } else {
      toast.error(response.message || 'Failed to update user role', {
        position: 'top-center',
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    const response = await apiService.deleteUser(selectedUser.id)

    if (response.success) {
      toast.success(
        `User ${selectedUser.name} (${selectedUser.email}) has been deleted`,
        {
          position: 'top-center',
        },
      )

      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== selectedUser.id),
      )

      setIsDeleteUserDialogOpen(false)
    } else {
      toast.error('Failed to delete user', {
        position: 'top-center',
      })
    }
  }

  const handleChangeStatus = async (userId: string, newStatus: UserStatus) => {
    const response = await apiService.updateUserStatus(userId, newStatus)

    if (response.success) {
      toast.success('User has been updated successfully', {
        position: 'top-center',
      })

      // Update the user in the state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user,
        ),
      )
    } else {
      toast.error('Failed to update user status', {
        position: 'top-center',
      })
    }
  }

  const handleSort = (field: SortField) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    }))
  }

  const renderSortIndicator = (field: SortField) => {
    if (sortConfig.field !== field) {
      return null
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 inline" />
    )
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditUserRole(user.role)
    setIsEditUserDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteUserDialogOpen(true)
  }

  const renderStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Check className="w-3 h-3 mr-1" /> Active
          </Badge>
        )
      case 'Suspended':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <X className="w-3 h-3 mr-1" /> Suspended
          </Badge>
        )
    }
  }

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Shield className="w-3 h-3 mr-1" /> Administrator
          </Badge>
        )
      case 'Contributor':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Contributor
          </Badge>
        )
      case 'Auditor':
        return (
          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
            Auditor
          </Badge>
        )
    }
  }

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage User</h1>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Whitelist User
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-4 mb-6">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as UserStatus | 'All')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as UserRole | 'All')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Roles</SelectItem>
            <SelectItem value="Administrator">Administrator</SelectItem>
            <SelectItem value="Contributor">Contributor</SelectItem>
            <SelectItem value="Auditor">Auditor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground mt-5 mb-4">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-100">
              <TableHead
                className="w-[50%] cursor-pointer"
                onClick={() => handleSort('name')}
              >
                User {renderSortIndicator('name')}
              </TableHead>
              <TableHead
                className="w-[15%] cursor-pointer"
                onClick={() => handleSort('role')}
              >
                Role {renderSortIndicator('role')}
              </TableHead>
              <TableHead
                className="w-[15%] cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status {renderSortIndicator('status')}
              </TableHead>
              <TableHead
                className="w-[15%] cursor-pointer"
                onClick={() => handleSort('lastLogin')}
              >
                Last Login {renderSortIndicator('lastLogin')}
              </TableHead>
              <TableHead className="w-[5%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{renderRoleBadge(user.role)}</TableCell>
                  <TableCell>{renderStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        {user.status === 'Active' && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleChangeStatus(user.id, 'Suspended')
                            }
                          >
                            <X className="h-4 w-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        )}
                        {user.status === 'Suspended' && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleChangeStatus(user.id, 'Active')
                            }
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-muted-foreground"
                >
                  No users found matching your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent aria-describedby="add new user">
          <DialogHeader>
            <DialogTitle>Whitelist New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will be active immediately.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAddUser()
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(value) => setNewUserRole(value as UserRole)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Contributor">Contributor</SelectItem>
                    <SelectItem value="Auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
      >
        <DialogContent aria-describedby="change role perm">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role and permissions for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="font-medium">{selectedUser?.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedUser?.email}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editUserRole}
                onValueChange={(value) => setEditUserRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Contributor">Contributor</SelectItem>
                  <SelectItem value="Auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog
        open={isDeleteUserDialogOpen}
        onOpenChange={setIsDeleteUserDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedUser?.name} (
              {selectedUser?.email}) from the system. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
