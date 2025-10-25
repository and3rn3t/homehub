# HomeHub Performance Optimization Plan

**Date**: October 14, 2025
**Baseline Performance**: 27/100 🔴
**Target Performance**: 90+/100 ✅
**Status**: In Progress

## 📊 Current Performance Analysis

### Baseline Metrics (October 14, 2025)

| Metric                | Current | Target  | Gap            | Priority    |
| --------------------- | ------- | ------- | -------------- | ----------- |
| **Performance Score** | 27/100  | 90/100  | -63            | 🔴 Critical |
| **FCP**               | 3278ms  | <1500ms | +1778ms (2.2x) | 🔴 Critical |
| **LCP**               | 7882ms  | <2500ms | +5382ms (3.2x) | 🔴 Critical |
| **TTI**               | 7902ms  | <3000ms | +4902ms (2.6x) | 🔴 Critical |
| **TBT**               | 1091ms  | <300ms  | +791ms (3.6x)  | 🔴 Critical |
| **SI**                | 5583ms  | <2000ms | +3583ms (2.8x) | 🔴 Critical |
| **CLS**               | 0.00    | <0.1    | ✅ Perfect     | ✅ Good     |

### What's Working Well ✅

1. **Best Practices: 96/100** - Excellent code quality
2. **CLS: 0** - Perfect visual stability
3. **Lazy Loading**: Already implemented for heavy components
4. **Code Splitting**: Basic vendor chunking in place

### Root Causes 🔍

Based on the metrics, the main issues are:

1. **Large JavaScript Bundle** - Long parse/execution time (TBT: 1091ms)
2. **Blocking Resources** - Main thread blocked for 1+ second
3. **Heavy Initial Load** - All tab content loaded upfront
4. **Large Dependencies** - Heavy libraries loaded immediately
5. **No Resource Prioritization** - Critical resources not preloaded

## 🎯 Optimization Strategy

### Phase 1: Quick Wins (Target: 50+ Performance) ⚡

**Estimated Impact**: +23 points (27 → 50)
**Time**: 2-3 hours

#### 1.1 Optimize Bundle Size

**Current Problem**: Large JavaScript bundle blocking main thread

**Actions**:

- ✅ Lazy loading (already done)
- 🔄 Move heavy deps to dynamic imports
- 🔄 Enable tree-shaking for unused code
- 🔄 Split vendor chunks more aggressively

**Implementation**:

```typescript
// vite.config.ts improvements
build: {
  rollupOptions: {
    output: {
      manualChunks: id => {
        // Split by node_modules
        if (id.includes('node_modules')) {
          if (id.includes('react')) return 'react-vendor'
          if (id.includes('@radix-ui')) return 'radix-vendor'
          if (id.includes('recharts') || id.includes('d3')) return 'chart-vendor'
          if (id.includes('framer-motion')) return 'animation-vendor'
          if (id.includes('lucide-react')) return 'icon-vendor'
          return 'vendor' // Other deps
        }
      }
    }
  }
}
```

#### 1.2 Defer Non-Critical JavaScript

**Actions**:

- Move analytics to async
- Defer third-party scripts
- Use `defer` or `async` attributes

#### 1.3 Optimize Images

**Current**: Arlo camera images loaded synchronously

**Actions**:

- Add `loading="lazy"` to all images
- Implement progressive image loading
- Use WebP format where possible
- Add width/height to prevent CLS

#### 1.4 Preload Critical Resources

**Actions**:

```html
<!-- index.html -->
<link rel="preload" href="/src/main.tsx" as="script" />
<link rel="preconnect" href="https://api.cloudflare.com" />
```

### Phase 2: Major Improvements (Target: 70+ Performance) 🚀

**Estimated Impact**: +20 points (50 → 70)
**Time**: 4-6 hours

#### 2.1 Implement Route-Based Code Splitting

**Current**: All tabs available upfront
**Better**: Load tab content only when needed

**Implementation**:

```typescript
// Only load Dashboard by default
// Other tabs load on first access

const tabComponents = {
  home: () => import('./components/Dashboard'),
  rooms: () => import('./components/Rooms'),
  // etc...
}
```

#### 2.2 Optimize Heavy Dependencies

**Targets**:

- `recharts` (130KB) - Only load in Energy tab
- `d3` (100KB) - Only load when needed
- `@koush/arlo` - Async load in Security tab
- `three.js` (if used) - Dynamic import

#### 2.3 Implement Virtual Scrolling

