# HomeHub Testing Guide

**Purpose**: Comprehensive guide for writing tests in HomeHub using Vitest.

**Last Updated**: October 16, 2025

---

## Table of Contents

- [Testing Stack](#testing-stack)
- [Test File Structure](#test-file-structure)
- [Component Testing](#component-testing)
- [Hook Testing](#hook-testing)
- [Service Testing](#service-testing)
- [Integration Testing](#integration-testing)
- [Mocking Patterns](#mocking-patterns)
- [Running Tests](#running-tests)

---

## Testing Stack

- **Test Runner**: Vitest (Vite-native, faster than Jest)
- **React Testing**: @testing-library/react
- **Assertions**: Vitest's expect API (Jest-compatible)
- **Mocking**: Vitest vi.mock()
- **Coverage**: c8 via Vitest

**Configuration**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

---

## Test File Structure

### Naming Convention

```
src/
├── components/
│   ├── Dashboard.tsx
│   └── Dashboard.test.tsx         # Component tests
├── hooks/
│   ├── use-kv.ts
│   └── use-kv.test.ts             # Hook tests
├── services/
│   ├── devices/
│   │   ├── HueBridgeAdapter.ts
│   │   └── HueBridgeAdapter.test.ts # Service tests
└── test/
    ├── setup.ts                    # Test setup/globals
    └── utils.tsx                   # Test utilities
```

### Test File Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ComponentToTest } from './ComponentToTest'

describe('ComponentToTest', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should render correctly', () => {
    // Test implementation
  })

  it('should handle user interaction', async () => {
    // Async test implementation
  })
})
```

---

## Component Testing

### Pattern 1: Basic Rendering Test

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeviceCard } from './DeviceCard'
import type { Device } from '@/types'

describe('DeviceCard', () => {
  const mockDevice: Device = {
    id: '1',
    name: 'Living Room Light',
    type: 'light',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'hue',
  }

  it('should render device information', () => {
    render(<DeviceCard device={mockDevice} />)

    expect(screen.getByText('Living Room Light')).toBeInTheDocument()
    expect(screen.getByText('Living Room')).toBeInTheDocument()
  })

  it('should show online status', () => {
    render(<DeviceCard device={mockDevice} />)

    const statusBadge = screen.getByTestId('status-badge')
    expect(statusBadge).toHaveClass('bg-green-500')
  })
})
```

### Pattern 2: Event Handler Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeviceCard } from './DeviceCard'

describe('DeviceCard interactions', () => {
  it('should call onToggle when button is clicked', () => {
    const mockOnToggle = vi.fn()
    render(<DeviceCard device={mockDevice} onToggle={mockOnToggle} />)

    const toggleButton = screen.getByRole('button', { name: /turn off/i })
    fireEvent.click(toggleButton)

    expect(mockOnToggle).toHaveBeenCalledWith('1')
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('should disable button when loading', () => {
    render(<DeviceCard device={mockDevice} isLoading={true} />)

    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toBeDisabled()
  })
})
```

### Pattern 3: Async Operations

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'

// Mock the service
vi.mock('@/services/devices/HueBridgeAdapter', () => ({
  HueBridgeAdapter: {
    setLightState: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('Dashboard async operations', () => {
  it('should update device state after API call', async () => {
    render(<Dashboard />)

    const toggleButton = screen.getByRole('button', { name: /turn on/i })
    fireEvent.click(toggleButton)

    // Wait for async state update
    await waitFor(() => {
      expect(screen.getByText(/turn off/i)).toBeInTheDocument()
    })
  })

  it('should show error toast on API failure', async () => {
    const { HueBridgeAdapter } = await import('@/services/devices/HueBridgeAdapter')
    HueBridgeAdapter.setLightState = vi.fn().mockRejectedValue(new Error('API Error'))

    render(<Dashboard />)

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to control/i)).toBeInTheDocument()
    })
  })
})
```

---

## Hook Testing

### Pattern 1: Testing Custom Hooks

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKV } from './use-kv'

describe('useKV hook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useKV<string>('test-key', 'default'))

    expect(result.current[0]).toBe('default')
  })

  it('should update value', () => {
    const { result } = renderHook(() => useKV<number>('counter', 0))

    act(() => {
      result.current[1](5)
    })

    expect(result.current[0]).toBe(5)
  })

  it('should update with function updater', () => {
    const { result } = renderHook(() => useKV<number>('counter', 0))

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(1)
  })
})
```

### Pattern 2: Testing Hooks with Dependencies

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDeviceControl } from './use-device-control'

vi.mock('@/services/devices/HueBridgeAdapter')

describe('useDeviceControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should control device successfully', async () => {
    const { result } = renderHook(() => useDeviceControl())

    await result.current.controlDevice('device-1', true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })
})
```

---

## Service Testing

### Pattern 1: Testing Static Service Methods

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HueBridgeAdapter } from './HueBridgeAdapter'

// Mock fetch globally
global.fetch = vi.fn()

describe('HueBridgeAdapter', () => {
  beforeEach(() => {
    HueBridgeAdapter.registerBridge('bridge-1', 'http://192.168.1.2', 'test-username')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should set light state', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ success: { '/lights/1/state/on': true } }],
    })

    await HueBridgeAdapter.setLightState('bridge-1', 1, { on: true })

    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.1.2/api/test-username/lights/1/state',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ on: true }),
      })
    )
  })

  it('should throw on API error', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    })

    await expect(HueBridgeAdapter.setLightState('bridge-1', 1, { on: true })).rejects.toThrow(
      'Hue API error'
    )
  })
})
```

### Pattern 2: Testing Discovery Services

```typescript
import { describe, it, expect, vi } from 'vitest'
import { HTTPScanner } from './HTTPScanner'

