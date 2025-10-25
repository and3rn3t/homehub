import { Card } from '@/components/ui/card'
import type { LucideIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { Device } from '@/types'
import { motion } from 'framer-motion'

interface ControlTileProps {
  device: Device
  icon: LucideIcon
  onTap: (deviceId: string) => void
  onLongPress: (device: Device) => void
  tint?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function ControlTile({
  device,
  icon: Icon,
  onTap,
  onLongPress,
  tint = 'primary',
  size = 'medium',
  className,
}: ControlTileProps) {
  const isActive = device.enabled && device.status === 'online'

  // Size configurations (iOS Control Center style)
  const sizeClasses = {
    small: 'h-[80px] w-[80px]', // 1x1 grid
    medium: 'h-[170px] w-[170px]', // 2x2 grid
    large: 'h-[170px] w-[350px]', // 2x4 grid
  }

  // Tint color mapping
  const tintColors = {
    primary: 'bg-primary/20 text-primary border-primary/30',
    accent: 'bg-accent/20 text-accent border-accent/30',
    yellow: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    orange: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    red: 'bg-red-500/20 text-red-500 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    green: 'bg-green-500/20 text-green-500 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  }

  const inactiveTintColors = {
    primary: 'text-primary/50',
    accent: 'text-accent/50',
    yellow: 'text-yellow-500/50',
    orange: 'text-orange-500/50',
    red: 'text-red-500/50',
    blue: 'text-blue-500/50',
    green: 'text-green-500/50',
    purple: 'text-purple-500/50',
  }

  const handlePointerDown = () => {
    // Start long-press timer (500ms like iOS)
    const timer = setTimeout(() => {
      onLongPress(device)
    }, 500)

    const handlePointerUp = () => {
      clearTimeout(timer)
      document.removeEventListener('pointerup', handlePointerUp)
    }

    document.addEventListener('pointerup', handlePointerUp, { once: true })
  }

  const handleClick = () => {
    onTap(device.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      }}
      className={cn(sizeClasses[size], className)}
    >
      <Card
        className={cn(
          'relative h-full w-full cursor-pointer overflow-hidden border-2 transition-all duration-200',
          'backdrop-blur-xl',
          isActive
            ? tintColors[tint as keyof typeof tintColors] || tintColors.primary
            : 'bg-card/50 text-muted-foreground border-border/50'
        )}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        <div className="flex h-full flex-col items-start justify-between p-4">
          {/* Icon */}
          <motion.div
            animate={{
              scale: isActive ? 1 : 0.9,
              opacity: isActive ? 1 : 0.6,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
          >
            <Icon
              className={cn(
                size === 'small' ? 'h-7 w-7' : 'h-9 w-9',
                isActive
                  ? undefined
                  : inactiveTintColors[tint as keyof typeof inactiveTintColors] ||
                      inactiveTintColors.primary
              )}
            />
          </motion.div>

          {/* Content */}
          <div className="flex w-full flex-col gap-1">
            {/* Value indicator (for brightness, temperature, etc.) */}
            {device.value !== undefined && isActive && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-semibold tabular-nums"
              >
                {device.value}
                {device.unit && <span className="ml-1 text-sm">{device.unit}</span>}
              </motion.div>
            )}

            {/* Device name */}
            <div className="line-clamp-2 text-sm leading-tight font-medium">{device.name}</div>

            {/* Status indicator */}
            {device.status !== 'online' && (
              <div className="text-xs opacity-60">{device.status}</div>
            )}
          </div>
        </div>

        {/* Active glow effect */}
        {isActive && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white to-transparent"
            />
            {/* Power-on ripple effect */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-lg"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
              key={`ripple-${device.id}-${isActive}`}
              style={{
                background: `radial-gradient(circle, ${tintColors[tint as keyof typeof tintColors]?.split(' ')[0]?.replace('bg-', 'rgba(var(--') || 'rgba(var(--primary-rgb)'}, 0.4) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
      </Card>
    </motion.div>
  )
}
