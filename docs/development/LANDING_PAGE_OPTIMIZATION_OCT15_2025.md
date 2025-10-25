# Landing Page Performance Optimization - October 15, 2025

## 🎯 Executive Summary

**Current State Analysis**:

- ✅ Service Worker: Implemented (repeat visit scores 80-90+)
- ✅ Image Lazy Loading: Implemented across 8 components
- ✅ Component Lazy Loading: All major sections already lazy-loaded
- 🔴 **Critical Issue**: Large bundle sizes blocking initial load

**Bundle Size Analysis** (from `npm run build`):

| File                      | Size (gzip) | Issue                          |
| ------------------------- | ----------- | ------------------------------ |
| `Security-BlIkuBgj.js`    | **487 KB**  | 🔴 Arlo video player + DASH.js |
| `index-DbKSzAr7.js`       | **184 KB**  | 🔴 Main bundle (React + deps)  |
| `Dashboard-BYIhfUJ9.js`   | **130 KB**  | 🟡 All dashboard logic         |
| `Energy-DePBK1UP.js`      | **108 KB**  | 🟡 Recharts + D3 library       |
| `Rooms-C5dGVBet.js`       | 24 KB       | ✅ Acceptable                  |
| `Automations-T0VBpZUX.js` | 23 KB       | ✅ Acceptable                  |

**Total Initial Load**: ~900 KB gzipped (main + Security if loaded)

---

## 🔍 Root Cause Analysis

### Problem 1: Massive Security Bundle (487 KB) 🔴

**Issue**: Security tab loads Arlo video player stack upfront:

- `@koush/arlo` SDK (auth, API client)
- `dash.js` streaming library (~200 KB alone)
- HLS.js fallback player
- Video player components

**Impact**:

- Security tab takes 3-5 seconds to load
- Main thread blocked for 1+ second parsing JavaScript
- Wasted bandwidth if user never views cameras

**Evidence from Build Output**:

```
dist/assets/Security-BlIkuBgj.js            1,592.45 kB │ gzip: 487.02 kB
```

### Problem 2: Main Bundle Size (184 KB) 🟡

**Issue**: Everything in one chunk due to React duplication prevention:

```typescript
// vite.config.ts
manualChunks: undefined, // CRITICAL: Disable chunking
```

**Why This Exists**:

- Prevents React being imported twice (causes crashes)
- Comment says: "Disable chunking for node_modules to prevent React duplication"

**Side Effect**:

- ALL vendor code in main bundle (React, Framer Motion, Lucide, etc.)
- No parallel loading of vendor chunks
- Browser can't cache vendors separately

### Problem 3: Heavy Video Dependencies 🔴

**Culprits**:

1. **dash.js** (~200 KB) - MPEG-DASH video streaming
2. **@koush/arlo** SDK - Arlo API client
3. **hls.js** - HLS video fallback
4. Multiple video player components bundled together

**Current Loading**:

- All loaded when Security component mounts
- No lazy loading within Security component

---

## 💡 Optimization Strategy

### Phase 1: Critical Path (Target: -2s LCP) 🚀

#### 1.1 Lazy Load Video Players ⚡ HIGH IMPACT

**Implementation**: Split video players into dynamic imports

**Before** (Security.tsx):

```tsx
import { UniversalVideoPlayer } from './UniversalVideoPlayer'
import { CameraDetailsModal } from './CameraDetailsModal'
```

**After**:

```tsx
const UniversalVideoPlayer = lazy(() =>
  import('./UniversalVideoPlayer').then(m => ({ default: m.UniversalVideoPlayer }))
)
const CameraDetailsModal = lazy(() =>
  import('./CameraDetailsModal').then(m => ({ default: m.CameraDetailsModal }))
)
```

**Expected Savings**:

- **-300 KB gzipped** from Security bundle
- Video players only load when camera card clicked
- **Impact**: Security tab loads in <1s instead of 3-5s

**Files to Modify**:

