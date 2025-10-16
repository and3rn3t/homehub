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
import { Input } from '@/components/ui/input'
import { IOS26EmptyState, IOS26Error } from '@/components/ui/ios26-error'
import { IOS26Shimmer } from '@/components/ui/ios26-loading'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SwipeableCard } from '@/components/ui/swipeable-card'
import { KV_KEYS, MOCK_DEVICES, MOCK_ROOMS } from '@/constants'
import { useHaptic } from '@/hooks/use-haptic'
import { useKV } from '@/hooks/use-kv'
import {
  BathIcon,
  BedIcon,
  BriefcaseIcon,
  EditIcon,
  HouseIcon,
  LightbulbIcon,
  MoreHorizontalIcon,
  NavigationIcon,
  PlusIcon,
  ShieldIcon,
  SofaIcon,
  ThermometerIcon,
  TrashIcon,
  TreeIcon,
  UtensilsIcon,
  WarehouseIcon,
  WifiIcon,
} from '@/lib/icons'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import type { Device, Room } from '@/types'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { DeviceCardEnhanced } from './DeviceCardEnhanced'
import { DeviceControlPanel } from './DeviceControlPanel'
import { DeviceEditDialog } from './DeviceEditDialog'
import { RoomEditDialog } from './RoomEditDialog'
import { RoomStatistics } from './RoomStatistics'

const deviceIcons = {
  light: LightbulbIcon,
  thermostat: ThermometerIcon,
  security: ShieldIcon,
  sensor: WifiIcon,
}

// Sortable Room Card Component
interface SortableRoomCardProps {
  room: Room
  roomDevices: Device[]
  activeDevices: number
  onEditClick: (room: Room) => void
  onDeleteClick: (room: Room) => void
  onDeviceToggle: (deviceId: string) => void
  onDeviceContextMenu: (device: Device) => void
}

