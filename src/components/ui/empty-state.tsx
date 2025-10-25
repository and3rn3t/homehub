import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HomeRoomIcon, LightbulbIcon, PlayIcon, PlusIcon, StarIcon } from '@/lib/icons'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  type: 'devices' | 'scenes' | 'rooms' | 'favorites'
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

const emptyStateConfig = {
  devices: {
    icon: LightbulbIcon,
    defaultTitle: 'No Devices Yet',
    defaultDescription: 'Get started by adding your first smart device to your home',
    defaultActionLabel: 'Add Device',
    gradient: 'from-blue-400 via-purple-400 to-pink-400',
    iconColor: 'text-blue-500',
  },
  scenes: {
    icon: PlayIcon,
    defaultTitle: 'No Scenes Created',
    defaultDescription: 'Create scenes to control multiple devices with a single tap',
    defaultActionLabel: 'Create Scene',
    gradient: 'from-green-400 via-teal-400 to-blue-400',
    iconColor: 'text-green-500',
  },
  rooms: {
    icon: HomeRoomIcon,
    defaultTitle: 'No Rooms Configured',
    defaultDescription: 'Organize your devices by creating rooms in your home',
    defaultActionLabel: 'Add Room',
    gradient: 'from-orange-400 via-red-400 to-pink-400',
    iconColor: 'text-orange-500',
  },
  favorites: {
    icon: StarIcon,
    defaultTitle: 'No Favorites Yet',
    defaultDescription: 'Mark devices as favorites for quick access from your dashboard',
    defaultActionLabel: 'Browse Devices',
    gradient: 'from-yellow-400 via-orange-400 to-red-400',
    iconColor: 'text-yellow-500',
  },
}

/**
 * EmptyState Component
 *
 * Displays friendly empty state illustrations with CTAs when no data exists.
 * Uses iOS-style design with gradient backgrounds and smooth animations.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   type="devices"
 *   onAction={() => setDiscoveryOpen(true)}
 * />
 * ```
 */
export function EmptyState({ type, title, description, actionLabel, onAction }: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
    >
      <Card className="border-border/50 from-background/50 to-muted/30 border-2 border-dashed bg-gradient-to-br backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
          {/* Animated Icon with Gradient Background */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="relative mb-6"
          >
            {/* Gradient Circle Background */}
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.gradient} opacity-20 blur-2xl`}
              style={{ width: '120px', height: '120px' }}
            />

            {/* Icon Container */}
            <motion.div
              className="bg-background/80 border-border/50 relative rounded-full border-2 p-6 shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
              }}
            >
              <IconComponent className={`h-12 w-12 ${config.iconColor}`} />
            </motion.div>

            {/* Floating Sparkles */}
            <motion.div
              className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-yellow-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-blue-400"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-foreground mb-2 text-xl font-semibold">
              {title || config.defaultTitle}
            </h3>
            <p className="text-muted-foreground max-w-md text-sm sm:text-base">
              {description || config.defaultDescription}
            </p>
          </motion.div>

          {/* CTA Button */}
          {onAction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onAction}
                size="lg"
                className="gap-2 shadow-lg transition-shadow hover:shadow-xl"
              >
                <PlusIcon className="h-5 w-5" />
                {actionLabel || config.defaultActionLabel}
              </Button>
            </motion.div>
          )}

          {/* Optional Decorative Wave Pattern */}
          <svg
            className="absolute right-0 bottom-0 left-0 opacity-5"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            style={{ height: '80px' }}
          >
            <motion.path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="currentColor"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </svg>
        </CardContent>
      </Card>
    </motion.div>
  )
}
