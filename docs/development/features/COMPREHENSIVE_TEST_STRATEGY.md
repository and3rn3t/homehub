# Comprehensive Test Strategy for HomeHub

**Date**: October 13, 2025
**Status**: Planning - Test Coverage Expansion
**Current Coverage**: ~5% (2 test files, automation integration tests)
**Target Coverage**: 70%+ for critical paths

## 📊 Current Test Inventory

### ✅ Existing Tests

**Unit Tests**:

- `src/constants/mock-cameras.test.ts` (132 lines)
  - Data structure validation
  - 7 cameras with unique IDs
  - Status/capability validation

**Component Tests**:

- `src/components/SecurityCameras.test.tsx` (188 lines)
  - Basic rendering
  - Camera display
  - Layout validation

**Integration Tests**:

- `src/tests/automation-integration.test.ts` (1,000+ lines)
  - 10 test scenarios for Phase 3 automation
  - Needs type fixes (30+ errors)
  - Not currently executable

**Smoke Tests** (Node.js scripts):

- `scripts/smoke-test-frontend.js`
- `scripts/smoke-test-worker.js`
- `scripts/smoke-test-all.js`

### ⚠️ Test Coverage Gaps

**NO tests for**:

- 35+ React components
- 15+ custom hooks
- 5+ service modules
- State management (useKV)
- Device discovery/control
- UI interactions
- Error boundaries
- Performance

## 🎯 Recommended Test Suite Architecture

### Tier 1: Critical Path Tests (HIGHEST PRIORITY)

These are the "if these break, the app is unusable" tests.

#### 1.1 Core State Management

**File**: `src/hooks/use-kv.test.ts`

```typescript
describe('useKV hook', () => {
  describe('Basic CRUD Operations', () => {
    it('should persist data to localStorage', async () => {
      // Test: Write to KV, refresh page, data survives
    })

    it('should handle concurrent updates', async () => {
      // Test: Multiple setters don't cause race conditions
    })

    it('should debounce rapid updates', async () => {
      // Test: 10 updates in 100ms = 1 API call
    })

    it('should handle localStorage quota exceeded', () => {
      // Test: Graceful degradation when storage full
    })
  })

  describe('Optimistic Updates', () => {
    it('should update UI immediately', () => {
      // Test: No loading state for local updates
    })

    it('should rollback on API failure', async () => {
      // Test: Revert to previous state if sync fails
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid JSON in localStorage', () => {
      // Test: Corrupt data doesn't crash app
    })

    it('should handle missing keys gracefully', () => {
      // Test: Default value returned for new users
    })
  })
})
```

**Why Critical**: 100% of persistent state depends on this hook. If useKV breaks, entire app is unusable.

#### 1.2 Device Discovery & Control

**File**: `src/services/discovery/HTTPScanner.test.ts`

```typescript
describe('HTTPScanner', () => {
  describe('Device Discovery', () => {
    it('should discover Shelly devices on local network', async () => {
      // Mock: HTTP server responding with Shelly device info
    })

    it('should discover Philips Hue bridges', async () => {
      // Mock: mDNS/SSDP responses
    })

    it('should handle network timeouts gracefully', async () => {
      // Test: 5-second timeout doesn't hang UI
    })

    it('should deduplicate discovered devices', async () => {
      // Test: Same device found twice = 1 result
    })
  })

  describe('Protocol Detection', () => {
    it('should correctly identify Shelly Gen 1 devices', async () => {
      // Test: /shelly endpoint = Shelly device
    })

    it('should correctly identify TP-Link Kasa devices', async () => {
      // Test: Port 9999 response = Kasa device
    })
  })
})
```

**Why Critical**: Device discovery is the first user experience. If this fails, users can't add any devices.

#### 1.3 Hue Bridge Integration

**File**: `src/services/devices/HueBridgeAdapter.test.ts`

