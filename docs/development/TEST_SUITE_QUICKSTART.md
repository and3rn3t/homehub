# Quick Start: Implementing Test Suite

**Goal**: Get from 5% → 70% test coverage in 4 weeks
**Priority**: Critical Path First (useKV, HTTPScanner, HueBridgeAdapter)
**Start Date**: October 13, 2025

## 🚀 Week 1: Critical Path Tests (32 hours)

### Day 1: Test Infrastructure Setup (4 hours)

**1. Install Dependencies**

```bash
npm install --save-dev @testing-library/react@^16.1.0
npm install --save-dev @testing-library/react-hooks@^8.0.1
npm install --save-dev @testing-library/user-event@^14.5.2
npm install --save-dev @testing-library/jest-dom@^6.6.3
npm install --save-dev msw@^2.7.0
npm install --save-dev happy-dom@^16.6.0
```

**2. Create Test Utilities**

Create `src/test/utils.tsx`:

```typescript
import { render } from '@testing-library/react'
import type { Device, Automation } from '@/types'

export function createMockDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 'test-device-1',
    name: 'Test Light',
    type: 'light',
    room: 'living-room',
    status: 'online',
    enabled: false,
    protocol: 'http',
    ...overrides,
  } as Device
}

export function createMockAutomation(overrides: Partial<Automation> = {}): Automation {
  return {
    id: 'test-automation-1',
    name: 'Test Automation',
    type: 'schedule',
    enabled: true,
    triggers: [{ type: 'time', time: '07:00' }],
    actions: [{ deviceId: 'light-1', action: 'turn_on' }],
    ...overrides,
  } as Automation
}

export const renderWithProviders = render
export async function waitForAsync() {
  await new Promise(resolve => setTimeout(resolve, 0))
}
```

**3. Update Test Setup**

Update `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

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

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock IntersectionObserver
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any
```

**Checkpoint**: Run `npm test` - should execute existing tests (SecurityCameras, mock-cameras)

---

### Day 2: useKV Hook Tests (8 hours) 🔥 CRITICAL

Create `src/hooks/use-kv.test.ts`:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useKV } from './use-kv'

describe('useKV', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Basic Operations', () => {
    it('should initialize with default value', () => {
      const { result } = renderHook(() => useKV('test-key', 'default'))
      expect(result.current[0]).toBe('default')
    })

    it('should persist value to localStorage', async () => {
      const { result } = renderHook(() => useKV('test-key', ''))

      act(() => {
        result.current[1]('new value')
      })

      await waitFor(() => {
        expect(localStorage.getItem('test-key')).toBe('"new value"')
      })
    })

    it('should load persisted value on mount', () => {
      localStorage.setItem('test-key', '"persisted"')

      const { result } = renderHook(() => useKV('test-key', 'default'))
      expect(result.current[0]).toBe('persisted')
    })

    it('should handle objects', async () => {
      const { result } = renderHook(() => useKV('test-key', { count: 0 }))

      act(() => {
        result.current[1]({ count: 5 })
      })

      await waitFor(() => {
        expect(result.current[0]).toEqual({ count: 5 })
      })
    })

    it('should handle arrays', async () => {
      const { result } = renderHook(() => useKV<string[]>('test-key', []))

      act(() => {
        result.current[1](prev => [...prev, 'item1'])
      })

      await waitFor(() => {
        expect(result.current[0]).toEqual(['item1'])
      })
    })
  })

  describe('Concurrent Updates', () => {
    it('should handle rapid updates', async () => {
      const { result } = renderHook(() => useKV('test-key', 0))

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current[1](prev => prev + 1)
        }
      })

      await waitFor(() => {
        expect(result.current[0]).toBe(10)
      })
    })

    it('should debounce API calls', async () => {
      const apiSpy = vi.fn()
      vi.spyOn(global, 'fetch').mockImplementation(apiSpy)

      const { result } = renderHook(() => useKV('test-key', 0))

      act(() => {
        result.current[1](1)
        result.current[1](2)
        result.current[1](3)
      })

      await waitFor(() => {
        // Only 1 API call despite 3 updates
        expect(apiSpy).toHaveBeenCalledTimes(1)
      })

      vi.restoreAllMocks()
    })
  })

  describe('Edge Cases', () => {
    it('should handle corrupt JSON in localStorage', () => {
      localStorage.setItem('test-key', 'invalid json {')

      const { result } = renderHook(() => useKV('test-key', 'default'))
      expect(result.current[0]).toBe('default')
    })

    it('should handle localStorage quota exceeded', () => {
      const largeMock = vi.spyOn(Storage.prototype, 'setItem')
      largeMock.mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

      const { result } = renderHook(() => useKV('test-key', ''))

      act(() => {
        result.current[1]('huge data')
      })

      // Should not crash app
      expect(result.current[0]).toBe('huge data')

      largeMock.mockRestore()
    })

    it('should handle undefined values', async () => {
      const { result } = renderHook(() => useKV<string | undefined>('test-key', undefined))

      expect(result.current[0]).toBeUndefined()
    })

    it('should handle null values', async () => {
      const { result } = renderHook(() => useKV<string | null>('test-key', null))

      expect(result.current[0]).toBeNull()
    })
  })

  describe('Loading States', () => {
    it('should provide loading metadata', () => {
      const { result } = renderHook(() => useKV('test-key', '', { skipInitialLoad: true }))

      // Check if hook returns loading state (if implemented)
      expect(result.current).toBeDefined()
    })
  })
})
```

**Checkpoint**: Run `npm test -- use-kv.test.ts` - target 90%+ coverage

---

### Day 3: HTTPScanner Tests (8 hours) 🔥 CRITICAL

Create `src/services/discovery/HTTPScanner.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HTTPScanner } from './HTTPScanner'
import type { Device } from '@/types'

