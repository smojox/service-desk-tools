"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Plus, Pencil, Trash2, Users, Shield, Activity, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface User {
  _id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  permissions: {
    analytics: boolean
    appealCodes: boolean
    admin: boolean
  }
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

interface CreateUserForm {
  email: string
  password: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  permissions: {
    analytics: boolean
    appealCodes: boolean
    admin: boolean
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    name: '',
    role: 'user',
    permissions: {
      analytics: true,
      appealCodes: true,
      admin: false
    }
  })

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user.permissions.admin) {
      router.push('/tools')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session && session.user.permissions.admin) {
      fetchUsers()
    }
  }, [session])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const userData = await response.json()
        setUsers(userData)
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      toast.error('Error fetching users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        toast.success('User created successfully')
        setIsCreateDialogOpen(false)
        setCreateForm({
          email: '',
          password: '',
          name: '',
          role: 'user',
          permissions: {
            analytics: true,
            appealCodes: true,
            admin: false
          }
        })
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Error creating user')
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast.success('User updated successfully')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user')
      }
    } catch (error) {
      toast.error('Error updating user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Error deleting user')
    }
  }

  const handleRoleChange = (role: 'admin' | 'user' | 'viewer') => {
    const permissions = {
      admin: { analytics: true, appealCodes: true, admin: true },
      user: { analytics: true, appealCodes: true, admin: false },
      viewer: { analytics: false, appealCodes: false, admin: false }
    }
    
    setCreateForm({
      ...createForm,
      role,
      permissions: permissions[role]
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!session.user.permissions.admin) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/20"
                onClick={() => router.push('/tools')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools Hub
              </Button>
              <img 
                src="/logo.png" 
                alt="Taranto Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-gray-300 text-xl font-semibold">User Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-white border-white">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 text-2xl flex items-center">
                    <Users className="h-6 w-6 mr-2" />
                    User Management
                  </CardTitle>
                  <p className="text-gray-600 mt-1">Manage users and their permissions</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={createForm.name}
                          onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={createForm.email}
                          onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={createForm.password}
                          onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={createForm.role} onValueChange={handleRoleChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin - Full Access</SelectItem>
                            <SelectItem value="user">User - Standard Access</SelectItem>
                            <SelectItem value="viewer">Viewer - Read Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label>Permissions</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Analytics Dashboard</span>
                            <Switch
                              checked={createForm.permissions.analytics}
                              onCheckedChange={(checked) => 
                                setCreateForm({
                                  ...createForm,
                                  permissions: {...createForm.permissions, analytics: checked}
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Appeal Codes</span>
                            <Switch
                              checked={createForm.permissions.appealCodes}
                              onCheckedChange={(checked) => 
                                setCreateForm({
                                  ...createForm,
                                  permissions: {...createForm.permissions, appealCodes: checked}
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Admin Panel</span>
                            <Switch
                              checked={createForm.permissions.admin}
                              onCheckedChange={(checked) => 
                                setCreateForm({
                                  ...createForm,
                                  permissions: {...createForm.permissions, admin: checked}
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                          Create User
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {user.permissions.analytics && (
                                <Badge variant="secondary" className="text-xs">Analytics</Badge>
                              )}
                              {user.permissions.appealCodes && (
                                <Badge variant="secondary" className="text-xs">Appeals</Badge>
                              )}
                              {user.permissions.admin && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Activity className={`h-3 w-3 mr-1 ${user.isActive ? 'text-green-500' : 'text-red-500'}`} />
                              {user.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(user)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              {user._id !== session.user.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {user.name}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user._id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(role: 'admin' | 'user' | 'viewer') => 
                    setEditingUser({...editingUser, role})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full Access</SelectItem>
                    <SelectItem value="user">User - Standard Access</SelectItem>
                    <SelectItem value="viewer">Viewer - Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics Dashboard</span>
                    <Switch
                      checked={editingUser.permissions.analytics}
                      onCheckedChange={(checked) => 
                        setEditingUser({
                          ...editingUser,
                          permissions: {...editingUser.permissions, analytics: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Appeal Codes</span>
                    <Switch
                      checked={editingUser.permissions.appealCodes}
                      onCheckedChange={(checked) => 
                        setEditingUser({
                          ...editingUser,
                          permissions: {...editingUser.permissions, appealCodes: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Admin Panel</span>
                    <Switch
                      checked={editingUser.permissions.admin}
                      onCheckedChange={(checked) => 
                        setEditingUser({
                          ...editingUser,
                          permissions: {...editingUser.permissions, admin: checked}
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Account Status</span>
                <Switch
                  checked={editingUser.isActive}
                  onCheckedChange={(checked) => 
                    setEditingUser({...editingUser, isActive: checked})
                  }
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleUpdateUser(editingUser._id, editingUser)
                    setEditingUser(null)
                  }}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Update User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}