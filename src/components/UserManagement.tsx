import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MOCK_USERS } from '@/constants'
import { useHaptic } from '@/hooks/use-haptic'
import { useKV } from '@/hooks/use-kv'
import {
  EditIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
  UserPlusIcon,
} from '@/lib/icons'
import type { User, UserPermissions } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'

export function UserManagement() {
  const [users, setUsers] = useKV<User[]>('home-users', MOCK_USERS)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'member' as User['role'],
  })
  const haptic = useHaptic()

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Please fill in all required fields')
      return
    }

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: getDefaultPermissions(newUser.role),
      lastActive: new Date(),
    }

    setUsers(currentUsers => [...currentUsers, user])
    setNewUser({ name: '', email: '', role: 'member' })
    setIsAddingUser(false)
    toast.success(`${user.name} has been added to your home`)
  }

  const handleRemoveUser = (userId: string) => {
    setUsers(currentUsers => currentUsers.filter(user => user.id !== userId))
    toast.success('User removed from home')
  }

  // Context menu handlers
  const handleEditUser = (user: User) => {
    haptic.light()
    toast.info(`Edit ${user.name}`, {
      description: 'User editor coming soon',
    })
  }

  const handleChangeRole = (user: User) => {
    haptic.light()
    toast.info(`Change role for ${user.name}`, {
      description: 'Role selector coming soon',
    })
  }

  const handleRemoveUserContext = (user: User) => {
    haptic.heavy()
    handleRemoveUser(user.id)
  }

  const getDefaultPermissions = (role: User['role']): UserPermissions => {
    switch (role) {
      case 'owner':
      case 'admin':
        return {
          canEditDevices: true,
          canCreateScenes: true,
          canManageUsers: true,
          canViewSecurity: true,
        }
      case 'member':
        return {
          canEditDevices: true,
          canCreateScenes: true,
          canManageUsers: false,
          canViewSecurity: false,
        }
      case 'guest':
        return {
          canEditDevices: false,
          canCreateScenes: false,
          canManageUsers: false,
          canViewSecurity: false,
        }
      default:
        return {
          canEditDevices: false,
          canCreateScenes: false,
          canManageUsers: false,
          canViewSecurity: false,
        }
    }
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'owner':
        return <ShieldCheckIcon className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <ShieldIcon className="h-4 w-4 text-blue-500" />
      default:
        return <UserIcon className="text-muted-foreground h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'member':
        return 'outline'
      case 'guest':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage who has access to your smart home</p>
        </div>

        <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
          <DialogTrigger asChild>
            <Button>
              <UserPlusIcon className="mr-2 h-[18px] w-[18px]" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Invite someone to access your smart home system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: User['role']) =>
                    setNewUser(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      Admin - Full access except user management
                    </SelectItem>
                    <SelectItem value="member">Member - Device and scene control</SelectItem>
                    <SelectItem value="guest">Guest - Scene control only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleAddUser} className="flex-1">
                  Add User
                </Button>
                <Button variant="outline" onClick={() => setIsAddingUser(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserIcon className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-medium">No Users Added</h3>
              <p className="text-muted-foreground mb-6 text-center">
                Add family members and guests to share access to your smart home
              </p>
              <Button onClick={() => setIsAddingUser(true)}>
                <UserPlusIcon className="mr-2 h-[18px] w-[18px]" />
                Add First User
              </Button>
            </CardContent>
          </Card>
        ) : (
          users.map(user => (
            <ContextMenu key={user.id}>
              <ContextMenuTrigger asChild>
                <Card>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-medium">{user.name}</h3>
                          {getRoleIcon(user.role)}
                        </div>
                        <p className="text-muted-foreground text-sm">{user.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            Last active:{' '}
                            {user.lastActive
                              ? new Date(user.lastActive).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => handleEditUser(user)} className="gap-2">
                  <EditIcon className="h-4 w-4" />
                  Edit User
                </ContextMenuItem>
                {user.role !== 'owner' && (
                  <>
                    <ContextMenuItem onClick={() => handleChangeRole(user)} className="gap-2">
                      <ShieldIcon className="h-4 w-4" />
                      Change Role
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => handleRemoveUserContext(user)}
                      className="gap-2 text-red-600 dark:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove User
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))
        )}
      </div>

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permission Overview</CardTitle>
            <CardDescription>What each role can access in your smart home</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Owner</span>
                </div>
                <span className="text-muted-foreground text-sm">Full access to everything</span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Admin</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  Devices, scenes, automation, settings
                </span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">Member</span>
                </div>
                <span className="text-muted-foreground text-sm">Devices and scenes only</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">Guest</span>
                </div>
                <span className="text-muted-foreground text-sm">Scenes only</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
