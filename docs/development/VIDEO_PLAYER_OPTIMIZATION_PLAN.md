# Video Player Dynamic Import Strategy

## Problem

The `UniversalVideoPlayer.tsx` currently imports `dash.js` (~200 KB) and `hls.js` (~50 KB) at the top level, causing them to be included in the Security bundle (487 KB gzipped).

## Current Code Structure

```typescript
// Top-level imports (BLOAT!)
import * as dashjs from 'dashjs'
import Hls from 'hls.js'

// Used in useEffect
const player = dashjs.MediaPlayer().create()
const hls = new Hls({...})
```

## Proposed Solution: Lazy Player Initialization

### Option 1: Dynamic Import in useEffect (RECOMMENDED)

```typescript
// NO top-level imports! ✅

const [Hls, setHls] = useState<typeof import('hls.js').default | null>(null)
const [dashjs, setDashjs] = useState<typeof import('dashjs') | null>(null)

useEffect(() => {
  if (streamType === 'hls' && !Hls) {
    import('hls.js').then(module => {
      setHls(() => module.default)
    })
  }

  if (streamType === 'dash' && !dashjs) {
    import('dashjs').then(module => {
      setDashjs(() => module)
    })
  }
}, [streamType])

// Use after loaded
if (Hls && Hls.isSupported()) {
  const hls = new Hls({...})
}
```

### Option 2: Separate Player Components (CLEANER)

Create 3 separate components:

1. `NativeVideoPlayer.tsx` - No deps, just `<video src>`
2. `HLSPlayer.tsx` - Imports `hls.js` dynamically
3. `DASHPlayer.tsx` - Imports `dashjs` dynamically

Then `UniversalVideoPlayer.tsx` lazy loads the right one:

```typescript
const PlayerComponent = useMemo(() => {
  if (streamType === 'native') return NativeVideoPlayer
  if (streamType === 'hls') return lazy(() => import('./HLSPlayer'))
  if (streamType === 'dash') return lazy(() => import('./DASHPlayer'))
}, [streamType])

return (
  <Suspense fallback={<LoadingSpinner />}>
    <PlayerComponent {...props} />
  </Suspense>
)
```

## Implementation Steps

### Step 1: Extract DASH Player

Create `src/components/DASHVideoPlayer.tsx`:

- Move all dashjs code from UniversalVideoPlayer
- Import `dashjs` at component level (only loads when component loads)
- Export `DASHVideoPlayer` component

### Step 2: Extract HLS Player

Create `src/components/HLSVideoPlayer.tsx` (ALREADY EXISTS!)

- Verify it imports `hls.js` locally
- Export `HLSVideoPlayer` component

### Step 3: Simplify UniversalVideoPlayer

- Remove dashjs/hls imports
- Lazy load DASHVideoPlayer and HLSVideoPlayer
- Keep native player inline (no deps)
- Add Suspense with loading state

### Step 4: Update CameraDetailsModal

- Already lazy loads UniversalVideoPlayer ✅
- No changes needed

## Expected Savings

| Change                       | Bundle Reduction    |
| ---------------------------- | ------------------- |
| Remove dash.js from Security | -200 KB gzipped     |
| Remove hls.js from Security  | -50 KB gzipped      |
| **Total**                    | **-250 KB gzipped** |

## Testing Checklist

- [ ] HLS streams still work (Arlo cameras)
- [ ] DASH streams still work
- [ ] Native Safari HLS still works
- [ ] Loading states show correctly
- [ ] No console errors
- [ ] Bundle size reduced in build output

## Files to Modify

1. `src/components/UniversalVideoPlayer.tsx` - Simplify, add lazy loading
2. `src/components/DASHVideoPlayer.tsx` - NEW FILE (extract from Universal)
3. `src/components/HLSVideoPlayer.tsx` - CHECK if already correct
4. `src/components/SecurityCameras.tsx` - Already updated ✅

## Rollback Plan

If video playback breaks:

1. Revert `UniversalVideoPlayer.tsx` to git HEAD
2. Keep `SecurityCameras.tsx` lazy loading (that's safe)
3. Bundle will be 437 KB instead of 187 KB, but functionality preserved
