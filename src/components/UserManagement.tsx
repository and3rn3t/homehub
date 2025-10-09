import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, Crown, Shield, User as UserIcon, Trash2 } from "@phosphor-icons/react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'guest'
  avatar?: string
  createdAt: string
  lastActive: string
  permissions: string[]
}

export function UserManagement() {
  const [users, setUsers] = useKV<User[]>("home-users", [])
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'member' as User['role']
  })

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Please fill in all required fields")
      return
    }

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      permissions: getDefaultPermissions(newUser.role)
    }

    setUsers(currentUsers => [...currentUsers, user])
    setNewUser({ name: '', email: '', role: 'member' })
    setIsAddingUser(false)
    toast.success(`${user.name} has been added to your home`)
  }

  const handleRemoveUser = (userId: string) => {
    setUsers(currentUsers => currentUsers.filter(user => user.id !== userId))
    toast.success("User removed from home")
  }

  const getDefaultPermissions = (role: User['role']): string[] => {
    switch (role) {
      case 'owner':
        return ['all']
      case 'admin':
        return ['devices', 'scenes', 'automation', 'settings', 'users']
      case 'member':
        return ['devices', 'scenes']
      case 'guest':
        return ['scenes']
      default:
        return []
    }
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-500" />
      case 'admin':
        return <Shield size={16} className="text-blue-500" />
      default:
        return <UserIcon size={16} className="text-muted-foreground" />
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage who has access to your smart home</p>
        </div>

        <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus size={18} className="mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Invite someone to access your smart home system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: User['role']) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full access except user management</SelectItem>
                    <SelectItem value="member">Member - Device and scene control</SelectItem>
                    <SelectItem value="guest">Guest - Scene control only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleAddUser} className="flex-1">Add User</Button>
                <Button variant="outline" onClick={() => setIsAddingUser(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserIcon size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Users Added</h3>
              <p className="text-muted-foreground text-center mb-6">
                Add family members and guests to share access to your smart home
              </p>
              <Button onClick={() => setIsAddingUser(true)}>
                <UserPlus size={18} className="mr-2" />
                Add First User
              </Button>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{user.name}</h3>
                      {getRoleIcon(user.role)}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Last active: {new Date(user.lastActive).toLocaleDateString()}
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
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permission Overview</CardTitle>
            <CardDescription>
              What each role can access in your smart home
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-yellow-500" />
                  <span className="font-medium">Owner</span>
                </div>
                <span className="text-sm text-muted-foreground">Full access to everything</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-blue-500" />
                  <span className="font-medium">Admin</span>
                </div>
                <span className="text-sm text-muted-foreground">Devices, scenes, automation, settings</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-muted-foreground" />
                  <span className="font-medium">Member</span>
                </div>
                <span className="text-sm text-muted-foreground">Devices and scenes only</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-muted-foreground" />
                  <span className="font-medium">Guest</span>
                </div>
                <span className="text-sm text-muted-foreground">Scenes only</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}