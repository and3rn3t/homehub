import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProtocolBadge } from '@/components/ui/protocol-badge'
import { Switch } from '@/components/ui/switch'
import { useKV } from '@/hooks/use-kv'
import {
  BatteryIcon,
  BatteryLowIcon,
  BatteryWarningIcon,
  ClockIcon,
  LightbulbIcon,
  ShieldIcon,
  ThermometerIcon,
  WifiIcon,
  WifiOffIcon,
} from '@/lib/icons'
import type { Device } from '@/types'
import { motion } from 'framer-motion'
import { memo, useCallback } from 'react'
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
  showFavoriteButton?: boolean
}

export const DeviceCardEnhanced = memo(
  function DeviceCardEnhanced({
    device,
    index,
    onDeviceClick,
    onToggle,
    showFavoriteButton = true,
  }: DeviceCardEnhancedProps) {
    const IconComponent = deviceIcons[device.type]
    const [favoriteDevices] = useKV<string[]>('favorite-devices', [])

    const SignalIcon = getSignalIcon(device.signalStrength)
    const signalColor = getSignalColor(device.signalStrength)

    const BatteryIcon = getBatteryIcon(device.batteryLevel)
    const batteryColor = getBatteryColor(device.batteryLevel)

    // Create stable handlers using just the device ID
    const handleToggle = useCallback(() => {
      onToggle(device.id)
    }, [device.id, onToggle])

    const handleClick = useCallback(() => {
      onDeviceClick(device)
    }, [device, onDeviceClick])

    return (
      <motion.div
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
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
          },
        }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="hover:shadow-primary/5 relative transition-all duration-200 hover:shadow-lg">
          {/* Animated pulse ring for online devices */}
          {device.enabled && device.status === 'online' && (
            <motion.div
              className="bg-primary/20 absolute -inset-0.5 rounded-lg blur-sm"
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

                      {/* Signal strength */}
                      {device.signalStrength !== undefined && (
                        <div
                          className={`flex items-center gap-1 text-xs ${signalColor}`}
                          title={`Signal: ${device.signalStrength}%`}
                        >
                          <SignalIcon className="h-3 w-3" />
                          <span className="tabular-nums">{device.signalStrength}%</span>
                        </div>
                      )}

                      {/* Battery level */}
                      {device.batteryLevel !== undefined && BatteryIcon && (
                        <div
                          className={`flex items-center gap-1 text-xs ${batteryColor}`}
                          title={`Battery: ${device.batteryLevel}%`}
                        >
                          <BatteryIcon className="h-3 w-3" />
                          <span className="tabular-nums">{device.batteryLevel}%</span>
                        </div>
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
                      {device.value}
                      {device.unit}
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
                  <div onClick={e => e.stopPropagation()}>
                    <Switch
                      checked={device.enabled}
                      onCheckedChange={handleToggle}
                      disabled={device.status === 'offline'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