```typescript
describe('HueBridgeAdapter', () => {
  describe('Light Control', () => {
    it('should turn lights on/off', async () => {
      // Mock: Hue API responses
    })

    it('should set brightness (0-254)', async () => {
      // Test: Brightness slider values map correctly
    })

    it('should set color (HSV)', async () => {
      // Test: Color wheel values convert to Hue API format
    })

    it('should set color temperature (2000K-6500K)', async () => {
      // Test: Mirek values calculated correctly
    })
  })

  describe('Error Handling', () => {
    it('should handle bridge offline gracefully', async () => {
      // Test: Timeout doesn't crash app
    })

    it('should retry failed commands', async () => {
      // Test: 3 retries with exponential backoff
    })
  })

  describe('Performance', () => {
    it('should batch multiple commands', async () => {
      // Test: 10 light changes = 1 API call
    })

    it('should respond within 300ms', async () => {
      // Target: <500ms for good UX
    })
  })
})
```

**Why Critical**: Controls 22 real Philips Hue lights. If this breaks, primary device control is down.

### Tier 2: Feature Tests (HIGH PRIORITY)

Tests for major features that users interact with daily.

#### 2.1 Dashboard Component

**File**: `src/components/Dashboard.test.tsx`

```typescript
describe('Dashboard', () => {
  describe('Device Display', () => {
    it('should render all device cards', () => {
      // Test: 27 devices = 27 cards
    })

    it('should group devices by room', () => {
      // Test: Living Room section shows 5 devices
    })

    it('should show favorite devices first', () => {
      // Test: Starred devices appear at top
    })
  })

  describe('Device Interactions', () => {
    it('should toggle device on click', async () => {
      // Test: Click light = on/off toggle
    })

    it('should open control panel on long press', async () => {
      // Test: Hold 500ms = color/brightness controls
    })

    it('should update multiple devices', async () => {
      // Test: "Turn off all" button works
    })
  })

  describe('Loading States', () => {
    it('should show skeleton while loading', () => {
      // Test: Skeleton cards before data loads
    })

    it('should show error state on failure', () => {
      // Test: Network error = friendly error message
    })
  })
})
```

#### 2.2 Rooms Component

**File**: `src/components/Rooms.test.tsx`

```typescript
describe('Rooms', () => {
  describe('Room Management', () => {
    it('should create new room', async () => {
      // Test: Add room dialog + save
    })

    it('should edit room name/icon/color', async () => {
      // Test: Edit dialog + update
    })

    it('should delete room with confirmation', async () => {
      // Test: Two-step delete prevents accidents
    })
  })

  describe('Drag & Drop', () => {
    it('should reorder rooms', async () => {
      // Test: @dnd-kit integration
    })

    it('should persist new order', async () => {
      // Test: Order survives page refresh
    })

    it('should work on touch devices', async () => {
      // Test: Mobile drag & drop
    })
  })

  describe('Device Assignment', () => {
    it('should assign device to room', async () => {
      // Test: Device appears in room view
    })

    it('should show room statistics', () => {
      // Test: "3 online, 1 offline" badge
    })
  })
})
```

#### 2.3 Scenes Component

**File**: `src/components/Scenes.test.tsx`

```typescript
describe('Scenes', () => {
  describe('Scene Activation', () => {
    it('should activate scene on click', async () => {
      // Test: All devices change to scene states
    })

    it('should show active scene indicator', () => {
      // Test: Blue border on active scene
    })

    it('should deactivate previous scene', async () => {
      // Test: Only 1 scene active at a time
    })
  })

  describe('Scene Creation', () => {
    it('should create scene from current state', async () => {
      // Test: "Save Current" captures all device states
    })

    it('should validate scene has actions', () => {
      // Test: Empty scene shows error
    })
  })

  describe('Scene Editing', () => {
    it('should update device states', async () => {
      // Test: Change brightness in scene editor
    })

    it('should add/remove devices', async () => {
      // Test: Device list checkboxes
    })
  })
})
```

#### 2.4 Automations Component

**File**: `src/components/Automations.test.tsx`