- `src/components/Security.tsx` (main component)
- `src/components/SecurityCameras.tsx` (camera grid)
- Wrap players in `<Suspense>` with spinner

---

#### 1.2 Code-Split DASH.js and HLS.js ⚡ HIGH IMPACT

**Strategy**: Dynamic import video libraries only when needed

**Implementation**:

```tsx
// UniversalVideoPlayer.tsx - BEFORE
import dashjs from 'dashjs'
import Hls from 'hls.js'

// UniversalVideoPlayer.tsx - AFTER
const loadDashPlayer = async () => {
  const { default: dashjs } = await import('dashjs')
  return dashjs
}

const loadHlsPlayer = async () => {
  const { default: Hls } = await import('hls.js')
  return Hls
}

// Load only when user clicks play
const handlePlay = async () => {
  if (streamUrl.includes('.mpd')) {
    const dashjs = await loadDashPlayer()
    // Initialize DASH player
  } else if (streamUrl.includes('.m3u8')) {
    const Hls = await loadHlsPlayer()
    // Initialize HLS player
  }
}
```

**Expected Savings**:

- **-200 KB gzipped** (dash.js/hls.js not loaded upfront)
- Only loaded when video actually plays
- Most users never play videos (just view snapshots)

---

#### 1.3 Optimize Main Bundle with Vendor Splitting 🟡 MEDIUM IMPACT

**Problem**: Current config prevents vendor chunking to avoid React duplication

**Solution**: Use Vite's `optimizeDeps` + careful chunk strategy

**Implementation**:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    // Pre-bundle these vendors separately
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      // ... other radix components
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: id => {
          // Only chunk vendors, keep app code together
          if (id.includes('node_modules')) {
            // React ecosystem (must stay together)
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'animation-vendor'
            }
            // UI components
            if (id.includes('@radix-ui')) {
              return 'ui-vendor'
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icon-vendor'
            }
            // Charts (for Energy tab)
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'chart-vendor'
            }
            // Video (for Security tab)
            if (id.includes('dashjs') || id.includes('hls.js') || id.includes('@koush/arlo')) {
              return 'video-vendor'
            }
            // Everything else
            return 'vendor'
          }
        },
      },
    },
  },
})
```

**Expected Savings**:

- **-50ms parse time** (smaller chunks = faster parse)
- **Better caching** (vendors cached separately)
- **Parallel loading** (browser downloads multiple chunks)

**Risk Mitigation**:

- Test thoroughly for React duplication
- Use `import React from 'react'` consistently
- Monitor for "Invalid hook call" errors

---

#### 1.4 Preload Critical Resources 🟢 LOW IMPACT

**Implementation**: Add to `index.html`:

```html
<!-- Preload critical chunks -->
<link rel="modulepreload" href="/src/main.tsx" />

<!-- DNS prefetch for Arlo CDN -->
<link rel="dns-prefetch" href="https://vzwow09-prod.api.arlo.com" />
<link rel="dns-prefetch" href="https://arlos3-prod-z2.s3.amazonaws.com" />

