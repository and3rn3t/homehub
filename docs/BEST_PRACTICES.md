# HomeHub - Best Practices Guide

## Code Organization

### ✅ DO: Use Centralized Types

```tsx
// Good
import type { Device, Room, Scene } from '@/types'

// Bad - Don't define inline
interface Device {
  id: string
  // ...
}
```

### ✅ DO: Use KV Key Constants

```tsx
// Good
import { KV_KEYS } from '@/constants'
const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, [])

// Bad - Hardcoded strings
const [devices, setDevices] = useKV("devices", [])
```

### ✅ DO: Import Mock Data

```tsx
// Good
import { MOCK_DEVICES } from '@/constants'
const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)

// Bad - Inline data
const [devices, setDevices] = useKV("devices", [
  { id: "1", name: "Light", type: "light", ... }
])
```

## Component Structure

### ✅ DO: Follow This Pattern

```tsx
// 1. React imports
import { useState, useEffect } from 'react'

// 2. Spark hooks
import { useKV } from '@github/spark/hooks'

// 3. Type imports
import type { Device, Room } from '@/types'

// 4. Constants
import { KV_KEYS, MOCK_DEVICES, DEVICE_ICONS } from '@/constants'

// 5. UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// 6. Icons
import { Lightbulb } from '@phosphor-icons/react'

// 7. Utilities
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// 8. Component definition
export function MyFeature() {
  // Hooks first
  const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  
  // Helper functions
  const toggleDevice = (deviceId: string) => {
    setDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, enabled: !d.enabled } : d
    ))
    toast.success('Device toggled')
  }
  
  // JSX
  return (
    <div className="p-6 space-y-4">
      {devices.map(device => (
        <Card key={device.id}>
          {/* ... */}
        </Card>
      ))}
    </div>
  )
}
```

## State Management

### ✅ DO: Use useKV for Persistent Data

```tsx
// Good - Data survives refresh
const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, [])

// Bad - Data lost on refresh
const [devices, setDevices] = useState<Device[]>([])
```

### ✅ DO: Use useState for UI State

```tsx
// Good - Temporary UI state
const [isDialogOpen, setIsDialogOpen] = useState(false)
const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
```

### ✅ DO: Type All KV Stores

```tsx
// Good - Fully typed
const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, [])
const [activeScene, setActiveScene] = useKV<string | null>(KV_KEYS.ACTIVE_SCENE, null)

// Bad - No types
const [devices, setDevices] = useKV("devices", [])
```

## Naming Conventions

### Files

