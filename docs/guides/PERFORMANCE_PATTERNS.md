# Performance Patterns Guide

**Purpose**: Optimization patterns for React 19, memoization, code splitting, and lazy loading in HomeHub.

**Last Updated**: October 16, 2025

---

## Table of Contents

- [Performance Philosophy](#performance-philosophy)
- [Memoization Patterns](#memoization-patterns)
- [Code Splitting](#code-splitting)
- [Lazy Loading](#lazy-loading)
- [Image Optimization](#image-optimization)
- [Service Worker & PWA](#service-worker--pwa)
- [Bundle Analysis](#bundle-analysis)
- [Performance Monitoring](#performance-monitoring)

---

## Performance Philosophy

### Core Principles

1. **Measure First**: Use Lighthouse and profiler before optimizing
2. **Optimize for User Perception**: Fast initial load > total bundle size
3. **Progressive Enhancement**: Core features work offline
4. **Lazy by Default**: Load resources when needed, not upfront
5. **Cache Aggressively**: Service worker for offline capability

### Performance Budget

- **First Contentful Paint (FCP)**: <1.5s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3.5s
- **Total Blocking Time (TBT)**: <200ms
- **Cumulative Layout Shift (CLS)**: <0.1

---

## Memoization Patterns

### useMemo for Expensive Computations

```typescript
import { useMemo } from 'react'

// ✅ CORRECT: Memoize expensive calculations
const deviceStats = useMemo(() => {
  return {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    enabled: devices.filter(d => d.enabled).length,
    lowBattery: devices.filter(d => d.batteryLevel && d.batteryLevel < 20).length,
  }
}, [devices]) // Only recalculate when devices change

// ❌ WRONG: Recalculates on every render
const deviceStats = {
  total: devices.length,
  online: devices.filter(d => d.status === 'online').length,
  // ... expensive calculations on EVERY render
}
```

### useCallback for Event Handlers

```typescript
import { useCallback } from 'react'

// ✅ CORRECT: Memoize callback to prevent child re-renders
const handleToggleDevice = useCallback(
  async (id: string) => {
    const device = devices.find(d => d.id === id)
    if (!device) return

    await controlDevice(device, !device.enabled)
    toast.success(`${device.name} ${device.enabled ? 'off' : 'on'}`)
  },
  [devices] // Only recreate if devices array changes
)

// ❌ WRONG: New function on every render causes child re-renders
const handleToggleDevice = async (id: string) => {
  // ... same logic, but function is recreated every render
}
```

### React.memo for Component Memoization

```typescript
import { memo } from 'react'

// ✅ CORRECT: Prevent re-render if props haven't changed
export const DeviceCard = memo(function DeviceCard({
  device,
  onToggle
}: DeviceCardProps) {
  return (
    <Card>
      <h3>{device.name}</h3>
      <Button onClick={() => onToggle(device.id)}>Toggle</Button>
    </Card>
  )
})

// ❌ WRONG: No memoization, re-renders even if props unchanged
export function DeviceCard({ device, onToggle }: DeviceCardProps) {
  // Same implementation, but re-renders unnecessarily
}
```

### Custom Comparison Function

```typescript
import { memo } from 'react'

// ✅ CORRECT: Custom comparison for complex objects
export const DeviceCard = memo(
  function DeviceCard({ device, onToggle }: DeviceCardProps) {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return (
      prevProps.device.id === nextProps.device.id &&
      prevProps.device.enabled === nextProps.device.enabled &&
      prevProps.device.status === nextProps.device.status
    )
  }
)
```

---

## Code Splitting

### Route-Based Splitting (React.lazy)

```typescript
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// ✅ CORRECT: Lazy load heavy components
const Security = lazy(() => import('@/components/Security'))
const DeviceMonitor = lazy(() => import('@/components/DeviceMonitor'))
const Insights = lazy(() => import('@/components/Insights'))

export function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {currentTab === 'security' && <Security />}
      {currentTab === 'monitor' && <DeviceMonitor />}
      {currentTab === 'insights' && <Insights />}
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### Component-Based Splitting

```typescript
// ✅ CORRECT: Split heavy UI components
const HeavyChart = lazy(() => import('@/components/HeavyChart'))
const VideoPlayer = lazy(() => import('@/components/VideoPlayer'))

export function EnergyDashboard() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div>
      <Button onClick={() => setShowChart(true)}>Show Chart</Button>

      {showChart && (
        <Suspense fallback={<Spinner />}>
          <HeavyChart data={energyData} />
        </Suspense>
      )}
    </div>
  )
}
```

### Dynamic Imports for Services

```typescript
// ✅ CORRECT: Lazy load heavy libraries
const loadHeavyService = async () => {
  const { HeavyService } = await import('@/services/HeavyService')
  return new HeavyService()
}

// Usage
const performAction = async () => {
  const service = await loadHeavyService()
  await service.doSomething()
}
```

---

## Lazy Loading

### Image Lazy Loading

```typescript
// ✅ CORRECT: Native lazy loading
<img
  src="/camera-snapshot.jpg"
  alt="Camera feed"
  loading="lazy"
  decoding="async"
/>

// ✅ CORRECT: Intersection Observer for custom lazy loading
import { useEffect, useRef, useState } from 'react'

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <img
      ref={imgRef}
      src={isVisible ? src : undefined}
      alt={alt}
      loading="lazy"
    />
  )
}
```

### List Virtualization

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// ✅ CORRECT: Virtualize long lists (1000+ items)
export function DeviceList({ devices }: { devices: Device[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: devices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated item height
    overscan: 5, // Render 5 extra items above/below viewport
  })

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <DeviceCard device={devices[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Image Optimization

### Modern Formats & Responsive Images

```typescript
// ✅ CORRECT: WebP with fallback, responsive sizes
<picture>
  <source
    type="image/webp"
    srcSet="/img/device-400.webp 400w, /img/device-800.webp 800w"
    sizes="(max-width: 768px) 400px, 800px"
  />
  <img
    src="/img/device-800.jpg"
    alt="Device"
    loading="lazy"
    decoding="async"
  />
</picture>
```

### Camera Snapshot Optimization

```typescript
// ✅ CORRECT: Lazy load camera snapshots
export function CameraGrid({ cameras }: { cameras: Camera[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {cameras.map(camera => (
        <img
          key={camera.id}
          src={camera.snapshotUrl}
          alt={camera.name}
          loading="lazy"
          decoding="async"
          className="rounded-lg"
        />
      ))}
    </div>
  )
}
```

---

## Service Worker & PWA

### Service Worker Setup (Already Configured)

**File**: `src/sw.ts`

```typescript
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache build assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache images (camera snapshots, icons)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
)

// Cache API responses (KV store data)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
)
```

### Offline Fallback

```typescript
// In service worker
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Return offline page if network fails
      return caches.match('/offline.html')
    })
  )
})
```

---

## Bundle Analysis

### Analyze Bundle Size

```bash
# 1. Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# 2. Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})

