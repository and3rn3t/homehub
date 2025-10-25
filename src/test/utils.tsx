/**
 * Test Utilities
 *
 * Common test helpers, mock factories, and render utilities.
 *
 * @author HomeHub Team
 * @date October 13, 2025
 */

import type { Automation, Device, Flow, Geofence, Room, Scene } from '@/types'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { vi } from 'vitest'

// ===================================================================
// RENDER UTILITIES
// ===================================================================

/**
 * Custom render with providers (if needed in future)
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options })
}

// ===================================================================
// MOCK FACTORIES
// ===================================================================

/**
 * Create a mock device with sensible defaults
 */
export function createMockDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 'test-device-1',
    name: 'Test Light',
    type: 'light',
    room: 'living-room',
    status: 'online',
    enabled: false,
    protocol: 'http',
    ipAddress: '192.168.1.100',
    ...overrides,
  } as Device
}

/**
 * Create a mock automation with sensible defaults
 */
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

/**
 * Create a mock scene with sensible defaults
 */
export function createMockScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'test-scene-1',
    name: 'Test Scene',
    icon: 'sun',
    enabled: true,
    deviceStates: [{ deviceId: 'light-1', enabled: true, value: 100 }],
    ...overrides,
  } as Scene
}

/**
 * Create a mock room with sensible defaults
 */
export function createMockRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'test-room-1',
    name: 'Test Room',
    icon: 'home',
    deviceIds: [],
    color: '#3b82f6',
    ...overrides,
  } as Room
}

/**
 * Create a mock geofence with sensible defaults
 */
export function createMockGeofence(overrides: Partial<Geofence> = {}): Geofence {
  return {
    id: 'test-geofence-1',
    name: 'Test Geofence',
    type: 'home',
    enabled: true,
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 100,
    triggerMode: 'enter',
    actions: [{ deviceId: 'light-1', action: 'turn_on' }],
    ...overrides,
  } as Geofence
}

/**
 * Create a mock flow with sensible defaults
 */
export function createMockFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    id: 'test-flow-1',
    name: 'Test Flow',
    enabled: true,
    created: new Date().toISOString(),
    nodes: [],
    ...overrides,
  } as Flow
}

// ===================================================================
// TEST HELPERS
// ===================================================================

/**
 * Wait for async updates to complete
 */
export async function waitForAsync(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Wait for a specific duration
 */
export async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock localStorage for tests
 */
export function mockLocalStorage(): void {
  const storage: Record<string, string> = {}

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
      removeItem: (key: string) => {
        delete storage[key]
      },
      clear: () => {
        Object.keys(storage).forEach(key => delete storage[key])
      },
    },
    writable: true,
  })
}

/**
 * Mock sessionStorage for tests
 */
export function mockSessionStorage(): void {
  const storage: Record<string, string> = {}

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
      removeItem: (key: string) => {
        delete storage[key]
      },
      clear: () => {
        Object.keys(storage).forEach(key => delete storage[key])
      },
    },
    writable: true,
  })
}

/**
 * Mock fetch API for tests
 */
export function mockFetch(responses: Record<string, unknown> = {}) {
  const mock = vi.fn((url: string) => {
    const response = responses[url]
    if (response instanceof Error) {
      return Promise.reject(response)
    }
    return Promise.resolve({
      ok: true,
      json: async () => response,
      text: async () => JSON.stringify(response),
    })
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.fetch = mock as any
  return mock
}

/**
 * Create a spy on console methods to suppress logs in tests
 */
export function suppressConsoleLogs(): void {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}

/**
 * Restore console methods
 */
export function restoreConsoleLogs(): void {
  vi.restoreAllMocks()
}
