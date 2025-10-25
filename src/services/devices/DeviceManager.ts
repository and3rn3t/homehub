/**
 * Device Manager
 *
 * Central hub for device control across all protocols (HTTP, MQTT, Zigbee, etc.)
 * Routes commands to appropriate device adapters and handles error fallback.
 *
 * Architecture:
 * - Device → DeviceManager → Protocol Adapter → Physical Device
 * - Supports multiple protocols simultaneously
 * - Automatic adapter selection based on device metadata
 * - Graceful error handling with user feedback
 */

import type { Device } from '@/types'
import { HueBridgeAdapter, type HueBridgeConfig } from './HueBridgeAdapter'
import { ShellyAdapter } from './ShellyAdapter'
import { TPLinkAdapter } from './TPLinkAdapter'
import type {
  DeviceAdapter,
  DeviceAdapterOptions,
  DeviceCapability,
  DeviceCommandResult,
  DeviceState,
} from './types'

/**
 * Device protocol identifiers
 */
export type DeviceProtocol = 'hue' | 'shelly' | 'tplink' | 'mqtt' | 'zigbee' | 'zwave' | 'http'

/**
 * Device connection information stored in device metadata
 */
export interface DeviceConnection {
  /** Protocol used to communicate with device */
  protocol: DeviceProtocol

  /** IP address for HTTP-based devices */
  ip?: string

  /** Port number for HTTP-based devices */
  port?: number

  /** Hue bridge configuration */
  hueBridge?: HueBridgeConfig

  /** MQTT topic for MQTT devices */
  mqttTopic?: string

  /** Additional protocol-specific settings */
  settings?: Record<string, unknown>
}

/**
 * Device Manager configuration
 */
export interface DeviceManagerOptions {
  /** Default adapter options (timeout, retries, etc.) */
  adapterOptions?: DeviceAdapterOptions

  /** Enable debug logging */
  debug?: boolean

  /** Hue bridge configurations (can have multiple bridges) */
  hueBridges?: HueBridgeConfig[]
}

/**
 * Device Manager - Routes commands to appropriate protocol adapters
 *
 * @example
 * ```typescript
 * const manager = new DeviceManager({
 *   hueBridges: [{ ip: '192.168.1.6', username: 'abc123' }]
 * })
 *
 * // Turn on any device regardless of protocol
 * const result = await manager.turnOn(device)
 * ```
 */
export class DeviceManager {
  private readonly adapters: Map<string, DeviceAdapter> = new Map()
  private readonly options: DeviceManagerOptions

  constructor(options: DeviceManagerOptions = {}) {
    this.options = options

    // Initialize Hue bridge adapters if provided
    if (options.hueBridges) {
      for (const bridgeConfig of options.hueBridges) {
        const adapterId = `hue-${bridgeConfig.ip}`
        this.adapters.set(adapterId, new HueBridgeAdapter(bridgeConfig))
      }
    }
  }

  /**
   * Get or create adapter for a device
   */
  private getAdapter(device: Device): DeviceAdapter {
    // Extract connection info from device metadata
    const connection = device.metadata?.connection as DeviceConnection | undefined

    if (!connection) {
      throw new Error(`Device ${device.id} has no connection information`)
    }

    const { protocol, ip, port = 80, hueBridge } = connection

    // Generate adapter ID for caching
    const adapterId = `${protocol}-${ip || hueBridge?.ip}`

    // Return cached adapter if exists
    const cachedAdapter = this.adapters.get(adapterId)
    if (cachedAdapter) {
      return cachedAdapter
    }

    // Create new adapter based on protocol
    let adapter: DeviceAdapter

    switch (protocol) {
      case 'hue':
        if (!hueBridge) {
          throw new Error(`Device ${device.id} missing Hue bridge configuration`)
        }
        adapter = new HueBridgeAdapter(hueBridge)
        break

      case 'shelly':
        if (!ip) {
          throw new Error(`Device ${device.id} missing IP address`)
        }
        adapter = new ShellyAdapter(ip, port, this.options.adapterOptions)
        break

      case 'tplink':
        if (!ip) {
          throw new Error(`Device ${device.id} missing IP address`)
        }
        adapter = new TPLinkAdapter(ip, port, this.options.adapterOptions)
        break

      case 'http':
      case 'mqtt':
      case 'zigbee':
      case 'zwave':
        throw new Error(`Protocol "${protocol}" not yet implemented`)

      default:
        throw new Error(`Unknown protocol: ${protocol}`)
    }

    // Cache adapter for future use
    this.adapters.set(adapterId, adapter)

    if (this.options.debug) {
      console.log(`[DeviceManager] Created adapter for ${protocol} device at ${ip}`)
    }

    return adapter
  }

