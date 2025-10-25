# HomeHub Development Quick Reference

**Last Updated**: October 15, 2025
**Purpose**: Fast lookup for common patterns, recent lessons, and best practices

---

## 🚀 Quick Commands

```bash
# Development
npm run dev                    # Start dev server (port 5173)
npm run build                  # Production build
npm run preview                # Preview production build
npm test                       # Run test suite
npm run test:coverage          # Generate coverage report

# Linting & Validation
npm run lint                   # ESLint check
npm run lint:fix               # Auto-fix lint issues
npm run validate               # Full validation (type + lint + format)

# Cloudflare Workers
cd workers && npm run dev      # Run Worker locally
cd workers && npm run deploy   # Deploy to Cloudflare
```

---

## 💾 State Management Patterns

### ✅ CORRECT: useKV for Persistent Data

```tsx
import { useKV } from '@/hooks/use-kv'
import { MOCK_DEVICES } from '@/constants'

// Always use MOCK_DEVICES (not []) as default
const [devices, setDevices] = useKV<Device[]>('devices', MOCK_DEVICES)

// Update single device
const toggleDevice = (id: string) => {
  setDevices(prev => prev.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d)))
}
```

### ❌ WRONG: useState for Persistent Data

```tsx
// BAD - Data lost on refresh!
const [devices, setDevices] = useState<Device[]>([])

// BAD - Empty array clears localStorage!
useKV<Device[]>('devices', [])
```

**Key Lesson**: Always use `MOCK_DEVICES` (or other constants) as defaults, never empty arrays.

---

## 🎨 Component Patterns

### Feature Component Structure

```tsx
// 1. Imports
import { useKV } from '@/hooks/use-kv'
import type { Device } from '@/types'
import { LightbulbIcon } from '@/lib/icons'
import { Button } from '@/components/ui/button'

// 2. Helper functions (extract complex logic)
function ConnectionStatusBadge({ status }: { status: string }) {
  // Component logic
}

async function controlHueDevice(device: Device, setDevices: Function) {
  // Protocol-specific logic
}

// 3. Main component
export function Dashboard() {
  const [devices, setDevices] = useKV<Device[]>('devices', MOCK_DEVICES)

  const toggleDevice = useCallback(async (id: string) => {
    const device = devices.find(d => d.id === id)
    if (!device) return toast.error('Device not found')

    // Route to appropriate handler
    if (device.protocol === 'hue') return await controlHueDevice(device, setDevices)
    // ... more handlers
  }, [devices, setDevices])

  return (
    // JSX with Framer Motion animations
  )
}
```

**Key Lesson**: Extract complex logic into helper functions to reduce cognitive complexity.

---

## 📦 Code Splitting & Lazy Loading

### Lazy Load Heavy Components

```tsx
import { lazy, Suspense } from 'react'
import { Spinner } from '@/components/ui/spinner'

// Lazy load modal with video player (467 KB)
const CameraDetailsModal = lazy(() =>
  import('@/components/CameraDetailsModal').then(m => ({ default: m.CameraDetailsModal }))
)

// Wrap in Suspense with loading UI
<Suspense
  fallback={
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Spinner size="lg" />
      <p>Loading camera details...</p>
    </div>
  }
>
  <CameraDetailsModal camera={selectedCamera} />
</Suspense>
```

**Key Lesson**: Lazy load video players, charting libraries, and other heavy features (>100KB).
Vite automatically code-splits dynamic imports.

---

## 🛠️ Device Migration Pattern

### Automatic Data Repair

```typescript
// src/utils/migrate-devices.ts
export async function migrateDevices() {
  const stored = localStorage.getItem('kv:devices')
  const devices = stored ? JSON.parse(stored) : []

  // If empty or corrupted, restore from mock data
  if (devices.length === 0) {
    console.log('🔄 Migrating devices: restoring from MOCK_DEVICES')
    localStorage.setItem('kv:devices', JSON.stringify(MOCK_DEVICES))
    return MOCK_DEVICES
  }

  return devices
}

// main.tsx - Run before React renders
await migrateDevices()
```

**Key Lesson**: Always validate data integrity on app startup. Migrations are essential for
production reliability.

---

## 🎯 Function Complexity Reduction

### Extract Protocol Handlers

**Before** (Complexity 39):

```typescript
const toggleDevice = async (deviceId: string) => {
  // 173 lines of if/else for protocol routing
}
```

**After** (Complexity 5):

```typescript
// Helper functions (each <30 lines, complexity <10)
async function controlHueDevice(device, setDevices) { ... }
async function controlHTTPDevice(device, setDevices) { ... }
async function controlMQTTDevice(device, registry, setDevices) { ... }

// Main function (just routing)
const toggleDevice = async (deviceId: string) => {
  const device = devices.find(d => d.id === deviceId)
  if (!device) return toast.error('Device not found')

  if (device.protocol === 'hue') return await controlHueDevice(device, setDevices)
  if (device.protocol === 'http') return await controlHTTPDevice(device, setDevices)

  return await controlMQTTDevice(device, deviceRegistry, setDevices)
}
```

**Key Lesson**: Extract protocol-specific logic into focused helper functions. Target complexity <15.

---

## 📱 Mobile Optimization

### iOS Safe-Area Support

```css
/* Utility classes in main.css */
.safe-top {
  padding-top: max(0.5rem, env(safe-area-inset-top));
}

.safe-bottom {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
```

### Pull-to-Refresh

```tsx
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'

const { isPulling, pullDistance } = usePullToRefresh({
  onRefresh: async () => {
    await fetchData()
  },
  threshold: 80,
})
```

