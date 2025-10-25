/**
 * Offline Banner Component
 *
 * Displays a banner at the top of the screen when the network connection is lost.
 * Features:
 * - Slide-in animation
 * - Haptic feedback on state change
 * - Safe-area aware positioning
 * - Auto-dismiss when connection restored
 */

import { useHaptic } from '@/hooks/use-haptic'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { WifiOffIcon } from '@/lib/icons'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

export function OfflineBanner() {
  const isOnline = useNetworkStatus()
  const haptic = useHaptic()

  // Trigger haptic feedback when connection state changes
  useEffect(() => {
    if (!isOnline) {
      // Heavy haptic when going offline (warning)
      haptic.heavy()
    } else {
      // Success haptic when coming back online
      haptic.success()
    }
  }, [isOnline, haptic])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="safe-top fixed inset-x-0 top-0 z-[100] bg-amber-500 px-4 py-3 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2 text-center">
            <WifiOffIcon className="h-4 w-4 flex-shrink-0 text-white" />
            <span className="text-sm font-medium text-white">No internet connection</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