function SortableRoomCard({
  room,
  roomDevices,
  activeDevices,
  onEditClick,
  onDeleteClick,
  onDeviceToggle,
  onDeviceContextMenu,
}: SortableRoomCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: room.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SwipeableCard
        actions={[
          {
            label: 'Edit',
            icon: EditIcon,
            color: 'blue',
            onAction: () => onEditClick(room),
          },
          {
            label: 'Delete',
            icon: TrashIcon,
            color: 'red',
            onAction: () => onDeleteClick(room),
          },
        ]}
        disabled={isDragging} // Disable swipe while dragging for reorder
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Card className="hover:bg-accent/5 focus-within:ring-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none hover:shadow-md">
            <div className="w-full text-left">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={e => {
                      e.stopPropagation()
                      onEditClick(room)
                    }}
                  >
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {activeDevices} of {roomDevices.length} active
                    </span>
                    {room.temperature && (
                      <span className="text-muted-foreground">{room.temperature}°C</span>
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
                      <span>{Math.round((activeDevices / roomDevices.length) * 100)}%</span>
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
                          onDeviceToggle(device.id)
                        }}
                        onContextMenu={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDeviceContextMenu(device)
                        }}
                        title={`Click to toggle • Right-click for advanced controls`}
                      >
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
                            className={cn(
                              'h-4 w-4',
                              device.enabled
                                ? 'text-primary group-hover:text-primary/90'
                                : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          />
                        </div>
                        <span
                          className={`text-center text-xs leading-tight font-medium transition-colors ${device.enabled ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                        >
                          {device.name.split(' ')[0]}
                        </span>
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
                        <PlusIcon className="text-muted-foreground h-4 w-4" />
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
      </SwipeableCard>
    </div>
  )
}

export function Rooms() {
  const [rooms, setRooms, { isLoading: roomsLoading, isError: roomsError }] = useKV<Room[]>(
    KV_KEYS.ROOMS,
    MOCK_ROOMS,
    { withMeta: true }
  )
  const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)
  const haptic = useHaptic()
  const [hideUnreachable, setHideUnreachable] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [controlPanelOpen, setControlPanelOpen] = useState(false)
  const [controlDevice, setControlDevice] = useState<Device | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [roomEditDialogOpen, setRoomEditDialogOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)

  // Drag and drop state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  // Configure sensors for mouse and touch
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold before drag starts on touch
        tolerance: 5,
      },
    })
  )

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    haptic.medium() // Haptic feedback on refresh

    try {
      // Simulate data refresh by re-fetching from storage
      // In a real app, this would fetch from the API
      await new Promise(resolve => setTimeout(resolve, 800))

      toast.success('Rooms refreshed')
    } catch (error) {
      logger.error('Failed to refresh rooms', { component: 'Rooms', error })
      toast.error('Failed to refresh rooms')
    }
  }, [haptic])

  const getRoomDevices = (roomName: string) => {
    return devices.filter(device => device.room === roomName)
  }

  const getActiveDevicesCount = (roomDevices: Device[]) => {
    return roomDevices.filter(device => device.enabled && device.status === 'online').length
  }

  // Get unassigned devices (newly discovered devices without a room)
  const unassignedDevices = devices.filter(device => device.room === 'Unassigned')

  const toggleDevice = async (deviceId: string) => {
    try {
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
          const result = device.enabled
            ? await adapter.turnOff(device)
            : await adapter.turnOn(device)

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
          logger.error('Hue device control error', {
            error: err,
            deviceId,
            deviceName: device.name,
          })
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
    } catch (error) {
      logger.error('Failed to toggle device', {
        error,
        deviceId,
      })
      toast.error('Failed to toggle device', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const openAssignDialog = (device: Device) => {
    setSelectedDevice(device)
    setSelectedRoom('')
    setAssignDialogOpen(true)
  }

  const assignDeviceToRoom = () => {
    try {
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
    } catch (error) {
      logger.error('Failed to assign device to room', {
        error,
        deviceId: selectedDevice?.id,
        roomName: selectedRoom,
      })
      toast.error('Failed to assign device', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const createRoom = () => {
    try {
      if (!newRoomName.trim()) {
        toast.error('Please enter a room name')
        return
      }

      // Check if room already exists
      if (rooms.some(r => r.name.toLowerCase() === newRoomName.trim().toLowerCase())) {
        toast.error('A room with this name already exists')
        return
      }

      const newRoom: Room = {
        id: crypto.randomUUID(),
        name: newRoomName.trim(),
        icon: 'home', // Default icon
        deviceIds: [],
      }

      setRooms(prevRooms => [...prevRooms, newRoom])
      toast.success(`Created room: ${newRoom.name}`)
      setCreateRoomDialogOpen(false)
      setNewRoomName('')
    } catch (error) {
      logger.error('Failed to create room', {
        error,
        roomName: newRoomName,
      })
      toast.error('Failed to create room', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleDeviceUpdate = (deviceId: string, updates: Partial<Device>) => {
    try {
      setDevices(prevDevices =>
        prevDevices.map(d => (d.id === deviceId ? { ...d, ...updates } : d))
      )
    } catch (error) {
      logger.error('Failed to update device', {
        error,
        deviceId,
        updates,
      })
      toast.error('Failed to update device', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleDeviceDelete = (deviceId: string) => {
    try {
      setDevices(prevDevices => prevDevices.filter(d => d.id !== deviceId))
    } catch (error) {
      logger.error('Failed to delete device', {
        error,
        deviceId,
      })
      toast.error('Failed to delete device', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveRoomId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveRoomId(null)

    if (!over || active.id === over.id) {
      return
    }

    setRooms(prevRooms => {
      const oldIndex = prevRooms.findIndex(room => room.id === active.id)
      const newIndex = prevRooms.findIndex(room => room.id === over.id)

      const newOrder = arrayMove(prevRooms, oldIndex, newIndex)
      toast.success('Room order updated')
      return newOrder
    })
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
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setCreateRoomDialogOpen(true)}
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IOS26Shimmer className="h-48 rounded-2xl" />
            <IOS26Shimmer className="h-48 rounded-2xl" />
            <IOS26Shimmer className="h-48 rounded-2xl" />
            <IOS26Shimmer className="h-48 rounded-2xl" />
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
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setCreateRoomDialogOpen(true)}
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <IOS26Shimmer className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (roomsError) {
    return (
      <div className="flex h-full flex-col">
        <div className="p-6 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">Rooms</h1>
              <p className="text-muted-foreground">Manage devices by location</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setCreateRoomDialogOpen(true)}
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-6">
          <IOS26Error
            variant="error"
            title="Unable to Load Rooms"
            message="There was a problem loading your rooms. Please check your connection and try again."
            action={{
              label: 'Refresh',
              onClick: () => window.location.reload(),
            }}
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
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full"
              onClick={() => setCreateRoomDialogOpen(true)}
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="flex-1 px-4 pb-6 sm:px-6">
        <div className="space-y-6">
          {/* Room Statistics */}
          <RoomStatistics devices={devices} />

          {/* All Devices Section - Show everything */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-foreground text-lg font-semibold">
                All Devices (
                {hideUnreachable
                  ? devices.filter(d => d.status !== 'offline').length
                  : devices.length}
                )
              </h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <span className="text-muted-foreground">Hide unreachable</span>
                <input
                  type="checkbox"
                  checked={hideUnreachable}
                  onChange={e => setHideUnreachable(e.target.checked)}
                  className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300 focus:ring-2"
                />
              </label>
            </div>
            <div className="space-y-3">
              {devices
                .filter(device => !hideUnreachable || device.status !== 'offline')
                .map((device, index) => (
                  <DeviceCardEnhanced
                    key={device.id}
                    device={device}
                    index={index}
                    onDeviceClick={device => {
                      setControlDevice(device)
                      setControlPanelOpen(true)
                    }}
                    onToggle={toggleDevice}
                    onEdit={device => {
                      setEditDevice(device)
                      setEditDialogOpen(true)
                    }}
                    onDelete={deviceId => {
                      handleDeviceDelete(deviceId)
                      toast.success('Device removed')
                    }}
                    showFavoriteButton={true}
                  />
                ))}
            </div>
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
            <div className="space-y-6">
              <IOS26EmptyState
                icon={<HouseIcon className="h-16 w-16" />}
                title="No Rooms Created"
                message="Organize your smart home by creating rooms. Group devices by location for easier control and automation."
                action={{
                  label: 'Create First Room',
                  onClick: () => setCreateRoomDialogOpen(true),
                }}
              />

              {/* Quick Start Room Templates */}
              <div>
                <h3 className="mb-4 text-base font-semibold sm:text-lg">Common Rooms</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: SofaIcon, name: 'Living Room', color: 'oklch(0.6 0.15 250)' },
                    { icon: BedIcon, name: 'Bedroom', color: 'oklch(0.65 0.15 290)' },
                    { icon: UtensilsIcon, name: 'Kitchen', color: 'oklch(0.7 0.15 145)' },
                    { icon: BathIcon, name: 'Bathroom', color: 'oklch(0.6 0.15 210)' },
                    { icon: BriefcaseIcon, name: 'Office', color: 'oklch(0.65 0.15 30)' },
                    { icon: WarehouseIcon, name: 'Garage', color: 'oklch(0.5 0.1 280)' },
                    { icon: TreeIcon, name: 'Garden', color: 'oklch(0.7 0.18 145)' },
                    { icon: NavigationIcon, name: 'Hallway', color: 'oklch(0.55 0.1 260)' },
                  ].map((template, index) => (
                    <motion.button
                      key={template.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ y: -2 }}
                      onClick={() => {
                        const newRoom = {
                          id: `room-${Date.now()}`,
                          name: template.name,
                          icon: template.icon.name,
                          color: template.color,
                          deviceIds: [],
                        }
                        setRooms([...rooms, newRoom])
                        toast.success(`${template.name} created!`, {
                          description: 'Add devices to this room to get started',
                        })
                      }}
                      className="text-left"
                    >
                      <Card className="hover:bg-accent/5 border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
                        <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${template.color}15` }}
                          >
                            <template.icon className="h-6 w-6" style={{ color: template.color }} />
                          </div>
                          <span className="text-sm font-medium">{template.name}</span>
                        </CardContent>
                      </Card>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-foreground mb-3 text-lg font-semibold">All Rooms</h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={rooms.map(r => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {rooms.map(room => {
                      const roomDevices = getRoomDevices(room.name)
                      const activeDevices = getActiveDevicesCount(roomDevices)

                      return (
                        <SortableRoomCard
                          key={room.id}
                          room={room}
                          roomDevices={roomDevices}
                          activeDevices={activeDevices}
                          onEditClick={room => {
                            setEditRoom(room)
                            setRoomEditDialogOpen(true)
                          }}
                          onDeleteClick={room => {
                            setEditRoom(room)
                            setRoomEditDialogOpen(true)
                            // The RoomEditDialog handles deletion
                          }}
                          onDeviceToggle={toggleDevice}
                          onDeviceContextMenu={device => {
                            setControlDevice(device)
                            setControlPanelOpen(true)
                          }}
                        />
                      )
                    })}
                  </div>
                </SortableContext>

                {/* Drag Overlay - shows while dragging */}
                <DragOverlay>
                  {activeRoomId ? (
                    <div className="opacity-50">
                      <Card className="shadow-2xl">
                        <CardHeader>
                          <CardTitle>{rooms.find(r => r.id === activeRoomId)?.name}</CardTitle>
                        </CardHeader>
                      </Card>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </div>
      </PullToRefresh>

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
          onEdit={() => {
            setEditDevice(controlDevice)
            setEditDialogOpen(true)
          }}
        />
      )}

      {/* Device Edit Dialog */}
      <DeviceEditDialog
        device={editDevice}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onDeviceUpdated={device => {
          setDevices(prev => prev.map(d => (d.id === device.id ? device : d)))
          toast.success('Device updated')
        }}
        onDeviceRemoved={deviceId => {
          setDevices(prev => prev.filter(d => d.id !== deviceId))
        }}
      />

      {/* Create Room Dialog */}
      <Dialog open={createRoomDialogOpen} onOpenChange={setCreateRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
            <DialogDescription>Add a new room to organize your devices</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                placeholder="e.g., Living Room, Bedroom, Kitchen"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    createRoom()
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCreateRoomDialogOpen(false)
                setNewRoomName('')
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={createRoom} className="flex-1">
              Create Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Edit Dialog */}
      <RoomEditDialog
        room={editRoom}
        open={roomEditDialogOpen}
        onOpenChange={setRoomEditDialogOpen}
        onRoomUpdated={room => {
          setRooms(prev => prev.map(r => (r.id === room.id ? room : r)))
          toast.success('Room updated')
        }}
        onRoomDeleted={roomId => {
          setRooms(prev => prev.filter(r => r.id !== roomId))
          toast.success('Room deleted')
        }}
      />
    </div>
  )
}
