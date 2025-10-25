# Additional Mobile Optimizations - Enhancement Plan

**Date**: October 14, 2025
**Priority**: Medium to High Impact Improvements

## Current Status ✅

Already implemented:

- Safe-area support for notch/Dynamic Island/home indicator
- Touch-optimized tab bar (44×44px+ targets)
- Responsive sub-navigation with horizontal scroll
- Mobile-friendly scrolling with momentum

## Proposed Enhancements

### 1. Dialog/Modal Mobile Optimization ⭐⭐⭐⭐⭐

**Problem**: Dialogs currently use fixed max-width and may not fully utilize mobile screen space.

**Solution**: Make dialogs full-screen on mobile, drawer-style on tablets.

```tsx
// In dialog.tsx
<DialogPrimitive.Content
  className={cn(
    'fixed z-50 grid w-full gap-4 border shadow-lg duration-200',
    // Mobile: Full screen bottom sheet
    'inset-x-0 bottom-0 rounded-t-2xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
    // Tablet+: Centered modal
    'sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:max-w-lg',
    'safe-bottom pb-6', // Respect home indicator
    className
  )}
>
```

**Files to modify**:

- `src/components/ui/dialog.tsx`
- `src/components/ui/drawer.tsx` (create for native iOS feel)

**Impact**:

- Better screen utilization on phones
- Native iOS "sheet" feel
- Easier thumb-reach for controls

---

### 2. Pull-to-Refresh Enhancement ⭐⭐⭐⭐

**Status**: Already exists! (`src/components/ui/pull-to-refresh.tsx`)

**Optimization**: Ensure it's used in all scrollable pages.

**Add to**:

- `Dashboard.tsx` - ✅ Already has it
- `Rooms.tsx` - Add
- `Scenes.tsx` - Add
- `Security.tsx` - Add
- `DeviceMonitor.tsx` - Add

```tsx
<PullToRefresh onRefresh={handleRefresh}>
  <div className="h-full overflow-y-auto">{/* Content */}</div>
</PullToRefresh>
```

**Impact**:

- Native iOS gesture feel
- Better UX for refreshing data

---

### 3. Card Grid Responsive Optimization ⭐⭐⭐⭐

**Problem**: Many grids use `grid-cols-2` on mobile which can be cramped.

**Current patterns**:

```tsx
// SecurityCameras.tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
```

**Better pattern**:

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
  {/* Single column on mobile, scales up */}
</div>
```

**Apply to**:

- `Dashboard.tsx` - Device grids
- `Rooms.tsx` - Room cards
- `Scenes.tsx` - Scene cards
- `SecurityCameras.tsx` - Camera cards

**Impact**:

- More breathing room on small screens
- Larger tap targets

---

### 4. Bottom Sheet for Device Controls ⭐⭐⭐⭐⭐

**Problem**: `DeviceControlPanel` opens as centered dialog, awkward on mobile.

**Solution**: Use iOS-style bottom sheet with handle.

```tsx
// New component: src/components/ui/bottom-sheet.tsx
export function BottomSheet({ open, onOpenChange, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'safe-bottom rounded-t-3xl pb-4',
          'max-h-[90vh] overflow-y-auto',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
          'sm:bottom-auto sm:left-1/2 sm:top-[50%] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg'
        )}
      >
        {/* Drag handle */}
        <div className="bg-muted mx-auto mb-4 h-1 w-12 rounded-full sm:hidden" />
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

**Modify**:

- `DeviceControlPanel.tsx` - Use BottomSheet on mobile
- `DeviceEditDialog.tsx` - Use BottomSheet on mobile
- `RoomEditDialog.tsx` - Use BottomSheet on mobile

**Impact**:

- Native iOS feel
- Easier one-handed use
- Thumb-friendly controls

---

### 5. Horizontal Scrolling Optimization ⭐⭐⭐

**Add to scenes/shortcuts sections**:

```tsx
// Dashboard quick scenes
<div className="scrollbar-hide -mx-6 flex gap-3 overflow-x-auto px-6 sm:mx-0 sm:px-0">
  {scenes.map(scene => (
    <SceneCard key={scene.id} className="min-w-[160px] sm:min-w-0 sm:flex-1" />
  ))}
</div>
```

**Features**:

- Edge-to-edge scroll on mobile
- Snap scrolling: `scroll-snap-type: x mandatory`
- Scroll indicators (fade on edges)