```typescript
describe('Automations', () => {
  describe('Time-Based Automations', () => {
    it('should create time trigger', async () => {
      // Test: Schedule builder UI
    })

    it('should validate time format', () => {
      // Test: Invalid time shows error
    })

    it('should show next run time', () => {
      // Test: "Next run: Tomorrow at 7:00 AM"
    })
  })

  describe('Condition-Based Automations', () => {
    it('should create threshold trigger', async () => {
      // Test: "If temperature > 75°F"
    })

    it('should validate device selection', () => {
      // Test: Must select device for condition
    })
  })

  describe('Geofence Automations', () => {
    it('should create location trigger', async () => {
      // Test: Map picker + radius slider
    })

    it('should validate coordinates', () => {
      // Test: Invalid lat/lng shows error
    })
  })
})
```

### Tier 3: Service Layer Tests (MEDIUM PRIORITY)

Backend logic and business rules.

#### 3.1 Scheduler Service

**File**: `src/services/automation/scheduler.service.test.ts`

```typescript
describe('SchedulerService', () => {
  describe('Time Matching', () => {
    it('should trigger at exact time', () => {
      // Test: 7:00 AM = trigger fires
    })

    it('should respect day-of-week filter', () => {
      // Test: Monday-Friday only
    })

    it('should handle timezone changes', () => {
      // Test: DST doesn't break schedules
    })
  })

  describe('Sunrise/Sunset', () => {
    it('should calculate sunset correctly', () => {
      // Test: Based on user location
    })

    it('should update daily', () => {
      // Test: Sunset time changes over year
    })
  })

  describe('Performance', () => {
    it('should check 100 schedules in <50ms', () => {
      // Test: Efficient time checking
    })
  })
})
```

#### 3.2 Condition Evaluator

**File**: `src/services/automation/condition-evaluator.service.test.ts`

```typescript
describe('ConditionEvaluatorService', () => {
  describe('Threshold Checks', () => {
    it('should compare numeric values correctly', () => {
      // Test: temperature > 75 = true/false
    })

    it('should handle missing device data', () => {
      // Test: Offline device = condition skipped
    })
  })

  describe('Hysteresis', () => {
    it('should prevent rapid toggling', () => {
      // Test: 60s cooldown between triggers
    })

    it('should track cooldown per automation', () => {
      // Test: Multiple automations don't interfere
    })
  })

  describe('Boolean Logic', () => {
    it('should evaluate AND conditions', () => {
      // Test: temp > 75 AND time > 6pm
    })

    it('should evaluate OR conditions', () => {
      // Test: motion OR door open
    })
  })
})
```

#### 3.3 Action Executor

**File**: `src/services/automation/action-executor.service.test.ts`

```typescript
describe('ActionExecutorService', () => {
  describe('Action Execution', () => {
    it('should execute actions sequentially', async () => {
      // Test: Action order preserved
    })

    it('should execute actions in parallel', async () => {
      // Test: Scene activation all at once
    })
  })

  describe('Error Handling', () => {
    it('should retry failed actions', async () => {
      // Test: 3 retries with backoff
    })

    it('should continue on non-critical errors', async () => {
      // Test: 1 failed action doesn't stop others
    })

    it('should rollback on critical errors', async () => {
      // Test: Revert to previous state
    })
  })

  describe('Performance', () => {
    it('should execute action in <150ms', async () => {
      // Test: Fast response time
    })

    it('should batch API calls', async () => {
      // Test: 10 actions = optimized requests
    })
  })
})
```

#### 3.4 Flow Interpreter

**File**: `src/services/automation/flow-interpreter.service.test.ts`

```typescript
describe('FlowInterpreterService', () => {
  describe('Node Execution', () => {
    it('should execute trigger node', async () => {
      // Test: Time trigger fires
    })

    it('should evaluate condition node', async () => {
      // Test: If/else branching
    })

    it('should execute action node', async () => {
      // Test: Device control
    })

    it('should respect delay node', async () => {
      // Test: 5-second pause
    })
  })

  describe('Data Flow', () => {
    it('should pass data between nodes', () => {
      // Test: Trigger value → condition → action
    })

    it('should handle missing connections', () => {
      // Test: Disconnected nodes ignored
    })
  })

  describe('Error Handling', () => {
    it('should stop on error node', () => {
      // Test: Red error node halts flow
    })

    it('should log execution path', () => {
      // Test: Debug mode shows node execution
    })
  })
})
```

