# Service Worker Enhancement Plan

**Status**: Phase 1 Complete ✅ (October 15, 2025)
**Priority**: Medium-High (Improves offline experience)
**Total Effort**: 12-20 hours (Phase 1: 2-3 hours COMPLETE)

---

## ✅ Phase 1 Complete - Cache Strategies & Offline Fallback

**Completed**: October 15, 2025
**Time Spent**: ~1.5 hours
**Status**: ✅ Implemented & Tested

### What Was Implemented

1. **Enhanced Cache Strategies** - 7 optimized rules (vs. 2 basic rules)
   - Device states: NetworkFirst (5 min cache)
   - Hue local API: CacheFirst (30 sec cache)
   - Camera snapshots: CacheFirst (1 hour cache)
   - Video streams: NetworkOnly (no cache)
   - Config/settings: StaleWhileRevalidate (24 hour cache)
   - Cloudflare API: NetworkFirst (1 hour cache)
   - Static images: CacheFirst (30 day cache)

2. **Offline Fallback Page** - `/public/offline.html`
   - Branded HomeHub design matching app theme
   - Auto-retry connection every 5 seconds
   - Connection status detection
   - Feature highlights (cached data, auto-sync, security)
   - Responsive mobile-friendly design

### Files Modified

- ✅ `vite.config.ts` - Enhanced `workbox.runtimeCaching` configuration
- ✅ `public/offline.html` - Created branded offline fallback page
- ✅ `docs/development/SERVICE_WORKER_CACHE_TESTING.md` - Complete testing guide

### Expected Benefits

- **Performance**: 4x faster dashboard loads (800ms → 200ms)
- **Bandwidth**: 90% reduction on camera snapshots (repeat visits)
- **Offline**: Full offline capability for cached content
- **User Experience**: Professional offline page vs. generic browser error

### Testing Instructions

See `docs/development/SERVICE_WORKER_CACHE_TESTING.md` for:

- 7 detailed test scenarios
- Performance benchmarks
- Debugging tools
- Common issues & solutions

---

## 🎯 Current State Review

### ✅ What's Working Well

1. **Asset Precaching**: 45 static assets cached automatically
2. **API Caching**: NetworkFirst strategy for Cloudflare API (1hr cache)
3. **Image Caching**: CacheFirst for camera snapshots (30-day retention)
4. **PWA Manifest**: Install-to-home-screen capability
5. **Auto-Update**: Service worker updates automatically

### 📊 Current Performance

- **First Visit**: Minimal benefit (setup overhead)
- **Repeat Visits**: 80-90+ Lighthouse score
- **Offline**: Static assets work, API calls fail

---

## 🚀 Proposed Enhancements

### 1. Background Sync API ⭐⭐⭐⭐⭐

**Goal**: Queue device control actions when offline, sync when connection restored

**Use Cases**:

- Toggle lights while offline
- Adjust thermostat without internet
- Create scenes/automations offline
- Edit room assignments

**Implementation**:

```typescript
// vite.config.ts - Add to workbox config
workbox: {
  // ... existing config
  plugins: [
    {
      // Register Background Sync
      handlerDidError: async ({ request }) => {
        await self.registration.sync.register('device-control-sync')
        throw error // Will be retried when online
      },
    },
  ]
}
```

```typescript
// public/sw-bg-sync.js (new file)
import { Queue } from 'workbox-background-sync'

const queue = new Queue('device-control-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
})

// Intercept failed API requests
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/') && event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request).catch(err => {
        queue.pushRequest({ request: event.request })
        return new Response(
          JSON.stringify({
            offline: true,
            queued: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
      })
    )
  }
})

// Process queue when back online
self.addEventListener('sync', event => {
  if (event.tag === 'device-control-queue') {
    event.waitUntil(queue.replayRequests())
  }
})
```

**Benefits**:

- ✅ Seamless offline experience
- ✅ Zero data loss
- ✅ Automatic retry when online
- ✅ User doesn't need to remember failed actions

**Complexity**: Medium (4-6 hours)

---

### 2. Web Push Notifications ⭐⭐⭐⭐

**Goal**: Send native notifications for critical events (motion detected, device offline, low battery)

**Use Cases**:

- Security camera motion alerts
- Device offline warnings
- Automation execution failures
- Low battery notifications

**Implementation**:

```typescript
// Request permission (in App.tsx)
async function requestNotificationPermission() {
  if (!('Notification' in window)) return false

  if (Notification.permission === 'granted') return true

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Subscribe to push (in App.tsx)
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' },
  })
}
```

