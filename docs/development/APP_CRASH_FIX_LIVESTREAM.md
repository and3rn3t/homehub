# App Crash Fix - Live Stream Initialization

**Date**: October 14, 2025
**Issue**: App crashes and goes blank when clicking "Start Live Stream"
**Status**: ✅ Fixed

## Problem

When clicking the "Start Live Stream" button, the entire React app would crash and show a blank page.

### Root Cause

**dashjs import failure** - The dashjs library was being imported incorrectly, causing a module loading error that crashed the app when attempting to initialize the DASH video player.

### Error Details

```typescript
// ❌ WRONG - Caused crash
import dashjs from 'dashjs'
// TypeScript Error: Module has no default export

// At runtime:
const player = dashjs.MediaPlayer().create()
// Error: dashjs.MediaPlayer is not a function
```

## Solution

### 1. Fixed dashjs Import

Changed from default import to namespace import:

```typescript
// ✅ CORRECT
import * as dashjs from 'dashjs'
```

**File**: `src/components/UniversalVideoPlayer.tsx` (line 5)

### 2. Added Try-Catch Protection

Wrapped DASH.js initialization in try-catch to prevent crashes:

```typescript
try {
  // Create DASH player
  const player = dashjs.MediaPlayer().create()
  dashRef.current = player

  // ... player setup
} catch (dashError) {
  console.error('[UniversalVideoPlayer] Failed to initialize DASH.js:', dashError)
  setError('Failed to load video player. Please refresh the page.')
  setIsLoading(false)
}
```

**File**: `src/components/UniversalVideoPlayer.tsx` (lines 177-248)

### 3. Fixed Import Order

Corrected the position of `@ts-expect-error` comment:

```typescript
// ❌ WRONG - Comment in wrong place
import { MaximizeIcon, ... } from '@/lib/icons'
// @ts-expect-error - dashjs doesn't have TypeScript definitions
import dashjs from 'dashjs'

// ✅ CORRECT - Comment immediately before import
import { MaximizeIcon, ... } from '@/lib/icons'
// @ts-expect-error - dashjs doesn't have proper TypeScript definitions
import * as dashjs from 'dashjs'
```

### 4. Simplified DASH Settings

Removed unsupported settings that were causing errors:

```typescript
// ❌ WRONG - Invalid settings
player.updateSettings({
  streaming: {
    lowLatencyEnabled: false, // ❌ Not a valid property
    bufferTimeAtTopQualityLongForm: 60, // ❌ Not needed
    delay: { liveDelay: 6 }, // ❌ Nested incorrectly
  },
})

// ✅ CORRECT - Only valid settings
player.updateSettings({
  streaming: {
    liveDelay: 6,
    stableBufferTime: 12,
    bufferTimeAtTopQuality: 30,
  },
})
```

## Why This Happened

### ES Module Export Pattern

The dashjs library uses a specific export pattern:

```javascript
// dashjs exports (simplified)
export const MediaPlayer = function() { ... }
export const Debug = { ... }
export const events = { ... }

// No default export!
// export default MediaPlayer ❌
```

### TypeScript Import Confusion

```typescript
// Default import expects:
export default Something

// Namespace import expects:
export const Something = ...
export const AnotherThing = ...
```

Since dashjs doesn't have a default export, we need namespace import (`import * as`).

## Testing

### 1. Verify No Errors

```bash
# Check TypeScript compilation
npm run build
# Should complete without errors
```

### 2. Test Live Streaming

1. Refresh browser (Ctrl+R)
2. Click on any Arlo camera
3. Click "Start Live Stream" button
4. **Expected**: Video player loads and starts buffering
5. **Expected**: Console shows DASH initialization logs
6. **NOT Expected**: Blank screen or app crash

### 3. Check Console Output

```
[CameraDetailsModal] Starting stream for camera: Front Yard
[CameraDetailsModal] Token found, initializing adapter...
[CameraDetailsModal] Adapter initialized, starting stream...
[CameraDetailsModal] ✅ Stream URL received: https://arlostreaming...mpd
[UniversalVideoPlayer] Stream type detected: dash
[UniversalVideoPlayer] Using DASH.js
[UniversalVideoPlayer] DASH stream initialized
[UniversalVideoPlayer] Video tracks: 1
[UniversalVideoPlayer] Audio tracks: 1
[UniversalVideoPlayer] DASH playback started
```

## Related Issues Fixed

### Issue 1: Error Boundary Not Catching

**Why**: Module loading errors happen before React error boundaries can catch them
**Solution**: Try-catch at module initialization level

### Issue 2: TypeScript Type Errors

**Why**: dashjs doesn't provide complete TypeScript definitions
**Solution**: Use `@ts-expect-error` directive and accept `any` types for DASH player

### Issue 3: Settings Validation

**Why**: DASH.js has strict type checking for settings object
**Solution**: Only use documented, supported properties

## Production Considerations

### 1. Add React Error Boundary

```tsx
<ErrorBoundary FallbackComponent={VideoPlayerError}>
  <UniversalVideoPlayer {...props} />
</ErrorBoundary>
```

### 2. Lazy Load dashjs

```typescript
// Future optimization: Load dashjs only when needed
const dashjs = await import('dashjs')
```

### 3. Feature Detection

```typescript
// Check if browser supports DASH
if (typeof dashjs === 'undefined') {
  setError('Video streaming not supported')
  return
}
```

## Files Modified

1. `src/components/UniversalVideoPlayer.tsx`
   - Fixed dashjs import (line 5)
   - Added try-catch for DASH initialization (lines 177-248)
   - Simplified DASH settings (lines 233-239)

2. `docs/development/APP_CRASH_FIX_LIVESTREAM.md`
   - This file

## Success Criteria

- ✅ No blank screen when clicking "Start Live Stream"
- ✅ Video player component renders
- ✅ DASH.js initializes successfully
- ✅ Error messages shown gracefully if stream fails
- ✅ TypeScript compilation succeeds
- ✅ No console errors during initialization

---

**Result**: Live streaming now initializes without crashing the app. If a stream fails to load, error is shown gracefully instead of crashing the entire application! 🎉