#### 3.5 Geofence Service

**File**: `src/services/automation/geofence.service.test.ts`

```typescript
describe('GeofenceService', () => {
  describe('Location Tracking', () => {
    it('should detect entering geofence', async () => {
      // Test: User moves into radius
    })

    it('should detect leaving geofence', async () => {
      // Test: User moves out of radius
    })

    it('should calculate distance correctly', () => {
      // Test: Haversine formula accuracy
    })
  })

  describe('Battery Optimization', () => {
    it('should throttle location checks', () => {
      // Test: Max 1 check per 30 seconds
    })

    it('should use significant location change only', () => {
      // Test: <100m movement ignored
    })
  })

  describe('Multi-User Support', () => {
    it('should track multiple users', async () => {
      // Test: 3 users, 3 separate geofence states
    })

    it('should trigger on any user', async () => {
      // Test: "Anyone arrives home"
    })
  })
})
```

### Tier 4: Hook Tests (MEDIUM PRIORITY)

Custom React hooks used across components.

#### 4.1 Device Control Hook

**File**: `src/hooks/use-device-control.test.ts`

```typescript
describe('useDeviceControl', () => {
  describe('Device Operations', () => {
    it('should toggle device', async () => {
      const { result } = renderHook(() => useDeviceControl())
      await act(async () => {
        await result.current.toggleDevice('light-1')
      })
      // Assert: Device state changed
    })

    it('should set brightness', async () => {
      // Test: 0-100 brightness range
    })

    it('should set color', async () => {
      // Test: HSV color values
    })
  })

  describe('Optimistic Updates', () => {
    it('should update UI immediately', () => {
      // Test: No loading spinner
    })

    it('should sync to API in background', async () => {
      // Test: Debounced API call
    })
  })
})
```

#### 4.2 MQTT Connection Hook

**File**: `src/hooks/use-mqtt-connection.test.ts`

```typescript
describe('useMQTTConnection', () => {
  describe('Connection Management', () => {
    it('should connect to broker on mount', async () => {
      // Mock: MQTT.js client
    })

    it('should reconnect on disconnect', async () => {
      // Test: Auto-reconnect with backoff
    })

    it('should cleanup on unmount', () => {
      // Test: No memory leaks
    })
  })

  describe('Message Handling', () => {
    it('should subscribe to topics', async () => {
      // Test: Device status updates
    })

    it('should publish messages', async () => {
      // Test: Device control commands
    })
  })
})
```

#### 4.3 Scheduler Hook

**File**: `src/hooks/use-scheduler.test.ts`

```typescript
describe('useScheduler', () => {
  describe('Schedule Management', () => {
    it('should start scheduler on mount', () => {
      // Test: Interval starts
    })

    it('should check schedules every minute', async () => {
      // Test: Clock ticking
    })

    it('should stop scheduler on unmount', () => {
      // Test: Interval cleared
    })
  })

  describe('Trigger Detection', () => {
    it('should detect matching schedule', () => {
      // Test: Time matches = trigger
    })

    it('should execute actions', async () => {
      // Test: Device control called
    })
  })
})
```

### Tier 5: UI Component Tests (LOWER PRIORITY)

Visual components and interactions.

#### 5.1 DeviceControlPanel

**File**: `src/components/DeviceControlPanel.test.tsx`

```typescript
describe('DeviceControlPanel', () => {
  describe('Light Controls', () => {
    it('should render brightness slider', () => {
      // Test: 0-100 slider visible
    })

    it('should render color wheel', () => {
      // Test: HSV color picker
    })

    it('should render temperature slider', () => {
      // Test: Warm to cool slider
    })
  })

  describe('User Interactions', () => {
    it('should update brightness on slider change', async () => {
      // Test: Slider → device update
    })

    it('should debounce rapid changes', async () => {
      // Test: 500ms debounce
    })
  })
})
```

