# HomeHub Component Patterns Catalog

**Purpose**: Reusable component patterns, best practices, and anti-patterns for HomeHub development.

**Last Updated**: October 16, 2025

---

## Table of Contents

- [Component Structure](#component-structure)
- [State Management Patterns](#state-management-patterns)
- [Event Handler Patterns](#event-handler-patterns)
- [Async Operation Patterns](#async-operation-patterns)
- [Animation Patterns](#animation-patterns)
- [Common Anti-Patterns](#common-anti-patterns)
- [Component Examples](#component-examples)

---

## Component Structure

### Standard Feature Component Template

```tsx
// 1. Imports (organized by category)
import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Device, Room } from '@/types'
import { useKV } from '@/hooks/use-kv'
import { MOCK_DEVICES, KV_KEYS } from '@/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LightbulbIcon, HomeIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// 2. Helper Components (extract for reusability)
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'error'
}

function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <motion.div
      className={cn('h-2 w-2 rounded-full', colors[status])}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    />
  )
}

// 3. Helper Functions (complex logic extraction)
async function controlDevice(device: Device, enabled: boolean): Promise<void> {
  // Complex device control logic
  switch (device.protocol) {
    case 'hue':
      // Hue-specific logic
      break
    case 'http':
      // HTTP-specific logic
      break
    default:
      throw new Error(`Unsupported protocol: ${device.protocol}`)
  }
}

// 4. Main Component
export function FeatureComponent() {
  // State
  const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Event Handlers (useCallback for optimization)
  const handleToggleDevice = useCallback(
    async (id: string) => {
      const device = devices.find(d => d.id === id)
      if (!device) {
        toast.error('Device not found')
        return
      }

      setIsLoading(true)
      try {
        await controlDevice(device, !device.enabled)
        setDevices(prev => prev.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d)))
        toast.success(`${device.name} ${device.enabled ? 'off' : 'on'}`)
      } catch (error) {
        toast.error(`Failed to control ${device.name}`)
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    },
    [devices, setDevices]
  )

  // Effects
  useEffect(() => {
    // Initialization logic
  }, [])

  // Render
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Feature Component</h1>

      <AnimatePresence mode="wait">
        {devices.map(device => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LightbulbIcon className="h-5 w-5" />
                  {device.name}
                  <StatusBadge status={device.status} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleToggleDevice(device.id)}
                  disabled={isLoading}
                  variant={device.enabled ? 'default' : 'outline'}
                >
                  {device.enabled ? 'Turn Off' : 'Turn On'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

---

## State Management Patterns

### Pattern 1: useKV for Persistent State

✅ **CORRECT**: Use useKV for all data that should persist across page refreshes.

```tsx
import { useKV } from '@/hooks/use-kv'
import { MOCK_DEVICES, KV_KEYS } from '@/constants'

// Always use constants for KV keys and default values
const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)
```

❌ **WRONG**: Using useState for persistent data

```tsx
// BAD - Data lost on refresh!
const [devices, setDevices] = useState<Device[]>([])

// BAD - Empty array wipes localStorage!
const [devices, setDevices] = useKV<Device[]>('devices', [])
```

### Pattern 2: Optimistic Updates

```tsx
const toggleDevice = useCallback(
  async (id: string) => {
    // 1. Optimistic UI update (instant feedback)
    setDevices(prev => prev.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d)))

    // 2. Perform actual operation
    try {
      await deviceAdapter.toggle(id)
    } catch (error) {
      // 3. Rollback on failure
      setDevices(prev => prev.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d)))
      toast.error('Failed to toggle device')
    }
  },
  [setDevices]
)
```

### Pattern 3: Derived State

✅ **CORRECT**: Compute derived values inline or with useMemo

```tsx
// Simple derived state - compute inline
const onlineDevices = devices.filter(d => d.status === 'online')

// Complex derived state - use useMemo
const deviceStats = useMemo(() => {
  return {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    enabled: devices.filter(d => d.enabled).length,
  }
}, [devices])
```

❌ **WRONG**: Storing derived state

```tsx
// BAD - Can get out of sync
const [onlineDevices, setOnlineDevices] = useState<Device[]>([])
useEffect(() => {
  setOnlineDevices(devices.filter(d => d.status === 'online'))
}, [devices])
```

---

## Event Handler Patterns

### Pattern 1: useCallback for Event Handlers

```tsx
// Memoize event handlers to prevent unnecessary re-renders
const handleClick = useCallback(
  (id: string) => {
    // Handler logic
    setData(prev => prev.map(item => (item.id === id ? { ...item, clicked: true } : item)))
  },
  [setData] // Only dependencies, not derived values
)
```

### Pattern 2: Async Event Handlers with Loading States

```tsx
const [isLoading, setIsLoading] = useState(false)

const handleAsyncAction = useCallback(async (id: string) => {
  setIsLoading(true)
  try {
    await performAsyncOperation(id)
    toast.success('Operation completed')
  } catch (error) {
    toast.error('Operation failed')
    console.error(error)
  } finally {
    setIsLoading(false)
  }
}, [])
```

### Pattern 3: Debounced Handlers

```tsx
import { useDebouncedCallback } from 'use-debounce'

const handleSearch = useDebouncedCallback((query: string) => {
  // Expensive search operation
  setResults(performSearch(query))
}, 300)
```

---

## Async Operation Patterns

### Pattern 1: Try-Catch with Toast Notifications

```tsx
const performAction = async () => {
  try {
    const result = await apiCall()
    toast.success('Action completed successfully')
    return result
  } catch (error) {
    toast.error(`Action failed: ${error.message}`)
    throw error // Re-throw if caller needs to handle
  }
}
```

### Pattern 2: Loading and Error States

```tsx
const [data, setData] = useState<Data | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)

const loadData = async () => {
  setIsLoading(true)
  setError(null)

  try {
    const result = await fetchData()
    setData(result)
  } catch (err) {
    setError(err as Error)
    toast.error('Failed to load data')
  } finally {
    setIsLoading(false)
  }
}

// Render based on state
if (isLoading) return <Spinner />
if (error) return <ErrorMessage error={error} />
if (!data) return null
return <DataDisplay data={data} />
```

### Pattern 3: Parallel Operations with Promise.allSettled

```tsx
const performBulkOperation = async (ids: string[]) => {
  const promises = ids.map(id => performOperation(id))
  const results = await Promise.allSettled(promises)

  const successes = results.filter(r => r.status === 'fulfilled').length
  const failures = results.filter(r => r.status === 'rejected').length

  toast.success(`Completed: ${successes} succeeded, ${failures} failed`)
}
```

---

## Animation Patterns

### Pattern 1: Spring Animations with Framer Motion

```tsx
import { motion } from 'framer-motion'

// Standard spring animation config
;<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  {children}
</motion.div>
```

### Pattern 2: List Animations with AnimatePresence

```tsx
import { AnimatePresence, motion } from 'framer-motion'

;<AnimatePresence mode="wait">
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }} // Stagger effect
    >
      <ItemCard item={item} />
    </motion.div>
  ))}
