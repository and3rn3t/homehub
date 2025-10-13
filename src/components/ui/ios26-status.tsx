/**
 * iOS 26 Status Components
 *
 * Modern status indicators with iOS 26's refined animations.
 * Features:
 * - Live activity pulses
 * - Status badges with glass morphism
 * - Smooth transitions
 * - Context-aware colors
 */

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface iOS26StatusBadgeProps {
  status: 'recording' | 'idle' | 'offline' | 'motion' | 'alert'
  label?: string
  showPulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * iOS 26 Status Badge
 *
 * Elegant status indicator with optional pulse animation
 */
export function iOS26StatusBadge({
  status,
  label,
  showPulse = true,
  size = 'md',
  className,
}: iOS26StatusBadgeProps) {
  const statusConfig = {
    recording: {
      color: 'bg-red-500',
      text: 'text-red-100',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      label: label || 'Recording',
    },
    idle: {
      color: 'bg-green-500',
      text: 'text-green-100',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      label: label || 'Online',
    },
    offline: {
      color: 'bg-gray-500',
      text: 'text-gray-300',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
      label: label || 'Offline',
    },
    motion: {
      color: 'bg-yellow-500',
      text: 'text-yellow-100',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      label: label || 'Motion',
    },
    alert: {
      color: 'bg-orange-500',
      text: 'text-orange-100',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      label: label || 'Alert',
    },
  }

  const config = statusConfig[status]

  const sizes = {
    sm: { dot: 'h-1.5 w-1.5', text: 'text-xs', padding: 'px-2 py-0.5' },
    md: { dot: 'h-2 w-2', text: 'text-xs', padding: 'px-2.5 py-1' },
    lg: { dot: 'h-2.5 w-2.5', text: 'text-sm', padding: 'px-3 py-1.5' },
  }

  const s = sizes[size]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border backdrop-blur-xl',
        config.bg,
        config.border,
        s.padding,
        className
      )}
    >
      {/* Status dot with optional pulse */}
      <div className="relative">
        {showPulse && status !== 'offline' && (
          <motion.div
            className={cn('absolute inset-0 rounded-full', config.color)}
            animate={{
              scale: [1, 2, 2],
              opacity: [0.6, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
        <div className={cn('rounded-full', config.color, s.dot)} />
      </div>

      {/* Label */}
      <span className={cn('font-medium', config.text, s.text)}>{config.label}</span>
    </motion.div>
  )
}

/**
 * iOS 26 Info Chip
 *
 * Small informational chip (for capabilities, specs, etc.)
 */
interface iOS26InfoChipProps {
  icon?: ReactNode
  label: string
  variant?: 'default' | 'accent' | 'warning'
  className?: string
}

export function iOS26InfoChip({ icon, label, variant = 'default', className }: iOS26InfoChipProps) {
  const variantStyles = {
    default: 'bg-white/10 text-white/80 border-white/10',
    accent: 'bg-blue-500/20 text-blue-100 border-blue-500/30',
    warning: 'bg-yellow-500/20 text-yellow-100 border-yellow-500/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 backdrop-blur-xl',
        variantStyles[variant],
        className
      )}
    >
      {icon && <div className="h-3 w-3">{icon}</div>}
      <span className="text-xs font-medium">{label}</span>
    </motion.div>
  )
}

/**
 * iOS 26 Live Activity
 *
 * Dynamic island-style live activity banner
 */
interface iOS26LiveActivityProps {
  icon: ReactNode
  title: string
  subtitle?: string
  actions?: Array<{
    label: string
    onClick: () => void
  }>
  onDismiss?: () => void
  className?: string
}

export function iOS26LiveActivity({
  icon,
  title,
  subtitle,
  actions,
  onDismiss,
  className,
}: iOS26LiveActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10',
        'bg-black/80 p-4 shadow-2xl backdrop-blur-2xl',
        className
      )}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

      {/* Content */}
      <div className="relative flex items-start gap-4">
        {/* Icon with pulse */}
        <div className="relative flex-shrink-0">
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-500/20"
            animate={{
              scale: [1, 1.5, 1.5],
              opacity: [0.5, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            {icon}
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {subtitle && <p className="mt-0.5 text-xs text-white/60">{subtitle}</p>}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.onClick}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDismiss}
            className="flex-shrink-0 rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

/**
 * iOS 26 Signal Strength
 *
 * Animated signal bars with iOS 26 style
 */
interface iOS26SignalProps {
  strength: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function iOS26Signal({ strength, size = 'md', className }: iOS26SignalProps) {
  const bars = 4
  const activeBars = Math.ceil((strength / 100) * bars)

  const sizes = {
    sm: { container: 'h-3 gap-0.5', bar: 'w-0.5' },
    md: { container: 'h-4 gap-1', bar: 'w-1' },
    lg: { container: 'h-5 gap-1', bar: 'w-1' },
  }

  const s = sizes[size]

  return (
    <div className={cn('flex items-end', s.container, className)}>
      {Array.from({ length: bars }).map((_, i) => {
        const isActive = i < activeBars
        const height = ((i + 1) / bars) * 100

        return (
          <motion.div
            key={`signal-bar-${i}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
            className={cn('rounded-full', s.bar, isActive ? 'bg-white' : 'bg-white/20')}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}
