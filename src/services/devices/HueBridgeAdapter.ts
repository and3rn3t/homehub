/**
 * Philips Hue Bridge Adapter
 *
 * HTTP-based adapter for controlling Philips Hue devices via the Hue Bridge API.
 * Supports on/off, brightness, color temperature, and RGB color control.
 *
 * Architecture:
 * - Bridge acts as central hub for all Hue devices
 * - HTTP REST API for device control
 * - Supports multiple bridges (multi-home scenarios)
 * - Compatible with all Hue device types (bulbs, strips, Play bars, etc.)
 *
 * @see https://developers.meethue.com/develop/hue-api/
 */

import type { Device } from '@/types'
import type {
  DeviceAdapter,
  DeviceCapability,
  DeviceCommandResult,
  DeviceState,
  RetryConfig,
} from './types'
import { CommandError, DEFAULT_RETRY_CONFIG } from './types'

/**
 * Hue Bridge configuration
 */
export interface HueBridgeConfig {
  /** Bridge IP address (e.g., "192.168.1.6") */
  ip: string
  /** API username/key (obtained via button press + POST /api) */
  username: string
  /** Optional bridge ID for multi-bridge setups */
  bridgeId?: string
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number
  /** Retry configuration (default: 3 attempts) */
  retryConfig?: RetryConfig
}

/**
 * Hue device light state from Bridge API
 */
interface HueLightState {
  on: boolean
  bri: number // Brightness 0-254
  hue?: number // Hue 0-65535 (for color lights)
  sat?: number // Saturation 0-254 (for color lights)
  ct?: number // Color temperature 153-500 mireds (for white spectrum)
  xy?: [number, number] // CIE color space coordinates
  colormode?: 'hs' | 'xy' | 'ct'
  reachable: boolean
  alert?: string
  effect?: string
  mode?: string
}

/**
 * Hue device info from Bridge API
 */
interface HueLight {
  state: HueLightState
  type: string
  name: string
  modelid: string
  manufacturername: string
  productname: string
  uniqueid: string
  swversion: string
}

/**
 * Philips Hue Bridge Adapter
 *
 * Implements DeviceAdapter interface for controlling Hue devices via Bridge HTTP API.
 * Handles color, brightness, and temperature control with proper error handling.
 */
export class HueBridgeAdapter implements DeviceAdapter {
  private readonly config: Required<HueBridgeConfig>
  private readonly baseUrl: string

