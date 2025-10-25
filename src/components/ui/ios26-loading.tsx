/**
 * iOS 26 Loading Components
 *
 * Modern loading states inspired by iOS 26's refined design language.
 * Features:
 * - Frosted glass blur effects
 * - Smooth spring animations
 * - Contextual messaging
 * - Progressive disclosure patterns
 */

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface iOS26LoadingProps {
  message?: string
  submessage?: string
  variant?: 'spinner' | 'dots' | 'pulse' | 'shimmer'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * IOS26 Spinner
 *
 * The classic iOS spinner with refined motion and glass morphism
 */
export function IOS26Spinner({
  message = 'Loading',
  submessage,
  size = 'md',
  className,
}: iOS26LoadingProps) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-16 w-16 border-4',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        'rounded-2xl bg-black/20 p-6 backdrop-blur-2xl',
        'border border-white/10 shadow-2xl',
        className
      )}
    >
      {/* Spinner */}
      <div className="relative">
        <motion.div
          className={cn('rounded-full border-white/30 border-t-white', sizes[size])}
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-white/5 blur-sm" />
      </div>

      {/* Messages */}
      {message && (
        <div className="space-y-1 text-center">
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-white"
          >
            {message}
          </motion.p>
          {submessage && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-white/60"
            >
              {submessage}
            </motion.p>
          )}
        </div>
      )}
    </motion.div>
  )
}

/**
 * IOS26 Dots
 *
 * Three-dot loading animation with spring physics
 */
export function IOS26Dots({
  message,
  submessage,
  className,
}: Omit<iOS26LoadingProps, 'size' | 'variant'>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        'rounded-2xl bg-black/20 p-6 backdrop-blur-2xl',
        'border border-white/10 shadow-2xl',
        className
      )}
    >
      {/* Dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="h-3 w-3 rounded-full bg-white"
            animate={{
              y: [0, -12, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: [0.34, 1.56, 0.64, 1], // iOS elastic ease
            }}
          />
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-white">{message}</p>
          {submessage && <p className="text-xs text-white/60">{submessage}</p>}
        </div>
      )}
    </motion.div>
  )
}

/**
 * IOS26 Pulse
 *
 * Pulsing circle loader with scale animation
 */
export function IOS26Pulse({
  message,
  className,
}: Omit<iOS26LoadingProps, 'size' | 'variant' | 'submessage'>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex items-center gap-3', className)}
    >
      {/* Pulse circles */}
      <div className="relative h-8 w-8">
        {/* Outer pulse */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/20"
          animate={{
            scale: [1, 1.8],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        {/* Inner pulse */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/30"
          animate={{
            scale: [1, 1.5],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.3,
          }}
        />
        {/* Core */}
        <motion.div
          className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-white shadow-lg"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {message && <p className="text-sm font-medium text-white">{message}</p>}
    </motion.div>
  )
}

/**
 * IOS26 Shimmer
 *
 * Elegant shimmer loading for content placeholders
 */
export function IOS26Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {/* Base gradient */}
      <div className="h-full w-full bg-gradient-to-r from-white/5 via-white/10 to-white/5" />

      {/* Animated shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

/**
 * iOS 26 Progress Ring
 *
 * Circular progress indicator with spring animation
 */
interface iOS26ProgressRingProps {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  message?: string
  className?: string
}

export function iOS26ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  message,
  className,
}: iOS26ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex flex-col items-center gap-3', className)}
    >
      {/* Ring */}
      <div className="relative">
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/20"
          />

          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-white"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </svg>

        {/* Percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={progress}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm font-semibold text-white"
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
      </div>

      {/* Message */}
      {message && <p className="text-xs text-white/70">{message}</p>}
    </motion.div>
  )
}