#### 5.2 ColorWheelPicker

**File**: `src/components/ui/color-wheel.test.tsx`

```typescript
describe('ColorWheelPicker', () => {
  describe('Color Selection', () => {
    it('should calculate HSV from click position', () => {
      // Test: Canvas coordinates → HSV
    })

    it('should render indicator at current color', () => {
      // Test: Visual feedback
    })
  })

  describe('Canvas Rendering', () => {
    it('should draw color wheel on mount', () => {
      // Test: Canvas populated
    })

    it('should update on prop change', () => {
      // Test: Re-render on new color
    })
  })
})
```

#### 5.3 FlowDesigner

**File**: `src/components/FlowDesigner.test.tsx`

```typescript
describe('FlowDesigner', () => {
  describe('Node Management', () => {
    it('should add node on button click', () => {
      // Test: New node appears on canvas
    })

    it('should connect nodes by dragging', async () => {
      // Test: Drag from output to input
    })

    it('should delete node on trash icon click', () => {
      // Test: Node removed from canvas
    })
  })

  describe('Canvas Interactions', () => {
    it('should pan canvas on drag', () => {
      // Test: Canvas position changes
    })

    it('should zoom canvas on scroll', () => {
      // Test: Canvas scale changes
    })
  })
})
```

### Tier 6: Integration Tests (LOWER PRIORITY)

End-to-end user flows.

#### 6.1 Device Onboarding Flow

**File**: `src/tests/e2e/device-onboarding.test.ts`

```typescript
describe('Device Onboarding E2E', () => {
  it('should complete full device setup', async () => {
    // 1. Open device discovery
    // 2. Scan for devices
    // 3. Select device
    // 4. Assign to room
    // 5. Test control
    // 6. Verify in dashboard
  })
})
```

#### 6.2 Scene Creation Flow

**File**: `src/tests/e2e/scene-creation.test.ts`

```typescript
describe('Scene Creation E2E', () => {
  it('should create and activate scene', async () => {
    // 1. Navigate to Scenes
    // 2. Click "Create Scene"
    // 3. Name scene
    // 4. Select devices
    // 5. Set device states
    // 6. Save scene
    // 7. Activate scene
    // 8. Verify devices changed
  })
})
```

#### 6.3 Automation Creation Flow

**File**: `src/tests/e2e/automation-creation.test.ts`

```typescript
describe('Automation Creation E2E', () => {
  it('should create time-based automation', async () => {
    // 1. Navigate to Automations
    // 2. Click "Create Automation"
    // 3. Select time trigger
    // 4. Set time and days
    // 5. Add actions
    // 6. Save automation
    // 7. Wait for trigger
    // 8. Verify execution
  })
})
```

## 🛠️ Test Infrastructure Setup

### Required Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/react-hooks": "^8.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.6.3",
    "@vitest/ui": "^2.1.8",
    "@vitest/coverage-v8": "^2.1.8",
    "vitest": "^2.1.8",
    "happy-dom": "^16.6.0",
    "msw": "^2.7.0" // Mock Service Worker for API mocking
  }
}
```

### Test Setup File

**File**: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Framer Motion for faster tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
} as any
```

### Test Utilities

**File**: `src/test/utils.tsx`

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render with providers
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options })
}

// Mock device factory
export function createMockDevice(overrides = {}) {
  return {
    id: 'test-device-1',
    name: 'Test Light',
    type: 'light',
    room: 'living-room',
    status: 'online',
    enabled: false,
    ...overrides,
  }
}

// Mock automation factory
export function createMockAutomation(overrides = {}) {
  return {
    id: 'test-automation-1',
    name: 'Test Automation',
    type: 'schedule',
    enabled: true,
    triggers: [{ type: 'time', time: '07:00' }],
    actions: [{ deviceId: 'light-1', action: 'turn_on' }],
    ...overrides,
  }
}