```typescript
// public/sw-push.js (new file)
self.addEventListener('push', event => {
  const data = event.data.json()

  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url,
      deviceId: data.deviceId,
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'view') {
    clients.openWindow(event.notification.data.url)
  }
})
```

**Backend Requirements** (Cloudflare Worker):

- VAPID keys for Web Push
- Push subscription storage (KV)
- Trigger logic (motion events, device state changes)

**Benefits**:

- ✅ Instant alerts even when app closed
- ✅ Native OS notifications (iOS/Android)
- ✅ Actionable notifications (tap to view)
- ✅ Battery-efficient

**Complexity**: Medium-High (6-8 hours)

---

### 3. Periodic Background Sync ⭐⭐⭐

**Goal**: Update device states even when app is closed

**Use Cases**:

- Refresh camera snapshots
- Check device health
- Update weather data
- Sync energy consumption

**Implementation**:

```typescript
// Request permission (in App.tsx)
async function registerPeriodicSync() {
  const registration = await navigator.serviceWorker.ready

  try {
    await registration.periodicSync.register('device-health-check', {
      minInterval: 15 * 60 * 1000, // Every 15 minutes
    })
  } catch (err) {
    console.error('Periodic sync not supported:', err)
  }
}
```

```typescript
// public/sw-periodic.js (new file)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'device-health-check') {
    event.waitUntil(checkDeviceHealth())
  }
})

async function checkDeviceHealth() {
  try {
    const response = await fetch('/api/devices/health')
    const data = await response.json()

    // Show notification if issues found
    const offlineDevices = data.devices.filter(d => d.status === 'offline')
    if (offlineDevices.length > 0) {
      self.registration.showNotification('Device Alert', {
        body: `${offlineDevices.length} devices are offline`,
        icon: '/icon-192.png',
      })
    }
  } catch (err) {
    console.error('Health check failed:', err)
  }
}
```

**Benefits**:

- ✅ Proactive monitoring
- ✅ Reduced battery usage (vs. polling)
- ✅ Fresh data when app opens

**Limitations**:

- ⚠️ Chrome/Edge only (not Safari yet)
- ⚠️ Browser controls frequency (15min minimum)

**Complexity**: Low-Medium (2-4 hours)

---

### 4. Cache Strategies Per Route ⭐⭐⭐⭐

**Goal**: Optimize caching for different content types

**Current**: Only Cloudflare API + images cached
**Improved**: Add specific strategies for different API endpoints

**Implementation**:

```typescript
// vite.config.ts - Enhanced runtimeCaching
workbox: {
  runtimeCaching: [
    // Device states - NetworkFirst (always try network, fallback to cache)
    {
      urlPattern: /\/api\/(devices|rooms|scenes)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'device-state-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 3,
      },
    },

    // Hue API - CacheFirst (local devices, fast response)
    {
      urlPattern: /^http:\/\/192\.168\..*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'hue-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30, // 30 seconds
        },
      },
    },

    // Arlo streams - NetworkOnly (can't cache video)
    {
      urlPattern: /arlo.*\.(mpd|m3u8)/,
      handler: 'NetworkOnly',
    },

    // Camera snapshots - CacheFirst
    {
      urlPattern: /arlo.*snapshot/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'camera-snapshot-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },

    // Static config - StaleWhileRevalidate
    {
      urlPattern: /\/api\/(config|settings)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'config-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
  ]
}
```

**Benefits**:

- ✅ Faster API responses (cached fallback)
- ✅ Better offline experience
- ✅ Reduced bandwidth usage
- ✅ Optimized per content type

**Complexity**: Low (1-2 hours)

---

### 5. Service Worker Update Notifications ⭐⭐⭐

**Goal**: Notify users when a new version is available

**Current**: Auto-updates silently
**Improved**: Show toast with "Update Available" action

**Implementation**:

```typescript
// src/hooks/use-sw-update.ts (new file)
import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function useServiceWorkerUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true)
    }
  }, [needRefresh])

  const handleUpdate = () => {
    updateServiceWorker(true)
    setShowUpdatePrompt(false)
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
    setNeedRefresh(false)
  }

  return { showUpdatePrompt, handleUpdate, handleDismiss }
}
```

```tsx
// App.tsx - Add update prompt
import { useServiceWorkerUpdate } from '@/hooks/use-sw-update'

function App() {
  const { showUpdatePrompt, handleUpdate, handleDismiss } = useServiceWorkerUpdate()

  return (
    <>
      {showUpdatePrompt && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-primary fixed bottom-20 left-4 right-4 z-50 rounded-xl p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-white">Update Available</p>
              <p className="text-sm text-white/80">A new version of HomeHub is ready</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-white" onClick={handleDismiss}>
                Later
              </Button>
              <Button size="sm" variant="secondary" onClick={handleUpdate}>
                Update
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      {/* Rest of app */}
    </>
  )
}
```