  constructor(config: HueBridgeConfig) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 5000,
      retryConfig: config.retryConfig ?? DEFAULT_RETRY_CONFIG,
      bridgeId: config.bridgeId ?? 'default',
    }

    // Construct base URL for Bridge API
    // Note: Using http:// not https:// (Hue Bridge doesn't use SSL for local API)
    this.baseUrl = `http://${this.config.ip}/api/${this.config.username}`
  }

  /**
   * Turn device on
   */
  async turnOn(device: Device): Promise<DeviceCommandResult> {
    const deviceId = this.extractDeviceId(device)
    return this.executeWithRetry(deviceId, async () => {
      const startTime = Date.now()

      await this.setState(deviceId, { on: true })

      // Get updated state
      const newState = await this.getState(device)

      return {
        success: true,
        newState,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      }
    })
  }

  /**
   * Turn device off
   */
  async turnOff(device: Device): Promise<DeviceCommandResult> {
    const deviceId = this.extractDeviceId(device)
    return this.executeWithRetry(deviceId, async () => {
      const startTime = Date.now()

      await this.setState(deviceId, { on: false })

      // Get updated state
      const newState = await this.getState(device)

      return {
        success: true,
        newState,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      }
    })
  }

  /**
   * Get current device state
   */
  async getState(device: Device): Promise<DeviceState> {
    const deviceId = this.extractDeviceId(device)
    return this.executeWithRetry(deviceId, async () => {
      const light = await this.getLight(deviceId)

      return {
        enabled: light.state.on,
        value: this.brightnessToPercentage(light.state.bri),
        unit: '%',
        online: light.state.reachable,
        lastSeen: new Date(),
        // Additional Hue-specific state
        metadata: {
          colormode: light.state.colormode,
          hue: light.state.hue,
          saturation: light.state.sat,
          colorTemp: light.state.ct,
          xy: light.state.xy,
          type: light.type,
          model: light.modelid,
        },
      }
    })
  }

  /**
   * Set brightness (0-100%)
   */
  async setBrightness(device: Device, brightness: number): Promise<DeviceCommandResult> {
    const deviceId = this.extractDeviceId(device)
    if (brightness < 0 || brightness > 100) {
      throw new CommandError(
        `Brightness must be 0-100, got ${brightness}`,
        'DEVICE_ERROR',
        deviceId
      )
    }

    return this.executeWithRetry(deviceId, async () => {
      const startTime = Date.now()

      // Convert 0-100 to Hue's 0-254 scale
      const bri = this.percentageToBrightness(brightness)

      await this.setState(deviceId, { on: true, bri })

      const newState = await this.getState(device)

      return {
        success: true,
        newState,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      }
    })
  }

  /**
   * Set color (hex or RGB string)
   */
  async setColor(device: Device, color: string): Promise<DeviceCommandResult> {
    const deviceId = this.extractDeviceId(device)
    return this.executeWithRetry(deviceId, async () => {
      const startTime = Date.now()

      // Parse color string (supports hex or rgb())
      const rgb = this.parseColor(color)

      // Convert RGB to CIE xy color space (Hue's native format)
      const xy = this.rgbToXY(rgb.r, rgb.g, rgb.b)

      await this.setState(deviceId, { on: true, xy })

      const newState = await this.getState(device)

      return {
        success: true,
        newState,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      }
    })
  }

  /**
   * Set color temperature (warm to cool white)
   * @param device Device
   * @param kelvin Color temperature in Kelvin (2000-6500)
   */
  async setColorTemperature(device: Device, kelvin: number): Promise<DeviceCommandResult> {
    const deviceId = this.extractDeviceId(device)
    return this.executeWithRetry(deviceId, async () => {
      const startTime = Date.now()

      // Convert Kelvin to mireds (Hue's unit)
      // mireds = 1,000,000 / kelvin
      // Hue range: 153-500 mireds (6500K-2000K)
      const mireds = Math.round(1000000 / kelvin)
      const ct = Math.max(153, Math.min(500, mireds))

      await this.setState(deviceId, { on: true, ct })

      const newState = await this.getState(device)

      return {
        success: true,
        newState,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      }
    })
  }

  /**
   * Check if adapter supports a specific capability
   */
  supportsCapability(capability: DeviceCapability): boolean {
    const supportedCapabilities: DeviceCapability[] = [
      'turn_on',
      'turn_off',
      'brightness',
      'color',
      'temperature',
      'get_state',
    ]
    return supportedCapabilities.includes(capability)
  }

  /**
   * Extract Hue device ID from Device object
   * For Hue devices, we store the Bridge's light ID in the device.id field
   * (formatted as "hue-{lightId}" or just the lightId)
   * @private
   */
  private extractDeviceId(device: Device): string {
    // If device.id is formatted as "hue-39", extract "39"
    if (device.id.startsWith('hue-')) {
      return device.id.slice(4)
    }
    // Otherwise use device.id directly (for backward compatibility)
    return device.id
  }

  /**
   * Parse color string to RGB
   * @private
   */
  private parseColor(color: string): { r: number; g: number; b: number } {
    // Remove whitespace
    color = color.trim()

    // Hex format: #RRGGBB or RRGGBB
    if (color.startsWith('#')) {
      color = color.slice(1)
    }

    if (color.length === 6) {
      return {
        r: parseInt(color.slice(0, 2), 16),
        g: parseInt(color.slice(2, 4), 16),
        b: parseInt(color.slice(4, 6), 16),
      }
    }

    // RGB format: rgb(r, g, b)
    const rgbPattern = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/
    const rgbMatch = rgbPattern.exec(color)
    if (rgbMatch?.[1] && rgbMatch?.[2] && rgbMatch?.[3]) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      }
    }

    // Default to white if parsing fails
    return { r: 255, g: 255, b: 255 }
  }

  /**
   * Set state on Hue Bridge
   * @private
   */
  private async setState(deviceId: string, state: Partial<HueLightState>): Promise<void> {
    const url = `${this.baseUrl}/lights/${deviceId}/state`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new CommandError(
          `Hue Bridge returned ${response.status}: ${response.statusText}`,
          'DEVICE_ERROR',
          deviceId
        )
      }

      const result = await response.json()

      // Hue Bridge returns array of results, check for errors
      if (Array.isArray(result)) {
        const errors = result.filter(
          (r: unknown): r is { error: { description: string } } =>
            typeof r === 'object' && r !== null && 'error' in r
        )
        if (errors.length > 0) {
          const errorMsg = errors.map(e => e.error.description).join(', ')
          throw new CommandError(`Hue error: ${errorMsg}`, 'DEVICE_ERROR', deviceId)
        }
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new CommandError(
          `Request timed out after ${this.config.timeout}ms`,
          'TIMEOUT',
          deviceId
        )
      }

      if (error instanceof CommandError) {
        throw error
      }

      throw new CommandError(
        `Failed to set state: ${error instanceof Error ? error.message : String(error)}`,
        'NETWORK',
        deviceId
      )
    }
  }

  /**
   * Get light info from Hue Bridge
   * @private
   */
  private async getLight(deviceId: string): Promise<HueLight> {
    const url = `${this.baseUrl}/lights/${deviceId}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new CommandError(
          `Hue Bridge returned ${response.status}: ${response.statusText}`,
          'DEVICE_ERROR',
          deviceId
        )
      }

      return await response.json()
    } catch (error: unknown) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new CommandError(
          `Request timed out after ${this.config.timeout}ms`,
          'TIMEOUT',
          deviceId
        )
      }

      if (error instanceof CommandError) {
        throw error
      }

      throw new CommandError(
        `Failed to get device state: ${error instanceof Error ? error.message : String(error)}`,
        'NETWORK',
        deviceId
      )
    }
  }

  /**
   * Execute command with retry logic
   * @private
   */
  private async executeWithRetry<T>(_deviceId: string, operation: () => Promise<T>): Promise<T> {
    const { maxAttempts, initialDelay, backoffMultiplier, maxDelay } = this.config.retryConfig

    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry device errors or unsupported operations
        if (
          error instanceof CommandError &&
          (error.code === 'DEVICE_ERROR' || error.code === 'UNSUPPORTED')
        ) {
          throw error
        }

        // Last attempt, throw error
        if (attempt === maxAttempts) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay)

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Retry failed')
  }

  /**
   * Convert Hue brightness (0-254) to percentage (0-100)
   * @private
   */
  private brightnessToPercentage(bri: number): number {
    return Math.round((bri / 254) * 100)
  }

  /**
   * Convert percentage (0-100) to Hue brightness (0-254)
   * @private
   */
  private percentageToBrightness(percentage: number): number {
    return Math.round((percentage / 100) * 254)
  }

  /**
   * Convert RGB to CIE xy color space (Hue's native format)
   * Implements the official Philips color conversion algorithm
   * @private
   */
  private rgbToXY(r: number, g: number, b: number): [number, number] {
    // Normalize RGB values to 0-1
    const red = r / 255
    const green = g / 255
    const blue = b / 255

    // Apply gamma correction
    const applyGamma = (val: number) => {
      return val > 0.04045 ? Math.pow((val + 0.055) / 1.055, 2.4) : val / 12.92
    }

    const rGamma = applyGamma(red)
    const gGamma = applyGamma(green)
    const bGamma = applyGamma(blue)

    // Convert to XYZ using Wide RGB D65 conversion formula
    const X = rGamma * 0.664511 + gGamma * 0.154324 + bGamma * 0.162028
    const Y = rGamma * 0.283881 + gGamma * 0.668433 + bGamma * 0.047685
    const Z = rGamma * 0.000088 + gGamma * 0.07231 + bGamma * 0.986039

    // Calculate xy chromaticity coordinates
    const sum = X + Y + Z

    if (sum === 0) {
      return [0.3227, 0.329] // Default white point
    }

    const x = X / sum
    const y = Y / sum

    // Clamp to Hue's gamut (approximation of Color Gamut C)
    const xClamped = Math.max(0, Math.min(1, x))
    const yClamped = Math.max(0, Math.min(1, y))

    return [Math.round(xClamped * 10000) / 10000, Math.round(yClamped * 10000) / 10000]
  }
}

/**
 * Helper function to discover all lights on a Hue Bridge
 */
export async function discoverHueLights(
  bridgeIp: string,
  username: string
): Promise<Record<string, HueLight>> {
  const url = `http://${bridgeIp}/api/${username}/lights`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to discover lights: ${response.statusText}`)
    }

    return await response.json()
  } catch (error: unknown) {
    throw new Error(
      `Failed to discover Hue lights: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
