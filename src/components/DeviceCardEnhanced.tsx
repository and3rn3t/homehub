import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { ProtocolBadge } from '@/components/ui/protocol-badge'
import { SwipeableCard } from '@/components/ui/swipeable-card'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHaptic } from '@/hooks/use-haptic'
import { useKV } from '@/hooks/use-kv'
import { useLongPress } from '@/hooks/use-long-press'
import { useUnits } from '@/hooks/use-units'
import {
  BatteryIcon,
  BatteryLowIcon,
  BatteryWarningIcon,
  ClockIcon,
  EditIcon,
  HomeRoomIcon,
  LightbulbIcon,
  ShieldIcon,
  StarIcon,
  ThermometerIcon,
  TrashIcon,
  WifiIcon,
  WifiOffIcon,
} from '@/lib/icons'
import type { Device } from '@/types'
import { motion } from 'framer-motion'
import { memo, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { FavoriteButton } from './FavoriteButton'

// Time ago helper
const getTimeAgo = (date: Date | string | undefined) => {
  if (!date) return null
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const minutes = Math.floor((Date.now() - dateObj.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const deviceIcons = {
  light: LightbulbIcon,
  thermostat: ThermometerIcon,
  security: ShieldIcon,
  sensor: WifiIcon,
}

// Signal strength icon helper
const getSignalIcon = (strength: number | undefined) => {
  if (!strength || strength < 30) return WifiOffIcon
  return WifiIcon
}

// Signal strength color helper
const getSignalColor = (strength: number | undefined) => {
  if (!strength || strength < 30) return 'text-red-500'
  if (strength < 60) return 'text-yellow-500'
  return 'text-green-500'
}

// Battery icon helper
const getBatteryIcon = (level: number | undefined) => {
  if (!level) return null
  if (level < 20) return BatteryLowIcon
  if (level < 50) return BatteryWarningIcon
  return BatteryIcon
}

// Battery color helper
const getBatteryColor = (level: number | undefined) => {
  if (!level || level < 20) return 'text-red-500'
  if (level < 50) return 'text-yellow-500'
  return 'text-green-500'
}

interface DeviceCardEnhancedProps {
  device: Device
  index: number
  onDeviceClick: (device: Device) => void
  onToggle: (deviceId: string) => void
  onEdit?: (device: Device) => void
  onDelete?: (deviceId: string) => void
  showFavoriteButton?: boolean
  showContextMenu?: boolean
}

export const DeviceCardEnhanced = memo(
  function DeviceCardEnhanced({
    device,
    index,
    onDeviceClick,
    onToggle,
    onEdit,
    onDelete,
    showFavoriteButton = true,
    showContextMenu = true,
  }: DeviceCardEnhancedProps) {
    const IconComponent = deviceIcons[device.type]
    const [favoriteDevices, setFavoriteDevices] = useKV<string[]>('favorite-devices', [])
    const [contextMenuOpen, setContextMenuOpen] = useState(false)
    const { formatTemperature } = useUnits()
    const haptic = useHaptic()

    const SignalIcon = getSignalIcon(device.signalStrength)
    const signalColor = getSignalColor(device.signalStrength)

    const BatteryIcon = getBatteryIcon(device.batteryLevel)
    const batteryColor = getBatteryColor(device.batteryLevel)

    const isFavorite = favoriteDevices.includes(device.id)

    // Create stable handlers using just the device ID
    const handleToggle = useCallback(() => {
      haptic.light() // Haptic feedback on toggle
      onToggle(device.id)
    }, [device.id, onToggle, haptic])

    const handleClick = useCallback(() => {
      if (!contextMenuOpen) {
        haptic.medium() // Haptic feedback on card click
        onDeviceClick(device)
      }
    }, [device, onDeviceClick, haptic, contextMenuOpen])

    // Context menu handlers
    const handleToggleFavorite = useCallback(() => {
      haptic.light()
      if (isFavorite) {
        setFavoriteDevices(prev => prev.filter(id => id !== device.id))
        toast.success('Removed from favorites')
      } else {
        setFavoriteDevices(prev => [...prev, device.id])
        toast.success('Added to favorites')
      }
    }, [device.id, isFavorite, setFavoriteDevices, haptic])

    const handleEdit = useCallback(() => {
      haptic.medium()
      onEdit?.(device)
    }, [device, onEdit, haptic])

    const handleDelete = useCallback(() => {
      haptic.heavy()
      onDelete?.(device.id)
    }, [device.id, onDelete, haptic])

    // Keyboard navigation handler (WCAG 2.1.1)
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      },
      [handleClick]
    )

    // Long press detection
    const longPressHandlers = useLongPress({
      onLongPress: () => {
        haptic.medium()
        setContextMenuOpen(true)
      },
      delay: 500,
    })

    const cardContent = (
      <motion.div
        {...longPressHandlers}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          delay: index * 0.05,
        }}
        whileHover={{
          scale: 1.02,
          y: -4,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
          },
        }}
        whileTap={{ scale: 0.98, y: 0 }}
        style={{
          // GPU-accelerated transforms
          willChange: 'transform',
        }}
      >
        <Card className="group hover:shadow-primary/10 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
          {/* Animated border glow on hover */}
          <motion.div
            className="pointer-events-none absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(135deg, rgba(var(--primary-rgb), 0.3) 0%, rgba(var(--primary-rgb), 0) 50%, rgba(var(--primary-rgb), 0.3) 100%)',
              filter: 'blur(8px)',
            }}
          />

          {/* Animated pulse ring for online devices */}
          {device.enabled && device.status === 'online' && (
            <motion.div
              className="bg-primary/20 pointer-events-none absolute -inset-0.5 rounded-lg blur-sm"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          )}

          <CardContent className="relative p-4">
            <div
              className="cursor-pointer"
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              role="button"
              tabIndex={0}
              aria-label={`${device.name} - ${device.status} - Click to open advanced controls`}
              title="Click to open advanced controls"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="bg-secondary relative flex h-10 w-10 items-center justify-center rounded-full"
                    animate={{
                      scale: device.enabled ? 1.05 : 1,
                      backgroundColor: device.enabled
                        ? 'rgba(var(--primary-rgb), 0.15)'
                        : 'rgba(var(--secondary-rgb), 1)',
                    }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeInOut',
                    }}
                  >
                    {/* Power-on ripple effect */}
                    {device.enabled && (
                      <motion.div
                        className="bg-primary/30 pointer-events-none absolute inset-0 rounded-full"
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{
                          duration: 0.6,
                          ease: 'easeOut',
                        }}
                        key={`ripple-${device.id}-${device.enabled}`}
                      />
                    )}

                    <IconComponent
                      size={20}
                      className={device.enabled ? 'text-primary' : 'text-muted-foreground'}
                    />
                    {/* Status indicator dot */}
                    <motion.div
                      className={`border-background absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 ${
                        device.status === 'online'
                          ? 'bg-green-500'
                          : device.status === 'offline'
                            ? 'bg-red-500'
                            : device.status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                      }`}
                      animate={{
                        scale: device.status === 'online' ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: device.status === 'online' ? Number.POSITIVE_INFINITY : 0,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-medium">{device.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground text-xs">{device.room}</p>
                      <ProtocolBadge protocol={device.protocol} />
                      <Badge
                        variant={
                          device.status === 'online'
                            ? 'default'
                            : device.status === 'offline'
                              ? 'destructive'
                              : 'outline'
                        }
                        className="text-xs"
                      >
                        {device.status}
                      </Badge>
                    </div>

                    {/* Enhanced metadata row */}
                    <div className="mt-1 flex items-center gap-3">
                      {/* Last seen timestamp */}
                      {device.lastSeen && getTimeAgo(device.lastSeen) && (
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <ClockIcon className="h-3 w-3" />
                          <span>{getTimeAgo(device.lastSeen)}</span>
                        </div>
                      )}

                      {/* Signal strength with tooltip */}
                      {device.signalStrength !== undefined && (
                        <Tooltip delayDuration={500}>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-1 text-xs ${signalColor}`}>
                              <SignalIcon className="h-3 w-3" />
                              <span className="tabular-nums">{device.signalStrength}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Signal Strength: {device.signalStrength}%
                              {device.signalStrength < 30 && ' (Weak)'}
                              {device.signalStrength >= 30 &&
                                device.signalStrength < 60 &&
                                ' (Fair)'}
                              {device.signalStrength >= 60 && ' (Good)'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Battery level with tooltip */}
                      {device.batteryLevel !== undefined && BatteryIcon && (
                        <Tooltip delayDuration={500}>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-1 text-xs ${batteryColor}`}>
                              <BatteryIcon className="h-3 w-3" />
                              <span className="tabular-nums">{device.batteryLevel}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Battery Level: {device.batteryLevel}%
                              {device.batteryLevel < 20 && ' (Critical - Replace soon)'}
                              {device.batteryLevel >= 20 &&
                                device.batteryLevel < 50 &&
                                ' (Low - Monitor)'}
                              {device.batteryLevel >= 50 && ' (Good)'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {device.value !== undefined && (
                    <motion.span
                      className="text-sm font-medium tabular-nums"
                      key={device.value}
                      initial={{ scale: 1.2, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {device.type === 'thermostat' && device.unit === '°F'
                        ? formatTemperature(device.value)
                        : `${device.value}${device.unit}`}
                    </motion.span>
                  )}
                  {showFavoriteButton && (
                    <FavoriteButton
                      deviceId={device.id}
                      deviceName={device.name}
                      isFavorite={favoriteDevices.includes(device.id)}
                      size={18}
                    />
                  )}
                  <motion.div
                    onClick={e => e.stopPropagation()}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Switch
                      checked={device.enabled}
                      onCheckedChange={handleToggle}
                      disabled={device.status === 'offline'}
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )

    // Wrap with swipeable gestures
    const swipeableContent = (
      <SwipeableCard
        actions={[
          ...(onEdit
            ? [
                {
                  label: 'Edit',
                  icon: EditIcon,
                  color: 'blue' as const,
                  onAction: handleEdit,
                },
              ]
            : []),
          {
            label: isFavorite ? 'Unfav' : 'Favorite',
            icon: StarIcon,
            color: 'yellow' as const,
            onAction: handleToggleFavorite,
          },
          ...(onDelete
            ? [
                {
                  label: 'Delete',
                  icon: TrashIcon,
                  color: 'red' as const,
                  onAction: handleDelete,
                },
              ]
            : []),
        ]}
      >
        {cardContent}
      </SwipeableCard>
    )

    if (!showContextMenu) {
      return swipeableContent
    }

    return (
      <ContextMenu onOpenChange={setContextMenuOpen}>
        <ContextMenuTrigger asChild>{swipeableContent}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {onEdit && (
            <ContextMenuItem onClick={handleEdit}>
              <EditIcon className="mr-2 h-4 w-4" />
              <span>Edit Device</span>
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={handleToggleFavorite}>
            <StarIcon className="mr-2 h-4 w-4" />
            <span>{isFavorite ? 'Remove from' : 'Add to'} Favorites</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              haptic.light()
              toast.info('Room selector coming soon')
            }}
          >
            <HomeRoomIcon className="mr-2 h-4 w-4" />
            <span>Change Room</span>
          </ContextMenuItem>
          {onDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={handleDelete} className="text-red-600">
                <TrashIcon className="mr-2 h-4 w-4" />
                <span>Delete Device</span>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  },
  // Custom comparison function - only re-render if these specific props change
  (prevProps, nextProps) => {
    return (
      prevProps.device.id === nextProps.device.id &&
      prevProps.device.enabled === nextProps.device.enabled &&
      prevProps.device.value === nextProps.device.value &&
      prevProps.device.status === nextProps.device.status &&
      prevProps.device.signalStrength === nextProps.device.signalStrength &&
      prevProps.device.batteryLevel === nextProps.device.batteryLevel &&
      prevProps.device.lastSeen === nextProps.device.lastSeen &&
      prevProps.index === nextProps.index
    )
  }
)
