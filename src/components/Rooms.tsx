import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/error-state'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RoomCardSkeleton } from '@/components/ui/skeleton'
import { KV_KEYS, MOCK_DEVICES, MOCK_ROOMS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { Device, Room } from '@/types'
import { DotsThree, Lightbulb, Plus, Shield, Thermometer, WifiHigh } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'
import { DeviceControlPanel } from './DeviceControlPanel'

const deviceIcons = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: WifiHigh,
}

export function Rooms() {
  const [rooms, , { isLoading: roomsLoading, isError: roomsError }] = useKV<Room[]>(
    KV_KEYS.ROOMS,
    MOCK_ROOMS,
    { withMeta: true }
  )
  const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [controlPanelOpen, setControlPanelOpen] = useState(false)
  const [controlDevice, setControlDevice] = useState<Device | null>(null)

  const getRoomDevices = (roomName: string) => {
    return devices.filter(device => device.room === roomName)
  }

  const getActiveDevicesCount = (roomDevices: Device[]) => {
    return roomDevices.filter(device => device.enabled && device.status === 'online').length
  }

  // Get unassigned devices (newly discovered devices without a room)
  const unassignedDevices = devices.filter(device => device.room === 'Unassigned')

  const toggleDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId)
    if (!device) {
      toast.error('Device not found')
      return
    }

    // For Hue devices, use HueBridgeAdapter
    if (device.protocol === 'hue') {
      try {
        // Import adapter dynamically
        const { HueBridgeAdapter } = await import('@/services/devices/HueBridgeAdapter')

        // Create adapter instance
        const adapter = new HueBridgeAdapter({
          ip: '192.168.1.6',
          username: 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA',
          timeout: 5000,
        })

        // Optimistic update
        setDevices(prevDevices =>
          prevDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
        )

        // Execute command
        const result = device.enabled ? await adapter.turnOff(device) : await adapter.turnOn(device)

        if (result.success) {
          // Update with real state
          setDevices(prevDevices =>
            prevDevices.map(d =>
              d.id === deviceId ? { ...d, ...result.newState, lastSeen: new Date() } : d
            )
          )
          toast.success(`${device.name} turned ${result.newState?.enabled ? 'on' : 'off'}`, {
            description: `Hue Bridge · ${result.duration}ms`,
          })
        } else {
          // Rollback optimistic update
          setDevices(prevDevices =>
            prevDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
          )
          toast.error(`Failed to control ${device.name}`, {
            description: result.error || 'Hue Bridge error',
          })
        }
        return
      } catch (err) {
        // Rollback on exception
        setDevices(prevDevices =>
          prevDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
        )
        console.error('Hue device control error:', err)
        toast.error(`Error controlling ${device.name}`, {
          description: err instanceof Error ? err.message : 'Hue Bridge error',
        })
        return
      }
    }

    // For other devices, just update UI state
    setDevices(prevDevices =>
      prevDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
    )
    toast.success(`${device?.name} turned ${device?.enabled ? 'off' : 'on'}`)
  }

  const openAssignDialog = (device: Device) => {
    setSelectedDevice(device)
    setSelectedRoom('')
    setAssignDialogOpen(true)
  }

  const assignDeviceToRoom = () => {
    if (!selectedDevice || !selectedRoom) {
      toast.error('Please select a room')
      return
    }

    // Update device's room
    setDevices(prevDevices =>
      prevDevices.map(d => (d.id === selectedDevice.id ? { ...d, room: selectedRoom } : d))
    )

    toast.success(`${selectedDevice.name} assigned to ${selectedRoom}`)
    setAssignDialogOpen(false)
    setSelectedDevice(null)
    setSelectedRoom('')
  }

  const handleDeviceUpdate = (deviceId: string, updates: Partial<Device>) => {
    setDevices(prevDevices => prevDevices.map(d => (d.id === deviceId ? { ...d, ...updates } : d)))
  }

  const handleDeviceDelete = (deviceId: string) => {
    setDevices(prevDevices => prevDevices.filter(d => d.id !== deviceId))
  }

  // Show loading state
  if (roomsLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="p-6 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">Rooms</h1>
              <p className="text-muted-foreground">Manage devices by location</p>
            </div>
            <Button variant="outline" size="icon" className="rounded-full">
              <Plus size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (roomsError) {
    return (
      <div className="flex h-full flex-col">
        <div className="p-6 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">Rooms</h1>
              <p className="text-muted-foreground">Manage devices by location</p>
            </div>
            <Button variant="outline" size="icon" className="rounded-full">
              <Plus size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ErrorState
            title="Unable to Load Rooms"
            description="There was a problem loading your rooms. Please try again."
            onRetry={() => window.location.reload()}
            size="lg"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 pb-3 sm:p-6 sm:pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-xl font-bold sm:text-2xl">Rooms</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage devices by location</p>
          </div>
          <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
              <Plus size={20} />
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        <div className="space-y-6">
          {/* All Devices Section - Show everything */}
          <div>
            <h2 className="text-foreground mb-3 text-lg font-semibold">
              All Devices ({devices.length})
            </h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {devices.map(device => {
                    const IconComponent = deviceIcons[device.type] || WifiHigh
                    return (
                      <div
                        key={device.id}
                        className="hover:bg-accent/50 flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors"
                        onClick={() => {
                          setControlDevice(device)
                          setControlPanelOpen(true)
                        }}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              device.enabled ? 'bg-primary/10' : 'bg-secondary'
                            }`}
                          >
                            <IconComponent
                              size={20}
                              className={device.enabled ? 'text-primary' : 'text-muted-foreground'}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{device.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-muted-foreground text-xs">{device.room}</p>
                              <Badge
                                variant={device.status === 'online' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {device.status}
                              </Badge>
                              {device.protocol && (
                                <Badge variant="outline" className="text-xs">
                                  {device.protocol.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            toggleDevice(device.id)
                          }}
                        >
                          {device.enabled ? 'Turn Off' : 'Turn On'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unassigned Devices Section */}
          {unassignedDevices.length > 0 && (
            <div>
              <h2 className="text-foreground mb-3 text-lg font-semibold">
                Recently Discovered Devices
              </h2>
              <Card className="border-primary/50 bg-primary/5 border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Unassigned Devices ({unassignedDevices.length})
                    </CardTitle>
                    <Badge variant="outline" className="border-primary text-primary">
                      New
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Assign these devices to a room to manage them
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {unassignedDevices.map(device => {
                      const IconComponent = deviceIcons[device.type]
                      return (
                        <motion.div
                          key={device.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                          <div className="bg-card hover:bg-accent/10 flex items-center justify-between rounded-lg border p-3 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                                <IconComponent size={18} className="text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{device.name}</p>
                                <p className="text-muted-foreground text-xs">
                                  {device.type} • {device.status}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                openAssignDialog(device)
                              }}
                            >
                              Assign Room
                            </Button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rooms Grid */}
          {rooms.length === 0 ? (
            <Card className="border-border/30 border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No rooms configured</p>
                <p className="text-muted-foreground mb-4 text-sm">
                  Create rooms to organize your devices by location
                </p>
                <Button variant="outline" size="sm">
                  Add Room
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h2 className="text-foreground mb-3 text-lg font-semibold">All Rooms</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {rooms.map(room => {
                  const roomDevices = getRoomDevices(room.name)
                  const activeDevices = getActiveDevicesCount(roomDevices)

                  return (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <Card className="hover:bg-accent/5 focus-within:ring-primary/50 cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none hover:shadow-md">
                        <div
                          className="w-full text-left"
                          onClick={() => {
                            // Room click handler
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{room.name}</CardTitle>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={e => e.stopPropagation()}
                              >
                                <DotsThree size={16} />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <span className="text-muted-foreground">
                                  {activeDevices} of {roomDevices.length} active
                                </span>
                                {room.temperature && (
                                  <span className="text-muted-foreground">
                                    {room.temperature}°C
                                  </span>
                                )}
                              </div>
                              <Badge variant="secondary" className="h-5">
                                {roomDevices.length} devices
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            {roomDevices.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                                  <span>Device Activity</span>
                                  <span>
                                    {Math.round((activeDevices / roomDevices.length) * 100)}%
                                  </span>
                                </div>
                                <Progress
                                  value={(activeDevices / roomDevices.length) * 100}
                                  className="h-1.5"
                                />
                              </div>
                            )}

                            <div className="mt-4 grid grid-cols-4 gap-2">
                              {roomDevices.slice(0, 4).map(device => {
                                const IconComponent = deviceIcons[device.type]
                                return (
                                  <motion.div
                                    key={device.id}
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.05 }}
                                    className={`group relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${
                                      device.enabled
                                        ? 'border-primary/30 bg-primary/10 hover:border-primary/50 hover:bg-primary/20'
                                        : 'border-border/50 bg-secondary/50 hover:border-border hover:bg-secondary'
                                    }`}
                                    onClick={e => {
                                      e.stopPropagation()
                                      toggleDevice(device.id)
                                    }}
                                    onContextMenu={e => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setControlDevice(device)
                                      setControlPanelOpen(true)
                                    }}
                                    title={`Click to toggle • Right-click for advanced controls`}
                                  >
                                    {/* Status Indicator */}
                                    <div
                                      className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${
                                        device.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                                      }`}
                                    />

                                    <div
                                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                                        device.enabled
                                          ? 'bg-primary/20 group-hover:bg-primary/30'
                                          : 'bg-muted group-hover:bg-muted-foreground/20'
                                      }`}
                                    >
                                      <IconComponent
                                        size={16}
                                        weight={device.enabled ? 'fill' : 'regular'}
                                        className={
                                          device.enabled
                                            ? 'text-primary group-hover:text-primary/90'
                                            : 'text-muted-foreground group-hover:text-foreground'
                                        }
                                      />
                                    </div>
                                    <span
                                      className={`text-center text-xs leading-tight font-medium transition-colors ${
                                        device.enabled
                                          ? 'text-primary'
                                          : 'text-muted-foreground group-hover:text-foreground'
                                      }`}
                                    >
                                      {device.name.split(' ')[0]}
                                    </span>

                                    {/* Hover hint */}
                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-all group-hover:bg-black/5 group-hover:opacity-100">
                                      <span className="text-[10px] font-medium">
                                        {device.enabled ? 'Turn Off' : 'Turn On'}
                                      </span>
                                    </div>
                                  </motion.div>
                                )
                              })}

                              {roomDevices.length > 4 && (
                                <div className="bg-secondary/50 border-border/50 flex flex-col items-center gap-1 rounded-lg border-2 p-2">
                                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                                    <Plus size={16} className="text-muted-foreground" />
                                  </div>
                                  <span className="text-muted-foreground text-center text-xs leading-tight font-medium">
                                    +{roomDevices.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Room Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Device to Room</DialogTitle>
            <DialogDescription>Choose a room for {selectedDevice?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Room</p>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.name}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={assignDeviceToRoom} className="flex-1">
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Device Control Panel */}
      {controlDevice && (
        <DeviceControlPanel
          device={controlDevice}
          open={controlPanelOpen}
          onOpenChange={setControlPanelOpen}
          onUpdate={handleDeviceUpdate}
          onDelete={handleDeviceDelete}
        />
      )}
    </div>
  )
}
