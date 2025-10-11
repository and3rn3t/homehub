/**
 * Device Edit Dialog
 *
 * Modal dialog for editing device properties (name, room, icon, protocol settings).
 * Supports cascading removal from rooms, scenes, and automations.
 */

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { KV_KEYS, MOCK_ROOMS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import {
  AlertTriangleIcon,
  LightbulbIcon,
  SaveIcon,
  ShieldIcon,
  ThermometerIcon,
  TrashIcon,
  WifiIcon,
} from '@/lib/icons'
import type { Automation, Device, Room, Scene } from '@/types'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DeviceEditDialogProps {
  device: Device | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeviceUpdated?: (device: Device) => void
  onDeviceRemoved?: (deviceId: string) => void
}

const deviceTypeOptions = [
  { value: 'light', label: 'Light', icon: LightbulbIcon },
  { value: 'thermostat', label: 'Thermostat', icon: ThermometerIcon },
  { value: 'security', label: 'Security', icon: ShieldIcon },
  { value: 'sensor', label: 'Sensor', icon: WifiIcon },
]

export function DeviceEditDialog({
  device,
  open,
  onOpenChange,
  onDeviceUpdated,
  onDeviceRemoved,
}: Readonly<DeviceEditDialogProps>) {
  const [, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, [])
  const [rooms] = useKV<Room[]>(KV_KEYS.ROOMS, MOCK_ROOMS)
  const [scenes, setScenes] = useKV<Scene[]>(KV_KEYS.SCENES, [])
  const [automations, setAutomations] = useKV<Automation[]>(KV_KEYS.AUTOMATIONS, [])

  const [name, setName] = useState('')
  const [room, setRoom] = useState('')
  const [type, setType] = useState<Device['type']>('light')
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // Initialize form when device changes
  useEffect(() => {
    if (device) {
      setName(device.name)
      setRoom(device.room)
      setType(device.type)
      setShowRemoveConfirm(false)
    }
  }, [device])

  if (!device) return null

  /**
   * Save device changes
   */
  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Device name is required')
      return
    }

    const updatedDevice: Device = {
      ...device,
      name: name.trim(),
      room,
      type,
    }

    // Update device in list
    setDevices(prevDevices => prevDevices.map(d => (d.id === device.id ? updatedDevice : d)))

    toast.success('Device updated', {
      description: `${name} settings saved`,
    })

    onDeviceUpdated?.(updatedDevice)
    onOpenChange(false)
  }

  /**
   * Remove device with cascade (remove from rooms, scenes, automations)
   */
  const handleRemove = async () => {
    setIsRemoving(true)

    try {
      // 1. Remove device from device list
      setDevices(prevDevices => prevDevices.filter(d => d.id !== device.id))

      // 2. Remove device from scenes
      const scenesWithDevice = scenes.filter(scene =>
        scene.deviceStates?.some(ds => ds.deviceId === device.id)
      )

      if (scenesWithDevice.length > 0) {
        setScenes(prevScenes =>
          prevScenes.map(scene => ({
            ...scene,
            deviceStates: scene.deviceStates?.filter(ds => ds.deviceId !== device.id) || [],
          }))
        )
      }

      // 3. Remove device from automations
      const automationsWithDevice = automations.filter(
        automation =>
          automation.triggers?.some(trigger => trigger.deviceId === device.id) ||
          automation.actions?.some(action => action.deviceId === device.id)
      )

      if (automationsWithDevice.length > 0) {
        setAutomations(prevAutomations =>
          prevAutomations
            // Remove triggers that reference this device
            .map(auto => ({
              ...auto,
              triggers: auto.triggers?.filter(trigger => trigger.deviceId !== device.id) || [],
              actions: auto.actions?.filter(action => action.deviceId !== device.id) || [],
            }))
            // Remove automations with no triggers or actions left
            .filter(auto => auto.triggers.length > 0 && auto.actions.length > 0)
        )
      }

      // Build removal summary
      const removedFrom: string[] = []
      if (scenesWithDevice.length > 0) {
        removedFrom.push(
          `${scenesWithDevice.length} scene${scenesWithDevice.length > 1 ? 's' : ''}`
        )
      }
      if (automationsWithDevice.length > 0) {
        removedFrom.push(
          `${automationsWithDevice.length} automation${automationsWithDevice.length > 1 ? 's' : ''}`
        )
      }

      toast.success('Device removed', {
        description:
          removedFrom.length > 0
            ? `Also removed from ${removedFrom.join(' and ')}`
            : `${device.name} has been deleted`,
      })

      onDeviceRemoved?.(device.id)
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to remove device', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsRemoving(false)
      setShowRemoveConfirm(false)
    }
  }

  /**
   * Calculate how many places this device is used
   */
  const getUsageCount = () => {
    const inScenes = scenes.filter(scene =>
      scene.deviceStates?.some(ds => ds.deviceId === device.id)
    ).length

    const inAutomations = automations.filter(
      auto =>
        auto.triggers?.some(trigger => trigger.deviceId === device.id) ||
        auto.actions?.some(action => action.deviceId === device.id)
    ).length

    return { inScenes, inAutomations }
  }

  const usage = getUsageCount()
  const isUsed = usage.inScenes > 0 || usage.inAutomations > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {!showRemoveConfirm ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit Device</DialogTitle>
              <DialogDescription>Update device settings or remove from your home</DialogDescription>
            </DialogHeader>

            <motion.div
              className="space-y-6 py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Device Name */}
              <div className="space-y-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter device name"
                  className="w-full"
                />
              </div>

              {/* Room */}
              <div className="space-y-2">
                <Label htmlFor="device-room">Room</Label>
                <Select value={room} onValueChange={setRoom}>
                  <SelectTrigger id="device-room">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.name}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Device Type */}
              <div className="space-y-2">
                <Label htmlFor="device-type">Device Type</Label>
                <Select value={type} onValueChange={(value: Device['type']) => setType(value)}>
                  <SelectTrigger id="device-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypeOptions.map(option => {
                      const IconComponent = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Device Info */}
              <div className="bg-muted space-y-2 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{device.status}</span>
                </div>
                {device.protocol && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Protocol</span>
                    <span className="font-medium uppercase">{device.protocol}</span>
                  </div>
                )}
                {device.lastSeen && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Seen</span>
                    <span className="font-medium">
                      {new Date(device.lastSeen).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Usage Warning */}
              {isUsed && (
                <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                  <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div className="text-sm">
                    <p className="mb-1 font-medium text-amber-900 dark:text-amber-100">
                      Device is in use
                    </p>
                    <p className="text-amber-800 dark:text-amber-200">
                      Used in {usage.inScenes} scene{usage.inScenes !== 1 ? 's' : ''} and{' '}
                      {usage.inAutomations} automation{usage.inAutomations !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => setShowRemoveConfirm(true)}
                className="mr-auto"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Remove Device
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Remove Device?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently remove the device and all
                associated data.
              </DialogDescription>
            </DialogHeader>

            <motion.div
              className="space-y-4 py-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium">This will remove:</p>
                <ul className="text-muted-foreground ml-4 list-disc space-y-1 text-sm">
                  <li>Device "{device.name}"</li>
                  {usage.inScenes > 0 && (
                    <li>
                      Device from {usage.inScenes} scene{usage.inScenes > 1 ? 's' : ''}
                    </li>
                  )}
                  {usage.inAutomations > 0 && (
                    <li>
                      Device from {usage.inAutomations} automation
                      {usage.inAutomations > 1 ? 's' : ''}
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
                {isRemoving ? 'Removing...' : 'Remove Device'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