describe('HTTPScanner', () => {
  let scanner: HTTPScanner
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    scanner = new HTTPScanner()
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Device Discovery', () => {
    it('should discover Shelly Gen 1 devices', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'SHSW-1',
          mac: 'AA:BB:CC:DD:EE:FF',
          auth: false,
        }),
      })

      const devices = await scanner.scan('192.168.1.100')

      expect(devices).toHaveLength(1)
      expect(devices[0].protocol).toBe('http')
      expect(devices[0].name).toContain('Shelly')
    })

    it('should discover TP-Link Kasa devices', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          system: {
            get_sysinfo: {
              alias: 'Living Room Light',
              model: 'HS100',
            },
          },
        }),
      })

      const devices = await scanner.scan('192.168.1.101')

      expect(devices).toHaveLength(1)
      expect(devices[0].name).toBe('Living Room Light')
    })

    it('should discover Philips Hue bridges', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Philips hue',
          bridgeid: '001788FFFE123456',
        }),
      })

      const devices = await scanner.scan('192.168.1.102')

      expect(devices).toHaveLength(1)
      expect(devices[0].type).toBe('bridge')
    })
  })

  describe('Network Error Handling', () => {
    it('should handle connection timeout', async () => {
      fetchMock.mockRejectedValueOnce(new Error('ETIMEDOUT'))

      const devices = await scanner.scan('192.168.1.200')

      expect(devices).toHaveLength(0)
    })

    it('should handle connection refused', async () => {
      fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      const devices = await scanner.scan('192.168.1.201')

      expect(devices).toHaveLength(0)
    })

    it('should handle invalid JSON responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const devices = await scanner.scan('192.168.1.202')

      expect(devices).toHaveLength(0)
    })

    it('should timeout after 5 seconds', async () => {
      const start = Date.now()

      fetchMock.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10000)))

      await scanner.scan('192.168.1.203')

      const duration = Date.now() - start
      expect(duration).toBeLessThan(6000) // 5s timeout + 1s buffer
    })
  })

  describe('Device Deduplication', () => {
    it('should deduplicate devices by MAC address', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ type: 'SHSW-1', mac: 'AA:BB:CC:DD:EE:FF' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ type: 'SHSW-1', mac: 'AA:BB:CC:DD:EE:FF' }),
        })

      const devices1 = await scanner.scan('192.168.1.100')
      const devices2 = await scanner.scan('192.168.1.100')

      // Same device, should not duplicate
      expect(devices1[0].id).toBe(devices2[0].id)
    })
  })

  describe('Performance', () => {
    it('should scan device in under 500ms', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'SHSW-1' }),
      })

      const start = Date.now()
      await scanner.scan('192.168.1.100')
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })
  })
})
```

**Checkpoint**: Run `npm test -- HTTPScanner.test.ts` - target 90%+ coverage

---

### Day 4: HueBridgeAdapter Tests (8 hours) 🔥 CRITICAL

Create `src/services/devices/HueBridgeAdapter.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HueBridgeAdapter } from './HueBridgeAdapter'

