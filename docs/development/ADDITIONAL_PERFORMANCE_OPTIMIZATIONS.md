# Additional Performance Optimization Strategies

**Current Baseline**: 27/100 Performance  
**Goal**: 90+/100 Performance  
**Date**: October 14, 2025

## 🎯 High-Impact Optimizations (Beyond Phase 1)

### 1. Bundle Size Reduction ⚡ (Highest Impact)

**Current Issue**: 2.15 MB vendor bundle (main bottleneck)

#### A. Tree-Shaking & Dead Code Elimination

```bash
# Analyze what's in your bundle
npm run build
# Open dist/stats.html to see bundle composition
```

**Large dependencies to address**:
- `@koush/arlo` - Only load in Security tab
- `recharts` (303KB) - Only load in Energy tab
- `d3` - Lazy load with recharts
- `framer-motion` (80KB) - Consider lighter alternatives for some animations

**Implementation**:

```typescript
// Instead of: import { Chart } from 'recharts'
// Use dynamic import in Energy component:

const Energy = lazy(() => import('./components/Energy'))

// Inside Energy.tsx:
const [ChartLib, setChartLib] = useState(null)

useEffect(() => {
  import('recharts').then(module => {
    setChartLib(module)
  })
}, [])
```

**Expected Impact**: -1000ms LCP, -500ms TBT

---

#### B. Remove Unused Dependencies

Check `package.json` for unused packages:

```bash
# Install depcheck
npm install -g depcheck

# Find unused dependencies
depcheck
```

**Likely candidates**:
- Old icon libraries (if fully migrated to Lucide)
- Duplicate utilities
- Dev dependencies in production

**Expected Impact**: -200ms to -400ms

---

#### C. Use Production Builds for All Dependencies

Ensure all deps use production builds:

```typescript
// vite.config.ts
define: {
  'process.env.NODE_ENV': JSON.stringify('production'),
}
```

**Expected Impact**: -100ms to -300ms

---

### 2. Code Splitting & Lazy Loading 🔀 (High Impact)

**Current**: Components lazy-loaded, but improvements possible

#### A. Route-Based Code Splitting

```typescript
// App.tsx - Load tabs on demand
const tabComponents = {
  home: () => import('./components/Dashboard'),
  rooms: () => import('./components/Rooms'),
  automations: () => import('./components/Automations'),
  // ... etc
}

// Only load active tab
const ActiveTab = lazy(tabComponents[currentTab])
```

**Expected Impact**: -800ms to -1200ms on FCP

---

#### B. Component-Level Splitting

Split large components into smaller chunks:

```typescript
// Security.tsx - Split camera grid
const CameraGrid = lazy(() => import('./components/CameraGrid'))
const CameraModal = lazy(() => import('./components/CameraModal'))

// Dashboard.tsx - Split heavy widgets
const EnergyWidget = lazy(() => import('./components/widgets/EnergyWidget'))
const AutomationWidget = lazy(() => import('./components/widgets/AutomationWidget'))
```

**Expected Impact**: -500ms TTI

---

#### C. Vendor Code Splitting by Usage

```typescript
// vite.config.ts
manualChunks: (id) => {
  if (id.includes('node_modules')) {
    // Split by feature
    if (id.includes('@koush/arlo')) return 'arlo-vendor' // Security only
    if (id.includes('recharts') || id.includes('d3')) return 'chart-vendor' // Energy only
    if (id.includes('@radix-ui')) {
      // Further split Radix UI by component
      if (id.includes('dialog')) return 'dialog-vendor'
      if (id.includes('dropdown')) return 'dropdown-vendor'
      return 'radix-vendor'
    }
  }
}
```

**Expected Impact**: -600ms LCP (parallel loading)

---

### 3. Image Optimization 🖼️ (Medium-High Impact)

#### A. Lazy Loading Images

