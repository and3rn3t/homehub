# Icon Usage Guide - Lucide React

**Last Updated**: October 11, 2025
**Icon System**: Lucide React v0.484.0
**Location**: `src/lib/icons.ts`

---

## Quick Start

### Basic Import and Usage

```typescript
// ✅ CORRECT - Import from centralized library
import { LightbulbIcon, PowerIcon, ThermometerIcon } from '@/lib/icons'

function MyComponent() {
  return (
    <div>
      <LightbulbIcon className="h-5 w-5 text-primary" />
      <PowerIcon className="h-6 w-6 text-destructive" />
      <ThermometerIcon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
```

```typescript
// ❌ WRONG - Never import directly from lucide-react
import { Lightbulb } from 'lucide-react'

<Lightbulb size={20} />  // Wrong API, wrong naming convention
```

---

## Icon Naming Convention

All icons are exported with an **Icon suffix** to prevent naming conflicts:

| Lucide Base Name | HomeHub Export      | Usage            |
| ---------------- | ------------------- | ---------------- |
| `Lightbulb`      | `LightbulbIcon`     | Device icons     |
| `Power`          | `PowerIcon`         | Control icons    |
| `AlertTriangle`  | `AlertTriangleIcon` | Status icons     |
| `ChevronRight`   | `ChevronRightIcon`  | Navigation icons |

### Why Icon Suffix?

1. **Prevents conflicts** with HTML elements (e.g., `Home` vs. `HomeIcon`)
2. **Clear intent** - Immediately recognizable as icon component
3. **Consistency** - All icons follow same pattern
4. **TypeScript friendly** - Better autocomplete and type safety

---

## Sizing Icons

### iOS-Standard Sizes

Use Tailwind utility classes for consistent sizing:

```typescript
<LightbulbIcon className="h-3 w-3" />  {/* 12px - Tiny (badges, tags) */}
<LightbulbIcon className="h-4 w-4" />  {/* 16px - Small (inline, buttons) */}
<LightbulbIcon className="h-5 w-5" />  {/* 20px - Default (cards, lists) */}
<LightbulbIcon className="h-6 w-6" />  {/* 24px - Medium (headers) */}
<LightbulbIcon className="h-8 w-8" />  {/* 32px - Large (empty states) */}
<LightbulbIcon className="h-12 w-12" /> {/* 48px - XL (hero sections) */}
```

### Size Presets

Use the `ICON_SIZES` constant for consistency:

```typescript
import { ICON_SIZES, LightbulbIcon } from '@/lib/icons'

<LightbulbIcon className={ICON_SIZES.xs} />  {/* h-3 w-3 */}
<LightbulbIcon className={ICON_SIZES.sm} />  {/* h-4 w-4 */}
<LightbulbIcon className={ICON_SIZES.md} />  {/* h-5 w-5 */}
<LightbulbIcon className={ICON_SIZES.lg} />  {/* h-6 w-6 */}
<LightbulbIcon className={ICON_SIZES.xl} />  {/* h-8 w-8 */}
<LightbulbIcon className={ICON_SIZES['2xl']} /> {/* h-10 w-10 */}
<LightbulbIcon className={ICON_SIZES['3xl']} /> {/* h-12 w-12 */}
```

---

## Coloring Icons

### Theme Colors

```typescript
// Primary action
<PowerIcon className="h-5 w-5 text-primary" />

// Destructive action
<TrashIcon className="h-4 w-4 text-destructive" />

// Muted/secondary
<ClockIcon className="h-4 w-4 text-muted-foreground" />

// Success
<CheckCircleIcon className="h-5 w-5 text-green-500" />

// Warning
<AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
```

### State-Based Colors

```typescript
const iconColor = device.enabled
  ? 'text-primary'
  : 'text-muted-foreground'

<LightbulbIcon className={cn('h-5 w-5', iconColor)} />
```

### Using cn() Utility

```typescript
import { cn } from '@/lib/utils'

<LightbulbIcon
  className={cn(
    'h-5 w-5',
    device.enabled && 'text-primary',
    !device.enabled && 'text-muted-foreground opacity-50',
    'transition-colors duration-200'
  )}
/>
```

---

## Dynamic Icon Selection

### Device Icon Mappings

```typescript
import { DEVICE_ICONS } from '@/lib/icons'

function DeviceCard({ device }: { device: Device }) {
  const IconComponent = DEVICE_ICONS[device.type] || DEVICE_ICONS.sensor

  return (
    <div>
      <IconComponent className="h-6 w-6" />
      <span>{device.name}</span>
    </div>
  )
}
```

**Available Mappings:**

