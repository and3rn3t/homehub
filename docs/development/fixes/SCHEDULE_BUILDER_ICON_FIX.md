# Schedule Builder Icon Fix

**Date**: October 11, 2025
**Issue**: ScheduleBuilder component crashing with ReferenceError
**Status**: ✅ **RESOLVED**

---

## Problem Summary

User reported browser console error:

```
ScheduleBuilder.tsx:257 Uncaught ReferenceError: Plus is not defined
```

The ScheduleBuilder component was using icon components without the `Icon` suffix and with invalid `size` props.

---

## Root Causes

### 1. **Missing Icon Suffix**

Icons were referenced as `<Plus />`, `<Clock />`, `<Sun />`, `<X />` instead of `<PlusIcon />`, `<ClockIcon />`, etc.

**Error Locations**:

- Line 257: `<Plus size={20} />` → Should be `<PlusIcon />`
- Line 500: `<Clock size={24} />` → Should be `<ClockIcon />`
- Line 525: `<Clock size={20} />` → Should be `<ClockIcon />`
- Line 572: `<Sun size={14} />` → Should be `<PlayIcon />` (for "run now" action)
- Line 581: `<X size={14} />` → Should be `<XIcon />`

### 2. **Invalid Icon Size Prop**

Used `size={number}` prop which Lucide React icons don't support.

**Wrong**: `<PlusIcon size={20} />`
**Correct**: `<PlusIcon className="h-5 w-5" />`

---

## Fixes Applied

### Updated Imports

```tsx
// Before
import { ClockIcon, PlusIcon, SunRoomIcon, XIcon } from '@/lib/icons'

// After
import { ClockIcon, PlayIcon, PlusIcon, XIcon } from '@/lib/icons'
```

**Changes**:

- ✅ Kept `ClockIcon` and `PlusIcon`
- ✅ Added `PlayIcon` for "run now" button (better semantic meaning than Sun)
- ❌ Removed `SunRoomIcon` (not needed)
- ✅ Kept `XIcon` for delete action

### Fixed Icon Usages

**1. "New Schedule" Button (Line 257)**

```tsx
// Before
<Plus size={20} className="mr-2" />

// After
<PlusIcon className="mr-2 h-5 w-5" />
```

**2. Empty State Icon (Line 500)**

```tsx
// Before
<Clock size={24} className="text-muted-foreground" />

// After
<ClockIcon className="text-muted-foreground h-6 w-6" />
```

**3. Schedule Card Icon (Line 525)**

```tsx
// Before
<Clock
  size={20}
  className={schedule.enabled ? 'text-primary' : 'text-muted-foreground'}
/>

// After
<ClockIcon
  className={`h-5 w-5 ${schedule.enabled ? 'text-primary' : 'text-muted-foreground'}`}
/>
```

**4. "Run Now" Button (Line 572)**

```tsx
// Before
<Sun size={14} />

// After
<PlayIcon className="h-3.5 w-3.5" />
```

**Rationale**: PlayIcon is more semantically appropriate for "execute now" action than Sun.

**5. Delete Button (Line 581)**

```tsx
// Before
<X size={14} />

// After
<XIcon className="h-3.5 w-3.5" />
```

---

## Icon Size Reference

Following HomeHub's design system (from copilot-instructions.md):

| Tailwind Class | Size (px) | Use Case                                  |
| -------------- | --------- | ----------------------------------------- |
| `h-3 w-3`      | 12px      | Very small icons (inline text)            |
| `h-3.5 w-3.5`  | 14px      | Compact buttons (icon-only small buttons) |
| `h-4 w-4`      | 16px      | Standard UI icons (most common)           |
| `h-5 w-5`      | 20px      | Medium icons (buttons with text)          |
| `h-6 w-6`      | 24px      | Large icons (emphasis, empty states)      |
| `h-8 w-8`      | 32px      | Extra large (headers, focal points)       |

**Applied in ScheduleBuilder**:

- Empty state: `h-6 w-6` (24px) - Large focal icon
- Schedule card: `h-5 w-5` (20px) - Medium emphasis
- Action buttons: `h-3.5 w-3.5` (14px) - Compact controls
- "New Schedule" button: `h-5 w-5` (20px) - Medium with text

---

## Testing Checklist

After applying fixes, verify:

- [x] **No Console Errors**: Browser console shows no ReferenceError
- [x] **Component Renders**: ScheduleBuilder tab loads without crashing
- [x] **Icons Display**: All icons render correctly (plus, clock, play, x)
- [x] **New Schedule Button**: Button with plus icon clickable
- [x] **Empty State**: Clock icon shows when no schedules exist
- [x] **Schedule Cards**: Clock icon displays per schedule
- [x] **Action Buttons**: Play and X icons work in schedule cards
- [x] **Icon Sizes**: All icons proportioned correctly (no oversized/undersized)

---

## Related Issues

This is the second icon-related fix today. Both issues stem from the same root causes:

1. **FlowDesigner** (earlier): `<nodeType.icon size={16} />` → Fixed to use `className`
2. **ScheduleBuilder** (this fix): `<Plus size={20} />` → Fixed missing Icon suffix + className

### Pattern

When migrating to Lucide React's centralized icon library (`@/lib/icons`), need to:

1. Import with `Icon` suffix: `import { PlusIcon } from '@/lib/icons'`
2. Use Tailwind classes for sizing: `<PlusIcon className="h-5 w-5" />`
3. Never use `size`, `width`, or `height` props

---

## Prevention

To avoid similar issues in the future:

1. **Always Use Icon Suffix**: Every Lucide icon import ends with `Icon`
   - ✅ `PlusIcon`, `ClockIcon`, `XIcon`
   - ❌ `Plus`, `Clock`, `X`

2. **Never Use size Prop**: Lucide icons don't accept `size`
   - ✅ `<PlusIcon className="h-5 w-5" />`
   - ❌ `<PlusIcon size={20} />`

3. **Import from Centralized Library**: Always use `@/lib/icons`
   - ✅ `import { PlusIcon } from '@/lib/icons'`
   - ❌ `import { Plus } from 'lucide-react'`

4. **Use ESLint**: Consider adding a lint rule to catch:
   - Icons imported without `Icon` suffix
   - `size` prop usage on Lucide components
   - Direct imports from `lucide-react` (bypass centralized library)

---

## Remaining Warnings

The following ESLint warnings remain (non-blocking, code quality issues):

1. **Nested Ternaries** (Line 132): Complex conditional can be extracted
2. **Unused Error** (Line 240): Catch block doesn't use error variable
3. **TypeScript `any`** (Lines 42, 128): Can be typed more strictly
4. **Deep Nesting** (Line 351): Function nesting exceeds 4 levels

These are cosmetic and don't affect functionality. Can be addressed in a future refactor.

---

## Related Files

- **Component**: `src/components/ScheduleBuilder.tsx` (608 lines)
- **Icon Library**: `src/lib/icons.ts` (200+ Lucide exports)
- **Related Fix**: `docs/development/FLOW_DESIGNER_NODE_ADDITION_FIX.md` (icon issues fixed today)

---

**Resolution**: ✅ All icon errors fixed, component renders without crashes, icons display correctly with proper sizing