**Current**: Render all devices at once
**Better**: Virtual list for device lists

```bash
npm install @tanstack/react-virtual
```

#### 2.4 Add Service Worker for Caching

**Benefits**:

- Cache static assets
- Offline support
- Faster repeat visits

```typescript
// vite-plugin-pwa
plugins: [
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    },
  }),
]
```

### Phase 3: Fine-Tuning (Target: 90+ Performance) 🏆

**Estimated Impact**: +20 points (70 → 90)
**Time**: 6-8 hours

#### 3.1 Optimize React Rendering

**Actions**:

- Implement React.memo for expensive components
- Use useMemo/useCallback strategically
- Reduce re-renders with proper state management
- Profile with React DevTools

#### 3.2 Critical CSS Inlining

**Current**: All Tailwind CSS in one file
**Better**: Inline critical CSS, defer rest

```typescript
// vite-plugin-critical
plugins: [
  critical({
    inline: true,
    dimensions: [
      { width: 375, height: 667 }, // Mobile
      { width: 1920, height: 1080 }, // Desktop
    ],
  }),
]
```

#### 3.3 Font Optimization

**Actions**:

- Use `font-display: swap`
- Preload critical fonts
- Subset fonts (only needed characters)
- Use variable fonts

#### 3.4 Network Optimizations

**Actions**:

- Enable HTTP/2
- Implement resource hints
- Optimize API calls (batch, dedupe)
- Add response compression

#### 3.5 Monitoring & Budgets

**Actions**:

- Set performance budgets
- Add bundle size limits
- CI/CD performance checks
- Real User Monitoring (RUM)

## 📋 Implementation Checklist

### Quick Wins (Week 1)

- [ ] Aggressive vendor code splitting
- [ ] Add lazy loading for images
- [ ] Preload critical resources
- [ ] Defer non-critical JS
- [ ] Optimize Vite build config
- [ ] Run comparison: `npm run lighthouse:compare`

### Major Improvements (Week 2)

- [ ] Route-based code splitting
- [ ] Virtual scrolling for lists
- [ ] Optimize heavy dependencies
- [ ] Implement service worker
- [ ] Add resource hints
- [ ] Run comparison: `npm run lighthouse:compare`

### Fine-Tuning (Week 3)

- [ ] React rendering optimizations
- [ ] Critical CSS inlining
- [ ] Font optimization
- [ ] Network optimizations
- [ ] Performance budgets
- [ ] Final baseline: `npm run lighthouse:baseline -- --save`

## 🎯 Success Metrics

### After Phase 1 (Quick Wins)

- Performance: **50+/100**
- FCP: **<2500ms**
- LCP: **<5000ms**
- TBT: **<600ms**

### After Phase 2 (Major Improvements)

- Performance: **70+/100**
- FCP: **<2000ms**
- LCP: **<3500ms**
- TBT: **<400ms**

### After Phase 3 (Fine-Tuning)

- Performance: **90+/100** ✅
- FCP: **<1500ms** ✅
- LCP: **<2500ms** ✅
- TBT: **<300ms** ✅

## 📊 Tracking Progress

### Weekly Comparison

```bash
# Every Friday
npm run lighthouse:baseline -- --compare --save
```

### Before/After Each Phase

```bash
# Before optimization
npm run lighthouse:baseline -- --save

# After optimization
npm run lighthouse:baseline -- --compare
```

## 🛠️ Tools & Resources

### Analysis Tools

- **Lighthouse Report**: Detailed recommendations
- **Bundle Analyzer**: `dist/stats.html` (already configured)
- **Chrome DevTools**: Performance profiler
- **React DevTools**: Component profiler

### NPM Packages to Consider

```bash
# Virtual scrolling
npm install @tanstack/react-virtual

# PWA support
npm install vite-plugin-pwa

# Critical CSS
npm install vite-plugin-critical

# Image optimization
npm install vite-imagetools
```

### Documentation

- [Web.dev Performance](https://web.dev/performance/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit#optimizing-performance)

## 🔄 Next Steps

1. **Review this plan** and prioritize tasks
2. **Start with Phase 1** (quick wins)
3. **Run lighthouse:compare** after each change
4. **Document improvements** in git commits
5. **Share progress** weekly

---

**Last Updated**: October 14, 2025
**Baseline File**: `lighthouse/baselines/baseline-desktop-latest.json`
**Report**: `lighthouse/reports/report-desktop-1760493554219.html`
