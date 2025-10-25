# Import Ordering Conventions

**Purpose**: Standard import structure and organization for HomeHub TypeScript/React files.

**Last Updated**: October 16, 2025

---

## Standard Import Order

All imports should follow this order (with blank lines between sections):

```typescript
// 1. React and external libraries
import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 2. Type imports (always use `type` keyword)
import type { Device, Room, Scene } from '@/types'

// 3. Internal hooks
import { useKV } from '@/hooks/use-kv'
import { useDeviceControl } from '@/hooks/use-device-control'

// 4. Constants and configuration
import { MOCK_DEVICES, KV_KEYS } from '@/constants'

// 5. UI components (shadcn/ui)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'

// 6. Feature components (if importing from other features)
import { DeviceCard } from '@/components/DeviceCard'

// 7. Icons (Lucide React)
import { LightbulbIcon, HomeIcon, SettingsIcon } from '@/lib/icons'

// 8. Services and adapters
import { HueBridgeAdapter } from '@/services/devices/HueBridgeAdapter'
import { DiscoveryManager } from '@/services/discovery/DiscoveryManager'

// 9. Utilities and helpers
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format-date'

// 10. External utilities (toast, etc.)
import { toast } from 'sonner'
```

---

## Detailed Rules

### 1. React Imports (First)

```typescript
// ✅ CORRECT: React first, destructured
import { useState, useCallback, useEffect, useMemo } from 'react'

// ❌ WRONG: Multiple import statements
import { useState } from 'react'
import { useCallback } from 'react'

// ❌ WRONG: Not first
import { Button } from '@/components/ui/button'
import { useState } from 'react'
```

### 2. External Libraries

```typescript
// ✅ CORRECT: Group by library
import { motion, AnimatePresence } from 'framer-motion'
import { useDebouncedCallback } from 'use-debounce'

// ❌ WRONG: Mixed with internal imports
import { motion } from 'framer-motion'
import { useKV } from '@/hooks/use-kv'
import { AnimatePresence } from 'framer-motion'
```

### 3. Type Imports (Always use `type` keyword)

```typescript
// ✅ CORRECT: Use 'type' keyword, group related types
import type { Device, DeviceType, DeviceStatus } from '@/types'
import type { Room } from '@/types/room.types'
import type { Scene } from '@/types/scene.types'

// ❌ WRONG: Not using 'type' keyword
import { Device, Room } from '@/types'

// ❌ WRONG: Mixing types and values
import { Device, MOCK_DEVICES } from '@/types'
```

### 4. Internal Hooks

```typescript
// ✅ CORRECT: All hooks together
import { useKV } from '@/hooks/use-kv'
import { useDeviceControl } from '@/hooks/use-device-control'
import { useHaptics } from '@/hooks/use-haptics'

// ❌ WRONG: Mixed with other imports
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'
import { useDeviceControl } from '@/hooks/use-device-control'
```

### 5. Constants

```typescript
// ✅ CORRECT: Group constants
import { MOCK_DEVICES, MOCK_ROOMS, MOCK_SCENES } from '@/constants'
import { KV_KEYS } from '@/constants/kv-keys'

// ❌ WRONG: Separate statements for same module
import { MOCK_DEVICES } from '@/constants'
import { MOCK_ROOMS } from '@/constants'
```

### 6. UI Components

```typescript
// ✅ CORRECT: Group shadcn/ui components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'

// ❌ WRONG: One per line unnecessarily
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CardContent } from '@/components/ui/card'
import { CardHeader } from '@/components/ui/card'
```

### 7. Icons

```typescript
// ✅ CORRECT: Group icons from centralized library
import { LightbulbIcon, PowerIcon, SettingsIcon } from '@/lib/icons'

// ❌ WRONG: Direct from lucide-react
import { Lightbulb, Power, Settings } from 'lucide-react'

// ❌ WRONG: Separate statements
import { LightbulbIcon } from '@/lib/icons'
import { PowerIcon } from '@/lib/icons'
```

### 8. Services

```typescript
// ✅ CORRECT: Group by service category
import { HueBridgeAdapter } from '@/services/devices/HueBridgeAdapter'
import { HTTPDeviceAdapter } from '@/services/devices/HTTPDeviceAdapter'
import { DiscoveryManager } from '@/services/discovery/DiscoveryManager'

// ❌ WRONG: Alphabetical without grouping
import { DiscoveryManager } from '@/services/discovery/DiscoveryManager'
import { HueBridgeAdapter } from '@/services/devices/HueBridgeAdapter'
```

### 9. Utilities

```typescript
// ✅ CORRECT: Group utilities
import { cn } from '@/lib/utils'
import { formatDate, formatTime } from '@/utils/format-date'

// External utilities last in this section
import { toast } from 'sonner'
```

---

## Path Aliases

### Always Use @ Prefix

```typescript
// ✅ CORRECT: Use @ alias
import { Device } from '@/types'
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'

// ❌ WRONG: Relative imports
import { Device } from '../types'
import { useKV } from '../../hooks/use-kv'
import { Button } from '../components/ui/button'

// ❌ WRONG: Full path
import { Device } from 'src/types'
```

