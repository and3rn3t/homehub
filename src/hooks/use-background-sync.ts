/**
 * React Hook for Background Sync
 *
 * Provides a seamless interface for queuing offline requests and monitoring sync status.
 * Automatically queues failed API requests and shows user notifications.
 *
 * Usage:
 * ```typescript
 * const { queueCount, isSupported, queueRequest } = useBackgroundSync()
 *
 * // Queue a device control action
 * const toggleDevice = async (deviceId: string, enabled: boolean) => {
 *   try {
 *     await fetch(`/api/devices/${deviceId}/control`, {
 *       method: 'POST',
 *       body: JSON.stringify({ enabled })
 *     })
 *   } catch (error) {
 *     if (!navigator.onLine) {
 *       await queueRequest({
 *         url: `/api/devices/${deviceId}/control`,
 *         method: 'POST',
 *         body: JSON.stringify({ enabled })
 *       })
 *       toast.info('Action queued - will sync when online')
 *     }
 *   }
 * }
 * ```
 */

import {
  clearQueue,
  getQueueCount,
  isBackgroundSyncSupported,
  queueRequest as queueRequestFn,
  triggerSync,
  type QueuedRequest,
} from '@/lib/background-sync'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SyncCompleteData {
  total: number
  success: number
  failed: number
}

export function useBackgroundSync() {
  const [queueCount, setQueueCount] = useState(0)
  const [isSupported] = useState(isBackgroundSyncSupported())

  /**
   * Update queue count from IndexedDB
   */
  const updateQueueCount = async () => {
    try {
      const count = await getQueueCount()
      setQueueCount(count)
    } catch (error) {
      console.error('[useBackgroundSync] Failed to get queue count:', error)
    }
  }

  /**
   * Queue a request for background sync
   */
  const queueRequest = async (request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>) => {
    try {
      const id = await queueRequestFn(request)
      await updateQueueCount()
      return id
    } catch (error) {
      console.error('[useBackgroundSync] Failed to queue request:', error)
      throw error
    }
  }

  /**
   * Manually trigger sync
   */
  const triggerManualSync = async () => {
    if (!isSupported) {
      toast.error('Background sync not supported')
      return
    }

    try {
      await triggerSync()
      toast.info('Sync triggered')
    } catch (error) {
      console.error('[useBackgroundSync] Failed to trigger sync:', error)
      toast.error('Failed to trigger sync')
    }
  }

  /**
   * Clear all queued requests
   */
  const clearAllQueued = async () => {
    try {
      await clearQueue()
      await updateQueueCount()
      toast.success('Queue cleared')
    } catch (error) {
      console.error('[useBackgroundSync] Failed to clear queue:', error)
      toast.error('Failed to clear queue')
    }
  }

  /**
   * Listen for sync completion messages from service worker
   */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'sync-complete') {
        const data = event.data.data as SyncCompleteData
        console.log('[useBackgroundSync] Sync complete:', data)

        // Update queue count
        updateQueueCount()

        // Show notification
        if (data.success > 0) {
          toast.success(`Synced ${data.success} ${data.success === 1 ? 'action' : 'actions'}`)
        }

        if (data.failed > 0) {
          toast.error(`${data.failed} ${data.failed === 1 ? 'action' : 'actions'} failed`)
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    // Initial queue count
    updateQueueCount()

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  /**
   * Update queue count when online/offline status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('[useBackgroundSync] Online - checking queue')
      updateQueueCount()
    }

    const handleOffline = () => {
      console.log('[useBackgroundSync] Offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    queueCount,
    isSupported,
    queueRequest,
    triggerSync: triggerManualSync,
    clearQueue: clearAllQueued,
    refreshCount: updateQueueCount,
  }
}