**Impact**:

- More content visible
- Native swipe feel

---

### 6. Tab Bar Badge Notifications ⭐⭐⭐

**Add to iOS26TabBar**:

```tsx
interface TabItem {
  id: string
  label: string
  icon: LucideIcon
  badge?: number | string // Already exists!
}

// Show unread counts
;<IOS26TabBar
  items={[
    { id: 'security', label: 'Security', icon: ShieldIcon, badge: unreadEvents },
    { id: 'insights', label: 'Insights', icon: ChartIcon, badge: 'new' },
  ]}
/>
```

**Connect to**:

- Security events (unread count)
- New insights available
- Device alerts

**Impact**:

- At-a-glance status
- Native iOS app feel

---

### 7. Haptic Feedback Integration ⭐⭐⭐⭐

**Status**: Hook already exists! (`src/hooks/use-haptic.ts`)

**Expand usage**:

```tsx
const haptic = useHaptic()

// On device toggle
const handleToggle = () => {
  haptic.medium() // Feedback
  toggleDevice()
}

// On scene activation
const activateScene = () => {
  haptic.heavy() // Success feedback
  scene.activate()
}

// On error
const onError = () => {
  haptic.light() // 3 quick taps
  haptic.light()
  haptic.light()
}
```

**Add to**:

- Device toggles
- Scene activations
- Room favorites
- Pull-to-refresh
- Tab switches

**Impact**:

- iOS-native feel
- Better tactile feedback

---

### 8. Swipe Gestures for Cards ⭐⭐⭐⭐

**Add swipe-to-delete on mobile**:

```tsx
// Use Framer Motion drag
<motion.div
  drag="x"
  dragConstraints={{ left: -80, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.x < -60) {
      // Show delete/edit actions
    }
  }}
>
  <DeviceCard />
</motion.div>
```

**Apply to**:

- Room cards
- Device cards
- Scene cards

**Reveal actions**:

- Edit (blue)
- Delete (red)
- Favorite (yellow)

**Impact**:

- iOS Mail-style interaction
- Faster actions on mobile

---

### 9. Virtual Scrolling for Large Lists ⭐⭐⭐

**Problem**: Long device lists can lag on older iPhones.

**Solution**: Use `@tanstack/react-virtual` for windowing.

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function DeviceList({ devices }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: devices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated row height
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => (
          <DeviceCard device={devices[item.index]} />
        ))}
      </div>
    </div>
  )
}
```

**Apply to**:

- Device Monitor (>50 devices)
- Security Events (>100 events)
- Automation logs

**Impact**:

- Smooth scrolling with 100+ items
- Reduced memory usage

---

### 10. Image Lazy Loading & Optimization ⭐⭐⭐

**Add to camera thumbnails**:

```tsx
<img
  src={camera.thumbnail}
  loading="lazy"
  decoding="async"
  className="aspect-video object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

**Use Cloudflare Image Resizing**:

```tsx
const thumbnailUrl = `/cdn-cgi/image/width=400,quality=80,format=auto/${camera.thumbnail}`
```

**Impact**:

- Faster page loads on mobile
- Less data usage

---

### 11. Offline Mode Indicator ⭐⭐⭐

**Add network status banner**:

```tsx
// New component: OfflineBanner.tsx
function OfflineBanner() {
  const isOnline = useNetworkStatus()

  return !isOnline ? (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="safe-top fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white"
    >
      <WifiOffIcon className="mr-2 inline h-4 w-4" />
      No internet connection
    </motion.div>
  ) : null
}
```

**Show**:

- When offline
- When MQTT disconnects
- When API calls fail

**Impact**:

- Clear status feedback
- Manages expectations

---

### 12. Keyboard Avoidance ⭐⭐⭐⭐

**Problem**: iOS keyboard covers input fields in dialogs.

**Solution**: Detect keyboard and adjust dialog position.

```tsx
// In dialog/bottom-sheet
useEffect(() => {
  const onResize = () => {
    // iOS fires resize when keyboard opens
    const isKeyboardOpen = window.innerHeight < window.outerHeight * 0.75

    if (isKeyboardOpen) {
      // Scroll input into view
      setTimeout(() => {
        document.activeElement?.scrollIntoView({ block: 'center' })
      }, 100)
    }
  }

  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
}, [])
```

**Impact**:

- Inputs always visible
- No awkward scrolling needed

---