  /**
   * Turn device on
   */
  async turnOn(device: Device): Promise<DeviceCommandResult> {
    try {
      const adapter = this.getAdapter(device)
      return await adapter.turnOn(device)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    }
  }

  /**
   * Turn device off
   */
  async turnOff(device: Device): Promise<DeviceCommandResult> {
    try {
      const adapter = this.getAdapter(device)
      return await adapter.turnOff(device)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    }
  }

  /**
   * Get current device state
   */
  async getState(device: Device): Promise<DeviceState> {
    try {
      const adapter = this.getAdapter(device)
      return await adapter.getState(device)
    } catch (_error) {
      // Return offline state on error - device may be unreachable
      return {
        enabled: false,
        online: false,
        lastSeen: device.lastSeen || new Date(),
      }
    }
  }

  /**
   * Set brightness (0-100) for lights
   */
  async setBrightness(device: Device, value: number): Promise<DeviceCommandResult> {
    try {
      const adapter = this.getAdapter(device)

      if (!adapter.setBrightness) {
        return {
          success: false,
          error: 'Device does not support brightness control',
          timestamp: new Date(),
        }
      }

      return await adapter.setBrightness(device, value)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    }
  }

  /**
   * Set color for RGB lights
   */
  async setColor(device: Device, color: string): Promise<DeviceCommandResult> {
    try {
      const adapter = this.getAdapter(device)

      if (!adapter.setColor) {
        return {
          success: false,
          error: 'Device does not support color control',
          timestamp: new Date(),
        }
      }

      return await adapter.setColor(device, color)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    }
  }

  /**
   * Set color temperature (in Kelvin) for white spectrum lights
   */
  async setColorTemperature(device: Device, kelvin: number): Promise<DeviceCommandResult> {
    try {
      const adapter = this.getAdapter(device)

      // HueBridgeAdapter has setColorTemperature method
      if ('setColorTemperature' in adapter && typeof adapter.setColorTemperature === 'function') {
        return await adapter.setColorTemperature(device, kelvin)
      }

      return {
        success: false,
        error: 'Device does not support color temperature control',
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    }
  }

  /**
   * Set temperature for thermostats
   */
  async setTemperature(device: Device, value: number): Promise<DeviceCommandResult> {
    try {
      const adapter = this.getAdapter(device)

      if (!adapter.setTemperature) {
        return {
          success: false,
          error: 'Device does not support temperature control',
          timestamp: new Date(),
        }
      }

      return await adapter.setTemperature(device, value)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check if device supports a capability
   */
  supportsCapability(device: Device, capability: DeviceCapability): boolean {
    try {
      const adapter = this.getAdapter(device)
      return adapter.supportsCapability(capability)
    } catch (_error) {
      // Device adapter unavailable - assume no capabilities
      return false
    }
  }

  /**
   * Add a Hue bridge configuration
   */
  addHueBridge(config: HueBridgeConfig): void {
    const adapterId = `hue-${config.ip}`
    this.adapters.set(adapterId, new HueBridgeAdapter(config))

    if (this.options.debug) {
      console.log(`[DeviceManager] Added Hue bridge: ${config.ip}`)
    }
  }

  /**
   * Get list of all registered adapters
   */
  getAdapters(): Map<string, DeviceAdapter> {
    return new Map(this.adapters)
  }

  /**
   * Clear all adapter instances (useful for testing)
   */
  clearAdapters(): void {
    this.adapters.clear()
  }
}

/**
 * Global device manager instance (singleton pattern)
 */
let globalManager: DeviceManager | null = null

/**
 * Get or create global device manager
 */
export function getDeviceManager(options?: DeviceManagerOptions): DeviceManager {
  globalManager ??= new DeviceManager(options)
  return globalManager
}

/**
 * Reset global device manager (useful for testing)
 */
export function resetDeviceManager(): void {
  globalManager = null
}
