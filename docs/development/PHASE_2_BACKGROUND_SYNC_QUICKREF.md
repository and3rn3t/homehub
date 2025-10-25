# Phase 2: Background Sync - Quick Reference

## What's New?

✅ **Offline request queuing** - Device control actions saved when offline
✅ **Automatic retry** - Actions sync when connection restored (1-5 seconds)
✅ **User notifications** - Toast messages on sync success/failure
✅ **Custom service worker** - Full control over caching + sync behavior
✅ **React integration** - `useBackgroundSync()` hook with real-time updates

## Usage

### Basic Integration

```typescript
import { useBackgroundSync } from '@/hooks/use-background-sync'

const { queueRequest, queueCount } = useBackgroundSync()

// Queue an action when offline
try {
  await fetch('/api/devices/123/control', {
    method: 'POST',
    body: JSON.stringify({ enabled: true }),
  })
} catch (error) {
  if (!navigator.onLine) {
    await queueRequest({
      url: '/api/devices/123/control',
      method: 'POST',
      body: JSON.stringify({ enabled: true }),
    })
    // User sees: "Action queued - will sync when online"
  }
}
```

### Show Queue Status

```typescript
const { queueCount } = useBackgroundSync()

{queueCount > 0 && (
  <Alert>
    {queueCount} actions pending sync
  </Alert>
)}
```

### Manual Sync Trigger

```typescript
const { triggerSync, isSupported } = useBackgroundSync()

<Button
  onClick={triggerSync}
  disabled={!isSupported || !navigator.onLine}
>
  Sync Now
</Button>
```

## How It Works

1. **User goes offline** → Device control attempted
2. **Request fails** → Queued in IndexedDB
3. **User goes online** → Service worker detects connection
4. **Automatic sync** → Queued requests replayed (1-5 sec delay)
5. **Success/failure** → Toast notification shown

## Browser Support

| Browser    | Background Sync  | Fallback    |
| ---------- | ---------------- | ----------- |
| Chrome 49+ | ✅ Automatic     | N/A         |
| Edge 79+   | ✅ Automatic     | N/A         |
| Firefox    | ❌ Not supported | Manual sync |
| Safari     | ❌ Not supported | Manual sync |

**Note**: On unsupported browsers, actions still queue but require manual sync (reload page or click "Sync Now" button).

## API Reference

### `useBackgroundSync()` Hook

```typescript
const {
  queueCount, // number - Pending requests count
  isSupported, // boolean - Background Sync API available
  queueRequest, // (req) => Promise<string> - Queue a request
  triggerSync, // () => Promise<void> - Manual sync
  clearQueue, // () => Promise<void> - Clear all queued
  refreshCount, // () => Promise<void> - Update count
} = useBackgroundSync()
```

### Queue Request Options

```typescript
interface QueuedRequest {
  url: string // Required: API endpoint
  method: string // Required: HTTP method
  headers?: Record<string, string> // Optional: Headers
  body?: string // Optional: Request body
  maxRetries?: number // Optional: Max retries (default: 3)
}
```

## Testing

### Chrome DevTools

1. **Network → Offline** - Simulate offline mode
2. **Attempt device control** - Should queue with toast
3. **Network → Online** - Wait 1-5 seconds
4. **Check Application → IndexedDB → homehub-sync-db** - Should be empty after sync
5. **Console** - Look for `[SW Sync] Sync complete: { total: X, success: X, failed: 0 }`

### Verify Sync Event

```typescript
// In console:
navigator.serviceWorker.ready
  .then(reg => {
    return reg.sync.getTags()
  })
  .then(tags => {
    console.log('Registered sync tags:', tags)
    // Expected: ['homehub-offline-queue']
  })
```

## Performance

- **Queue Write**: <10ms (IndexedDB)
- **Queue Read**: <20ms (IndexedDB)
- **Sync Delay**: 1-5 seconds (browser controlled)
- **Max Queue**: ~1000 requests (~500 KB)
- **Service Worker**: 9.53 KB gzipped (+0 KB vs Phase 1)

## Key Files

- `src/sw.ts` - Custom service worker (410 lines)
- `src/lib/background-sync.ts` - Queue management (250 lines)
- `src/hooks/use-background-sync.ts` - React hook (160 lines)
- `src/types/sync.d.ts` - TypeScript types (20 lines)

## Known Issues

1. **Safari/iOS** - No Background Sync API support (manual sync required)
2. **Sync Timing** - Browser controls when sync fires (not immediate)
3. **No Deduplication** - Same action queued multiple times will execute multiple times
4. **Request Size** - Large payloads consume IndexedDB quota faster

## What's Next?

**Phase 3: Update Notifications** - Notify users of new service worker versions

---

**Phase 2 Status**: ✅ Complete
**Build Verified**: ✅ `npm run build` successful
**Documentation**: See `PHASE_2_BACKGROUND_SYNC_COMPLETE.md` for full details
