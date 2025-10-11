import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useKV } from '@/hooks/use-kv'
import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  RefreshIcon,
  TrashIcon,
  UploadIcon,
} from '@/lib/icons'
import { useState } from 'react'
import { toast } from 'sonner'

interface Backup {
  id: string
  name: string
  createdAt: string
  size: string
  type: 'auto' | 'manual'
  status: 'completed' | 'in-progress' | 'failed'
  devices: number
  automations: number
  scenes: number
}

interface BackupSettings {
  autoBackup: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  retention: number
  location: 'local' | 'cloud'
  includeDeviceHistory: boolean
}

export function BackupRecovery() {
  const [backups, setBackups] = useKV<Backup[]>('system-backups', [
    {
      id: '1',
      name: 'Auto Backup - Dec 15',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      size: '2.4 MB',
      type: 'auto',
      status: 'completed',
      devices: 12,
      automations: 8,
      scenes: 5,
    },
    {
      id: '2',
      name: 'Manual Backup - Dec 10',
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      size: '2.1 MB',
      type: 'manual',
      status: 'completed',
      devices: 10,
      automations: 6,
      scenes: 4,
    },
  ])

  const [settings, setSettings] = useKV<BackupSettings>('backup-settings', {
    autoBackup: true,
    frequency: 'weekly',
    retention: 30,
    location: 'local',
    includeDeviceHistory: false,
  })

  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [backupName, setBackupName] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState(0)

  const handleCreateManualBackup = async () => {
    if (!backupName) {
      toast.error('Please enter a backup name')
      return
    }

    setIsCreatingBackup(true)

    // Simulate backup creation
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newBackup: Backup = {
      id: Date.now().toString(),
      name: backupName,
      createdAt: new Date().toISOString(),
      size: '2.6 MB',
      type: 'manual',
      status: 'completed',
      devices: 12,
      automations: 8,
      scenes: 5,
    }

    setBackups(currentBackups => [newBackup, ...currentBackups])
    setBackupName('')
    setIsCreatingBackup(false)
    toast.success('Backup created successfully')
  }

  const handleRestore = async (backup: Backup) => {
    setIsRestoring(true)
    setRestoreProgress(0)

    // Simulate restore process
    for (let i = 0; i <= 100; i += 10) {
      setRestoreProgress(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsRestoring(false)
    setRestoreProgress(0)
    toast.success(`System restored from "${backup.name}"`)
  }

  const handleDeleteBackup = (backupId: string) => {
    setBackups(currentBackups => currentBackups.filter(b => b.id !== backupId))
    toast.success('Backup deleted')
  }

  const getStatusIcon = (status: Backup['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <ClockIcon className="h-4 w-4 animate-spin text-yellow-500" />
      case 'failed':
        return <AlertTriangleIcon className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: Backup['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            Completed
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
            In Progress
          </Badge>
        )
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  const updateSettings = (key: keyof BackupSettings, value: any) => {
    setSettings(current => ({ ...current, [key]: value }))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backup & Recovery</h1>
          <p className="text-muted-foreground">Protect your smart home configuration and data</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UploadIcon className="mr-2 h-4.5 w-4.5" />
              Create Backup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Manual Backup</DialogTitle>
              <DialogDescription>Save your current smart home configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="backup-name">Backup Name</Label>
                <Input
                  id="backup-name"
                  value={backupName}
                  onChange={e => setBackupName(e.target.value)}
                  placeholder="e.g., Before vacation setup"
                />
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="mb-2 font-medium">What's included:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• All device configurations</li>
                  <li>• Automation rules and schedules</li>
                  <li>• Scene settings</li>
                  <li>• User preferences</li>
                  <li>• Room organization</li>
                </ul>
              </div>
              <Button
                onClick={handleCreateManualBackup}
                disabled={isCreatingBackup}
                className="w-full"
              >
                {isCreatingBackup ? (
                  <>
                    <RefreshIcon className="mr-2 h-4.5 w-4.5 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4.5 w-4.5" />
                    Create Backup
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Settings</CardTitle>
          <CardDescription>Configure automatic backup preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-backup">Automatic Backups</Label>
              <p className="text-muted-foreground text-sm">
                Automatically create backups on a schedule
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={settings.autoBackup}
              onCheckedChange={checked => updateSettings('autoBackup', checked)}
            />
          </div>

          {settings.autoBackup && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="frequency">Backup Frequency</Label>
                  <Select
                    value={settings.frequency}
                    onValueChange={(value: BackupSettings['frequency']) =>
                      updateSettings('frequency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="retention">Keep Backups (days)</Label>
                  <Input
                    id="retention"
                    type="number"
                    value={settings.retention}
                    onChange={e => updateSettings('retention', parseInt(e.target.value))}
                    min="7"
                    max="365"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Storage Location</Label>
                <Select
                  value={settings.location}
                  onValueChange={(value: BackupSettings['location']) =>
                    updateSettings('location', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage (Raspberry Pi)</SelectItem>
                    <SelectItem value="cloud">Cloud Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="device-history">Include Device History</Label>
                  <p className="text-muted-foreground text-sm">
                    Include device usage history and logs (increases backup size)
                  </p>
                </div>
                <Switch
                  id="device-history"
                  checked={settings.includeDeviceHistory}
                  onCheckedChange={checked => updateSettings('includeDeviceHistory', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Restore Progress */}
      {isRestoring && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <RefreshIcon className="text-primary h-6 w-6 animate-spin" />
              <div className="flex-1">
                <h3 className="mb-2 font-medium">Restoring System...</h3>
                <Progress value={restoreProgress} className="h-2" />
                <p className="text-muted-foreground mt-2 text-sm">
                  {restoreProgress < 30
                    ? 'Preparing restore...'
                    : restoreProgress < 60
                      ? 'Restoring device configurations...'
                      : restoreProgress < 90
                        ? 'Restoring automations and scenes...'
                        : 'Finalizing restore...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Backups</CardTitle>
          <CardDescription>Restore your system from a previous backup</CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="py-8 text-center">
              <ArchiveIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-medium">No Backups Available</h3>
              <p className="text-muted-foreground mb-4">
                Create your first backup to protect your smart home configuration
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map(backup => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="font-medium">{backup.name}</h4>
                        {getStatusBadge(backup.status)}
                        <Badge variant="outline" className="text-xs">
                          {backup.type === 'auto' ? 'Auto' : 'Manual'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {new Date(backup.createdAt).toLocaleDateString()} • {backup.size} •
                        {backup.devices} devices, {backup.automations} automations, {backup.scenes}{' '}
                        scenes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(backup)}
                      disabled={isRestoring || backup.status !== 'completed'}
                    >
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Information</CardTitle>
          <CardDescription>Monitor your backup storage usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-1 text-2xl font-bold">4.8 MB</div>
              <div className="text-muted-foreground text-sm">Total Backup Size</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-2xl font-bold">{backups.length}</div>
              <div className="text-muted-foreground text-sm">Available Backups</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-2xl font-bold">28.2 GB</div>
              <div className="text-muted-foreground text-sm">Storage Available</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