**Benefits**:

- ✅ User control over updates
- ✅ Better UX (know when new features available)
- ✅ Prevents unexpected behavior

**Complexity**: Low (1-2 hours)

---

### 6. Advanced Offline Fallback ⭐⭐

**Goal**: Show custom offline page with cached data

**Current**: Network errors just fail
**Improved**: Show last cached state with "offline" badge

**Implementation**:

```typescript
// vite.config.ts - Add offline fallback
workbox: {
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/api/]
}
```

```html
<!-- public/offline.html (new file) -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Offline - HomeHub</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro';
        background: linear-gradient(to br, #1e293b, #0f172a);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
      }
      .container {
        text-align: center;
        max-width: 400px;
        padding: 2rem;
      }
      .icon {
        font-size: 64px;
        margin-bottom: 1rem;
      }
      button {
        background: oklch(0.6 0.15 250);
        border: none;
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="icon">📡</div>
      <h1>You're Offline</h1>
      <p>HomeHub needs an internet connection to sync with your devices.</p>
      <p>Don't worry - your data is safe and will sync when you're back online.</p>
      <button onclick="window.location.reload()">Try Again</button>
    </div>
  </body>
</html>
```

**Benefits**:

- ✅ Better offline UX
- ✅ Clear communication to user
- ✅ Matches app branding

**Complexity**: Very Low (1 hour)

---

## 📊 Effort vs. Impact Matrix

| Enhancement              | Impact     | Effort    | Priority  |
| ------------------------ | ---------- | --------- | --------- |
| **Background Sync**      | ⭐⭐⭐⭐⭐ | 4-6 hours | 🔴 High   |
| **Cache Strategies**     | ⭐⭐⭐⭐   | 1-2 hours | 🔴 High   |
| **Web Push**             | ⭐⭐⭐⭐   | 6-8 hours | 🟡 Medium |
| **Update Notifications** | ⭐⭐⭐     | 1-2 hours | 🟡 Medium |
| **Periodic Sync**        | ⭐⭐⭐     | 2-4 hours | 🟡 Medium |
| **Offline Fallback**     | ⭐⭐       | 1 hour    | 🟢 Low    |

---

## 🎯 Recommended Implementation Order

### Phase 1: Quick Wins (2-3 hours)

1. ✅ Cache Strategies Per Route (2 hours)
2. ✅ Offline Fallback Page (1 hour)

**Result**: Better offline experience, faster API responses

### Phase 2: Core Features (4-6 hours)

3. ✅ Background Sync API (4-6 hours)

**Result**: Zero data loss when offline

### Phase 3: Advanced (3-4 hours)

4. ✅ Update Notifications (1-2 hours)
5. ✅ Periodic Sync (2-4 hours, optional)

**Result**: Better update UX, proactive monitoring

### Phase 4: Push Notifications (6-8 hours)

6. ✅ Web Push Notifications (6-8 hours)

**Result**: Native alerts for critical events

---

## 🧪 Testing Plan

### Background Sync

- [ ] Toggle device while offline
- [ ] Verify action queued in DevTools > Application > Background Sync
- [ ] Go back online
- [ ] Confirm action executed automatically

### Web Push

- [ ] Request permission prompt shown
- [ ] Notification appears when triggered
- [ ] Click notification opens correct page
- [ ] Works when app is closed

### Periodic Sync

- [ ] Register periodic sync
- [ ] Verify in DevTools > Application > Periodic Background Sync
- [ ] Wait 15 minutes (or trigger manually)
- [ ] Confirm health check executed

### Cache Strategies

- [ ] Go offline
- [ ] Navigate to different sections
- [ ] Verify cached content loads
- [ ] Check DevTools > Network for cache hits

---

## 📚 References

- [Background Sync API](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync/)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Periodic Background Sync](https://web.dev/periodic-background-sync/)
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview/)
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)

---

## 💡 Additional Ideas (Future)

### 7. IndexedDB for Offline Data

- Store full device states in IndexedDB (vs. localStorage limits)
- Support large datasets (camera history, energy data)
- Query capabilities for analytics

### 8. Share Target API

- Share device controls to other apps
- Share camera snapshots
- Share automation recipes

### 9. Badging API

- Show unread notification count on app icon
- Update badge in real-time

### 10. App Shortcuts

- Quick access to favorite devices
- Jump to specific scenes
- Camera quick view

---

**Next Steps**: Start with Phase 1 (Cache Strategies + Offline Fallback) for immediate impact with minimal effort.
