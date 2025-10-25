/**
 * iOS 26 Dynamic Floating Tab Bar
 *
 * Features:
 * - Liquid glass morphism with dynamic blur
 * - Material Design ripple effects
 * - Spring physics animations
 * - Adaptive sizing (larger icons)
 * - Dynamic island-style floating design
 * - Haptic-style feedback
 */

import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useRef, useState, type MouseEvent, type TouchEvent } from 'react'

interface TabItem {
  id: string
  label: string
  icon: LucideIcon
  badge?: number | string
}

interface iOS26TabBarProps {
  items: TabItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

interface RippleEffect {
  id: number
  x: number
  y: number
}

/**
 * Individual tab button with Material ripple effect
 */
function IOS26TabButton({
  item,
  isActive,
  onClick,
}: {
  item: TabItem
  isActive: boolean
  onClick: () => void
}) {
  const [ripples, setRipples] = useState<RippleEffect[]>([])
  const rippleCounter = useRef(0)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const Icon = item.icon

  // Spring animations for icon scale
  const scale = useSpring(isActive ? 1.15 : 1, {
    stiffness: 400,
    damping: 25,
  })

  const iconY = useSpring(isActive ? -2 : 0, {
    stiffness: 350,
    damping: 30,
  })

  // Create ripple effect on click/touch
  const createRipple = (clientX: number, clientY: number) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const newRipple: RippleEffect = {
      id: rippleCounter.current++,
      x,
      y,
    }

    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    createRipple(e.clientX, e.clientY)
    onClick()
  }

  const handleTouchStart = (e: TouchEvent<HTMLButtonElement>) => {
    const touch = e.touches[0]
    if (touch) {
      createRipple(touch.clientX, touch.clientY)
    }
  }

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      className={cn(
        'touch-target relative flex flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-3 py-2 transition-colors',
        'min-h-[60px] min-w-[64px]',
        'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
      )}
      whileTap={{ scale: 0.95 }}
      initial={false}
      animate={{
        backgroundColor: isActive ? 'oklch(0.6 0.15 250 / 0.12)' : 'transparent',
      }}
      transition={{
        backgroundColor: {
          type: 'spring',
          stiffness: 500,
          damping: 30,
        },
      }}
    >
      {/* Material Design Ripples */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="bg-primary/30 absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{
              width: 0,
              height: 0,
              x: 0,
              y: 0,
              opacity: 0.5,
            }}
            animate={{
              width: 200,
              height: 200,
              x: -100,
              y: -100,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Icon with spring animation */}
      <motion.div
        style={{
          scale,
          y: iconY,
        }}
        className="relative"
      >
        <Icon
          className={cn(
            'h-7 w-7 transition-all duration-200',
            isActive && 'drop-shadow-[0_2px_8px_oklch(0.6_0.15_250_/_0.4)]'
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />

        {/* Badge indicator */}
        {item.badge !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-lg"
          >
            {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
          </motion.div>
        )}
      </motion.div>

      {/* Label with fade animation */}
      <motion.span
        className={cn(
          'text-[11px] font-semibold transition-all duration-200',
          isActive && 'font-bold'
        )}
        animate={{
          opacity: isActive ? 1 : 0.8,
          y: isActive ? 0 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      >
        {item.label}
      </motion.span>

      {/* Active indicator pill */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="bg-primary/8 absolute inset-0 -z-10 rounded-2xl shadow-[inset_0_2px_8px_oklch(0.6_0.15_250_/_0.15)]"
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 35,
              mass: 0.8,
            }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/**
 * Main iOS 26 Floating Tab Bar Component
 */
export function IOS26TabBar({ items, value, onValueChange, className }: iOS26TabBarProps) {
  // Mouse position for parallax effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring-smoothed parallax transforms
  const parallaxX = useSpring(useTransform(mouseX, [-200, 200], [-3, 3]), {
    stiffness: 150,
    damping: 20,
  })
  const parallaxY = useSpring(useTransform(mouseY, [-100, 100], [-2, 2]), {
    stiffness: 150,
    damping: 20,
  })

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'safe-bottom fixed left-1/2 z-[100] -translate-x-1/2',
        'bottom-2 w-[min(calc(100%-16px),480px)] pb-2',
        'sm:bottom-6 sm:w-[min(calc(100%-32px),480px)] sm:pb-4',
        className
      )}
      style={{
        x: parallaxX,
        y: parallaxY,
      }}
      initial={false}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Liquid Glass Container */}
      <motion.div
        className={cn(
          'relative overflow-hidden rounded-[28px]',
          'shadow-[0_8px_32px_oklch(0_0_0_/_0.12),0_2px_8px_oklch(0_0_0_/_0.08),inset_0_1px_1px_oklch(1_0_0_/_0.1)]',
          'border border-white/20'
        )}
        whileHover={{
          scale: 1.02,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
          },
        }}
      >
        {/* Multi-layer glass effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/5 backdrop-blur-2xl" />
        <div className="bg-card/85 absolute inset-0" />
        <div className="from-primary/5 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
        {/* Multi-layer glass effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/5 backdrop-blur-2xl" />
        <div className="bg-card/85 absolute inset-0" />
        <div className="from-primary/5 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

        {/* Shimmer overlay effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 5,
          }}
        />

        {/* Tab buttons container */}
        <div className="relative flex items-center gap-1 p-2">
          {items.map(item => (
            <IOS26TabButton
              key={item.id}
              item={item}
              isActive={value === item.id}
              onClick={() => onValueChange(item.id)}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom glow effect */}
      <div className="bg-primary/10 pointer-events-none absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full blur-2xl" />
    </motion.div>
  )
}

/**
 * Compact variant for mobile/responsive layouts
 */
export function IOS26TabBarCompact({ items, value, onValueChange, className }: iOS26TabBarProps) {
  return (
    <motion.div
      className={cn(
        'safe-bottom fixed left-1/2 z-50 -translate-x-1/2',
        'bottom-2 w-[min(calc(100%-16px),360px)] pb-2',
        'sm:bottom-4 sm:pb-3',
        className
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 30,
      }}
    >
      <div className="bg-card/90 relative overflow-hidden rounded-3xl border border-white/15 p-1.5 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-0.5">
          {items.map(item => {
            const Icon = item.icon
            const isActive = value === item.id

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onValueChange(item.id)}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl p-2',
                  'min-h-[56px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                whileTap={{ scale: 0.92 }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={cn('text-[10px] font-medium', isActive && 'font-bold')}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="compactActiveTab"
                    className="bg-primary/10 absolute inset-0 -z-10 rounded-2xl"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