</AnimatePresence>
```

### Pattern 3: Gesture Animations (Tap, Hover)

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click Me
</motion.button>
```

---

## Common Anti-Patterns

### ❌ Anti-Pattern 1: Empty Array Defaults

```tsx
// BAD - Clears localStorage on load!
const [devices, setDevices] = useKV<Device[]>('devices', [])

// GOOD - Preserves data or uses mock data
const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)
```

### ❌ Anti-Pattern 2: Inline Complex Logic

```tsx
// BAD - Component too complex (Cognitive Complexity: 15+)
export function Dashboard() {
  const [devices, setDevices] = useKV(...)

  return (
    <div>
      {devices.map(device => {
        // 50+ lines of inline logic
        if (device.protocol === 'hue') {
          // Complex Hue logic
        } else if (device.protocol === 'http') {
          // Complex HTTP logic
        }
        // ... more inline logic
      })}
    </div>
  )
}

// GOOD - Extract helper functions and components
function DeviceCard({ device }: { device: Device }) {
  // Extracted component
}

async function controlDevice(device: Device) {
  // Extracted logic
}

export function Dashboard() {
  const [devices, setDevices] = useKV(...)
  const handleControl = useCallback(async (id: string) => {
    const device = devices.find(d => d.id === id)
    if (device) await controlDevice(device)
  }, [devices])

  return (
    <div>
      {devices.map(device => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  )
}
```