```tsx
// All images below fold
<img
  src="/camera-feed.jpg"
  loading="lazy"
  width="640"
  height="480"
  alt="Camera feed"
/>
```

**Expected Impact**: -300ms to -600ms LCP

---

#### B. Modern Image Formats

Convert images to WebP/AVIF:

```bash
# Install image optimizer
npm install --save-dev vite-imagetools

# Use in components
import cameraImage from './assets/camera.jpg?format=webp&w=640'
```

**Expected Impact**: -200ms to -400ms

---

#### C. Responsive Images

```tsx
<img
  srcset="
    /camera-small.webp 320w,
    /camera-medium.webp 640w,
    /camera-large.webp 1280w
  "
  sizes="(max-width: 640px) 320px, (max-width: 1280px) 640px, 1280px"
  src="/camera-medium.webp"
  alt="Camera"
/>
```

**Expected Impact**: -300ms on mobile

---

### 4. Virtual Scrolling 📜 (Medium Impact)

For long device lists:

```bash
npm install @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function DeviceList({ devices }) {
  const parentRef = useRef()
  
  const virtualizer = useVirtualizer({
    count: devices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Height of each device card
  })
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
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

**Expected Impact**: -200ms to -500ms on TTI/TBT

---

### 5. Service Worker & Caching 💾 (High Impact for Repeat Visits)

```bash
npm install vite-plugin-pwa workbox-window
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.cloudflare\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60, // 1 hour
            },
          },
        },
      ],
    },
    manifest: {
      name: 'HomeHub',
      short_name: 'HomeHub',
      theme_color: '#4a9eff',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
  }),
]
```

**Expected Impact**: 
- First visit: +5-10 points
- Repeat visits: 90+ performance instantly

---

### 6. Font Optimization 📝 (Medium Impact)

#### A. Font Display Strategy

```css
/* src/index.css */
@font-face {
  font-family: 'SF Pro';
  src: url('/fonts/sf-pro.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately */
  font-weight: 400;
}
```

**Expected Impact**: -100ms to -300ms FCP

---

#### B. Preload Critical Fonts

```html
<!-- index.html -->
<link
  rel="preload"
  href="/fonts/sf-pro-regular.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

**Expected Impact**: -100ms to -200ms

---

#### C. Font Subsetting

Only include characters you actually use:

```bash
# Use online tool or pyftsubset
pyftsubset font.ttf \
  --output-file=font-subset.woff2 \
  --flavor=woff2 \
  --unicodes="U+0020-007F"
```

**Expected Impact**: -50ms to -150ms

---

### 7. Critical CSS Inlining ⚡ (Medium Impact)

Extract and inline above-the-fold CSS:

```bash
npm install --save-dev vite-plugin-critical
```

```typescript
// vite.config.ts
import { critical } from 'vite-plugin-critical'

plugins: [
  critical({
    inline: true,
    dimensions: [
      { width: 375, height: 667 },  // Mobile
      { width: 1920, height: 1080 } // Desktop
    ],
  }),
]
```

**Expected Impact**: -200ms to -400ms FCP

---

### 8. React Performance Optimizations ⚛️ (Medium Impact)

#### A. Memoization

```tsx
// Expensive components
const DeviceCard = memo(({ device }) => {
  return <Card>...</Card>
}, (prevProps, nextProps) => {
  return prevProps.device.id === nextProps.device.id
})

// Expensive calculations
const sortedDevices = useMemo(() => {
  return devices.sort((a, b) => a.name.localeCompare(b.name))
}, [devices])

// Callbacks passed to children
const handleDeviceToggle = useCallback((deviceId) => {
  setDevices(prev => prev.map(d => 
    d.id === deviceId ? { ...d, enabled: !d.enabled } : d
  ))
}, [])
```

**Expected Impact**: -150ms to -300ms TBT

---

#### B. Reduce Re-renders

```tsx
// Split state to avoid unnecessary re-renders
// Bad: Single state object
const [state, setState] = useState({ devices, rooms, scenes })

// Good: Separate states
const [devices, setDevices] = useState([])
const [rooms, setRooms] = useState([])
const [scenes, setScenes] = useState([])
```

**Expected Impact**: -100ms to -200ms

---

#### C. Use React DevTools Profiler

```bash
# Install React DevTools
# Profile your app to find expensive renders
```

**Expected Impact**: Varies, but 10-20% improvement typical

---

### 9. Network Optimizations 🌐 (Medium Impact)

#### A. HTTP/2 & Server Push

Already enabled on Cloudflare Pages! ✅

#### B. Resource Hints

```html
<!-- index.html -->
<!-- DNS prefetch for external APIs -->
<link rel="dns-prefetch" href="https://api.cloudflare.com" />
<link rel="dns-prefetch" href="https://analytics.example.com" />

<!-- Preconnect for critical resources -->
<link rel="preconnect" href="https://api.cloudflare.com" crossorigin />

<!-- Prefetch next page -->
<link rel="prefetch" href="/scenes" />
```

**Expected Impact**: -100ms to -300ms

---

#### C. API Request Optimization

```typescript
// Batch API requests
const fetchMultiple = async (endpoints) => {
  return Promise.all(
    endpoints.map(endpoint => fetch(endpoint))
  )
}

// Deduplicate requests
const requestCache = new Map()
const fetchWithCache = async (url) => {
  if (requestCache.has(url)) {
    return requestCache.get(url)
  }
  const promise = fetch(url).then(r => r.json())
  requestCache.set(url, promise)
  return promise
}

// Add request timeouts
const fetchWithTimeout = (url, timeout = 5000) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ])
}
```

**Expected Impact**: -200ms to -400ms

---

### 10. CSS Optimization 🎨 (Low-Medium Impact)

#### A. Remove Unused CSS

```bash
npm install --save-dev purgecss @fullhuman/postcss-purgecss
```

```typescript
// postcss.config.js
export default {
  plugins: {
    '@fullhuman/postcss-purgecss': {
      content: ['./src/**/*.tsx', './src/**/*.ts'],
      safelist: ['html', 'body'],
    },
  },
}
```

**Expected Impact**: -50ms to -150ms

---

#### B. CSS Containment

```css
/* Optimize rendering performance */
.device-card {
  contain: layout style paint;
}

.camera-grid {
  contain: layout;
}
```

**Expected Impact**: -50ms to -100ms

---

### 11. JavaScript Optimization 📦 (Low-Medium Impact)

#### A. Use Web Workers for Heavy Computation

```typescript
// Create worker for data processing
const worker = new Worker('/workers/data-processor.js')

worker.postMessage({ devices, operation: 'sort' })
worker.onmessage = (e) => {
  setDevices(e.data)
}
```

**Expected Impact**: -100ms to -300ms TBT

---

#### B. Avoid Large Arrays/Objects in State

```typescript
// Bad: Store entire API response
const [apiData, setApiData] = useState(largeResponse)

// Good: Store only what's needed
const [devices, setDevices] = useState(largeResponse.devices)
const [metadata, setMetadata] = useState({
  total: largeResponse.total,
  page: largeResponse.page
})
```

**Expected Impact**: -50ms to -150ms

---

### 12. Performance Budgets 📊 (Ongoing)

Set limits and enforce them:

```typescript
// vite.config.ts
build: {
  chunkSizeWarningLimit: 500, // Warn at 500KB
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        // Enforce splitting at 300KB
        // ... chunking logic
      }
    }
  }
}
```

**CI/CD Integration**:

```yaml
# .github/workflows/performance.yml
- name: Check Bundle Size
  run: |
    npm run build
    node scripts/check-bundle-size.js --max=500
```

**Expected Impact**: Prevents regressions

---

### 13. Monitoring & Analytics 📈 (Ongoing)

#### A. Real User Monitoring (RUM)

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getLCP } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getLCP(console.log)
```

#### B. Performance Observer API

```typescript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('DOM Content Loaded:', entry.domContentLoadedEventEnd)
      console.log('Load Complete:', entry.loadEventEnd)
    }
  }
})
observer.observe({ entryTypes: ['navigation', 'resource'] })
```

**Expected Impact**: Visibility into real-world performance

---

## 🎯 Recommended Implementation Order

### Week 1: Critical Path (Target: 50+ Performance)

1. ✅ Code splitting (already done)
2. ✅ Resource hints (already done)
3. **Font optimization** - `font-display: swap`
4. **Bundle analysis** - Identify biggest chunks
5. **Lazy load heavy deps** - Arlo, recharts, d3

**Expected Result**: 27 → 50+ performance

---

### Week 2: Major Improvements (Target: 70+ Performance)

6. **Virtual scrolling** - Device lists
7. **Service worker** - Caching strategy
8. **Image optimization** - Lazy loading + WebP
9. **Route-based splitting** - Load tabs on demand
10. **React memoization** - Expensive components

**Expected Result**: 50 → 70+ performance

---

### Week 3: Fine-Tuning (Target: 90+ Performance)

11. **Critical CSS inlining** - Above-fold optimization
12. **API optimization** - Batching, caching, deduplication
13. **Web Workers** - Heavy computation off main thread
14. **CSS containment** - Rendering optimization
15. **Performance budgets** - CI/CD integration

**Expected Result**: 70 → 90+ performance

---

## 📊 Expected Improvements Summary

| Optimization | Impact on FCP | Impact on LCP | Impact on TBT | Difficulty |
|--------------|---------------|---------------|---------------|------------|
| Bundle splitting | -500ms | -1000ms | -300ms | Medium |
| Lazy loading deps | -300ms | -800ms | -400ms | Easy |
| Virtual scrolling | -100ms | -200ms | -500ms | Medium |
| Service worker | -200ms* | -500ms* | -100ms* | Medium |
| Image optimization | -200ms | -600ms | -50ms | Easy |
| Font optimization | -300ms | -100ms | 0ms | Easy |
| Critical CSS | -400ms | -200ms | 0ms | Medium |
| React memo | 0ms | -100ms | -300ms | Medium |
| API optimization | -300ms | -400ms | -200ms | Medium |
| Performance budgets | Prevents regressions | - | - | Easy |

**\* Repeat visits only**

---

## 🛠️ Quick Start Commands

```bash
# 1. Analyze current bundle
npm run build
start dist/stats.html  # Windows