- **Components**: PascalCase (`Dashboard.tsx`, `DeviceCard.tsx`)
- **Utils**: camelCase (`formatDate.ts`, `validateDevice.ts`)
- **Types**: kebab-case with `.types.ts` suffix (`device.types.ts`)
- **Constants**: kebab-case (`kv-keys.ts`, `mock-data.ts`)
- **Styles**: kebab-case (main.css`,`theme.css`)

### Variables & Functions

```tsx
// Good naming
const [devices, setDevices] = useKV(...)
const toggleDevice = (id: string) => { }
const isDeviceOnline = device.status === 'online'

// Bad naming
const [d, setD] = useKV(...)
const toggle = (x: string) => { }
const check = device.status === 'online'
```

## TypeScript

### ✅ DO: Use Type Imports

```tsx
// Good - Explicit type import
import type { Device, Room } from '@/types'

// Also good - Named import with type keyword
import { type Device, type Room } from '@/types'
```

### ✅ DO: Leverage TypeScript Features

```tsx
// Good - Type inference
const devices = MOCK_DEVICES // TypeScript knows this is Device[]

// Good - Type guards
if (device.type === 'light') {
  // TypeScript knows this is a light device
}

// Good - Optional chaining
const value = device.value ?? 0
```

## Styling

### ✅ DO: Use Tailwind Theme Colors

```tsx
// Good
<div className="bg-primary text-primary-foreground">

// Bad - Hardcoded colors
<div className="bg-blue-500 text-white">
```

### ✅ DO: Use cn() for Conditional Classes

```tsx
import { cn } from '@/lib/utils'

// Good
<div className={cn(
  "base-class",
  isActive && "active-class",
  isPending && "pending-class"
)}>

// Bad - String concatenation
<div className={`base-class ${isActive ? 'active-class' : ''}`}>
```

## Icons

### ✅ DO: Import from Phosphor Icons

```tsx
// Good
import { Lightbulb, Thermometer } from '@phosphor-icons/react'

<Lightbulb size={24} weight="regular" />

// Bad - Other icon libraries
import { FaLightbulb } from 'react-icons/fa'
```

### ✅ DO: Use Icon Mappings

```tsx
// Good
import { DEVICE_ICONS } from '@/constants'
const Icon = DEVICE_ICONS[device.type]
<Icon size={24} weight="regular" />

// Bad - Inline mapping
const getIcon = (type) => {
  if (type === 'light') return Lightbulb
  // ...
}
```

## Animations

### ✅ DO: Use Framer Motion for Interactions

```tsx
import { motion } from 'framer-motion'

// Good - Spring physics for iOS feel
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
  {content}
</motion.div>
```

## Error Handling

### ✅ DO: Provide User Feedback

```tsx
import { toast } from 'sonner'

// Good - User knows what happened
const toggleDevice = (id: string) => {
  try {
    // ... toggle logic
    toast.success('Device turned on')
  } catch (error) {
    toast.error('Failed to toggle device')
  }
}
```

## Comments

### ✅ DO: Write Self-Documenting Code

```tsx
// Good - Clear names, no comment needed
const isDeviceOffline = device.status === 'offline'

// Bad - Comment explains unclear code
// Check if device is not online
const check = device.status === 'offline'
```

### ✅ DO: Use JSDoc for Complex Logic

```tsx
/**
 * Calculates energy cost based on consumption and rate.
 * 
 * @param consumption - Energy usage in kWh
 * @param rate - Cost per kWh in dollars
 * @returns Total cost in dollars
 */
const calculateCost = (consumption: number, rate: number): number => {
  return consumption * rate
}
```

## Performance

### ✅ DO: Optimize Re-renders

```tsx
// Good - Stable reference
const handleToggle = useCallback((id: string) => {
  setDevices(prev => prev.map(d => 
    d.id === id ? { ...d, enabled: !d.enabled } : d
  ))
}, [setDevices])

// Good - Memoize expensive computations
const sortedDevices = useMemo(() => 
  devices.sort((a, b) => a.name.localeCompare(b.name)),
  [devices]
)
```

## Accessibility

### ✅ DO: Use Semantic HTML

```tsx
// Good
<button onClick={handleClick}>Toggle</button>

// Bad
<div onClick={handleClick}>Toggle</div>
```

### ✅ DO: Provide Labels

```tsx
// Good
<button aria-label="Toggle living room light">
  <Lightbulb />
</button>
```

## Testing (Future)

### ✅ DO: Write Testable Code

```tsx
// Good - Pure function, easy to test
export const calculateEnergyCoststest(
  consumption: number,
  rate: number
): number => consumption * rate

// Good - Separated logic from UI
export const useDeviceLogic = () => {
  const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, [])
  const toggleDevice = (id: string) => { /* ... */ }
  return { devices, toggleDevice }
}
```

## Git Commits

### ✅ DO: Write Descriptive Commits

```bash
# Good
git commit -m "feat: add energy monitoring dashboard"
git commit -m "fix: device toggle not persisting state"
git commit -m "refactor: centralize TypeScript types"

# Bad
git commit -m "updates"
git commit -m "fix bug"
git commit -m "changes"
```

## Documentation

### ✅ DO: Keep Documentation Updated

- Update `.github/copilot-instructions.md` when adding patterns
- Update `REFACTOR_PLAN.md` when completing milestones
- Update `README.md` with setup instructions
- Add JSDoc comments to complex functions

## Summary

Following these best practices ensures:

- ✅ **Consistency** across the codebase
- ✅ **Maintainability** for future changes
- ✅ **Type Safety** with TypeScript
- ✅ **Performance** with React best practices
- ✅ **Accessibility** for all users
- ✅ **Scalability** as the project grows

Start with the "DO" patterns and gradually refactor existing code to match!