### ❌ Anti-Pattern 3: Prop Drilling

```tsx
// BAD - Passing props through multiple levels
<Parent>
  <Child1 data={data} onUpdate={onUpdate}>
    <Child2 data={data} onUpdate={onUpdate}>
      <Child3 data={data} onUpdate={onUpdate} />
    </Child2>
  </Child1>
</Parent>

// GOOD - Use context or lift state to appropriate level
const DataContext = createContext<DataContextType>()

<DataContext.Provider value={{ data, onUpdate }}>
  <Parent>
    <Child1>
      <Child2>
        <Child3 />
      </Child2>
    </Child1>
  </Parent>
</DataContext.Provider>
```

### ❌ Anti-Pattern 4: Missing Error Boundaries

```tsx
// BAD - Errors crash entire app
export function App() {
  return <FeatureComponent />
}

// GOOD - Wrap with error boundary
export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <FeatureComponent />
    </ErrorBoundary>
  )
}
```

---

## Component Examples

### Example 1: Device Control Card

```tsx
interface DeviceControlCardProps {
  device: Device
  onToggle: (id: string) => Promise<void>
  isLoading?: boolean
}

export function DeviceControlCard({ device, onToggle, isLoading = false }: DeviceControlCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className={cn('relative overflow-hidden', device.enabled && 'border-primary')}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LightbulbIcon
                className={cn('h-5 w-5', device.enabled ? 'text-primary' : 'text-muted-foreground')}
              />
              <span>{device.name}</span>
            </div>
            <StatusBadge status={device.status} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              {device.room} • {device.value}%
            </div>
            <Button
              onClick={() => onToggle(device.id)}
              disabled={isLoading || device.status === 'offline'}
              size="sm"
              variant={device.enabled ? 'default' : 'outline'}
            >
              {device.enabled ? 'Turn Off' : 'Turn On'}
            </Button>
          </div>
        </CardContent>

        {/* iOS-style animated background */}
        {device.enabled && (
          <motion.div
            className="bg-primary/5 absolute inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </Card>
    </motion.div>
  )
}
```

### Example 2: Room Statistics Dashboard

```tsx
interface RoomStatsProps {
  room: Room
  devices: Device[]
}

export function RoomStats({ room, devices }: RoomStatsProps) {
  const stats = useMemo(() => {
    const roomDevices = devices.filter(d => room.deviceIds.includes(d.id))
    return {
      total: roomDevices.length,
      online: roomDevices.filter(d => d.status === 'online').length,
      enabled: roomDevices.filter(d => d.enabled).length,
      avgBattery:
        roomDevices
          .filter(d => d.batteryLevel !== undefined)
          .reduce((sum, d) => sum + (d.batteryLevel || 0), 0) /
          roomDevices.filter(d => d.batteryLevel !== undefined).length || null,
    }
  }, [room, devices])

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Total Devices" value={stats.total} />
      <StatCard label="Online" value={stats.online} color="text-green-600" />
      <StatCard label="Enabled" value={stats.enabled} color="text-primary" />
      {stats.avgBattery && (
        <StatCard label="Avg Battery" value={`${Math.round(stats.avgBattery)}%`} />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color = 'text-foreground',
}: {
  label: string
  value: string | number
  color?: string
}) {
  return (
    <motion.div
      className="bg-card rounded-lg p-4"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className={cn('text-2xl font-bold', color)}>{value}</div>
    </motion.div>
  )
}
```

---

## Best Practices Summary

1. **Extract Complex Logic**: Keep components <10 cognitive complexity
2. **Use TypeScript**: Explicit types for all props, state, and returns
3. **Memoize Callbacks**: Use `useCallback` for event handlers
4. **Optimize Renders**: Use `useMemo` for expensive computations
5. **Handle Errors**: Try-catch with toast notifications
6. **Animate Transitions**: Framer Motion for all state changes
7. **Test Components**: Write tests for critical user flows
8. **Document Props**: JSDoc comments for all component interfaces

---

**Note**: For mobile-specific patterns (safe-area, gestures, PWA), see `docs/development/MOBILE_OPTIMIZATION_COMPLETE.md`.
