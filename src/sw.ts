/**
 * HomeHub Service Worker with Background Sync
 *
 * Custom service worker that extends Workbox with background sync functionality.
 * Handles offline request queuing and automatic retry when connection is restored.
 */

/// <reference lib="webworker" />
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

// Precache all assets from manifest
precacheAndRoute(self.__WB_MANIFEST)

// Clean up old caches
cleanupOutdatedCaches()

// Navigation fallback to offline.html
const handler = createHandlerBoundToURL('/offline.html')
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api/, /\.(png|jpg|jpeg|svg|gif|webp|ico)$/],
})
registerRoute(navigationRoute)

// ====================
// CACHE STRATEGIES
// ====================

// Device states, rooms, scenes, automations - NetworkFirst with short cache
registerRoute(
  ({ url }) =>
    url.pathname.includes('/api/kv/') &&
    (url.pathname.includes('devices') ||
      url.pathname.includes('rooms') ||
      url.pathname.includes('scenes') ||
      url.pathname.includes('automations') ||
      url.pathname.includes('users')),
  new NetworkFirst({
    cacheName: 'device-state-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
    networkTimeoutSeconds: 3,
  })
)

// Hue Bridge local API - CacheFirst for speed
registerRoute(
  /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/,
  new CacheFirst({
    cacheName: 'hue-api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30, // 30 seconds
      }),
    ],
  })
)

// Arlo camera snapshots - CacheFirst for performance
registerRoute(
  ({ url }) => url.pathname.includes('arlo') && url.pathname.includes('snapshot'),
  new CacheFirst({
    cacheName: 'camera-snapshot-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
)

// Arlo video streams - NetworkOnly (can't cache live video)
registerRoute(
  ({ url }) =>
    url.pathname.includes('arlo') &&
    (url.pathname.endsWith('.mpd') || url.pathname.endsWith('.m3u8')),
  new NetworkOnly()
)

// Static configuration and settings - StaleWhileRevalidate
registerRoute(
  ({ url }) =>
    url.pathname.includes('/api/kv/') &&
    (url.pathname.includes('config') ||
      url.pathname.includes('settings') ||
      url.pathname.includes('preferences')),
  new StaleWhileRevalidate({
    cacheName: 'config-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
)

// Cloudflare Worker API - NetworkFirst with longer timeout
registerRoute(
  /^https:\/\/.*\.cloudflareaccess\.com\/.*/i,
  new NetworkFirst({
    cacheName: 'cloudflare-api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
    networkTimeoutSeconds: 10,
  })
)

// All other images - CacheFirst with long expiration
registerRoute(
  /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
)

// ====================
// BACKGROUND SYNC
// ====================

const QUEUE_NAME = 'homehub-offline-queue'
const DB_NAME = 'homehub-sync-db'
const STORE_NAME = 'requests'

interface QueuedRequest {
  id: string
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
  timestamp: number
  retryCount: number
  maxRetries: number
}

/**
 * Open IndexedDB for queue storage
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

/**
 * Handle skip waiting message from client
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested')
    self.skipWaiting()
  }
})

/**
 * Notify clients when service worker has been updated and activated
 */
self.addEventListener('activate', event => {
  console.log('[SW] Service worker activated')

  event.waitUntil(
    (async () => {
      // Claim all clients immediately
      await self.clients.claim()

      // Notify all clients that SW has been updated
      const clients = await self.clients.matchAll()
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          timestamp: Date.now(),
        })
      })

      console.log('[SW] All clients claimed and notified')
    })()
  )
})

console.log('[SW] Service worker loaded with background sync support')
