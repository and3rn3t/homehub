# HomeHub Refactoring Plan

## Current Issues

1. **TypeScript interfaces duplicated** across multiple component files (Device, Room, Scene, etc.)
2. **No centralized type definitions** - each component defines its own interfaces
3. **Mock data scattered** throughout component files instead of centralized
4. **No separation of concerns** - business logic mixed with UI components
5. **Missing service layer** for future device communication
6. **No utilities/helpers** directory structure
7. **Inconsistent file organization** - some related components together, others separate

## Target Architecture

```
src/
├── components/           # UI Components only (presentation)
│   ├── features/        # Feature-specific compound components
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DeviceCard.tsx
│   │   │   ├── DeviceAlerts.tsx
│   │   │   └── index.ts
│   │   ├── automation/
│   │   │   ├── Automations.tsx
│   │   │   ├── ScheduleBuilder.tsx
│   │   │   ├── GeofenceBuilder.tsx
│   │   │   ├── FlowDesigner.tsx
│   │   │   ├── FlowExecutor.tsx
│   │   │   ├── FlowMiniMap.tsx
│   │   │   ├── FlowTutorial.tsx
│   │   │   ├── NodeConfig.tsx
│   │   │   └── index.ts
│   │   ├── rooms/
│   │   │   ├── Rooms.tsx
│   │   │   ├── RoomCard.tsx
│   │   │   └── index.ts
│   │   ├── scenes/
│   │   │   ├── Scenes.tsx
│   │   │   ├── SceneCard.tsx
│   │   │   └── index.ts
│   │   ├── energy/
│   │   │   ├── Energy.tsx
│   │   │   └── index.ts
│   │   ├── security/
│   │   │   ├── Security.tsx
│   │   │   ├── CameraCard.tsx
│   │   │   └── index.ts
│   │   ├── monitoring/
│   │   │   ├── DeviceMonitor.tsx
│   │   │   ├── MonitoringSettings.tsx
│   │   │   └── index.ts
│   │   ├── settings/
│   │   │   ├── DeviceSettings.tsx
│   │   │   ├── AdaptiveLighting.tsx
│   │   │   ├── Intercom.tsx
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── UserManagement.tsx
│   │   │   └── index.ts
│   │   ├── insights/
│   │   │   ├── InsightsDashboard.tsx
│   │   │   └── index.ts
│   │   ├── backup/
│   │   │   ├── BackupRecovery.tsx
│   │   │   └── index.ts
│   │   └── shared/
│   │       ├── NotificationCenter.tsx
│   │       └── index.ts
│   └── ui/               # shadcn/ui components (DO NOT MODIFY)
├── types/                # TypeScript type definitions
│   ├── device.types.ts
│   ├── room.types.ts
│   ├── scene.types.ts
│   ├── automation.types.ts
│   ├── user.types.ts
│   ├── security.types.ts
│   ├── energy.types.ts
│   ├── backup.types.ts
│   └── index.ts          # Re-export all types
├── constants/            # App-wide constants
│   ├── kv-keys.ts        # Centralized KV store key definitions
│   ├── device-icons.ts   # Icon mappings
│   ├── mock-data.ts      # Mock/seed data for development
│   └── index.ts
├── hooks/                # Custom React hooks
│   ├── use-mobile.ts     # (existing)
│   ├── use-devices.ts    # Device management hook
│   ├── use-rooms.ts      # Room management hook
│   ├── use-scenes.ts     # Scene management hook
│   └── index.ts
├── services/             # Business logic & future API calls
│   ├── device.service.ts
│   ├── automation.service.ts
│   ├── energy.service.ts
│   └── index.ts
├── utils/                # Utility functions
│   ├── date.utils.ts
│   ├── validation.utils.ts
│   └── index.ts
├── lib/
│   └── utils.ts          # (existing - Tailwind class merger)
├── styles/
│   └── theme.css
├── App.tsx               # Main app shell
├── ErrorFallback.tsx
├── main.tsx
├── index.css
└── main.css
```

## Benefits of This Structure

1. **Type Safety**: Centralized types prevent drift and duplication
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new features without touching existing code
4. **Testability**: Services and utilities can be unit tested independently
5. **Discovery**: New developers can quickly understand the codebase structure
6. **Future-Proof**: Service layer ready for real device integration
7. **DRY Principle**: Shared logic in hooks and services

## Migration Steps

### Phase 1: Create Type System (Immediate)

- [ ] Create `src/types/` directory
- [ ] Extract and consolidate all TypeScript interfaces
- [ ] Add JSDoc comments to all types
- [ ] Create barrel export in `types/index.ts`

### Phase 2: Create Constants (Immediate)

- [ ] Create `src/constants/` directory
- [ ] Move KV store keys to `kv-keys.ts`
- [ ] Move icon mappings to `device-icons.ts`
- [ ] Extract mock data to `mock-data.ts`

### Phase 3: Create Hooks (Week 1)

- [ ] Create `src/hooks/` directory
- [ ] Create `use-devices.ts` hook
- [ ] Create `use-rooms.ts` hook
- [ ] Create `use-scenes.ts` hook
- [ ] Update components to use new hooks

### Phase 4: Create Services (Week 2)

- [ ] Create `src/services/` directory
- [ ] Create device service with mock implementation
- [ ] Create automation service
- [ ] Prepare for Phase 2 (real device integration)

### Phase 5: Reorganize Components (Week 3)

- [ ] Create feature directories under `src/components/features/`
- [ ] Move components to appropriate feature folders
- [ ] Extract reusable sub-components
- [ ] Create barrel exports

### Phase 6: Create Utilities (Week 4)

- [ ] Create `src/utils/` directory
- [ ] Extract date formatting functions
- [ ] Extract validation functions
- [ ] Add utility unit tests

## Breaking Changes

- Import paths will change (can use find/replace)
- Components split into smaller pieces (better for maintenance)
- KV keys centralized (prevents typos)

## Non-Breaking

- All existing functionality preserved
- No UI changes
- Same component APIs
- Backward compatible hooks

## Quick Wins (Do These First)

1. ✅ Create types directory and consolidate interfaces (2 hours)
2. ✅ Create constants directory and move KV keys (1 hour)
3. ✅ Create mock data file (1 hour)
4. ✅ Update imports to use new types (1 hour)

Total: ~5 hours for major improvement
