# File Naming Conventions

**Purpose**: Standardized file naming patterns for HomeHub codebase.

**Last Updated**: October 16, 2025

---

## Table of Contents

- [General Rules](#general-rules)
- [Component Files](#component-files)
- [Service Files](#service-files)
- [Type Definition Files](#type-definition-files)
- [Test Files](#test-files)
- [Utility Files](#utility-files)
- [Configuration Files](#configuration-files)
- [Documentation Files](#documentation-files)

---

## General Rules

### Universal Standards

1. **No spaces**: Use hyphens or camelCase, never spaces
2. **Lowercase for folders**: All folder names lowercase (except special cases)
3. **Descriptive names**: Name should indicate purpose
4. **Consistent extensions**: `.ts` for TypeScript, `.tsx` for React components
5. **No abbreviations**: Use full words (`device` not `dev`, `authentication` not `auth`)

---

## Component Files

### Feature Components

**Pattern**: `PascalCase.tsx`

```
✅ CORRECT:
src/components/Dashboard.tsx
src/components/Rooms.tsx
src/components/DeviceMonitor.tsx
src/components/SecurityCameras.tsx

❌ WRONG:
src/components/dashboard.tsx          (lowercase)
src/components/device-monitor.tsx     (kebab-case)
src/components/Device_Monitor.tsx     (snake_case)
src/components/DeviceMonitorPage.tsx  (redundant suffix)
```

### UI Components (shadcn/ui)

**Pattern**: `kebab-case.tsx`

```
✅ CORRECT:
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/dialog.tsx
src/components/ui/color-wheel.tsx

❌ WRONG:
src/components/ui/Button.tsx          (PascalCase for ui/)
src/components/ui/color_wheel.tsx     (snake_case)
```

### Component Subfiles

**Pattern**: `ComponentName.SubName.tsx`

```
✅ CORRECT:
src/components/Dashboard.DeviceCard.tsx
src/components/Rooms.RoomCard.tsx

❌ WRONG:
src/components/DashboardDeviceCard.tsx  (merged name)
src/components/Dashboard-DeviceCard.tsx (kebab-case)
```

---

## Service Files

### Service Classes

**Pattern**: `PascalCase.ts` or `PascalCaseAdapter.ts`

```
✅ CORRECT:
src/services/devices/HueBridgeAdapter.ts
src/services/devices/HTTPDeviceAdapter.ts
src/services/discovery/HTTPScanner.ts
src/services/discovery/DiscoveryManager.ts
src/services/automation/Scheduler.ts

❌ WRONG:
src/services/devices/hue-bridge-adapter.ts  (kebab-case)
src/services/devices/hue_bridge_adapter.ts  (snake_case)
src/services/devices/hueBridgeAdapter.ts    (camelCase start)
```

### Service Folders

**Pattern**: `lowercase`

```
✅ CORRECT:
src/services/devices/
src/services/discovery/
src/services/automation/

❌ WRONG:
src/services/Devices/
src/services/deviceControl/
```

---

## Type Definition Files

### Type Files

**Pattern**: `kebab-case.types.ts`

```
✅ CORRECT:
src/types/device.types.ts
src/types/automation.types.ts
src/types/security.types.ts
src/types/energy.types.ts

❌ WRONG:
src/types/Device.types.ts          (PascalCase)
src/types/deviceTypes.ts           (camelCase merged)
src/types/device-types.ts          (missing .types)
src/types/device_types.ts          (snake_case)
```

### Type Declaration Files

**Pattern**: `kebab-case.d.ts`

```
✅ CORRECT:
src/types/env.d.ts
src/types/vite-env.d.ts
src/types/koush__arlo.d.ts

❌ WRONG:
src/types/Env.d.ts
src/types/envTypes.d.ts
```

### Index Files (Re-exports)

**Pattern**: `index.ts`

```
✅ CORRECT:
src/types/index.ts
src/services/index.ts
src/components/index.ts
```

---

## Test Files

### Component/Service Tests

**Pattern**: `MatchExactName.test.ts` or `MatchExactName.test.tsx`

```
✅ CORRECT:
src/components/Dashboard.test.tsx
src/services/devices/HueBridgeAdapter.test.ts
src/hooks/use-kv.test.ts
src/components/ui/button.test.tsx

❌ WRONG:
src/components/DashboardTest.tsx         (merged name)
src/components/Dashboard.spec.tsx        (.spec instead of .test)
src/components/dashboard.test.tsx        (case mismatch)
tests/Dashboard.test.tsx                 (separate tests/ folder)
```

**Rule**: Test file must exactly match source file name + `.test.ts(x)`

### Integration Tests

**Pattern**: `kebab-case.integration.test.ts`

```
✅ CORRECT:
src/tests/device-control.integration.test.ts
src/tests/scene-activation.integration.test.ts

❌ WRONG:
src/tests/deviceControl.integration.test.ts
src/tests/device-control-integration.test.ts
```

---

## Utility Files

### Utility Functions

**Pattern**: `kebab-case.ts`

```
✅ CORRECT:
src/utils/format-date.ts
src/utils/calculate-distance.ts
src/utils/color-utils.ts

❌ WRONG:
src/utils/FormatDate.ts           (PascalCase)
src/utils/formatDate.ts           (camelCase)
src/utils/date_formatter.ts       (snake_case)
```

### Utility Barrel Files

**Pattern**: `utils.ts` or `index.ts`

```
✅ CORRECT:
src/lib/utils.ts         (cn function, etc.)
src/utils/index.ts       (re-exports)
```

---

## Configuration Files

### Root-Level Config

**Pattern**: Varies by tool convention

```
✅ CORRECT (Keep as-is):
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
eslint.config.js
components.json
.prettierrc
.editorconfig
wrangler.toml

❌ DON'T RENAME THESE
```

### Custom Config Files

**Pattern**: `kebab-case.config.ts`

```
✅ CORRECT:
config/app.config.ts
config/theme.config.ts

❌ WRONG:
config/AppConfig.ts
config/app-configuration.ts
```

---

## Documentation Files

### Guides and References

**Pattern**: `SCREAMING_SNAKE_CASE.md`

```
✅ CORRECT:
docs/guides/ARCHITECTURE.md
docs/guides/SETUP_QUICKSTART.md
docs/guides/TYPESCRIPT_API_REFERENCE.md
docs/development/PHASE_1_COMPLETE.md

❌ WRONG:
docs/guides/architecture.md          (lowercase)
docs/guides/Architecture.md          (PascalCase)
docs/guides/setup-quickstart.md      (kebab-case)
```

### Exception: Special Files

**Pattern**: `UPPERCASE.md`

```
✅ CORRECT:
README.md
LICENSE
CONTRIBUTING.md
SECURITY.md
```

### Documentation Sections

**Pattern**: `lowercase/` folders, `UPPERCASE_SNAKE.md` files

```
✅ CORRECT:
docs/
├── guides/
│   ├── ARCHITECTURE.md
│   └── SETUP_QUICKSTART.md
├── development/
│   ├── PHASE_1_COMPLETE.md
│   └── NEXT_STEPS.md
└── deployment/
    └── CLOUDFLARE_DEPLOYMENT.md
```

---

## Hooks

### Custom Hooks

**Pattern**: `use-kebab-case.ts`

```
✅ CORRECT:
src/hooks/use-kv.ts
src/hooks/use-device-control.ts
src/hooks/use-haptics.ts

❌ WRONG:
src/hooks/useKV.ts              (camelCase)
src/hooks/UseKV.ts              (PascalCase)
src/hooks/use_kv.ts             (snake_case)
src/hooks/kv-hook.ts            (missing use-)
```

---

## Constants

### Constant Files

**Pattern**: `kebab-case.ts`

```
✅ CORRECT:
src/constants/kv-keys.ts
src/constants/device-icons.ts
src/constants/mock-data.ts

❌ WRONG:
src/constants/KV_KEYS.ts        (SCREAMING_SNAKE_CASE)
src/constants/kvKeys.ts         (camelCase)
```

---

## Scripts

### Utility Scripts

**Pattern**: `kebab-case.js` or `kebab-case.ts`

```
✅ CORRECT:
scripts/test-device-simple.js
scripts/http-virtual-device.js
scripts/check-ci.js
scripts/arlo-real-browser-auth.js

❌ WRONG:
scripts/TestDevice.js
scripts/test_device.js
scripts/testDevice.js
```

### Script Documentation

**Pattern**: `SCREAMING_SNAKE_CASE.md`

```
✅ CORRECT:
scripts/ARLO_API_SUCCESS.md
scripts/IMPLEMENTATION_NEXT_STEPS.md
```

---

## Asset Files

### Images and Icons

**Pattern**: `kebab-case.extension`

```
✅ CORRECT:
public/logo-192x192.png
public/splash-screen.png
public/icons/device-light.svg

❌ WRONG:
public/LogoLarge.png
public/logo_large.png
```

---

## Quick Reference Table

| File Type         | Pattern                | Example               |
| ----------------- | ---------------------- | --------------------- |
| Feature Component | `PascalCase.tsx`       | `Dashboard.tsx`       |
| UI Component      | `kebab-case.tsx`       | `button.tsx`          |
| Service Class     | `PascalCase.ts`        | `HueBridgeAdapter.ts` |
| Type Definition   | `kebab-case.types.ts`  | `device.types.ts`     |
| Test File         | `MatchName.test.ts(x)` | `Dashboard.test.tsx`  |
| Hook              | `use-kebab-case.ts`    | `use-kv.ts`           |
| Util Function     | `kebab-case.ts`        | `format-date.ts`      |
| Constant File     | `kebab-case.ts`        | `kv-keys.ts`          |
| Script            | `kebab-case.js`        | `check-ci.js`         |
| Documentation     | `SCREAMING_SNAKE.md`   | `SETUP_GUIDE.md`      |
| Config            | Tool-specific          | `vite.config.ts`      |

---

## Validation Checklist

Before committing, verify:

- [ ] Component files use PascalCase
- [ ] UI components use kebab-case
- [ ] Service files use PascalCase with descriptive suffix
- [ ] Type files use kebab-case.types.ts
- [ ] Test files exactly match source file name
- [ ] Hooks start with `use-`
- [ ] No spaces in any filename
- [ ] Documentation uses SCREAMING_SNAKE_CASE

---

**Note**: When in doubt, look at existing files in the same folder for pattern consistency.
