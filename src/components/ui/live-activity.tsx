import { Progress } from '@/components/ui/progress'
import type { LucideIcon } from '@/lib/icons'
import { XIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'

interface LiveActivityProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  progress?: number
  style?: 'compact' | 'expanded'
  isVisible: boolean
  onDismiss?: () => void
  className?: string
}

export function LiveActivity({
  icon: Icon,
  title,
  subtitle,
  progress,
  style = 'compact',
  isVisible,
  onDismiss,
  className,
}: LiveActivityProps) {
  const isExpanded = style === 'expanded'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
          className={cn(
            'fixed top-4 left-1/2 z-50 -translate-x-1/2',
            'rounded-2xl backdrop-blur-xl',
            'bg-card/95 border-border/50 border shadow-2xl',
            isExpanded ? 'w-[380px]' : 'w-[280px]',
            className
          )}
        >
          <div className={cn('flex items-center gap-3', isExpanded ? 'p-4' : 'p-3')}>
            {/* Icon */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
              className="flex-shrink-0"
            >
              <div className="bg-primary/20 rounded-full p-2">
                <Icon className={cn(isExpanded ? 'h-6 w-6' : 'h-5 w-5', 'text-primary')} />
              </div>
            </motion.div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="text-sm leading-tight font-semibold">{title}</div>
              {subtitle && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground mt-0.5 line-clamp-1 text-xs"
                >
                  {subtitle}
                </motion.div>
              )}

              {/* Progress bar */}
              {progress !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-2"
                >
                  <Progress value={progress} className="h-1.5" />
                  <div className="text-muted-foreground mt-1 text-xs tabular-nums">
                    {Math.round(progress)}%
                  </div>
                </motion.div>
              )}
            </div>

            {/* Dismiss button */}
            {onDismiss && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onDismiss}
                className="hover:bg-accent/10 active:bg-accent/20 flex-shrink-0 rounded-full p-1.5 transition-colors"
              >
                <XIcon className="text-muted-foreground h-4 w-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
