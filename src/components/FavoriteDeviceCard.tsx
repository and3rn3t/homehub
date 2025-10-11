import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProtocolBadge } from '@/components/ui/protocol-badge'
import { Switch } from '@/components/ui/switch'
import type { Device } from '@/types'
import { Lightbulb, Shield, Thermometer, WifiHigh } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { memo, useCallback } from 'react'

const deviceIcons = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: WifiHigh,
}

interface FavoriteDeviceCardProps {
  device: Device
  index: number
  onDeviceClick: (device: Device) => void
  onToggle: (deviceId: string) => void
}

export const FavoriteDeviceCard = memo(
  function FavoriteDeviceCard({ device, index, onDeviceClick, onToggle }: FavoriteDeviceCardProps) {
    const IconComponent = deviceIcons[device.type]

    // Create stable handlers using just the device ID
    const handleToggle = useCallback(() => {
      onToggle(device.id)
    }, [device.id, onToggle])

    const handleClick = useCallback(() => {
      onDeviceClick(device)
    }, [device, onDeviceClick])

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          delay: index * 0.05,
        }}
      >
        <Card className="hover:bg-accent/5 transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            <div
              className="cursor-pointer"
              onClick={handleClick}
              title="Click to open advanced controls"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full"
                    animate={{
                      scale: device.enabled ? 1.05 : 1,
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
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {device.value !== undefined && (
                    <motion.span
                      className="text-sm font-medium"
                      key={device.value}
                      initial={{ scale: 1.2, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {device.value}
                      {device.unit}
                    </motion.span>
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
      prevProps.device.status === nextProps.device.status &&
      prevProps.device.value === nextProps.device.value &&
      prevProps.index === nextProps.index
    )
  }
)