### Bottom Sheets (Mobile)

```tsx
// Use Sheet for mobile, Dialog for desktop
const isMobile = window.innerWidth < 768

{
  isMobile ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom">{/* Content */}</SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>{/* Content */}</DialogContent>
    </Dialog>
  )
}
```

---

## 🎨 Icon System

### Use Centralized Icon Library

```tsx
// ✅ CORRECT
import { LightbulbIcon, PowerIcon, HomeIcon } from '@/lib/icons'

// ❌ WRONG - Direct import
import { Lightbulb } from 'lucide-react'
```

### Icon Sizes

```tsx
// Use Tailwind classes (not size prop)
<LightbulbIcon className="h-4 w-4" /> // Small
<LightbulbIcon className="h-5 w-5" /> // Medium
<LightbulbIcon className="h-6 w-6" /> // Large
```

---

## 🚀 Performance Best Practices

### Image Lazy Loading

```tsx
// Add loading="lazy" to all images below the fold
<img src={camera.snapshot} alt={camera.name} loading="lazy" />
```

### Service Worker Caching

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.example\.com\/.*/i,
        handler: 'NetworkFirst',
      },
    ],
  },
})
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer
```

**Key Metrics**:

- Security tab: 487KB → 21KB (96% reduction)
- Lazy chunk: 467KB (loads on demand)
- Lighthouse: 27 → 90+ (repeat visits)

---

## 🔒 Multi-Worker Deployment

### Cloudflare Workers Checklist

1. **KV Worker** (`homehub-kv-worker.andernet.workers.dev`)
   - REST API for KV operations
   - CORS headers enabled
2. **Arlo Proxy** (`homehub-arlo-proxy.andernet.workers.dev`)
   - CDN proxy for Arlo streaming
   - Wildcard route: `/arlo/*`

### Deploy Command

```bash
cd workers
npx wrangler deploy
```

---

## 🧪 Testing Patterns

### Run Tests

```bash
npm test                    # Run all tests
npm test Dashboard          # Run specific component
npm run test:coverage       # Generate coverage report
```

### Test Structure

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Dashboard', () => {
  it('renders device cards', () => {
    render(<Dashboard />)
    expect(screen.getByText('Living Room Light')).toBeInTheDocument()
  })
})
```

---

## 📚 Documentation Locations

### Essential Files

- **Architecture**: `docs/guides/ARCHITECTURE.md`
- **Best Practices**: `docs/guides/BEST_PRACTICES.md`
- **Lessons Learned**: `docs/development/LESSONS_LEARNED_OCT14_2025.md`
- **Deployment**: `docs/deployment/CLOUDFLARE_DEPLOYMENT.md`
- **Full Index**: `docs/INDEX.md`

### Quick Links

- Copilot Instructions: `.github/instructions/copilot-instructions.md`
- Type Definitions: `src/types/`
- Mock Data: `src/constants/mock-data.ts`
- KV Keys: `src/constants/kv-keys.ts`

---

## 🐛 Common Pitfalls

### 1. Empty Array Defaults

❌ **Don't**: `useKV<Device[]>('devices', [])`
✅ **Do**: `useKV<Device[]>('devices', MOCK_DEVICES)`

### 2. Direct UI Component Modification

❌ **Don't**: Edit files in `src/components/ui/`
✅ **Do**: Extend with wrapper components

### 3. Inline Styles

❌ **Don't**: `<div style={{ color: 'red' }}>`
✅ **Do**: Use Tailwind classes or CSS utilities

### 4. Direct Icon Imports

❌ **Don't**: `import { Lightbulb } from 'lucide-react'`
✅ **Do**: `import { LightbulbIcon } from '@/lib/icons'`

### 5. Large Bundles

❌ **Don't**: Import heavy libs in main bundle
✅ **Do**: Lazy load with `React.lazy()` + `Suspense`

---

## 🎓 Recent Lessons (October 15, 2025)

### Dashboard Refactoring

- Reduced complexity from 39 → 5 (87% improvement)
- Extracted protocol handlers into focused functions
- Fixed accessibility issues (proper `<button>` elements)

### Bundle Optimization

- Security tab: 487KB → 21KB gzipped (96% reduction)
- Lazy loaded CameraDetailsModal (467KB) on demand
- LCP improved: 7.8s → 2-3s (64% faster)

### Device Migration

- Created auto-repair script for corrupted localStorage
- Runs on app startup before React renders
- Prevents data loss from empty array defaults

### React 19 Validation

- Confirmed React 19.2.0 is latest stable (no React 20)
- All Radix UI packages support React 19
- Verified zero peer dependency conflicts

### PWA Fixes

- Fixed manifest path: `manifest.json` → `manifest.webmanifest`
- Added `mobile-web-app-capable` meta tag
- PWA install now works correctly on iOS

---

## 🏁 Quick Start Checklist

- [ ] Clone repo and run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Run `npm run dev` (opens on port 5173)
- [ ] Deploy KV Worker to Cloudflare
- [ ] Deploy Arlo Proxy Worker to Cloudflare
- [ ] Update `.env` with Worker URLs
- [ ] Run `npm run build` for production
- [ ] Deploy to Cloudflare Pages

---

## 📞 Need Help?

- **Documentation Index**: `docs/INDEX.md`
- **Architecture Guide**: `docs/guides/ARCHITECTURE.md`
- **Lessons Learned**: `docs/development/LESSONS_LEARNED_OCT14_2025.md`
- **GitHub Issues**: <https://github.com/and3rn3t/homehub/issues>

---

**Last Updated**: October 15, 2025
**Version**: 1.0.0
**Status**: Production-ready ✅
