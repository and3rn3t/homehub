/**
 * Service Worker Update Banner
 *
 * Displays a prominent update notification when a new service worker version
 * is available. Provides "Update Now" and "Later" options.
 *
 * Features:
 * - iOS-styled banner with spring animations
 * - Auto-dismisses after 30 seconds if ignored
 * - Preserves queued sync requests during update
 * - Shows loading state during update
 *
 * Usage:
 * ```tsx
 * import { UpdateBanner } from '@/components/UpdateBanner'
 *
 * function App() {
 *   return (
 *     <>
 *       <UpdateBanner />
 *       {children}
 *     </>
 *   )
 * }
 * ```
 */

import { Button } from '@/components/ui/button'
import { useServiceWorkerUpdate } from '@/hooks/use-service-worker-update'
import { RefreshCwIcon, XIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function UpdateBanner() {
  const { updateAvailable, updateServiceWorker, dismissUpdate } = useServiceWorkerUpdate()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (!updateAvailable || isDismissed) return

    const timer = setTimeout(() => {
      setIsDismissed(true)
    }, 30_000)

    return () => clearTimeout(timer)
  }, [updateAvailable, isDismissed])

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateServiceWorker(true)
    } catch (error) {
      console.error('[UpdateBanner] Update failed:', error)
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    dismissUpdate()
  }

  return (
    <AnimatePresence>
      {updateAvailable && !isDismissed && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={cn(
            'fixed top-0 right-0 left-0 z-50',
            'safe-top', // iOS safe area
            'flex items-center justify-center',
            'pointer-events-none'
          )}
        >
          <div
            className={cn(
              'pointer-events-auto mx-4 mt-4',
              'bg-primary/95 backdrop-blur-xl',
              'text-primary-foreground',
              'rounded-2xl shadow-2xl',
              'border-primary-foreground/10 border',
              'p-4',
              'w-full max-w-md'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="mb-1 text-base font-semibold">Update Available</h3>
                <p className="text-sm opacity-90">
                  A new version of HomeHub is ready. Update now for the latest features and fixes.
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                disabled={isUpdating}
                className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 rounded-full"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className={cn(
                  'bg-primary-foreground text-primary flex-1',
                  'hover:bg-primary-foreground/90',
                  'font-semibold'
                )}
              >
                {isUpdating ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    Update Now
                  </>
                )}
              </Button>

              <Button
                onClick={handleDismiss}
                disabled={isUpdating}
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                Later
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