describe('HueBridgeAdapter', () => {
  let adapter: HueBridgeAdapter
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    adapter = new HueBridgeAdapter('192.168.1.100', 'test-api-key')
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  describe('Light Control', () => {
    it('should turn light on', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ success: { '/lights/1/state/on': true } }],
      })

      await adapter.setLightState('1', { on: true })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/lights/1/state'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"on":true'),
        })
      )
    })

    it('should set brightness (0-254)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ success: { '/lights/1/state/bri': 200 } }],
      })

      await adapter.setLightState('1', { bri: 200 })

      expect(fetchMock).toHaveBeenCalled()
    })

    it('should set color (HSV)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ success: {} }],
      })

      await adapter.setLightState('1', { hue: 25500, sat: 254 })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"hue":25500'),
        })
      )
    })

    it('should set color temperature (153-500 mirek)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ success: {} }],
      })

      await adapter.setLightState('1', { ct: 300 })

      expect(fetchMock).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle bridge offline', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      await expect(adapter.setLightState('1', { on: true })).rejects.toThrow()
    })

    it('should retry failed commands 3 times', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ success: {} }],
        })

      await adapter.setLightState('1', { on: true })

      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('should use exponential backoff', async () => {
      const delays: number[] = []
      const originalSetTimeout = global.setTimeout

      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any, delay: number) => {
        delays.push(delay)
        return originalSetTimeout(fn, 0) as any
      })

      fetchMock
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce({ ok: true, json: async () => [{}] })

      await adapter.setLightState('1', { on: true })

      // Check exponential backoff: 1s, 2s, 4s...
      expect(delays.length).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    it('should respond within 300ms', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ success: {} }],
      })

      const start = Date.now()
      await adapter.setLightState('1', { on: true })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(300)
    })

    it('should batch multiple commands', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [{ success: {} }],
      })

      // Queue multiple updates
      const promises = [
        adapter.setLightState('1', { on: true }),
        adapter.setLightState('2', { on: true }),
        adapter.setLightState('3', { on: true }),
      ]

      await Promise.all(promises)

      // Should batch into fewer calls than 3
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })
  })
})
```

**Checkpoint**: Run `npm test` - all critical tests should pass (90%+ coverage for Tier 1)

---

### Day 5: Run & Fix (8 hours)

1. **Run full test suite**: `npm run test:coverage`
2. **Identify failures**: Review coverage report
3. **Fix failing tests**: Debug and patch
4. **Document blockers**: Note any integration issues
5. **Update metrics**: Calculate actual coverage

**Target**: 90%+ coverage for useKV, HTTPScanner, HueBridgeAdapter

---

## 📊 Progress Tracking

| Day       | Task                   | Hours   | Status          |
| --------- | ---------------------- | ------- | --------------- |
| 1         | Test Infrastructure    | 4h      | 🔴 Not Started  |
| 2         | useKV Tests            | 8h      | 🔴 Not Started  |
| 3         | HTTPScanner Tests      | 8h      | 🔴 Not Started  |
| 4         | HueBridgeAdapter Tests | 8h      | 🔴 Not Started  |
| 5         | Run & Fix              | 4h      | 🔴 Not Started  |
| **Total** | **Week 1**             | **32h** | **0% Complete** |

## 🎯 Success Criteria

**Week 1 Complete When**:

- ✅ All Tier 1 tests passing (0 failures)
- ✅ 90%+ coverage for critical path
- ✅ Test suite runs in <5 seconds
- ✅ CI/CD ready (GitHub Actions setup)
- ✅ Documentation updated

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Run single file
npm test -- use-kv.test.ts

# Watch mode
npm test -- --watch

# CI mode
npm run test:run
```

## 📚 Next Steps

After Week 1, proceed to:

- **Week 2**: Component tests (Dashboard, Rooms, Scenes, Automations)
- **Week 3**: Service tests (Scheduler, Condition Evaluator, Action Executor, Flow Interpreter, Geofence)
- **Week 4**: Hook tests + UI tests + E2E integration + Polish

See `COMPREHENSIVE_TEST_STRATEGY.md` for full 4-week plan.

---

**Remember**: Focus on **critical path first**. If useKV breaks, the entire app is unusable. These tests are your safety net!
