/**
 * iOS 26 Error States
 *
 * Contextual error messages with iOS 26's refined visual language.
 * Features:
 * - Glass morphism backgrounds
 * - Gentle spring animations
 * - Actionable error messages
 * - SF Symbols-style iconography
 */

import { AlertCircleIcon, RefreshCwIcon, WifiOffIcon, XCircleIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface iOS26ErrorProps {
  title: string
  message?: string
  variant?: 'error' | 'warning' | 'info' | 'offline'
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * IOS26 Error Card
 *
 * Primary error state component with glass morphism
 */
export function IOS26Error({
  title,
  message,
  variant = 'error',
  icon,
  action,
  secondaryAction,
  className,
}: iOS26ErrorProps) {
  const variantStyles = {
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: 'text-red-400',
      title: 'text-red-100',
      message: 'text-red-200/80',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: 'text-yellow-400',
      title: 'text-yellow-100',
      message: 'text-yellow-200/80',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      title: 'text-blue-100',
      message: 'text-blue-200/80',
    },
    offline: {
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
      icon: 'text-gray-400',
      title: 'text-gray-100',
      message: 'text-gray-200/80',
    },
  }

  const styles = variantStyles[variant]

  const defaultIcon = {
    error: <XCircleIcon className="h-10 w-10" />,
    warning: <AlertCircleIcon className="h-10 w-10" />,
    info: <AlertCircleIcon className="h-10 w-10" />,
    offline: <WifiOffIcon className="h-10 w-10" />,
  }[variant]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6',
        'border backdrop-blur-2xl',
        styles.bg,
        styles.border,
        className
      )}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

      {/* Content */}
      <div className="relative space-y-4">
        {/* Icon + Title */}
        <div className="flex items-start gap-4">
          <div className={cn('flex-shrink-0', styles.icon)}>{icon || defaultIcon}</div>
          <div className="flex-1 space-y-1">
            <h3 className={cn('text-lg font-semibold', styles.title)}>{title}</h3>
            {message && <p className={cn('text-sm', styles.message)}>{message}</p>}
          </div>
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex gap-3">
            {action && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                className={cn(
                  'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold',
                  'bg-white/20 text-white backdrop-blur-sm',
                  'transition-colors hover:bg-white/30',
                  'border border-white/10'
                )}
              >
                {action.label}
              </motion.button>
            )}
            {secondaryAction && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={secondaryAction.onClick}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-sm font-medium',
                  'text-white/80 hover:text-white',
                  'transition-colors hover:bg-white/10'
                )}
              >
                {secondaryAction.label}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

/**
 * iOS 26 Inline Error
 *
 * Compact error banner for inline messages
 */
export function iOS26InlineError({
  title,
  message,
  variant = 'error',
  action,
  className,
}: Omit<iOS26ErrorProps, 'icon' | 'secondaryAction'>) {
  const variantStyles = {
    error: 'bg-red-500/10 border-red-500/20 text-red-100',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-100',
    offline: 'bg-gray-500/10 border-gray-500/20 text-gray-100',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border p-4 backdrop-blur-xl',
        variantStyles[variant],
        className
      )}
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        {message && <p className="text-xs opacity-80">{message}</p>}
      </div>

      {action && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

/**
 * iOS 26 Empty State
 *
 * Beautiful empty state with illustration and CTA
 */
interface iOS26EmptyStateProps {
  icon: ReactNode
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function IOS26EmptyState({ icon, title, message, action, className }: iOS26EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={cn('flex flex-col items-center justify-center gap-6 p-12 text-center', className)}
    >
      {/* Icon with glow */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative"
      >
        <div className="text-white/60">{icon}</div>
        {/* Soft glow */}
        <div className="absolute inset-0 bg-white/5 blur-2xl" />
      </motion.div>

      {/* Text */}
      <div className="space-y-2">
        <motion.h3
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold text-white"
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md text-sm text-white/60"
        >
          {message}
        </motion.p>
      </div>

      {/* Action */}
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className={cn(
            'rounded-xl px-6 py-3 text-sm font-semibold',
            'bg-white/20 text-white backdrop-blur-sm',
            'transition-colors hover:bg-white/30',
            'border border-white/10 shadow-lg'
          )}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

/**
 * iOS 26 Reconnecting Banner
 *
 * Sticky banner for connection issues with auto-retry
 */
interface iOS26ReconnectingProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function IOS26Reconnecting({
  message = 'Connection lost',
  onRetry,
  className,
}: iOS26ReconnectingProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border border-yellow-500/20',
        'bg-yellow-500/10 p-4 backdrop-blur-2xl',
        className
      )}
    >
      {/* Icon + Message */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCwIcon className="h-5 w-5 text-yellow-400" />
        </motion.div>
        <div>
          <p className="text-sm font-medium text-yellow-100">{message}</p>
          <p className="text-xs text-yellow-200/60">Attempting to reconnect...</p>
        </div>
      </div>

      {/* Retry button */}
      {onRetry && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-semibold text-yellow-100 hover:bg-yellow-500/30"
        >
          Retry Now
        </motion.button>
      )}
    </motion.div>
  )
}