// Wait for async updates
export async function waitForAsync() {
  await new Promise(resolve => setTimeout(resolve, 0))
}
```

## 📋 Test Execution Plan

### Phase 1: Critical Path (Week 1)

**Goal**: 90%+ coverage of Tier 1 tests

1. **Day 1**: useKV hook tests (8 hours)
   - CRUD operations
   - Optimistic updates
   - Edge cases
   - Target: 100% hook coverage

2. **Day 2**: HTTPScanner tests (8 hours)
   - Device discovery
   - Protocol detection
   - Network error handling
   - Target: 90% service coverage

3. **Day 3**: HueBridgeAdapter tests (8 hours)
   - Light control
   - Color/brightness/temperature
   - Error handling & retries
   - Performance benchmarks
   - Target: 95% adapter coverage

4. **Day 4**: Run all Tier 1 tests, fix failures (8 hours)
   - Green CI pipeline
   - Document any blockers

### Phase 2: Feature Tests (Week 2)

**Goal**: 80%+ coverage of Tier 2 tests

1. **Day 5-6**: Component tests (16 hours)
   - Dashboard, Rooms, Scenes, Automations
   - User interactions
   - Loading states
   - Target: 85% component coverage

2. **Day 7**: Integration with Tier 1 (8 hours)
   - End-to-end flows
   - Fix integration issues

### Phase 3: Service Layer (Week 3)

**Goal**: 70%+ coverage of Tier 3 tests

1. **Day 8-9**: Automation service tests (16 hours)
   - Scheduler, Condition Evaluator, Action Executor
   - Flow Interpreter, Geofence
   - Target: 80% service coverage

2. **Day 10**: Performance benchmarks (8 hours)
   - Response time metrics
   - Memory leak detection

### Phase 4: Polish (Week 4)

**Goal**: 70%+ overall coverage

1. **Day 11-12**: Hook and UI tests (16 hours)
   - Custom hooks
   - UI components
   - Target: 75% overall coverage

2. **Day 13**: E2E integration tests (8 hours)
   - User flow validation
   - Smoke tests

3. **Day 14**: Documentation & CI/CD (8 hours)
   - Test documentation
   - GitHub Actions setup
   - Coverage badges

## 🎯 Success Metrics

### Coverage Targets

| Layer       | Target  | Critical Path               |
| ----------- | ------- | --------------------------- |
| Hooks       | 80%     | useKV: 100%                 |
| Services    | 70%     | Discovery: 90%, Hue: 95%    |
| Components  | 60%     | Dashboard/Rooms/Scenes: 85% |
| Utils       | 50%     | Core utils: 70%             |
| **Overall** | **70%** | **Critical: 90%+**          |

### Quality Metrics

- ✅ **Zero** flaky tests (100% reliable)
- ✅ **<5s** test suite execution time
- ✅ **<1s** per test file
- ✅ **100%** CI pass rate
- ✅ **90%** mutation score (PIT/Stryker)

### Performance Benchmarks

- ⚡ **<50ms** useKV operations
- ⚡ **<300ms** Hue API calls
- ⚡ **<500ms** device discovery scans
- ⚡ **<100ms** automation checks
- ⚡ **<1s** full page render

## 🔧 Tooling Recommendations

### Test Runners

**Current**: Vitest ✅ (already configured)

- Fast (Vite-powered)
- TypeScript support
- Jest-compatible API
- UI mode for debugging

### Component Testing

**Current**: @testing-library/react ✅ (partially used)

- Encourages accessible tests
- User-centric queries
- No implementation details

### API Mocking

**Recommended**: MSW (Mock Service Worker)

```bash
npm install --save-dev msw
```

**Why**: Network-level mocking (browser + Node.js)

### E2E Testing

**Recommended**: Playwright (for future)

```bash
npm install --save-dev @playwright/test
```

**Why**: Fast, reliable, great DX

### Visual Regression

**Recommended**: Percy or Chromatic (for future)

- Catch UI regressions
- Screenshot comparison
- CI integration

## 📚 Best Practices

### 1. Test Naming Convention

```typescript
describe('[Component/Service/Hook Name]', () => {
  describe('[Feature/Function Name]', () => {
    it('should [expected behavior]', () => {
      // Test implementation
    })
  })
})
```

### 2. AAA Pattern

```typescript
it('should turn on light', async () => {
  // Arrange
  const device = createMockDevice({ enabled: false })

  // Act
  await toggleDevice(device.id)

  // Assert
  expect(device.enabled).toBe(true)
})
```

### 3. Test Isolation

- ✅ Each test is independent
- ✅ No shared mutable state
- ✅ Clean up after each test
- ✅ Mock external dependencies

### 4. Avoid Implementation Details

```typescript
// ❌ Bad: Testing implementation
it('should call setState with true', () => {
  expect(setState).toHaveBeenCalledWith(true)
})

