import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
  xl: 'h-12 w-12 border-4',
}

/**
 * Spinner Component
 *
 * A rotating loading spinner with size variants.
 * Uses CSS animation for smooth rotation.
 *
 * @example
 * <Spinner size="md" label="Loading..." />
 */
export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'border-primary animate-spin rounded-full border-t-transparent',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <p className="text-muted-foreground text-sm">{label}</p>}
    </div>
  )
}

/**
 * Inline Spinner
 *
 * A small spinner for inline use (buttons, etc.)
 */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

/**
 * Dots Spinner
 *
 * Three animated dots for subtle loading indication.
 */
export function DotsSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="bg-primary h-2 w-2 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Pulse Spinner
 *
 * A pulsing circle for subtle loading indication.
 */
export function PulseSpinner({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('bg-primary h-6 w-6 rounded-full', className)}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

/**
 * Loading Overlay
 *
 * Full-screen loading overlay with spinner and optional message.
 */
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-foreground text-lg font-medium"
          >
            {message}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Button Spinner
 *
 * Spinner designed for use inside buttons.
 * Automatically sized to match button content.
 */
export function ButtonSpinner() {
  return <InlineSpinner className="text-current" />
}
