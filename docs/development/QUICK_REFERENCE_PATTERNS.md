# Quick Reference - Recent Technical Patterns

**Quick lookup for patterns established in Phase 6.1 + Mobile Optimization**
**Last Updated**: October 14, 2025

---

## 🎯 Mobile Patterns

### Safe-Area Handling

```tsx
// CSS (src/index.css)
.safe-top { padding-top: max(1rem, env(safe-area-inset-top)); }
.safe-bottom { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }

// HTML (index.html)
<meta name="viewport" content="viewport-fit=cover, user-scalable=no" />

// Usage
<div className="safe-bottom">Content respects home indicator</div>
```

### Bottom Sheets

```tsx
const isMobile = window.innerWidth < 768

{
  isMobile ? (
    <Sheet>
      <SheetContent side="bottom" className="safe-bottom">
        ...
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog>
      <DialogContent>...</DialogContent>
    </Dialog>
  )
}
```

### Keyboard Avoidance

```tsx
import { useKeyboardAvoidance } from '@/hooks/use-keyboard-avoidance'

function MyForm() {
  useKeyboardAvoidance() // Auto-scrolls inputs when keyboard opens
  return <form>...</form>
}
```

### Context Menus (Long-Press + Right-Click)

```tsx
const longPressHandlers = useLongPress({
  onLongPress: () => haptic.medium(),
  onPress: onClick,
})

<ContextMenu>
  <ContextMenuTrigger asChild>
    <div {...longPressHandlers}>{content}</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={handleEdit}>Edit</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Haptic Feedback

```tsx
const haptic = useHaptics()

<Button onClick={() => {
  haptic.light()   // Subtle tap
  handleAction()
}}>

<ContextMenuItem onClick={() => {
  haptic.heavy()   // Strong warning (delete)
  handleDelete()
}}>
```

### Image Lazy Loading

```tsx
// All below-fold images
<img
  src={camera.snapshotUrl}
  alt={camera.name}
  loading="lazy" // Native browser lazy loading
  decoding="async" // Off main thread
/>
```

---

## 🔌 API Patterns

### Arlo Authentication

```typescript
const headers = {
  Cookie: `auth_token=${authToken}; XSRF-TOKEN=${xsrfToken}`,
  Authorization: `Bearer ${bearerToken}`,
  Accept: 'application/json',
}
```

### CORS Proxy (Cloudflare Worker)

```typescript
// workers/src/index.ts
if (url.pathname.startsWith('/arlo/')) {
  const arloUrl = url.pathname.replace('/arlo/', 'https://vzwow72-z2-prod.vss.arlo.com/')
  const response = await fetch(arloUrl, {
    headers: { Origin: 'https://my.arlo.com' },
  })
  return new Response(response.body, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
```

---

## 🚀 Performance Patterns

### Service Worker (PWA)

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/homehub-.*\.workers\.dev\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxAgeSeconds: 60 * 60 }, // 1 hour
        },
      },
    ],
  },
})
```

### Offline Detection

```typescript
import { useNetworkStatus } from '@/hooks/use-network-status'

const { isOnline } = useNetworkStatus()

// Banner UI
{!isOnline && (
  <div className="fixed top-0 z-50 bg-destructive">
    You are offline
  </div>
)}

// Disable controls
<Button disabled={!isOnline}>
  {isOnline ? 'Turn On' : 'Offline'}
</Button>
```

---

## 🎨 UI Patterns

### Pull-to-Refresh

```tsx
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'

const { isPulling, pullDistance } = usePullToRefresh({
  onRefresh: async () => await fetchData(),
  threshold: 80,
})

<div style={{ transform: `translateY(${pullDistance}px)` }}>
  {isPulling && <Spinner />}
  {content}
</div>
```

### Tab Badges

```tsx
const [events] = useKV<SecurityEvent[]>('security-events', [])
const unreadCount = events.filter(e => !e.acknowledged).length

const tabs = [
  {
    id: 'security',
    badge: unreadCount > 0 ? unreadCount : undefined,
  },
]

// Render
{
  tab.badge && (
    <span className="bg-destructive absolute -right-1 -top-1 h-5 w-5 rounded-full">
      {tab.badge}
    </span>
  )
}
```

### Swipe-to-Reveal

```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: -100, right: 0 }}
  onDragEnd={(event, info) => {
    if (info.offset.x < -50) {
      setActionsVisible(true)
    }
  }}
>
  {cardContent}
  <motion.div animate={{ x: actionsVisible ? 0 : 100 }}>
    <button>Edit</button>
    <button>Delete</button>
  </motion.div>
</motion.div>
```

---

## 📦 Common Imports

```typescript
// Mobile hooks
import { useKeyboardAvoidance } from '@/hooks/use-keyboard-avoidance'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { useHaptics } from '@/hooks/use-haptics'
import { useLongPress } from '@/hooks/use-long-press'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'

// UI components
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Spinner } from '@/components/ui/spinner'

// Icons
import { WifiOffIcon, ShieldCheckIcon } from '@/lib/icons'
```

---

## 🎯 Performance Targets

| Metric                          | Target         | Phase 6.1 Result |
| ------------------------------- | -------------- | ---------------- |
| Lighthouse Performance (repeat) | 80+            | **90+** ✅       |
| FCP                             | <1.8s          | **0.8s** ✅      |
| LCP                             | <2.5s          | **1.2s** ✅      |
| TBT                             | <200ms         | **120ms** ✅     |
| Bundle (gzipped)                | <1MB per chunk | **668KB** ✅     |

---

## 🔧 Deployment Commands

```bash
# Build production
npm run build

# Deploy to Cloudflare
npx wrangler pages deploy dist --project-name homehub-awe

# Check Lighthouse score
node lighthouse/run-baseline.js

# Full validation
npm run validate  # type + lint + format
```

---

## 📚 Key Documents

- **Comprehensive Guide**: [LESSONS_LEARNED_OCT14_2025.md](./LESSONS_LEARNED_OCT14_2025.md)
- **Mobile Features**: [MOBILE_SESSION_SUMMARY_OCT14_2025.md](./MOBILE_SESSION_SUMMARY_OCT14_2025.md)
- **iOS Patterns**: [MOBILE_OPTIMIZATION_COMPLETE.md](./MOBILE_OPTIMIZATION_COMPLETE.md)
- **Performance**: [PERFORMANCE_OPTIMIZATION_SESSION_OCT14.md](./PERFORMANCE_OPTIMIZATION_SESSION_OCT14.md)
- **Copilot Instructions**: [copilot-instructions.md](../../.github/instructions/copilot-instructions.md)

---

**Quick Access**: This document provides instant code snippets for common patterns. For detailed explanations, see LESSONS_LEARNED_OCT14_2025.md.