- `DEVICE_ICONS` - Device type icons (light, thermostat, security, etc.)
- `ROOM_ICONS` - Room icons (living-room, bedroom, kitchen, etc.)
- `AUTOMATION_ICONS` - Automation trigger icons (schedule, geofence, condition)
- `SCENE_ICONS` - Scene icons (sun, moon, movie, etc.)

### Custom Mappings

```typescript
import { LightbulbIcon, ThermometerIcon, ShieldIcon } from '@/lib/icons'

const statusIcons = {
  online: CheckCircleIcon,
  offline: XCircleIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
} as const

function StatusBadge({ status }: { status: keyof typeof statusIcons }) {
  const IconComponent = statusIcons[status]
  return <IconComponent className="h-4 w-4" />
}
```

---

## Animations with Framer Motion

### Basic Animation

```typescript
import { motion } from 'framer-motion'
import { PowerIcon } from '@/lib/icons'

<motion.div
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
>
  <PowerIcon className="h-6 w-6" />
</motion.div>
```

### iOS Spring Physics

```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  }}
>
  <LightbulbIcon className="h-8 w-8 text-primary" />
</motion.div>
```

### Rotation Animation

```typescript
<motion.div
  animate={{ rotate: device.enabled ? 0 : 180 }}
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
>
  <PowerIcon className="h-5 w-5" />
</motion.div>
```

---

## Type-Safe Icon Props

### Creating Icon Props Interface

```typescript
import type { LucideIcon } from '@/lib/icons'

interface CardProps {
  icon: LucideIcon
  title: string
  description: string
}

function Card({ icon: Icon, title, description }: CardProps) {
  return (
    <div>
      <Icon className="h-6 w-6 mb-2" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
```

### Using in Component Props

```typescript
import { LightbulbIcon } from '@/lib/icons'

<Card
  icon={LightbulbIcon}
  title="Living Room Light"
  description="Main overhead light"
/>
```

---

## Common Patterns

### Button with Icon

```typescript
import { PlusIcon } from '@/lib/icons'
import { Button } from '@/components/ui/button'

<Button>
  <PlusIcon className="h-4 w-4 mr-2" />
  Add Device
</Button>
```

### Icon with Badge

```typescript
<div className="relative">
  <BellIcon className="h-6 w-6" />
  {hasNotifications && (
    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
  )}
</div>
```

### Icon List Item

```typescript
<div className="flex items-center gap-3">
  <div className="bg-primary/10 p-2 rounded-lg">
    <ThermometerIcon className="h-5 w-5 text-primary" />
  </div>
  <div>
    <p className="font-medium">Temperature Sensor</p>
    <p className="text-sm text-muted-foreground">72°F</p>
  </div>
</div>
```

### Empty State

```typescript
<div className="text-center p-8">
  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
    <PlusIcon className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-muted-foreground">No devices found</p>
</div>
```

---

## Migration from Phosphor Icons

If you're updating old code that used Phosphor Icons:

### Before (Phosphor)

```typescript
import { Lightbulb, Warning, Plus } from '@phosphor-icons/react'

<Lightbulb size={20} weight="regular" />
<Warning size={16} weight="bold" />
<Plus size={24} />
```

### After (Lucide)

```typescript
import { LightbulbIcon, AlertTriangleIcon, PlusIcon } from '@/lib/icons'

<LightbulbIcon className="h-5 w-5" />
<AlertTriangleIcon className="h-4 w-4" />
<PlusIcon className="h-6 w-6" />
```

### Key Changes

1. **Import path**: `@phosphor-icons/react` → `@/lib/icons`
2. **Naming**: Add `Icon` suffix to all icon names
3. **Size prop**: `size={20}` → `className="h-5 w-5"`
4. **Weight prop**: Removed (not available in Lucide)
5. **Icon mapping**: Some icons have different names (see migration doc)

---

## Icon Search

### Finding the Right Icon

1. **Browse the Library**: Check `src/lib/icons.ts` for all 200+ available icons
2. **Lucide Docs**: <https://lucide.dev/icons/> (remember to add Icon suffix)
3. **Type Autocomplete**: Import from `@/lib/icons` and use IDE autocomplete

### Common Icon Mappings

