/**
 * Shelly Device Adapter
 *
 * Implements device control for Shelly smart home devices via Gen2 RPC API.
 * Supports switches, lights, and other Shelly devices with HTTP control.
 *
 * API Documentation: https://shelly-api-docs.shelly.cloud/gen2/
 */

import type { Device } from '@/types'
import type {
  DeviceAdapter,
  DeviceAdapterOptions,
  DeviceCapability,
  DeviceCommandResult,
  DeviceState,
  RetryConfig,
} from './types'
import { CommandError, DEFAULT_RETRY_CONFIG } from './types'

/**
 * Shelly RPC API response types
 */
interface ShellyRPCResponse {
  was_on?: boolean
  output?: boolean
  brightness?: number
  [key: string]: unknown
}

/**
 * Adapter for Shelly Gen2 devices (Plus, Pro series)
 *
 * @example
 * ```typescript
 * const adapter = new ShellyAdapter('192.168.1.100', 80)
 * const result = await adapter.turnOn(device)
 * if (result.success) {
 *   console.log('Device turned on successfully')
 * }
 * ```
 */
export class ShellyAdapter implements DeviceAdapter {
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly retryConfig: RetryConfig
  private readonly debug: boolean

  constructor(ip: string, port: number = 80, options?: DeviceAdapterOptions) {
    this.baseUrl = `http://${ip}:${port}`
    this.timeout = options?.timeout ?? 5000
    this.debug = options?.debug ?? false
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      maxAttempts: options?.maxRetries ?? DEFAULT_RETRY_CONFIG.maxAttempts,
    }
  }

  /**
   * Execute HTTP request with retry logic and timeout
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    deviceId: string,
    operation: string
  ): Promise<T> {
    let lastError: Error | null = null
    let attempt = 0

    while (attempt < this.retryConfig.maxAttempts) {
      try {
        if (this.debug) {
          console.log(
            `[ShellyAdapter] Attempt ${attempt + 1}/${this.retryConfig.maxAttempts} - ${operation}`
          )
        }

        return await fn()
      } catch (error) {
        lastError = error as Error
        attempt++

        // Don't retry on last attempt
        if (attempt >= this.retryConfig.maxAttempts) {
          break
        }

        // Calculate exponential backoff delay
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        )

        if (this.debug) {
          console.log(`[ShellyAdapter] Retry ${attempt} after ${delay}ms - ${lastError.message}`)
        }

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // All retries exhausted
    const errorCode = this.categorizeError(lastError || new Error('Unknown error'))
    throw new CommandError(
      `${operation} failed after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message}`,
      errorCode,
      deviceId,
      { attempts: attempt, lastError: lastError?.message }
    )
  }

  /**
   * Categorize error for better error handling
   */
  private categorizeError(error: Error): 'TIMEOUT' | 'NETWORK' | 'DEVICE_ERROR' | 'UNKNOWN' {
    const message = error.message.toLowerCase()

    if (message.includes('timeout') || message.includes('aborted')) {
      return 'TIMEOUT'
    }

    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('econnrefused')
    ) {
      return 'NETWORK'
    }

    if (message.includes('http') || message.includes('400') || message.includes('500')) {
      return 'DEVICE_ERROR'
    }

    return 'UNKNOWN'
  }

  /**
   * Execute Shelly RPC command
   */
  private async rpcCall(
    method: string,
    params: Record<string, unknown>,
    deviceId: string
  ): Promise<ShellyRPCResponse> {
    return this.executeWithRetry(
      async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        try {
          const response = await fetch(`${this.baseUrl}/rpc/${method}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()

          if (this.debug) {
            console.log(`[ShellyAdapter] RPC ${method}:`, params, '→', data)
          }

          return data
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      },
      deviceId,
      `RPC ${method}`
    )
  }

  /**
   * Turn device on
   */
  async turnOn(device: Device): Promise<DeviceCommandResult> {
    const startTime = Date.now()

    try {
      // Determine component type (Switch for relays, Light for bulbs)
      const component = device.type === 'light' ? 'Light' : 'Switch'
      const method = `${component}.Set`

      await this.rpcCall(method, { id: 0, on: true }, device.id)

      const duration = Date.now() - startTime

      return {
        success: true,
        newState: {
          enabled: true,
          online: true,
          lastSeen: new Date(),
        },
        duration,
        timestamp: new Date(),
      }
    } catch (error) {
      const duration = Date.now() - startTime

      if (error instanceof CommandError) {
        return {
          success: false,
          error: error.message,
          duration,
          timestamp: new Date(),
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Turn device off
   */
  async turnOff(device: Device): Promise<DeviceCommandResult> {
    const startTime = Date.now()

    try {
      const component = device.type === 'light' ? 'Light' : 'Switch'
      const method = `${component}.Set`

      await this.rpcCall(method, { id: 0, on: false }, device.id)

      const duration = Date.now() - startTime

      return {
        success: true,
        newState: {
          enabled: false,
          online: true,
          lastSeen: new Date(),
        },
        duration,
        timestamp: new Date(),
      }
    } catch (error) {
      const duration = Date.now() - startTime

      if (error instanceof CommandError) {
        return {
          success: false,
          error: error.message,
          duration,
          timestamp: new Date(),
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Get current device state
   */
  async getState(device: Device): Promise<DeviceState> {
    try {
      const component = device.type === 'light' ? 'Light' : 'Switch'
      const method = `${component}.GetStatus`

      const response = await this.rpcCall(method, { id: 0 }, device.id)

      return {
        enabled: response.output ?? false,
        value: response.brightness,
        online: true,
        lastSeen: new Date(),
        metadata: response,
      }
    } catch (error) {
      // Return offline state if can't reach device
      if (this.debug) {
        console.log(
          `[ShellyAdapter] Failed to get state:`,
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
      return {
        enabled: false,
        online: false,
        lastSeen: device.lastSeen || new Date(),
      }
    }
  }

  /**
   * Set brightness (0-100) for Shelly lights
   */
  async setBrightness(device: Device, value: number): Promise<DeviceCommandResult> {
    const startTime = Date.now()

    // Validate brightness value
    if (value < 0 || value > 100) {
      return {
        success: false,
        error: 'Brightness must be between 0 and 100',
        duration: 0,
        timestamp: new Date(),
      }
    }

    try {
      await this.rpcCall('Light.Set', { id: 0, brightness: value }, device.id)

      const duration = Date.now() - startTime

      return {
        success: true,
        newState: {
          value,
          unit: '%',
          online: true,
          lastSeen: new Date(),
        },
        duration,
        timestamp: new Date(),
      }
    } catch (error) {
      const duration = Date.now() - startTime

      if (error instanceof CommandError) {
        return {
          success: false,
          error: error.message,
          duration,
          timestamp: new Date(),
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check if adapter supports a specific capability
   */
  supportsCapability(capability: DeviceCapability): boolean {
    const supportedCapabilities: DeviceCapability[] = [
      'turn_on',
      'turn_off',
      'get_state',
      'brightness', // Only for Light component
    ]

    return supportedCapabilities.includes(capability)
  }

  /**
   * Get adapter information for debugging
   */
  getInfo(): { baseUrl: string; timeout: number; retryConfig: RetryConfig } {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retryConfig: this.retryConfig,
    }
  }
}
