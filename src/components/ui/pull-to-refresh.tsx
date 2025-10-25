import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface PullToRefreshProps {
  /** Content to render inside the pull-to-refresh container */
  children: ReactNode
  /** Callback function executed on refresh trigger */
  onRefresh: () => Promise<void>
  /** Threshold distance in pixels to trigger refresh (default: 80) */
  threshold?: number
  /** Maximum pull distance in pixels (default: 120) */
  maxPull?: number
  /** Whether pull-to-refresh is enabled (default: true) */
  disabled?: boolean
  /** Custom loading spinner component */
  spinner?: ReactNode
  /** Class name for the container */
  className?: string
}

/**
 * Pull-to-Refresh Component
 *
 * Mobile-friendly pull-to-refresh gesture with elastic physics.
 * Triggers a refresh callback when pulled beyond threshold.
 *
 * Features:
 * - Touch-based gesture detection
 * - Elastic resistance (harder to pull further)
 * - Smooth spring animations
 * - Loading state with spinner
 * - iOS-like feel with haptic feedback
 *
 * @example
 * <PullToRefresh onRefresh={async () => { await fetchData() }}>
 *   <div>Your content here</div>
 * </PullToRefresh>
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
  spinner,
  className = '',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const controls = useAnimation()
  const y = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isDragging = useRef(false)

  // Calculate opacity and rotation for spinner based on pull distance
  const opacity = useTransform(y, [0, threshold], [0, 1])
  const rotate = useTransform(y, [0, threshold], [0, 360])
  const scale = useTransform(y, [0, threshold, maxPull], [0.5, 1, 1.2])

  // Elastic resistance - gets harder to pull further
  const applyResistance = (distance: number): number => {
    if (distance < 0) return 0
    if (distance <= threshold) return distance
    // Apply exponential resistance after threshold
    const excess = distance - threshold
    const resistance = threshold + excess * 0.5
    return Math.min(resistance, maxPull)
  }

  // Check if we're at the top of the scroll container
  const isAtTop = (): boolean => {
    const container = containerRef.current
    if (!container) return false
    return container.scrollTop === 0
  }

  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop()) return
    const touch = e.touches[0]
    if (!touch) return
    startY.current = touch.clientY
    isDragging.current = true
  }

  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || disabled || isRefreshing) return

    const touch = e.touches[0]
    if (!touch) return
    const currentY = touch.clientY
    const distance = currentY - startY.current

    // Only pull down, not up
    if (distance > 0) {
      const resistedDistance = applyResistance(distance)
      y.set(resistedDistance)

      // Prevent default scroll behavior when pulling
      if (resistedDistance > 10) {
        e.preventDefault()
      }
    }
  }

  // Handle touch end
  const handleTouchEnd = async () => {
    if (!isDragging.current || disabled) return

    isDragging.current = false
    const currentY = y.get()

    // Trigger refresh if pulled beyond threshold
    if (currentY >= threshold && !isRefreshing) {
      setIsRefreshing(true)

      // Snap to threshold position
      await controls.start({
        y: threshold,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      })

      try {
        // Execute refresh callback
        await onRefresh()
      } catch (error) {
        console.error('Pull-to-refresh error:', error)
      }

      // Reset after refresh complete
      setIsRefreshing(false)
      await controls.start({
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 25 },
      })
    } else {
      // Snap back to top if not beyond threshold
      await controls.start({
        y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 30 },
      })
    }
  }

  // Attach touch event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    // Event handler wrappers to satisfy deps
    const onTouchStart = (e: TouchEvent) => handleTouchStart(e)
    const onTouchMove = (e: TouchEvent) => handleTouchMove(e)
    const onTouchEnd = () => handleTouchEnd()

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])

  return (
    <div ref={containerRef} className={`relative h-full overflow-y-auto ${className}`}>
      {/* Pull indicator */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-center"
        style={{ y, opacity }}
      >
        <motion.div
          className="bg-card flex items-center justify-center rounded-full p-3 shadow-lg"
          style={{ rotate, scale }}
        >
          {spinner || (
            <svg
              className="text-primary h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div animate={controls} style={{ y }}>
        {children}
      </motion.div>
    </div>
  )
}