global.fetch = vi.fn()

describe('HTTPScanner', () => {
  it('should discover Shelly device', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: 'SHSW-25',
        name: 'My Shelly',
        ison: true,
      }),
    })

    const devices = await HTTPScanner.scan('192.168.1.100', '192.168.1.100')

    expect(devices).toHaveLength(1)
    expect(devices[0]).toMatchObject({
      name: 'My Shelly',
      type: 'light',
      protocol: 'http',
    })
  })

  it('should handle scan timeout gracefully', async () => {
    ;(fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves

    const devices = await HTTPScanner.scan('192.168.1.1', '192.168.1.1', 100)

    expect(devices).toEqual([])
  })
})
```

---

## Integration Testing

### Pattern 1: Component + Hook Integration

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'

describe('Dashboard integration', () => {
  it('should load devices and allow toggling', async () => {
    render(<Dashboard />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/living room light/i)).toBeInTheDocument()
    })

    // Toggle device
    const toggleButton = screen.getByRole('button', { name: /turn off/i })
    fireEvent.click(toggleButton)

    // Verify state change
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /turn on/i })).toBeInTheDocument()
    })
  })
})
```

### Pattern 2: Full User Flow

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { App } from './App'

describe('Scene activation flow', () => {
  it('should activate scene and update all devices', async () => {
    render(<App />)

    // Navigate to Scenes tab
    fireEvent.click(screen.getByRole('button', { name: /scenes/i }))

    // Activate "Movie Time" scene
    fireEvent.click(screen.getByRole('button', { name: /movie time/i }))

    // Verify toast notification
    await waitFor(() => {
      expect(screen.getByText(/scene activated/i)).toBeInTheDocument()
    })

    // Navigate back to Dashboard
    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }))

    // Verify devices updated
    await waitFor(() => {
      expect(screen.getByText(/living room light/i)).toHaveTextContent(/dim/)
    })
  })
})
```

---

## Mocking Patterns

### Pattern 1: Mock useKV Hook

```typescript
import { vi } from 'vitest'

vi.mock('@/hooks/use-kv', () => ({
  useKV: vi.fn((key, defaultValue) => {
    const [state, setState] = useState(defaultValue)
    return [state, setState]
  }),
}))
```

### Pattern 2: Mock Services

```typescript
vi.mock('@/services/devices/HueBridgeAdapter', () => ({
  HueBridgeAdapter: {
    setLightState: vi.fn().mockResolvedValue(undefined),
    getLightState: vi.fn().mockResolvedValue({ on: true, bri: 254 }),
  },
}))
```

### Pattern 3: Mock localStorage

```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as any
```

### Pattern 4: Mock fetch

```typescript
global.fetch = vi.fn((url, options) => {
  if (url.includes('/api/lights')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ state: { on: true } }),
    })
  }
  return Promise.reject(new Error('Not Found'))
})
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run in watch mode (during development)
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm test Dashboard.test.tsx

# Run tests matching pattern
npm test -- --grep "device control"
```

### Coverage Thresholds

Add to `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
})
```

---

## Best Practices

### ✅ DO

1. **Test User Behavior**, not implementation details
2. **Use data-testid** for complex selectors
3. **Mock External Dependencies** (APIs, services)
4. **Test Error States** and edge cases
5. **Keep Tests Isolated** - each test should run independently
6. **Use Descriptive Test Names** - "should X when Y"

### ❌ DON'T

1. **Don't test implementation details** (internal state, functions)
2. **Don't test external libraries** (React, Framer Motion, etc.)
3. **Don't write tests that test the test** (circular logic)
4. **Don't skip cleanup** - use afterEach for cleanup
5. **Don't use setTimeout** - use waitFor instead

---

## Test Examples by Feature

### Device Control

```typescript
it('should control Hue device via adapter', async () => {
  const device = createMockDevice({ protocol: 'hue' })
  await controlDevice(device, true)
  expect(HueBridgeAdapter.setLightState).toHaveBeenCalled()
})
```

### Room Management

```typescript
it('should filter devices by room', () => {
  const room = { id: '1', name: 'Living Room', deviceIds: ['device-1'] }
  const devices = [
    { id: 'device-1', room: 'Living Room' },
    { id: 'device-2', room: 'Bedroom' },
  ]
  const filtered = getRoomDevices(room, devices)
  expect(filtered).toHaveLength(1)
})
```

### Scene Activation

```typescript
it('should apply scene to all devices', async () => {
  const scene = {
    deviceStates: [
      { deviceId: '1', enabled: true, value: 50 },
      { deviceId: '2', enabled: false },
    ],
  }
  await activateScene(scene, setDevices)
  expect(setDevices).toHaveBeenCalled()
})
```

---

**Note**: For automation engine test examples, see `docs/development/AUTOMATION_ENGINE_COMPLETE.md`.