<!-- Preconnect for KV store -->
<link rel="preconnect" href="https://api.cloudflare.com" crossorigin />
```

**Expected Savings**:

- **-100ms to -200ms** on first load
- Earlier DNS resolution for Arlo API
- React bundle starts loading sooner

---

### Phase 2: Progressive Enhancements (Target: +10 points) 🎯

#### 2.1 Tree-Shake Lucide Icons 🟢

**Current**: All icons imported via centralized `lib/icons.ts`
**Issue**: 200+ icons exported, ~50-70 KB saved during migration

**Opportunity**: Vite should tree-shake unused icons, but verify

**Test**:

```bash
npm run build
grep "lucide-react" dist/stats.html  # Check actual size in bundle
```

**If not tree-shaking properly**:

- Remove `lib/icons.ts` barrel export
- Import icons directly: `import { Home } from 'lucide-react'`

---

#### 2.2 Compress Images with WebP 🟡

**Current**: Camera snapshots served as JPEG from Arlo
**Opportunity**: Convert to WebP on-the-fly or cache layer

**Implementation** (service worker):

```typescript
// sw.ts - Add image compression
self.addEventListener('fetch', event => {
  if (event.request.url.includes('arlo') && event.request.url.includes('.jpg')) {
    event.respondWith(
      fetch(event.request)
        .then(response => response.blob())
        .then(blob => convertToWebP(blob))
        .then(webpBlob => new Response(webpBlob))
    )
  }
})
```

**Expected Savings**:

- **-30% image size** (JPEG → WebP)
- Faster image loading on mobile

---

#### 2.3 Reduce Animation Bundle Size 🟢

**Current**: Framer Motion used extensively for spring animations
**Size**: ~50 KB gzipped

**Options**:

1. Replace simple animations with CSS transitions
2. Use `motion/mini` bundle (smaller subset)
3. Keep Framer Motion (worth the bundle size for UX)

**Recommendation**: Keep Framer Motion - animations are core to iOS feel

---

### Phase 3: Advanced Optimizations (Future) 🔮

#### 3.1 Route-Based Code Splitting

**Idea**: Split each tab into separate route

- Use React Router or TanStack Router
- Each tab loads on-demand
- Better than current "load all lazy components upfront"

**Complexity**: High (requires routing refactor)

---

#### 3.2 Incremental Static Regeneration (ISR)

**Idea**: Pre-render common views (Dashboard, Rooms)

- Use Cloudflare Pages Functions
- Serve static HTML shell first
- Hydrate with JavaScript after

**Complexity**: Very High (architectural change)

---

## 📋 Implementation Checklist

### Immediate (This Session) ✅

- [x] Analyze bundle sizes (completed with `npm run build`)
- [ ] Implement 1.1: Lazy load video players (30 min)
- [ ] Implement 1.2: Code-split dash.js/hls.js (45 min)
- [ ] Test video playback still works (15 min)

### Next Session 🔜

- [ ] Implement 1.3: Vendor chunk splitting (60 min)
- [ ] Test for React duplication issues (30 min)
- [ ] Implement 1.4: Resource preloading (15 min)
- [ ] Run Lighthouse baseline comparison (15 min)

### Future Sprints 🔮

- [ ] Implement 2.1: Verify icon tree-shaking
- [ ] Implement 2.2: WebP image conversion
- [ ] Consider 3.1: Route-based splitting

---

## 🎯 Expected Performance Gains

### Baseline (Current)

- **Performance Score**: 27/100 (first visit), 80-90/100 (repeat)
- **LCP**: 7.8s (first visit), 2-3s (repeat)
- **TBT**: 1091ms
- **Bundle Size**: 900 KB gzipped initial load

### After Phase 1 (Estimated)

- **Performance Score**: 50-60/100 (first visit), 85-95/100 (repeat)
- **LCP**: 4-5s (first visit), <2s (repeat)
- **TBT**: 400-500ms (-600ms!)
- **Bundle Size**: 400 KB gzipped initial load (-500 KB!)

### Impact Breakdown

| Optimization             | LCP Impact  | TBT Impact | Bundle Savings |
| ------------------------ | ----------- | ---------- | -------------- |
| 1.1 Lazy video players   | -1000ms     | -300ms     | -150 KB        |
| 1.2 Split dash.js/hls.js | -500ms      | -200ms     | -200 KB        |
| 1.3 Vendor chunking      | -300ms      | -100ms     | -50 KB (parse) |
| 1.4 Resource preloading  | -200ms      | -50ms      | 0 KB           |
| **Total**                | **-2000ms** | **-650ms** | **-400 KB**    |

---

## 🔬 Testing Plan

### Before Optimization

1. Run Lighthouse (desktop + mobile)

   ```bash
   npm run lighthouse:baseline
   ```

2. Record metrics:
   - Performance score
   - FCP, LCP, TBT, TTI, CLS
   - Bundle sizes from build output

### After Each Change

1. Build and test locally

   ```bash
   npm run build
   npm run preview
   ```

2. Verify functionality:
   - Security cameras load
   - Video playback works
   - No console errors
3. Check bundle sizes changed as expected

### Final Validation

1. Run Lighthouse comparison
2. Test on real devices (iPhone, Android)
3. Monitor for React errors in production
4. Verify service worker still caches correctly

---

## 🚨 Risks & Mitigation

### Risk 1: React Duplication 🔴 HIGH

**Risk**: Vendor chunking could cause React to load twice
**Symptoms**:

- "Invalid hook call" errors
- App crashes on load
- Two versions of React in bundle

**Mitigation**:

- Test thoroughly after vendor splitting
- Use `optimizeDeps.include` to force single React bundle
- Monitor production error logs

**Rollback**: Revert to `manualChunks: undefined`

---

### Risk 2: Video Playback Broken 🟡 MEDIUM

**Risk**: Dynamic imports break DASH/HLS initialization
**Symptoms**:

- Videos don't play
- Console errors: "dashjs is not defined"
- Blank video player

**Mitigation**:

- Test with real Arlo streams
- Add loading states during import
- Fallback to snapshot if import fails

**Rollback**: Revert to static imports

---

### Risk 3: Cache Invalidation 🟢 LOW

**Risk**: Service worker caches old chunks
**Symptoms**:

- Users see old bundle
- "Module not found" errors
- Features don't work after deploy

**Mitigation**:

- Update service worker to handle new chunk pattern
- Add cache versioning
- Clear cache on version mismatch

---

## 📚 References

- **Bundle Analysis**: `dist/stats.html` (generated by `rollup-plugin-visualizer`)
- **Performance Docs**: `docs/development/PERFORMANCE_OPTIMIZATION_PLAN.md`
- **Service Worker**: `docs/development/PHASE_1_SERVICE_WORKER_SUMMARY.md`
- **Vite Docs**: https://vitejs.dev/guide/performance.html
- **React Code Splitting**: https://react.dev/reference/react/lazy

---

## 🎬 Next Steps

**Recommended Priority Order**:

1. ✅ **Start Here**: Implement 1.1 (Lazy video players) - lowest risk, highest impact
2. ✅ **Then**: Implement 1.2 (Split dash.js/hls.js) - works with 1.1
3. ⚠️ **Carefully**: Implement 1.3 (Vendor chunking) - test thoroughly
4. ✅ **Finally**: Implement 1.4 (Resource preloading) - polish

**Time Estimate**: 2-3 hours for Phase 1

**Success Criteria**:

- Security bundle < 150 KB gzipped (currently 487 KB)
- Initial load < 500 KB gzipped (currently ~900 KB)
- LCP < 4s on 4G (currently 7.8s)
- Video playback still works perfectly
- No React errors in console

---

## 💬 Notes

**Why Security Bundle is So Large**:

- Started with Arlo integration (Phase 6.1)
- Added DASH.js for live streaming (200 KB library)
- Added HLS.js as fallback (50 KB)
- Bundled all video components together
- No lazy loading within component

**Why This Wasn't Caught Earlier**:

- Service worker masks issue on repeat visits (scores 80-90)
- Focus was on mobile optimizations (gestures, safe-area)
- Video features added late in development
- Bundle size warnings ignored (large chunk warnings)

**Why Fix Now**:

- First-time users get poor experience (27/100)
- 900 KB initial load is unacceptable
- Security tab takes 3-5 seconds to load
- Easy wins available (lazy loading)

**Why Not Earlier Optimizations**:

- Font loading: Already optimal (system fonts) ✅
- Image lazy loading: Already implemented ✅
- Component lazy loading: Already implemented ✅
- Service worker: Already implemented ✅
- **Missing**: Video player code splitting 🔴
