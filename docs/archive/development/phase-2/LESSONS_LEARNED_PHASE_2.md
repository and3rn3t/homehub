# HomeHub Phase 2 - Lessons Learned & Best Practices

**Compiled**: October 11, 2025
**Phase**: 2 (Device Integration + Polish)
**Purpose**: Document technical wins, patterns, and pitfalls for future reference

---

## Table of Contents

1. [Drag & Drop Patterns](#drag--drop-patterns)
2. [Color Control Patterns](#color-control-patterns)
3. [State Management Patterns](#state-management-patterns)
4. [Performance Optimization](#performance-optimization)
5. [API Integration Patterns](#api-integration-patterns)
6. [Touch & Mobile Support](#touch--mobile-support)
7. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
8. [Reusable Code Patterns](#reusable-code-patterns)

---

## Drag & Drop Patterns

### @dnd-kit Sensor Configuration

**Problem**: Drag activates too easily, interfering with clicks/scrolls

**Solution**: Tune activation constraints for mouse and touch

```typescript
import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

const sensors = useSensors(
  // Mouse: Require 8px movement before drag starts
  useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  }),

  // Touch: Require 200ms hold + 5px tolerance
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // Prevents scroll conflicts
      tolerance: 5, // Allows natural finger movement
    },
  })
)
```

**Why These Values?**

- **8px mouse**: Prevents accidental drags from clicks
- **200ms touch**: Distinguishes tap from drag
- **5px tolerance**: Accommodates jittery touch input

**Key Insight**: Always test on real mobile devices, not just desktop touch emulation!

---

### Drag Overlay Portal Pattern

**Problem**: Dragging items causes layout shift

**Solution**: Use DragOverlay in a portal

```tsx
<DndContext {...}>
  <SortableContext items={items}>
    {items.map(item => <SortableItem key={item.id} item={item} />)}
  </SortableContext>

  {/* Portal - renders outside normal flow */}
  <DragOverlay>
    {activeId ? (
      <div className="opacity-50">
        <PreviewCard item={items.find(i => i.id === activeId)} />
      </div>
    ) : null}
  </DragOverlay>
</DndContext>
```

**Benefits**:

- No layout shift during drag
- Smooth animations (no reflows)
- Custom preview styling (opacity, shadow)

**Key Insight**: DragOverlay is rendered in a portal, so it can use full viewport coordinates without affecting layout.

---

### Array Reordering with arrayMove

**Problem**: Manual array manipulation is error-prone

**Solution**: Use @dnd-kit's arrayMove utility

```typescript
import { arrayMove } from '@dnd-kit/sortable'

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event
  if (!over || active.id === over.id) return

  setItems(prevItems => {
    const oldIndex = prevItems.findIndex(item => item.id === active.id)
    const newIndex = prevItems.findIndex(item => item.id === over.id)

    // Clean, immutable reordering
    return arrayMove(prevItems, oldIndex, newIndex)
  })
}
```

**Why arrayMove?**

- Immutable (creates new array)
- Handles edge cases (boundaries, same index)
- Cleaner than splice/slice combos

**Key Insight**: Always use array methods that return new arrays for React state updates.

---

## Color Control Patterns

### onChange vs onValueCommit

**Problem**: Every slider movement triggers API call (100+ calls per drag)

**Solution**: Separate visual feedback from network sync

```tsx
function ColorWheelPicker({ color, onChange, onValueCommit }) {
  const [localColor, setLocalColor] = useState(color)

  // Instant visual feedback (no API call)
  const handleChange = (newColor: HSV) => {
    setLocalColor(newColor)
    onChange?.(newColor) // Optional parent update
  }

  // Single API call when user releases
  const handleCommit = (finalColor: HSV) => {
    onValueCommit?.(finalColor)
  }

  return (
    <canvas
      onMouseMove={handleChange}
      onMouseUp={() => handleCommit(localColor)}
      onTouchMove={handleChange}
      onTouchEnd={() => handleCommit(localColor)}
    />
  )
}
```

**Usage**:

```tsx
<ColorWheelPicker
  color={deviceColor}
  onChange={setLocalPreview} // Instant UI update
  onValueCommit={updateHueBridge} // Network call on release
/>
```

**Benefits**:

- 60fps smooth interactions
- 1 API call instead of 100+
- Instant visual feedback

**Key Insight**: Always separate visual state (local) from persisted state (network).

---

### Canvas Positioning with Fixed Container

**Problem**: Canvas indicator position drifts when scrolling

**Solution**: Calculate position from fixed container, not viewport

```typescript
const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current
  if (!canvas) return

  // Get canvas bounding rect RELATIVE TO VIEWPORT
  const rect = canvas.getBoundingClientRect()

  // Calculate pixel position from container origin
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // Now x,y are pixel coordinates within the canvas
  const color = getColorAtPosition(x, y, canvas.width, canvas.height)
  setSelectedColor(color)
}
```

**Why This Works**:

- `getBoundingClientRect()` gives viewport-relative position
- Subtracting rect.left/top gives canvas-relative coordinates
- Indicator position stays pixel-perfect during scroll

**Key Insight**: Always use getBoundingClientRect() for canvas mouse/touch positions, never rely on offsetX/offsetY (inconsistent across browsers).

---

### HSV vs RGB Color Spaces

**Problem**: RGB sliders feel unintuitive for color picking

**Solution**: Use HSV (Hue, Saturation, Value) for UI, convert to RGB for API

```typescript
// HSV representation (better for UI)
interface HSV {
  h: number // 0-360 degrees (color wheel position)
  s: number // 0-100% (distance from center)
  v: number // 0-100% (brightness)
}

// Convert HSV → RGB for API
function hsvToRgb(hsv: HSV): RGB {
  // Algorithm: https://en.wikipedia.org/wiki/HSL_and_HSV
  const h = hsv.h / 60
  const s = hsv.s / 100
  const v = hsv.v / 100

  const c = v * s
  const x = c * (1 - Math.abs((h % 2) - 1))
  const m = v - c

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 1) {
    r = c
    g = x
    b = 0
  } else if (h >= 1 && h < 2) {
    r = x
    g = c
    b = 0
  } else if (h >= 2 && h < 3) {
    r = 0
    g = c
    b = x
  } else if (h >= 3 && h < 4) {
    r = 0
    g = x
    b = c
  } else if (h >= 4 && h < 5) {
    r = x
    g = 0
    b = c
  } else if (h >= 5 && h < 6) {
    r = c
    g = 0
    b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}
```

**Why HSV for UI?**

- Hue = angle on color wheel (intuitive)
- Saturation = distance from center (intuitive)
- Value = brightness (separate control)

**Key Insight**: Use the color space that matches the UI metaphor (wheel = HSV, sliders = RGB).

---

## State Management Patterns

### useKV for Persistent State

**Problem**: useState state is lost on refresh

**Solution**: Use useKV hook for all persistent data

```typescript
import { useKV } from '@/hooks/use-kv'

// ❌ Wrong: State lost on refresh
const [rooms, setRooms] = useState<Room[]>([])

// ✅ Correct: State persists to Cloudflare KV
const [rooms, setRooms] = useKV<Room[]>('rooms', [])
```

**How useKV Works**:

```typescript
function useKV<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    // 1. Try localStorage first (instant)
    const cached = localStorage.getItem(key)
    if (cached) return JSON.parse(cached)

    // 2. Return default while fetching from KV
    return defaultValue
  })

  useEffect(() => {
    // 3. Fetch from Cloudflare KV (background)
    fetchFromKV(key).then(kvValue => {
      if (kvValue) setValue(kvValue)
    })
  }, [key])

  const updateValue = (newValue: T) => {
    // 4. Optimistic update (instant UI)
    setValue(newValue)
    localStorage.setItem(key, JSON.stringify(newValue))

    // 5. Sync to KV (debounced 500ms)
    debouncedSyncToKV(key, newValue)
  }

  return [value, updateValue]
}
```

**Benefits**:

- Instant reads (localStorage cache)
- Optimistic updates (no waiting)
- Automatic persistence (debounced sync)
- Global state (KV accessible everywhere)

**Key Insight**: Separate data concerns - UI state (useState) vs persisted state (useKV).

---

### Optimistic Updates Pattern

**Problem**: Waiting for API response feels slow

**Solution**: Update UI immediately, rollback on error

```typescript
const toggleDevice = async (deviceId: string) => {
  // 1. Save current state for rollback
  const previousState = devices.find(d => d.id === deviceId)

  // 2. Optimistic update (instant)
  setDevices(prev => prev.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d)))

  try {
    // 3. Background API call
    await deviceApi.toggle(deviceId)

    // 4. Success toast
    toast.success('Device toggled')
  } catch (error) {
    // 5. Rollback on error
    setDevices(prev => prev.map(d => (d.id === deviceId ? previousState : d)))

    // 6. Error toast
    toast.error('Failed to toggle device')
  }
}
```

**Benefits**:

- Instant feedback (<100ms)
- Graceful error handling
- Network resilient

**Key Insight**: Always save previous state before optimistic updates for rollback capability.

---

## Performance Optimization

### Debouncing Network Calls

**Problem**: Rapid state changes cause API spam

**Solution**: Debounce sync operations

```typescript
import { debounce } from 'lodash-es'

const debouncedSync = useRef(
  debounce((key: string, value: any) => {
    syncToKV(key, value)
  }, 500) // Wait 500ms after last change
).current

// Usage
setRooms(newOrder)
debouncedSync('rooms', newOrder)
```

**Why 500ms?**

- Long enough to batch rapid changes
- Short enough to feel responsive
- Balances UX and network efficiency

**Key Insight**: Use debouncing for high-frequency events (scroll, drag, input), throttling for periodic updates (monitoring, polling).

---

### Framer Motion + Canvas Events

**Problem**: Framer Motion blocks canvas mouse events

**Solution**: Wrap canvas in non-animated container

```tsx
// ❌ Wrong: motion.div blocks canvas events
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  <canvas ref={canvasRef} onClick={handleClick} />
</motion.div>

// ✅ Correct: Separate animation from interaction
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  <div> {/* Non-animated wrapper */}
    <canvas ref={canvasRef} onClick={handleClick} />
  </div>
</motion.div>
```

**Why This Works**:

- Framer Motion animations don't interfere with child events
- Canvas receives all mouse/touch events directly
- Animations still work on parent container

**Key Insight**: Always separate animation containers from interactive elements (canvas, inputs).

---

## API Integration Patterns

### Multi-Protocol Device Adapters

**Problem**: Different devices use different APIs (HTTP, MQTT, Zigbee)

**Solution**: Abstract behind common DeviceAdapter interface

```typescript
interface DeviceAdapter {
  discover(): Promise<Device[]>
  getState(deviceId: string): Promise<DeviceState>
  control(deviceId: string, command: DeviceCommand): Promise<void>
}

class HueBridgeAdapter implements DeviceAdapter {
  async discover() {
    const response = await fetch(`http://${bridgeIp}/api/${username}/lights`)
    const lights = await response.json()
    return Object.entries(lights).map(([id, light]) => ({
      id: `hue-${id}`,
      name: light.name,
      type: 'light',
      protocol: 'hue-http',
    }))
  }

  async control(deviceId: string, command: DeviceCommand) {
    const lightId = deviceId.replace('hue-', '')
    await fetch(`http://${bridgeIp}/api/${username}/lights/${lightId}/state`, {
      method: 'PUT',
      body: JSON.stringify(command),
    })
  }
}

class ShellyAdapter implements DeviceAdapter {
  // Similar structure, different API endpoints
}

// Usage
const adapters = [new HueBridgeAdapter(), new ShellyAdapter()]
const allDevices = await Promise.all(adapters.map(a => a.discover()))
```

**Benefits**:

- Protocol-agnostic UI code
- Easy to add new device types
- Testable (mock adapters)

**Key Insight**: Always design for multiple protocols from the start, even if you only support one initially.

---

### Error Handling with Toast Notifications

**Problem**: Silent failures confuse users

**Solution**: Show contextual toasts for all actions

```typescript
import { toast } from 'sonner'

try {
  await deviceApi.toggle(deviceId)
  toast.success('Device toggled', {
    description: device.name,
    duration: 3000,
  })
} catch (error) {
  toast.error('Failed to toggle device', {
    description: error.message,
    action: {
      label: 'Retry',
      onClick: () => retryToggle(deviceId),
    },
  })
}
```

**Toast Guidelines**:

- **Success**: 3 seconds, minimal info
- **Error**: 5+ seconds, action button
- **Info**: 4 seconds, dismissible
- **Warning**: Persistent, requires action

**Key Insight**: Every user action should have visual feedback (toast, status update, or animation).

---

## Touch & Mobile Support

### Touch Event Handling

**Problem**: Touch events fire alongside mouse events (double handling)

**Solution**: Use preventDefault and touch-specific handlers

```typescript
const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
  e.preventDefault() // Prevent default scroll/zoom

  const touch = e.touches[0]
  const rect = e.currentTarget.getBoundingClientRect()

  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top

  updatePosition(x, y)
}

// Separate handlers prevent double-firing
<canvas
  onMouseMove={handleMouseMove}
  onTouchMove={handleTouchMove}
/>
```

**Important**:

- Always call `e.preventDefault()` in touch handlers
- Use `e.touches[0]` for single-touch gestures
- Test on real devices (desktop touch emulation is unreliable)

**Key Insight**: Touch events are NOT mouse events - handle them separately for proper mobile support.

---

### Mobile-First Responsive Design

**Problem**: Desktop-first designs break on mobile

**Solution**: Design for mobile, enhance for desktop

```tsx
// Mobile-first Tailwind classes
<div className="/* Mobile: 1 column */ /* Tablet: 2 columns */ /* Desktop: 3 columns */ /* Consistent spacing */ grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {rooms.map(room => (
    <RoomCard key={room.id} room={room} />
  ))}
</div>
```

**Breakpoints**:

- `sm:` 640px (large phones)
- `md:` 768px (tablets)
- `lg:` 1024px (desktops)
- `xl:` 1280px (large desktops)

**Key Insight**: Start with mobile layout, add complexity at larger breakpoints (easier than removing complexity).

---

## Common Pitfalls & Solutions

### Pitfall 1: Mutating State Directly

```typescript
// ❌ Wrong: Mutates array (React won't re-render)
rooms[0].name = 'New Name'
setRooms(rooms)

// ✅ Correct: Creates new array (React re-renders)
setRooms(rooms.map(r => (r.id === rooms[0].id ? { ...r, name: 'New Name' } : r)))
```

**Why**: React compares object references, not deep values.

---

### Pitfall 2: Missing Dependencies in useEffect

```typescript
// ❌ Wrong: Missing deviceId in deps (stale closure)
useEffect(() => {
  fetchDevice(deviceId)
}, []) // Empty deps

// ✅ Correct: Include all used variables
useEffect(() => {
  fetchDevice(deviceId)
}, [deviceId])
```

**Why**: Stale closures capture old variable values.

---

### Pitfall 3: Inline Functions in Props

```typescript
// ❌ Wrong: Creates new function every render (breaks memoization)
<DeviceCard device={device} onClick={() => handleClick(device.id)} />

// ✅ Correct: Use useCallback or pass stable reference
const handleClick = useCallback((id: string) => {
  // ...
}, [])

<DeviceCard device={device} onClick={handleClick} />
```

**Why**: New function = new reference = re-render.

---

### Pitfall 4: Forgetting Error Boundaries

```typescript
// ❌ Wrong: Unhandled errors crash entire app
function App() {
  return <Dashboard />
}

// ✅ Correct: Wrap in ErrorBoundary
function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Dashboard />
    </ErrorBoundary>
  )
}
```

**Why**: Unhandled errors should show fallback UI, not blank screen.

---

## Reusable Code Patterns

### Type-Safe KV Keys

```typescript
// Define all keys in one place
export const KV_KEYS = {
  DEVICES: 'devices',
  ROOMS: 'rooms',
  SCENES: 'scenes',
  ACTIVE_SCENE: 'active-scene',
  FAVORITES: 'favorites',
} as const