| Use Case    | Icon              | Import                                            |
| ----------- | ----------------- | ------------------------------------------------- |
| Lights      | LightbulbIcon     | `import { LightbulbIcon } from '@/lib/icons'`     |
| Power       | PowerIcon         | `import { PowerIcon } from '@/lib/icons'`         |
| Temperature | ThermometerIcon   | `import { ThermometerIcon } from '@/lib/icons'`   |
| Security    | ShieldIcon        | `import { ShieldIcon } from '@/lib/icons'`        |
| Camera      | CameraIcon        | `import { CameraIcon } from '@/lib/icons'`        |
| Lock        | LockIcon          | `import { LockIcon } from '@/lib/icons'`          |
| WiFi        | WifiIcon          | `import { WifiIcon } from '@/lib/icons'`          |
| WiFi Off    | WifiOffIcon       | `import { WifiOffIcon } from '@/lib/icons'`       |
| Add         | PlusIcon          | `import { PlusIcon } from '@/lib/icons'`          |
| Remove      | TrashIcon         | `import { TrashIcon } from '@/lib/icons'`         |
| Edit        | EditIcon          | `import { EditIcon } from '@/lib/icons'`          |
| Save        | SaveIcon          | `import { SaveIcon } from '@/lib/icons'`          |
| Close       | XIcon             | `import { XIcon } from '@/lib/icons'`             |
| Check       | CheckIcon         | `import { CheckIcon } from '@/lib/icons'`         |
| Warning     | AlertTriangleIcon | `import { AlertTriangleIcon } from '@/lib/icons'` |
| Info        | InfoIcon          | `import { InfoIcon } from '@/lib/icons'`          |
| Error       | AlertCircleIcon   | `import { AlertCircleIcon } from '@/lib/icons'`   |

---

## Performance Tips

### Tree-Shaking

Lucide React icons are tree-shakeable - only imported icons are included in bundle:

```typescript
// ✅ Good - Only LightbulbIcon included in bundle
import { LightbulbIcon } from '@/lib/icons'

// ❌ Bad - Entire Lucide library included
import * as Icons from 'lucide-react'
```

### Lazy Loading

For rarely-used icons, consider lazy loading:

```typescript
const RareIcon = lazy(() => import('@/lib/icons').then(mod => ({
  default: mod.RareIconName
})))

<Suspense fallback={<div className="h-5 w-5" />}>
  <RareIcon />
</Suspense>
```

### Reusing Icon Components

```typescript
// ✅ Good - Define once, reuse many times
const DeviceIcon = DEVICE_ICONS[device.type]

return (
  <>
    <DeviceIcon className="h-5 w-5" />
    <DeviceIcon className="h-6 w-6" />
    <DeviceIcon className="h-4 w-4" />
  </>
)
```

---

## Accessibility

### Add Descriptive Labels

```typescript
<button aria-label="Delete device">
  <TrashIcon className="h-4 w-4" />
</button>
```

### Use with Visible Text

```typescript
<button>
  <TrashIcon className="h-4 w-4" aria-hidden="true" />
  <span>Delete</span>
</button>
```

### Screen Reader Support

```typescript
<div role="img" aria-label="Temperature sensor">
  <ThermometerIcon className="h-6 w-6" />
</div>
```

---

## Troubleshooting

### Icon Not Found

**Problem**: `Cannot find name 'LightbulbIcon'`

**Solution**: Check the icon name in `src/lib/icons.ts` - it may have a different export name

### Size Not Applied

**Problem**: Icon doesn't resize

**Solution**: Ensure you're using `className` not `size` prop:

```typescript
// ❌ Wrong
<LightbulbIcon size={20} />

// ✅ Correct
<LightbulbIcon className="h-5 w-5" />
```

### Icon Not Centered

**Solution**: Use flex utilities:

```typescript
<div className="flex items-center justify-center">
  <LightbulbIcon className="h-5 w-5" />
</div>
```

---

## Best Practices

1. ✅ **Always import from `@/lib/icons`**
2. ✅ **Use Icon suffix naming convention**
3. ✅ **Use Tailwind classes for sizing (h-_ w-_)**
4. ✅ **Use theme colors (text-primary, text-muted-foreground)**
5. ✅ **Use cn() utility for conditional classes**
6. ✅ **Use type-safe icon props (LucideIcon type)**
7. ✅ **Use mapping objects for dynamic icons**
8. ✅ **Add aria-labels for accessibility**
9. ❌ **Never import directly from lucide-react**
10. ❌ **Never use size prop (Phosphor pattern)**

---

## Resources

- **Icon Library**: `src/lib/icons.ts` (source of truth)
- **Lucide Docs**: <https://lucide.dev/>
- **Migration Guide**: `docs/development/LUCIDE_MIGRATION_COMPLETE.md`
- **Best Practices**: `docs/guides/BEST_PRACTICES.md`
- **Type Definitions**: `node_modules/lucide-react/dist/lucide-react.d.ts`

---

**Last Updated**: October 11, 2025
**Maintainer**: HomeHub Development Team
**Questions**: Check copilot-instructions.md for integration patterns