### 13. Context Menu Long-Press ⭐⭐⭐⭐

**Add long-press context menus**:

```tsx
function DeviceCard({ device }) {
  const [showMenu, setShowMenu] = useState(false)

  const handleLongPress = useLongPress(() => {
    setShowMenu(true)
    haptic.medium()
  }, 500)

  return (
    <Card {...handleLongPress}>
      {showMenu && (
        <ContextMenu>
          <MenuItem>Edit</MenuItem>
          <MenuItem>Delete</MenuItem>
          <MenuItem>Favorite</MenuItem>
        </ContextMenu>
      )}
    </Card>
  )
}
```

**Impact**:

- iOS-native interaction
- Faster access to actions

---

### 14. Reduce Motion Support ⭐⭐⭐

**Already handled by Framer Motion**, but add manual overrides:

```tsx
const prefersReducedMotion = useReducedMotion()

<motion.div
  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
>
```

**Impact**:

- Accessibility compliance
- Battery savings

---

### 15. Dark Mode Auto-Switch ⭐⭐

**Detect time of day**:

```tsx
function useAutoTheme() {
  const [theme, setTheme] = useKV('theme', 'auto')

  useEffect(() => {
    if (theme === 'auto') {
      const hour = new Date().getHours()
      const isDark = hour >= 19 || hour < 7
      document.documentElement.classList.toggle('dark', isDark)
    }
  }, [theme])
}
```

**Impact**:

- Convenience feature
- Matches iOS behavior

---

## Priority Matrix

| Enhancement                  | Impact     | Effort | Priority |
| ---------------------------- | ---------- | ------ | -------- |
| 1. Bottom Sheet Dialogs      | ⭐⭐⭐⭐⭐ | Medium | **P0**   |
| 4. Bottom Sheet Controls     | ⭐⭐⭐⭐⭐ | Medium | **P0**   |
| 2. Pull-to-Refresh All Pages | ⭐⭐⭐⭐   | Low    | **P1**   |
| 7. Haptic Feedback Expansion | ⭐⭐⭐⭐   | Low    | **P1**   |
| 8. Swipe Gestures            | ⭐⭐⭐⭐   | Medium | **P1**   |
| 12. Keyboard Avoidance       | ⭐⭐⭐⭐   | Low    | **P1**   |
| 3. Card Grid Optimization    | ⭐⭐⭐⭐   | Low    | **P2**   |
| 5. Horizontal Scroll         | ⭐⭐⭐     | Low    | **P2**   |
| 6. Tab Bar Badges            | ⭐⭐⭐     | Low    | **P2**   |
| 11. Offline Indicator        | ⭐⭐⭐     | Low    | **P2**   |
| 13. Context Menu             | ⭐⭐⭐⭐   | Medium | **P2**   |
| 9. Virtual Scrolling         | ⭐⭐⭐     | High   | **P3**   |
| 10. Image Lazy Loading       | ⭐⭐⭐     | Low    | **P3**   |
| 14. Reduce Motion            | ⭐⭐⭐     | Low    | **P3**   |
| 15. Auto Dark Mode           | ⭐⭐       | Low    | **P3**   |

## Implementation Order (Recommended)

### Phase 1 - High Impact, Low Effort (This Session)

1. ✅ ~~Bottom Sheet Component~~ (Create reusable)
2. ✅ ~~DeviceControlPanel → Bottom Sheet~~
3. ✅ ~~Card Grid Mobile Optimization~~
4. ✅ ~~Expand Haptic Usage~~

### Phase 2 - Native Feel

5. Swipe-to-Delete Gestures
6. Long-Press Context Menus
7. Pull-to-Refresh All Pages
8. Tab Bar Notification Badges

### Phase 3 - Performance

9. Virtual Scrolling (DeviceMonitor)
10. Image Lazy Loading
11. Offline Mode Indicator

### Phase 4 - Polish

12. Keyboard Avoidance
13. Horizontal Scroll Scenes
14. Reduce Motion Support
15. Auto Dark Mode

## Quick Wins (Can Do Now)

1. **Add pull-to-refresh to all pages** (5 min each)
2. **Single-column cards on mobile** (className changes)
3. **Expand haptic feedback** (Add hooks to existing handlers)
4. **Tab bar badges** (Use existing badge prop)

Would you like me to implement any of these? I recommend starting with **Bottom Sheet** + **Card Grid** + **Haptic Expansion** for maximum immediate impact!