// Usage with type safety
const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, [])
```

**Benefits**:

- No typos (auto-complete)
- Easy refactoring (single location)
- Type-safe keys

---

### Component Wrapper Pattern

```typescript
// Wrap third-party components for consistency
function Button({ children, ...props }) {
  return (
    <ShadcnButton
      className={cn('custom-defaults', props.className)}
      {...props}
    >
      {children}
    </ShadcnButton>
  )
}

// Now all buttons have consistent styling
<Button>Click Me</Button>
```

**Benefits**:

- Consistent design system
- Easy to update styles globally
- Abstraction from third-party API changes

---

### Custom Hook Pattern

```typescript
// Encapsulate complex logic in custom hooks
function useDeviceControl(deviceId: string) {
  const [device, setDevice] = useKV<Device>(`device-${deviceId}`, null)
  const [isLoading, setIsLoading] = useState(false)

  const toggle = async () => {
    setIsLoading(true)
    try {
      await deviceApi.toggle(deviceId)
      setDevice({ ...device, enabled: !device.enabled })
    } finally {
      setIsLoading(false)
    }
  }

  return { device, isLoading, toggle }
}

// Clean component code
function DeviceCard({ deviceId }) {
  const { device, isLoading, toggle } = useDeviceControl(deviceId)

  return <Card onClick={toggle} />
}
```

**Benefits**:

- Reusable logic
- Testable in isolation
- Clean component code

---

## Summary

### Top 10 Takeaways

1. **Sensor Tuning**: 8px mouse, 200ms touch for optimal drag & drop
2. **onChange/onValueCommit**: Separate visual feedback from network sync
3. **useKV Pattern**: Persistent state with optimistic updates
4. **DragOverlay Portal**: Smooth drag previews without layout shift
5. **HSV Color Space**: Better for UI than RGB
6. **Canvas Positioning**: Use getBoundingClientRect() for pixel-perfect coordinates
7. **Touch Events**: preventDefault + separate handlers from mouse
8. **Error Boundaries**: Always wrap app in ErrorBoundary
9. **Immutable Updates**: Never mutate state, always create new objects
10. **Mobile-First**: Design for mobile, enhance for desktop

### Next Phase Readiness

Phase 2 patterns are battle-tested and ready for Phase 3:

- State management (useKV) scales to automation rules
- Device control patterns (adapters) support all trigger types
- UI patterns (drag & drop) extend to automation flows
- Error handling (toasts, boundaries) catches automation failures

**You're ready to build the automation engine!** 🚀

---

**Document Version**: 1.0
**Last Updated**: October 11, 2025
**Next Review**: After Phase 3 completion
