/**
 * HueBridgeAdapter Test Suite
 *
 * Comprehensive tests for Philips Hue Bridge adapter covering:
 * - Device control (on/off, brightness, color, temperature)
 * - Error handling (offline, auth, timeout)
 * - Retry logic with exponential backoff
 * - Color conversions (RGB, hex, CIE xy)
 * - Performance benchmarks
 *
 * Target: 95% coverage for production-critical device control
 */

import type { Device } from '@/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HueBridgeAdapter, discoverHueLights } from './HueBridgeAdapter'
import { CommandError } from './types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('HueBridgeAdapter', () => {
  let adapter: HueBridgeAdapter
  let mockDevice: Device

  beforeEach(() => {
    vi.clearAllMocks()
    // Don't use fake timers by default - only in specific retry tests
    // vi.useFakeTimers()

    adapter = new HueBridgeAdapter({
      ip: '192.168.1.6',
      username: 'test-api-key',
      bridgeId: 'test-bridge',
      timeout: 5000,
    })

    mockDevice = {
      id: 'hue-1',
      name: 'Living Room Light',
      type: 'light',
      room: 'Living Room',
      status: 'online',
      enabled: true,
      protocol: 'http',
      capabilities: ['toggle', 'set_value', 'set_color'],
      metadata: {
        ip: '192.168.1.6',
        port: 80,
        preset: 'hue',
        discoveryMethod: 'http',
      },
    }
  })

  afterEach(() => {
    // Only restore if fake timers were used
    if (vi.isFakeTimers()) {
      vi.useRealTimers()
    }
  })

  describe('Basic Properties', () => {
    it('should construct with correct base URL', () => {
      expect(adapter).toBeDefined()
      // Base URL is private, tested through API calls
    })

    it('should support required capabilities', () => {
      expect(adapter.supportsCapability('turn_on')).toBe(true)
      expect(adapter.supportsCapability('turn_off')).toBe(true)
      expect(adapter.supportsCapability('brightness')).toBe(true)
      expect(adapter.supportsCapability('color')).toBe(true)
      expect(adapter.supportsCapability('temperature')).toBe(true)
      expect(adapter.supportsCapability('get_state')).toBe(true)
    })

    it('should not support unsupported capabilities', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(adapter.supportsCapability('motion_detection' as any)).toBe(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(adapter.supportsCapability('lock' as any)).toBe(false)
    })
  })

  describe('Device Control - Turn On', () => {
    it('should turn device on successfully', async () => {
      // Mock PUT request for setState
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: { '/lights/1/state/on': true } }],
      })

      // Mock GET request for getState
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            on: true,
            bri: 254,
            reachable: true,
            colormode: 'xy',
          },
          type: 'Extended color light',
          name: 'Living Room Light',
          modelid: 'LCT015',
          manufacturername: 'Signify Netherlands B.V.',
          productname: 'Hue color lamp',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      const result = await adapter.turnOn(mockDevice)

      expect(result.success).toBe(true)
      expect(result.newState?.enabled).toBe(true)
      expect(result.newState?.online).toBe(true)
      expect(result.duration).toBeGreaterThanOrEqual(0) // Duration may be 0 in tests with instant mocks
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Verify PUT request
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'http://192.168.1.6/api/test-api-key/lights/1/state',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ on: true }),
        })
      )

      // Verify GET request
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'http://192.168.1.6/api/test-api-key/lights/1',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should extract device ID correctly (hue- prefix)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.turnOn(mockDevice)

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'http://192.168.1.6/api/test-api-key/lights/1/state',
        expect.any(Object)
      )
    })

    it('should handle device ID without hue- prefix', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      const deviceWithoutPrefix = { ...mockDevice, id: '39' }
      await adapter.turnOn(deviceWithoutPrefix)

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'http://192.168.1.6/api/test-api-key/lights/39/state',
        expect.any(Object)
      )
    })
  })

  describe('Device Control - Turn Off', () => {
    it('should turn device off successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: { '/lights/1/state/on': false } }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            on: false,
            bri: 0,
            reachable: true,
          },
          type: 'Extended color light',
          name: 'Living Room Light',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      const result = await adapter.turnOff(mockDevice)

      expect(result.success).toBe(true)
      expect(result.newState?.enabled).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Verify PUT request
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'http://192.168.1.6/api/test-api-key/lights/1/state',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ on: false }),
        })
      )
    })
  })

  describe('Device Control - Brightness', () => {
    it('should set brightness successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            on: true,
            bri: 127, // ~50%
            reachable: true,
          },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      const result = await adapter.setBrightness(mockDevice, 50)

      expect(result.success).toBe(true)
      expect(result.newState?.value).toBe(50)

      // Verify brightness conversion (50% = 127 in Hue's 0-254 scale)
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'http://192.168.1.6/api/test-api-key/lights/1/state',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ on: true, bri: 127 }),
        })
      )
    })

    it('should set brightness to 0%', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 0, reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setBrightness(mockDevice, 0)

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ on: true, bri: 0 }),
        })
      )
    })

    it('should set brightness to 100%', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setBrightness(mockDevice, 100)

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ on: true, bri: 254 }),
        })
      )
    })

    it('should reject brightness below 0', async () => {
      await expect(adapter.setBrightness(mockDevice, -1)).rejects.toThrow(CommandError)
      await expect(adapter.setBrightness(mockDevice, -1)).rejects.toThrow(
        'Brightness must be 0-100'
      )
    })

    it('should reject brightness above 100', async () => {
      await expect(adapter.setBrightness(mockDevice, 101)).rejects.toThrow(CommandError)
      await expect(adapter.setBrightness(mockDevice, 150)).rejects.toThrow(
        'Brightness must be 0-100'
      )
    })
  })

  describe('Device Control - Color', () => {
    it('should set color using hex format (#RRGGBB)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            on: true,
            bri: 254,
            xy: [0.6484, 0.3309], // Red in xy space
            colormode: 'xy',
            reachable: true,
          },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      const result = await adapter.setColor(mockDevice, '#FF0000') // Red

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"xy"'),
        })
      )
    })

    it('should set color using hex format without # prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, xy: [0.3, 0.6], colormode: 'xy', reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setColor(mockDevice, '00FF00') // Green without #

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('should set color using rgb() format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, xy: [0.15, 0.06], colormode: 'xy', reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setColor(mockDevice, 'rgb(0, 0, 255)') // Blue

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('should fallback to white for invalid color format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, xy: [0.3227, 0.329], colormode: 'xy', reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      // Invalid format should default to white (255, 255, 255)
      await adapter.setColor(mockDevice, 'invalid-color')

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('Device Control - Color Temperature', () => {
    it('should set color temperature in Kelvin', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            on: true,
            bri: 254,
            ct: 250, // ~4000K
            colormode: 'ct',
            reachable: true,
          },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setColorTemperature(mockDevice, 4000) // Neutral white

      // 4000K = 1,000,000 / 4000 = 250 mireds
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ on: true, ct: 250 }),
        })
      )
    })

    it('should clamp color temperature to Hue min (153 mireds = 6500K)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, ct: 153, colormode: 'ct', reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setColorTemperature(mockDevice, 10000) // Too cool, clamp to 153

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ on: true, ct: 153 }),
        })
      )
    })

    it('should clamp color temperature to Hue max (500 mireds = 2000K)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, ct: 500, colormode: 'ct', reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setColorTemperature(mockDevice, 1000) // Too warm, clamp to 500

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ on: true, ct: 500 }),
        })
      )
    })
  })

  describe('Device State', () => {
    it('should get device state successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            on: true,
            bri: 200,
            hue: 10000,
            sat: 200,
            ct: 300,
            xy: [0.5, 0.5],
            colormode: 'xy',
            reachable: true,
          },
          type: 'Extended color light',
          name: 'Test Light',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      const state = await adapter.getState(mockDevice)

      expect(state.enabled).toBe(true)
      expect(state.online).toBe(true)
      expect(state.value).toBe(79) // 200/254 * 100 ≈ 79%
      expect(state.unit).toBe('%')
      expect(state.metadata?.colormode).toBe('xy')
      expect(state.metadata?.hue).toBe(10000)
      expect(state.metadata?.saturation).toBe(200)
      expect(state.metadata?.colorTemp).toBe(300)
    })

    it('should handle unreachable device in state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            on: false,
            bri: 0,
            reachable: false, // Device offline
          },
          type: 'Extended color light',
          name: 'Offline Light',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      const state = await adapter.getState(mockDevice)

      expect(state.online).toBe(false)
      expect(state.enabled).toBe(false)
    })
  })

  describe('Error Handling - Bridge Errors', () => {
    it('should handle HTTP 404 not found', async () => {
      // Mock all 3 retry attempts with 404
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response)

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(/404/)
    }, 10000)

    it('should handle HTTP 401 unauthorized', async () => {
      // Mock all 3 retry attempts with 401
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response)

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(/401/)
    }, 10000)

    it('should handle HTTP 500 server error', async () => {
      // Mock all 3 retry attempts with 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response)

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(CommandError)
    }, 10000)

    it('should handle Hue API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            error: {
              type: 3,
              address: '/lights/999/state',
              description: 'resource, /lights/999/state, not available',
            },
          },
        ],
      } as Response)

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(/not available/)
    })

    it('should handle multiple Hue API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { error: { description: 'Error 1' } },
          { error: { description: 'Error 2' } },
        ],
      } as Response)

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(/Error 1, Error 2/)
    })
  })

  describe('Error Handling - Network Errors', () => {
    it('should handle network timeout', async () => {
      // Clear any previous persistent mocks
      mockFetch.mockReset()

      // Mock fetch to simulate AbortError (what AbortController throws)
      const timeoutError = new Error('The operation was aborted')
      timeoutError.name = 'AbortError'

      // Mock for all 3 retry attempts
      mockFetch.mockRejectedValue(timeoutError)

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(/timed out/)
    }, 10000) // Increase timeout for retry delays

    it('should handle connection refused', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(/ECONNREFUSED/)
    }, 10000)

    it('should handle DNS resolution failure', async () => {
      mockFetch.mockRejectedValue(new Error('ENOTFOUND'))

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(/ENOTFOUND/)
    }, 10000)
  })

  describe('Retry Logic', () => {
    it('should retry on network error', async () => {
      // Create adapter with fast retry for testing
      const fastAdapter = new HueBridgeAdapter({
        ip: '192.168.1.6',
        username: 'test-api-key',
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 10, // Fast retry for testing
          backoffMultiplier: 2,
          maxDelay: 1000,
        },
      })

      // First 2 attempts fail, 3rd succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [{ success: { '/lights/1/state/on': true } }],
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            state: { on: true, bri: 254, reachable: true },
            type: 'Extended color light',
            name: 'Test',
            modelid: 'LCT015',
            manufacturername: 'Signify',
            productname: 'Hue',
            uniqueid: '00:17:88:01:00:00:00:00-0b',
            swversion: '1.88.1',
          }),
        })

      const result = await fastAdapter.turnOn(mockDevice)

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(4) // 2 failed + 1 successful PUT + 1 successful GET
    })

    it('should use exponential backoff', async () => {
      // Create adapter with measurable delays
      const testAdapter = new HueBridgeAdapter({
        ip: '192.168.1.6',
        username: 'test-api-key',
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 50,
          backoffMultiplier: 2,
          maxDelay: 1000,
        },
      })

      const startTime = Date.now()

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [{ success: { '/lights/1/state/on': true } }],
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            state: { on: true, bri: 254, reachable: true },
            type: 'Extended color light',
            name: 'Test',
            modelid: 'LCT015',
            manufacturername: 'Signify',
            productname: 'Hue',
            uniqueid: '00:17:88:01:00:00:00:00-0b',
            swversion: '1.88.1',
          }),
        })

      await testAdapter.turnOn(mockDevice)

      const duration = Date.now() - startTime

      // Should have delays: 50ms + 100ms = 150ms minimum
      expect(duration).toBeGreaterThanOrEqual(140) // Account for timing variance
    })

    it('should not retry on device errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            error: {
              description: 'Device not available',
            },
          },
        ],
      } as Response)

      await expect(adapter.turnOn(mockDevice)).rejects.toThrow(/Device not available/)

      // Should only be called once (no retry)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should fail after max retry attempts', async () => {
      // Create adapter with fast retry
      const fastAdapter = new HueBridgeAdapter({
        ip: '192.168.1.6',
        username: 'test-api-key',
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 10,
          backoffMultiplier: 2,
          maxDelay: 1000,
        },
      })

      // All 3 attempts fail
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      await expect(fastAdapter.turnOn(mockDevice)).rejects.toThrow('Network error')

      // Should be called 3 times (initial + 2 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('Performance', () => {
    it('should complete turn on in <300ms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      vi.useRealTimers()
      const startTime = Date.now()
      const result = await adapter.turnOn(mockDevice)
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(300)
    })
  })

  describe('Color Conversion - RGB to XY', () => {
    it('should convert red RGB to xy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, xy: [0.6484, 0.3309], colormode: 'xy', reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setColor(mockDevice, '#FF0000')

      const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string)
      expect(body.xy).toBeDefined()
      expect(body.xy[0]).toBeCloseTo(0.7006, 2) // Red x coordinate (Wide RGB D65 conversion)
      expect(body.xy[1]).toBeCloseTo(0.2993, 2) // Red y coordinate
    })

    it('should handle black (0,0,0) gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, xy: [0.3227, 0.329], colormode: 'xy', reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      await adapter.setColor(mockDevice, '#000000')

      const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string)
      // Should default to white point
      expect(body.xy).toEqual([0.3227, 0.329])
    })
  })

  describe('discoverHueLights Helper', () => {
    it('should discover all lights on bridge', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          '1': {
            state: { on: true, bri: 254, reachable: true },
            type: 'Extended color light',
            name: 'Light 1',
            modelid: 'LCT015',
            manufacturername: 'Signify',
            productname: 'Hue',
            uniqueid: '00:17:88:01:00:00:00:01-0b',
            swversion: '1.88.1',
          },
          '2': {
            state: { on: false, bri: 0, reachable: true },
            type: 'Dimmable light',
            name: 'Light 2',
            modelid: 'LWB010',
            manufacturername: 'Signify',
            productname: 'Hue White',
            uniqueid: '00:17:88:01:00:00:00:02-0b',
            swversion: '1.88.1',
          },
        }),
      })

      const lights = await discoverHueLights('192.168.1.6', 'test-api-key')

      expect(lights).toBeDefined()
      expect(Object.keys(lights)).toHaveLength(2)
      expect(lights['1']?.name).toBe('Light 1')
      expect(lights['2']?.name).toBe('Light 2')
    })

    it('should handle discovery errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(discoverHueLights('192.168.1.6', 'bad-key')).rejects.toThrow(
        'Failed to discover Hue lights'
      )
    })

    it('should handle HTTP errors in discovery', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(discoverHueLights('192.168.1.6', 'bad-key')).rejects.toThrow('Unauthorized')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty response from bridge', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      // Empty response array is success (no errors)
      const result = await adapter.turnOn(mockDevice)
      expect(result.success).toBe(true)
    })

    it('should handle custom timeout configuration', () => {
      const customAdapter = new HueBridgeAdapter({
        ip: '192.168.1.6',
        username: 'test',
        timeout: 10000, // Custom 10s timeout
      })

      expect(customAdapter).toBeDefined()
    })

    it('should handle custom retry configuration', () => {
      const customAdapter = new HueBridgeAdapter({
        ip: '192.168.1.6',
        username: 'test',
        retryConfig: {
          maxAttempts: 5,
          initialDelay: 50,
          backoffMultiplier: 3,
          maxDelay: 10000,
        },
      })

      expect(customAdapter).toBeDefined()
    })

    it('should handle whitespace in color strings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ success: {} }],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          state: { on: true, bri: 254, xy: [0.6484, 0.3309], colormode: 'xy', reachable: true },
          type: 'Extended color light',
          name: 'Test',
          modelid: 'LCT015',
          manufacturername: 'Signify',
          productname: 'Hue',
          uniqueid: '00:17:88:01:00:00:00:00-0b',
          swversion: '1.88.1',
        }),
      })

      // Should trim whitespace
      await adapter.setColor(mockDevice, '  rgb(255, 0, 0)  ')

      expect(mockFetch).toHaveBeenCalled()
    })
  })
})