// ✅ Good: Testing behavior
it('should show device as on', () => {
  expect(screen.getByText('On')).toBeInTheDocument()
})
```

### 5. Use Data-Testid Sparingly

```typescript
// ✅ Prefer: Accessible queries
screen.getByRole('button', { name: /turn on/i })
screen.getByLabelText(/brightness/i)

// ⚠️ Only when necessary:
screen.getByTestId('device-card-light-1')
```

## 🚀 Quick Start

### Run All Tests

```bash
npm test
```

### Run with UI

```bash
npm run test:ui
```

### Run Single File

```bash
npm test -- src/hooks/use-kv.test.ts
```

### Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm run test:coverage
```

### CI Mode

```bash
npm run test:run
```

## 📊 Test Status Dashboard

| Test Suite          | Status         | Coverage | Priority    |
| ------------------- | -------------- | -------- | ----------- |
| useKV Hook          | 🔴 Not Started | 0%       | 🔥 CRITICAL |
| HTTPScanner         | 🔴 Not Started | 0%       | 🔥 CRITICAL |
| HueBridgeAdapter    | 🔴 Not Started | 0%       | 🔥 CRITICAL |
| Dashboard           | 🔴 Not Started | 0%       | 🟡 High     |
| Rooms               | 🔴 Not Started | 0%       | 🟡 High     |
| Scenes              | 🔴 Not Started | 0%       | 🟡 High     |
| Automations         | 🔴 Not Started | 0%       | 🟡 High     |
| Scheduler           | 🔴 Not Started | 0%       | 🟠 Medium   |
| Condition Evaluator | 🔴 Not Started | 0%       | 🟠 Medium   |
| Action Executor     | 🔴 Not Started | 0%       | 🟠 Medium   |
| Flow Interpreter    | 🔴 Not Started | 0%       | 🟠 Medium   |
| Geofence            | 🔴 Not Started | 0%       | 🟠 Medium   |
| SecurityCameras     | 🟢 Complete    | 85%      | 🟢 Low      |
| Mock Data           | 🟢 Complete    | 95%      | 🟢 Low      |

## 🎯 Next Actions

### Immediate (This Week)

1. **Set up test infrastructure** (4 hours)
   - Install testing-library packages
   - Configure MSW for API mocking
   - Create test utilities

2. **Write useKV tests** (8 hours)
   - Critical path for entire app
   - Blocks all other tests

3. **Write HTTPScanner tests** (8 hours)
   - Device discovery validation
   - Network error handling

### Next Week

4. **Write HueBridgeAdapter tests** (8 hours)
   - Light control validation
   - Performance benchmarks

5. **Write Dashboard tests** (8 hours)
   - Primary user interface
   - High interaction coverage

### This Month

6. **Complete Tier 1 & 2** (80 hours)
   - Critical path: 90%+ coverage
   - Feature tests: 80%+ coverage

7. **Set up CI/CD** (8 hours)
   - GitHub Actions
   - Coverage reporting
   - Automated test runs

## 📖 References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Kent C. Dodds Testing Blog](https://kentcdodds.com/blog/?q=testing)

---

**Remember**: Perfect coverage is not the goal. **Confidence** is the goal. Focus on critical paths first, then expand coverage as time allows.