# 2. Check for unused dependencies
npx depcheck

# 3. Install optimization tools
npm install --save-dev @tanstack/react-virtual vite-plugin-pwa

# 4. Test after each change
npm run lighthouse:baseline -- --compare
```

---

## 📚 Additional Resources

- **Bundle Analyzer**: Check `dist/stats.html` after build
- **Chrome DevTools**: Performance tab for profiling
- **React DevTools**: Profiler for component optimization
- **Lighthouse**: Full recommendations in HTML report
- **Web.dev**: https://web.dev/performance/
- **Vite Performance**: https://vitejs.dev/guide/performance.html

---

## 🎯 Your Path to 90+ Performance

```
Current: 27/100
  ↓ Week 1 (Font + Lazy Loading)
Target: 50/100
  ↓ Week 2 (Virtual Scroll + Service Worker)
Target: 70/100
  ↓ Week 3 (Critical CSS + React Optimization)
Goal: 90+/100 ✅
```

**Total Time Estimate**: 3-4 weeks of focused optimization work

**Most Impactful**: 
1. Lazy load heavy dependencies (Arlo, recharts, d3)
2. Implement virtual scrolling
3. Add service worker
4. Font optimization with `font-display: swap`
5. Critical CSS inlining

Start with #1-4 this week for maximum impact! 🚀
