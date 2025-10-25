/**
 * Background Sync Manager
 *
 * Handles offline request queuing and automatic retry when connection is restored.
 * Integrates with the Service Worker's background sync capability.
 *
 * Features:
 * - Queue failed API requests when offline
 * - Automatic retry when connection restored
 * - Exponential backoff for failed requests
 * - User notifications on sync completion
 * - IndexedDB for persistent queue storage
 *
 * Usage:
 * ```typescript
 * import { queueRequest, getQueuedRequests } from '@/lib/background-sync'
 *
 * // Queue a request for later
 * await queueRequest({
 *   url: '/api/devices/123/control',
 *   method: 'POST',
 *   body: JSON.stringify({ enabled: true })
 * })
 *
 * // Check pending requests
 * const pending = await getQueuedRequests()
 * console.log(`${pending.length} requests pending`)
 * ```
 */

export interface QueuedRequest {
  id: string
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
  timestamp: number
  retryCount: number
  maxRetries: number
}

const QUEUE_NAME = 'homehub-offline-queue'
const DB_NAME = 'homehub-sync-db'
const STORE_NAME = 'requests'

/**
 * Open IndexedDB for queue storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(new Error(request.error?.message || 'Failed to open IndexedDB'))
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Queue a request for background sync
 *
 * @param request - Request details to queue
 * @returns Promise that resolves when queued
 */
export async function queueRequest(
  request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>
): Promise<string> {
  const db = await openDB()

  const queuedRequest: QueuedRequest = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retryCount: 0,
    ...request,
    maxRetries: request.maxRetries ?? 3,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const addRequest = store.add(queuedRequest)

    addRequest.onsuccess = () => {
      console.log('[BackgroundSync] Request queued:', queuedRequest.id)
      resolve(queuedRequest.id)

      // Attempt to register sync if service worker available
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready
          .then(registration => {
            return registration.sync.register(QUEUE_NAME)
          })
          .then(() => {
            console.log('[BackgroundSync] Sync registered')
          })
          .catch(error => {
            console.warn('[BackgroundSync] Sync registration failed:', error)
          })
      }
    }

    addRequest.onerror = () =>
      reject(new Error(addRequest.error?.message || 'Failed to queue request'))
  })
}

/**
 * Get all queued requests
 *
 * @returns Array of queued requests
 */
export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const getAllRequest = store.getAll()

    getAllRequest.onsuccess = () => {
      resolve(getAllRequest.result)
    }

    getAllRequest.onerror = () =>
      reject(new Error(getAllRequest.error?.message || 'Failed to get queued requests'))
  })
}

/**
 * Remove a request from the queue
 *
 * @param id - Request ID to remove
 */
export async function removeQueuedRequest(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const deleteRequest = store.delete(id)

    deleteRequest.onsuccess = () => {
      console.log('[BackgroundSync] Request removed:', id)
      resolve()
    }

    deleteRequest.onerror = () =>
      reject(new Error(deleteRequest.error?.message || 'Failed to remove request'))
  })
}

/**
 * Update a request's retry count
 *
 * @param id - Request ID
 * @param retryCount - New retry count
 */
export async function updateRetryCount(id: string, retryCount: number): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const request = getRequest.result
      if (request) {
        request.retryCount = retryCount
        const updateRequest = store.put(request)

        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () =>
          reject(new Error(updateRequest.error?.message || 'Failed to update retry count'))
      } else {
        resolve()
      }
    }

    getRequest.onerror = () =>
      reject(new Error(getRequest.error?.message || 'Failed to get request'))
  })
}

/**
 * Clear all queued requests
 */
export async function clearQueue(): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const clearRequest = store.clear()

    clearRequest.onsuccess = () => {
      console.log('[BackgroundSync] Queue cleared')
      resolve()
    }

    clearRequest.onerror = () =>
      reject(new Error(clearRequest.error?.message || 'Failed to clear queue'))
  })
}

/**
 * Get the count of queued requests
 *
 * @returns Number of pending requests
 */
export async function getQueueCount(): Promise<number> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const countRequest = store.count()

    countRequest.onsuccess = () => resolve(countRequest.result)
    countRequest.onerror = () =>
      reject(new Error(countRequest.error?.message || 'Failed to count requests'))
  })
}

/**
 * Check if background sync is supported
 *
 * @returns true if background sync is available
 */
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype
}

/**
 * Manually trigger sync (for testing)
 *
 * @returns Promise that resolves when sync is triggered
 */
export async function triggerSync(): Promise<void> {
  if (!isBackgroundSyncSupported()) {
    throw new Error('Background sync not supported')
  }

  const registration = await navigator.serviceWorker.ready
  await registration.sync.register(QUEUE_NAME)
  console.log('[BackgroundSync] Manual sync triggered')
}
