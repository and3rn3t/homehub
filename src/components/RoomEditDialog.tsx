/**
 * RoomEditDialog Component
 *
 * Modal dialog for editing room properties (name, icon, color) and deleting rooms.
 * Features:
 * - Edit room name with validation
 * - Choose from predefined room icons
 * - Select room accent color
 * - Delete room with device reassignment
 * - Cascade device handling
 */

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { KV_KEYS } from '@/constants'
import { useKeyboardAvoidance } from '@/hooks/use-keyboard-avoidance'
import { useKV } from '@/hooks/use-kv'
import {
  BathIcon,
  BedIcon,
  BuildingIcon,
  HomeRoomIcon,
  SofaIcon,
  UtensilsIcon,
  type LucideIcon,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { Device, Room } from '@/types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface RoomEditDialogProps {
  room: Room | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomUpdated?: (room: Room) => void
  onRoomDeleted?: (roomId: string) => void
}

// Room icon options
const ROOM_ICONS: Array<{ name: string; icon: LucideIcon; value: string }> = [
  { name: 'Home', icon: HomeRoomIcon, value: 'home' },
  { name: 'Bedroom', icon: BedIcon, value: 'bed' },
  { name: 'Bathroom', icon: BathIcon, value: 'bath' },
  { name: 'Living Room', icon: SofaIcon, value: 'sofa' },
  { name: 'Kitchen', icon: UtensilsIcon, value: 'utensils' },
  { name: 'Office', icon: BuildingIcon, value: 'building' },
]

// Room color options (OKLCH iOS-style colors)
const ROOM_COLORS = [
  { name: 'Blue', value: 'oklch(0.6 0.15 250)', bgClass: 'bg-blue-500' },
  { name: 'Green', value: 'oklch(0.7 0.15 145)', bgClass: 'bg-green-500' },
  { name: 'Orange', value: 'oklch(0.7 0.15 50)', bgClass: 'bg-orange-500' },
  { name: 'Purple', value: 'oklch(0.6 0.15 290)', bgClass: 'bg-purple-500' },
  { name: 'Pink', value: 'oklch(0.7 0.15 350)', bgClass: 'bg-pink-500' },
  { name: 'Red', value: 'oklch(0.6 0.2 25)', bgClass: 'bg-red-500' },
  { name: 'Yellow', value: 'oklch(0.75 0.15 90)', bgClass: 'bg-yellow-500' },
  { name: 'Teal', value: 'oklch(0.6 0.15 180)', bgClass: 'bg-teal-500' },
]

export function RoomEditDialog({
  room,
  open,
  onOpenChange,
  onRoomUpdated,
  onRoomDeleted,
}: RoomEditDialogProps) {
  const [, setRooms] = useKV<Room[]>(KV_KEYS.ROOMS, [])
  const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, [])

  // Keyboard avoidance for mobile
  useKeyboardAvoidance()

  // Form state
  const [name, setName] = useState(room?.name || '')
  const [icon, setIcon] = useState(room?.icon || 'home')
  const [color, setColor] = useState(room?.color || ROOM_COLORS[0]?.value || '#3b82f6')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reassignRoomId, setReassignRoomId] = useState<string>('')

  // Reset form when room changes
  useEffect(() => {
    if (room) {
      setName(room.name)
      setIcon(room.icon || 'home')
      setColor(room.color || ROOM_COLORS[0]?.value || '#3b82f6')
      setShowDeleteConfirm(false)
      setReassignRoomId('')
    }
  }, [room])

  // Get devices in this room
  const roomDevices = devices.filter(d => d.room === room?.name)
  const hasDevices = roomDevices.length > 0

  // Get other rooms for reassignment
  const [allRooms] = useKV<Room[]>(KV_KEYS.ROOMS, [])
  const otherRooms = allRooms.filter(r => r.id !== room?.id)

  /**
   * Save room changes
   */
  const handleSave = () => {
    if (!room) return

    if (!name.trim()) {
      toast.error('Room name is required')
      return
    }

    const updatedRoom: Room = {
      ...room,
      name: name.trim(),
      icon,
      color,
    }

    // Update room in list
    setRooms(prevRooms => prevRooms.map(r => (r.id === room.id ? updatedRoom : r)))

    // Update device room references (if name changed)
    if (room.name !== name.trim()) {
      setDevices(prevDevices =>
        prevDevices.map(d => (d.room === room.name ? { ...d, room: name.trim() } : d))
      )
    }

    toast.success('Room updated')
    onRoomUpdated?.(updatedRoom)
    onOpenChange(false)
  }

  /**
   * Delete room and reassign devices
   */
  const handleDelete = async () => {
    if (!room) return

    setIsDeleting(true)

    try {
      // If room has devices, reassign them
      if (hasDevices) {
        const targetRoom = reassignRoomId
          ? otherRooms.find(r => r.id === reassignRoomId)?.name
          : 'Unassigned'

        if (!targetRoom && reassignRoomId) {
          toast.error('Selected room not found')
          setIsDeleting(false)
          return
        }

        // Reassign all devices
        setDevices(prevDevices =>
          prevDevices.map(d => (d.room === room.name ? { ...d, room: targetRoom as string } : d))
        )

        toast.success(
          `Room deleted`,
          reassignRoomId
            ? { description: `${roomDevices.length} devices moved to ${targetRoom}` }
            : { description: `${roomDevices.length} devices marked as unassigned` }
        )
      } else {
        toast.success('Room deleted')
      }

      // Remove room from list
      setRooms(prevRooms => prevRooms.filter(r => r.id !== room.id))

      onRoomDeleted?.(room.id)
      onOpenChange(false)
      setShowDeleteConfirm(false)
    } catch (error) {
      toast.error('Failed to delete room')
      console.error('Error deleting room:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!room) return null

  // Show delete confirmation dialog
  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room?</DialogTitle>
            <DialogDescription>
              {hasDevices
                ? `This room contains ${roomDevices.length} device${roomDevices.length > 1 ? 's' : ''}. What would you like to do with them?`
                : 'This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {hasDevices && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reassign-room">Move devices to:</Label>
                <Select value={reassignRoomId} onValueChange={setReassignRoomId}>
                  <SelectTrigger id="reassign-room">
                    <SelectValue placeholder="Mark as Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {otherRooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted rounded-lg p-3">
                <p className="mb-2 text-sm font-medium">Affected devices:</p>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  {roomDevices.slice(0, 5).map(d => (
                    <li key={d.id}>• {d.name}</li>
                  ))}
                  {roomDevices.length > 5 && <li>• ... and {roomDevices.length - 5} more</li>}
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete Room'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Main edit dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>Customize room name, icon, and color</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Living Room"
            />
          </div>

          {/* Room Icon */}
          <div className="space-y-2">
            <Label>Room Icon</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_ICONS.map(({ name: iconName, icon: IconComponent, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIcon(value)}
                  className={cn(
                    'hover:bg-accent flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all',
                    icon === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <IconComponent className="h-6 w-6" />
                  <span className="text-xs font-medium">{iconName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Color */}
          <div className="space-y-2">
            <Label>Room Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {ROOM_COLORS.map(({ name: colorName, value, bgClass }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  className={cn(
                    'hover:bg-accent flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all',
                    color === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className={cn('h-8 w-8 rounded-full', bgClass)} />
                  <span className="text-xs font-medium">{colorName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Device Count Info */}
          {hasDevices && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">
                <span className="font-medium">{roomDevices.length}</span> device
                {roomDevices.length > 1 ? 's' : ''} in this room
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            Delete
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
