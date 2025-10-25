/**
 * SwipeableCard Component
 *
 * iOS Mail-style swipeable card with reveal actions
 * Supports left swipe to reveal actions (Edit, Delete, Favorite, etc.)
 *
 * Features:
 * - Smooth Framer Motion drag animations
 * - Configurable action buttons with colors and icons
 * - Haptic feedback on swipe
 * - Auto-reset after action
 * - Touch and mouse support
 *
 * @example
 * ```tsx
 * <SwipeableCard
 *   actions={[
 *     { label: 'Edit', icon: EditIcon, color: 'blue', onAction: handleEdit },
 *     { label: 'Delete', icon: TrashIcon, color: 'red', onAction: handleDelete },
 *   ]}
 * >
 *   <YourCardContent />
 * </SwipeableCard>
 * ```
 */

import { useHaptic } from '@/hooks/use-haptic'
import { cn } from '@/lib/utils'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { ReactNode, useCallback, useRef, useState } from 'react'

export interface SwipeAction {
  /** Action label */
  label: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Color theme: blue (edit), red (delete), yellow (favorite), green (success) */
  color: 'blue' | 'red' | 'yellow' | 'green'
  /** Callback when action is triggered */
  onAction: () => void | Promise<void>
}

interface SwipeableCardProps {
  /** Card content to wrap */
  children: ReactNode
  /** Array of actions to reveal on swipe */
  actions: SwipeAction[]
  /** Optional className for the wrapper */
  className?: string
  /** Swipe threshold to reveal actions (default: -80px) */
  threshold?: number
  /** Disable swipe gestures */
  disabled?: boolean
}

const colorStyles = {
  blue: 'bg-blue-500 hover:bg-blue-600 text-white',
  red: 'bg-red-500 hover:bg-red-600 text-white',
  yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  green: 'bg-green-500 hover:bg-green-600 text-white',
}

export function SwipeableCard({
  children,
  actions,
  className,
  threshold = -80,
  disabled = false,
}: SwipeableCardProps) {
  const haptic = useHaptic()
  const [isOpen, setIsOpen] = useState(false)
  const dragX = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate action button width based on number of actions
  const actionWidth = 80
  const totalActionsWidth = actions.length * actionWidth

  // Transform for action buttons opacity and scale
  const actionsOpacity = useTransform(dragX, [0, threshold], [0, 1])
  const actionsScale = useTransform(dragX, [0, threshold], [0.8, 1])

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeDistance = info.offset.x

      // Swipe left to open actions
      if (swipeDistance < threshold && !isOpen) {
        haptic.medium()
        setIsOpen(true)
        dragX.set(-totalActionsWidth)
      }
      // Swipe right to close
      else if (swipeDistance > -threshold / 2 && isOpen) {
        haptic.light()
        setIsOpen(false)
        dragX.set(0)
      }
      // Snap back to current state
      else {
        dragX.set(isOpen ? -totalActionsWidth : 0)
      }
    },
    [threshold, isOpen, haptic, dragX, totalActionsWidth]
  )

  const handleAction = useCallback(
    async (action: SwipeAction) => {
      haptic.heavy() // Strong haptic for action
      await action.onAction()

      // Auto-close after action
      setIsOpen(false)
      dragX.set(0)
    },
    [haptic, dragX]
  )

  if (disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Action Buttons (behind card) */}
      <motion.div
        className="absolute top-0 right-0 flex h-full items-stretch"
        style={{
          opacity: actionsOpacity,
          scale: actionsScale,
        }}
      >
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={`${action.label}-${index}`}
              onClick={() => handleAction(action)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-5 transition-colors',
                colorStyles[action.color]
              )}
              style={{ width: actionWidth }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          )
        })}
      </motion.div>

      {/* Draggable Card Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -totalActionsWidth, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
        whileTap={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>
    </div>
  )
}