# 3. Build and analyze
npm run build
# Opens stats.html showing bundle breakdown
```

### Tree-Shaking Verification

```typescript
// ✅ CORRECT: Named imports enable tree-shaking
import { Button, Card } from '@/components/ui'
import { LightbulbIcon } from '@/lib/icons'

// ❌ WRONG: Default import includes everything
import * as UI from '@/components/ui'
import * as Icons from '@/lib/icons'
```

---

## Performance Monitoring

### Lighthouse CI (Already Configured)

**File**: `lighthouse/config.js`

Run baseline:

```bash
npm run lighthouse:baseline
```

### React DevTools Profiler

```typescript
import { Profiler } from 'react'

export function Dashboard() {
  const onRenderCallback = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number
  ) => {
    console.log(`${id} ${phase} took ${actualDuration}ms`)
  }

  return (
    <Profiler id="Dashboard" onRender={onRenderCallback}>
      {/* Component tree */}
    </Profiler>
  )
}
```

### Performance API

```typescript
// Measure operation duration
const measureOperation = async (name: string, operation: () => Promise<void>) => {
  const start = performance.now()
  await operation()
  const duration = performance.now() - start

  console.log(`${name} took ${duration.toFixed(2)}ms`)

  // Send to analytics (optional)
  // analytics.track('operation_duration', { name, duration })
}

// Usage
await measureOperation('Load Devices', async () => {
  const devices = await loadDevices()
  setDevices(devices)
})
```

---

## Quick Wins Checklist

- [ ] **Lazy load routes**: Use React.lazy() for tabs
- [ ] **Memoize expensive calculations**: Use useMemo()
- [ ] **Memoize callbacks**: Use useCallback()
- [ ] **Lazy load images**: Add `loading="lazy"`
- [ ] **Code split heavy components**: React.lazy()
- [ ] **Enable service worker**: PWA caching
- [ ] **Optimize images**: WebP format, responsive sizes
- [ ] **Tree-shake imports**: Named imports only
- [ ] **Virtualize long lists**: Use @tanstack/react-virtual
- [ ] **Monitor performance**: Lighthouse CI baseline

---

## Performance Budget (Current State)

Based on Lighthouse reports:

| Metric | Target | Current (Cold Load) | Current (Warm Load) |
| ------ | ------ | ------------------- | ------------------- |
| FCP    | <1.5s  | 2.1s                | 0.4s                |
| LCP    | <2.5s  | 3.2s                | 0.8s                |
| TTI    | <3.5s  | 3.8s                | 1.2s                |
| TBT    | <200ms | 180ms               | 50ms                |
| CLS    | <0.1   | 0.02                | 0.01                |

**Note**: Warm load (repeat visit) hits all targets due to service worker caching.

---

**See Also**:

- `docs/development/PERFORMANCE_OPTIMIZATION_COMPLETE.md`
- `lighthouse/README.md` - Running performance audits
