/**
 * Service Worker Sync Event Handler
 *
 * Handles background sync events to replay queued requests when connection is restored.
 * This file is imported by the service worker during build via vite.config.ts.
 *
 * Features:
 * - Processes queued requests from IndexedDB
 * - Exponential backoff for failed retries
 * - Automatic queue cleanup on success
 * - Notifies client of sync results
 */

/// <reference lib="webworker" />
import type { QueuedRequest } from '../lib/background-sync'

declare const self: ServiceWorkerGlobalScope

const QUEUE_NAME = 'homehub-offline-queue'
const DB_NAME = 'homehub-sync-db'
const STORE_NAME = 'requests'

/**
 * Open IndexedDB (same as client-side implementation)
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, 1)

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
 * Get all queued requests
 */
async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const getAllRequest = store.getAll()

    getAllRequest.onsuccess = () => resolve(getAllRequest.result)
    getAllRequest.onerror = () =>
      reject(new Error(getAllRequest.error?.message || 'Failed to get requests'))
  })
}

/**
 * Remove a request from the queue
 */
async function removeRequest(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const deleteRequest = store.delete(id)

    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () =>
      reject(new Error(deleteRequest.error?.message || 'Failed to remove request'))
  })
}

/**
 * Update retry count for a request
 */
async function updateRetryCount(id: string, retryCount: number): Promise<void> {
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
          reject(new Error(updateRequest.error?.message || 'Failed to update'))
      } else {
        resolve()
      }
    }

    getRequest.onerror = () =>
      reject(new Error(getRequest.error?.message || 'Failed to get request'))
  })
}

/**
 * Replay a queued request
 */
async function replayRequest(request: QueuedRequest): Promise<Response> {
  const { url, method, headers, body } = request

  console.log('[SW Sync] Replaying request:', { url, method })

  const response = await fetch(url, {
    method,
    headers: headers || {},
    body: body || undefined,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response
}

/**
 * Notify all clients of sync result
 */
async function notifyClients(message: { type: string; data: unknown }): Promise<void> {
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage(message)
  })
}

/**
 * Process all queued requests
 */
async function processQueue(): Promise<void> {
  const requests = await getQueuedRequests()

  console.log(`[SW Sync] Processing ${requests.length} queued requests`)

  let successCount = 0
  let failureCount = 0

  for (const request of requests) {
    try {
      // Replay the request
      await replayRequest(request)

      // Remove from queue on success
      await removeRequest(request.id)
      successCount++

      console.log('[SW Sync] Request succeeded:', request.id)
    } catch (error) {
      console.error('[SW Sync] Request failed:', request.id, error)

      // Update retry count
      const newRetryCount = request.retryCount + 1

      if (newRetryCount >= request.maxRetries) {
        // Max retries reached, remove from queue
        await removeRequest(request.id)
        failureCount++
        console.log('[SW Sync] Max retries reached, removing:', request.id)
      } else {
        // Update retry count for next sync
        await updateRetryCount(request.id, newRetryCount)
        console.log(
          '[SW Sync] Will retry later:',
          request.id,
          `(${newRetryCount}/${request.maxRetries})`
        )
      }
    }
  }

  // Notify clients of results
  await notifyClients({
    type: 'sync-complete',
    data: {
      total: requests.length,
      success: successCount,
      failed: failureCount,
    },
  })

  console.log('[SW Sync] Sync complete:', {
    total: requests.length,
    success: successCount,
    failed: failureCount,
  })
}

/**
 * Handle sync event
 */
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('[SW Sync] Sync event received:', event.tag)

  if (event.tag === QUEUE_NAME) {
    event.waitUntil(processQueue())
  }
})

console.log('[SW Sync] Sync handler registered')
