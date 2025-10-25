import { Button } from '@/components/ui/button'
import type { LucideIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export interface LongPressMenuItem {
  icon: LucideIcon
  label: string
  action: () => void
  destructive?: boolean
  disabled?: boolean
}

interface LongPressMenuProps {
  trigger: React.ReactNode
  items: LongPressMenuItem[]
  disabled?: boolean
}

export function LongPressMenu({ trigger, items, disabled = false }: LongPressMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handlePointerDown = (_e: React.PointerEvent) => {
    if (disabled) return

    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Store position for menu placement
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })

    // Start long-press timer (500ms like iOS)
    longPressTimer.current = setTimeout(() => {
      setIsOpen(true)
    }, 500)
  }

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handlePointerUp = () => {
    clearLongPressTimer()
  }

  const handlePointerLeave = () => {
    clearLongPressTimer()
  }

  const handleItemClick = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <>
      {/* Trigger element */}
      <div
        ref={triggerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="touch-none"
      >
        {trigger}
      </div>

      {/* Long-press menu overlay and menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Context menu */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
              style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
              }}
              className="bg-card/95 border-border/50 z-50 min-w-[200px] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
            >
              <div className="py-2">
                {items.map((item, index) => {
                  const IconComponent = item.icon
                  const itemKey = `${item.label}-${index}`

                  return (
                    <motion.div
                      key={itemKey}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        disabled={item.disabled}
                        onClick={() => handleItemClick(item.action)}
                        className={cn(
                          'h-auto w-full justify-start gap-3 rounded-none px-4 py-3 font-normal',
                          'hover:bg-accent/10 active:bg-accent/20',
                          'transition-colors duration-150',
                          item.destructive &&
                            'text-red-500 hover:bg-red-500/10 hover:text-red-600 active:bg-red-500/20'
                        )}
                      >
                        <IconComponent
                          className={cn('h-5 w-5', item.destructive ? 'text-red-500' : undefined)}
                        />
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