### Exception: Sibling Files

```typescript
// ✅ ACCEPTABLE: Sibling file in same directory
import { DeviceCardProps } from './DeviceCard.types'
import { formatDeviceName } from './device-utils'

// ❌ WRONG: @ alias for same directory
import { DeviceCardProps } from '@/components/DeviceCard.types'
```

---

## Sorting Within Groups

### Alphabetical Sorting

```typescript
// ✅ CORRECT: Alphabetical within group
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// ❌ WRONG: Random order
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
```

### Destructuring Order

```typescript
// ✅ CORRECT: Alphabetical destructuring
import { useState, useCallback, useEffect, useMemo } from 'react'

// ACCEPTABLE: Logical grouping (state, effects, memo)
import { useState, useEffect, useMemo, useCallback } from 'react'
```

---

## Blank Lines Between Groups

```typescript
// ✅ CORRECT: Blank lines separate groups
import { useState } from 'react'

import type { Device } from '@/types'

import { useKV } from '@/hooks/use-kv'

import { Button } from '@/components/ui/button'

// ❌ WRONG: No separation
import { useState } from 'react'
import type { Device } from '@/types'
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'
```

---

## Type vs Value Imports

### Always Separate Type Imports

```typescript
// ✅ CORRECT: Separate type imports
import { something } from 'module'
import type { SomeType } from 'module'

// ❌ WRONG: Mixed imports
import { something, type SomeType } from 'module'
```

### Multiple Type Imports

```typescript
// ✅ CORRECT: Single type import statement per module
import type { Device, DeviceType, DeviceStatus, DeviceProtocol } from '@/types'

// ❌ WRONG: Multiple statements
import type { Device } from '@/types'
import type { DeviceType } from '@/types'
import type { DeviceStatus } from '@/types'
```

---

## Side-Effect Imports

```typescript
// ✅ CORRECT: CSS imports at the very top
import './styles.css'

import { useState } from 'react'
import type { Device } from '@/types'

// ❌ WRONG: CSS in middle
import { useState } from 'react'
import './styles.css'
import type { Device } from '@/types'
```

---

## Complete Example

```typescript
// Side effects (CSS)
import './Dashboard.css'

// 1. React & external libraries
import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDebouncedCallback } from 'use-debounce'

// 2. Type imports
import type { Device, DeviceType, DeviceStatus } from '@/types/device.types'
import type { Room } from '@/types/room.types'
import type { Scene } from '@/types/scene.types'

// 3. Internal hooks
import { useKV } from '@/hooks/use-kv'
import { useDeviceControl } from '@/hooks/use-device-control'
import { useHaptics } from '@/hooks/use-haptics'

// 4. Constants
import { MOCK_DEVICES, MOCK_ROOMS, MOCK_SCENES } from '@/constants'
import { KV_KEYS } from '@/constants/kv-keys'
import { DEVICE_ICONS } from '@/constants/device-icons'

// 5. UI components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

// 6. Feature components
import { DeviceCard } from '@/components/DeviceCard'
import { RoomCard } from '@/components/RoomCard'

// 7. Icons
import { HomeIcon, LightbulbIcon, PowerIcon, SettingsIcon } from '@/lib/icons'

// 8. Services
import { HueBridgeAdapter } from '@/services/devices/HueBridgeAdapter'
import { HTTPDeviceAdapter } from '@/services/devices/HTTPDeviceAdapter'
import { DiscoveryManager } from '@/services/discovery/DiscoveryManager'

// 9. Utilities
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format-date'

// 10. External utilities
import { toast } from 'sonner'

export function Dashboard() {
  // Component implementation
}
```

---

## Automated Enforcement

### ESLint Configuration

Add to `eslint.config.js`:

```javascript
{
  plugins: ['import'],
  rules: {
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'pathGroups': [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: '@/types/**', group: 'internal', position: 'before' },
          { pattern: '@/hooks/**', group: 'internal', position: 'before' },
          { pattern: '@/constants/**', group: 'internal', position: 'before' },
          { pattern: '@/components/ui/**', group: 'internal' },
          { pattern: '@/lib/icons', group: 'internal', position: 'after' },
          { pattern: '@/services/**', group: 'internal', position: 'after' }
        ],
        'alphabetize': { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always'
      }
    ]
  }
}
```

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  }
}
```

This auto-organizes imports on save!

---

## Quick Checklist

Before committing, verify imports:

- [ ] React imports first
- [ ] Type imports use `type` keyword
- [ ] All imports use `@/` prefix (except siblings)
- [ ] Blank lines between groups
- [ ] Alphabetical within groups
- [ ] No relative imports (`../`, `../../`)
- [ ] Icons from `@/lib/icons` not `lucide-react`
- [ ] UI components from `@/components/ui/`

---

## IDE Shortcuts

### VS Code

- **Organize Imports**: `Shift+Alt+O` (Windows/Linux) or `Shift+Option+O` (Mac)
- **Format Document**: `Shift+Alt+F` (Windows/Linux) or `Shift+Option+F` (Mac)

Configure: Preferences → Settings → Editor: Code Actions On Save

---

**Note**: Consistent import ordering improves code readability and reduces merge conflicts.
