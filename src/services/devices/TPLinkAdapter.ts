/**
 * TP-Link Smart Device Adapter
 *
 * Implements device control for TP-Link Kasa smart home devices via HTTP API.
 * Supports smart plugs (HS100, HS110), switches, and lights.
 *
 * Note: TP-Link uses encrypted JSON communication. This adapter works with
 * devices that have local API enabled or use the Kasa app protocol.
 *
 * API Documentation: https://github.com/softScheck/tplink-smartplug
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
 * TP-Link API response structure
 */
interface TPLinkResponse {
  system?: {
    get_sysinfo?: {
      relay_state?: number
      on_off?: number
      brightness?: number
      err_code?: number
    }
  }
  'smartlife.iot.smartbulb.lightingservice'?: {
    transition_light_state?: {
      err_code?: number
      on_off?: number
      brightness?: number
    }
  }
}

/**
 * Adapter for TP-Link Kasa devices (Plugs, Switches, Lights)
 *
 * @example
 * ```typescript
 * const adapter = new TPLinkAdapter('192.168.1.150')
 * const result = await adapter.turnOn(device)
 * if (result.success) {
 *   console.log('Device turned on successfully')
 * }
 * ```
 */
export class TPLinkAdapter implements DeviceAdapter {
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
            `[TPLinkAdapter] Attempt ${attempt + 1}/${this.retryConfig.maxAttempts} - ${operation}`
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
          console.log(`[TPLinkAdapter] Retry ${attempt} after ${delay}ms - ${lastError.message}`)
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
   * Send command to TP-Link device
   *
   * Note: This is a simplified implementation. Real TP-Link devices use
   * encrypted protocol that requires XOR cipher. For production, use
   * tplink-smarthome-api library or implement proper encryption.
   */
  private async sendCommand(
    command: Record<string, unknown>,
    deviceId: string
  ): Promise<TPLinkResponse> {
    return this.executeWithRetry(
      async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        try {
          const response = await fetch(`${this.baseUrl}/api/command`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(command),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()

          if (this.debug) {
            console.log(`[TPLinkAdapter] Command:`, command, '→', data)
          }

          return data
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      },
      deviceId,
      'Send Command'
    )
  }

  /**
   * Turn device on
   */
  async turnOn(device: Device): Promise<DeviceCommandResult> {
    const startTime = Date.now()

    try {
      // Different command structure for plugs vs lights
      const command =
        device.type === 'light'
          ? {
              'smartlife.iot.smartbulb.lightingservice': {
                transition_light_state: {
                  on_off: 1,
                },
              },
            }
          : {
              system: {
                set_relay_state: {
                  state: 1,
                },
              },
            }

      await this.sendCommand(command, device.id)

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
      const command =
        device.type === 'light'
          ? {
              'smartlife.iot.smartbulb.lightingservice': {
                transition_light_state: {
                  on_off: 0,
                },
              },
            }
          : {
              system: {
                set_relay_state: {
                  state: 0,
                },
              },
            }

      await this.sendCommand(command, device.id)

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
      const command =
        device.type === 'light'
          ? {
              'smartlife.iot.smartbulb.lightingservice': {
                get_light_state: {},
              },
            }
          : {
              system: {
                get_sysinfo: {},
              },
            }

      const response = await this.sendCommand(command, device.id)

      // Parse response based on device type
      let enabled = false
      let brightness: number | undefined

      if (device.type === 'light') {
        const lightState =
          response['smartlife.iot.smartbulb.lightingservice']?.transition_light_state
        enabled = lightState?.on_off === 1
        brightness = lightState?.brightness
      } else {
        const sysInfo = response.system?.get_sysinfo
        enabled = (sysInfo?.relay_state ?? sysInfo?.on_off) === 1
      }

      return {
        enabled,
        value: brightness,
        unit: brightness !== undefined ? '%' : undefined,
        online: true,
        lastSeen: new Date(),
        metadata: response,
      }
    } catch (error) {
      // Return offline state if can't reach device
      if (this.debug) {
        console.log(
          `[TPLinkAdapter] Failed to get state:`,
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
   * Set brightness (0-100) for TP-Link smart lights
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
      const command = {
        'smartlife.iot.smartbulb.lightingservice': {
          transition_light_state: {
            brightness: value,
          },
        },
      }

      await this.sendCommand(command, device.id)

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
      'brightness', // Only for smart bulbs
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
