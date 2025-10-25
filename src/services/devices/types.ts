/**
 * Device Control Types & Interfaces
 *
 * Defines the contract for device adapters that control smart home devices
 * via various protocols (HTTP, MQTT, Zigbee, etc.)
 */

import type { Device } from '@/types'

/**
 * Device capabilities that can be supported by adapters
 */
export type DeviceCapability =
  | 'turn_on'
  | 'turn_off'
  | 'brightness'
  | 'color'
  | 'temperature'
  | 'get_state'

/**
 * Result of a device command execution
 */
export interface DeviceCommandResult {
  /** Whether the command succeeded */
  success: boolean

  /** Updated device state after command execution */
  newState?: Partial<DeviceState>

  /** Error message if command failed */
  error?: string

  /** Command execution duration in milliseconds */
  duration?: number

  /** Timestamp when command was executed */
  timestamp: Date
}

/**
 * Current state of a device
 */
export interface DeviceState {
  /** Whether device is powered on */
  enabled: boolean

  /** Current value (brightness, temperature, etc.) */
  value?: number

  /** Unit of measurement for value */
  unit?: string

  /** Whether device is reachable on network */
  online: boolean

  /** Last successful communication timestamp */
  lastSeen: Date

  /** Additional metadata from device */
  metadata?: Record<string, any>
}

/**
 * Configuration options for device adapters
 */
export interface DeviceAdapterOptions {
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number

  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number

  /** Enable debug logging (default: false) */
  debug?: boolean
}

/**
 * Base interface for all device adapters
 *
 * Adapters translate high-level commands (turnOn, setBrightness)
 * into protocol-specific API calls (HTTP POST, MQTT publish, etc.)
 */
export interface DeviceAdapter {
  /**
   * Turn device on
   */
  turnOn(device: Device): Promise<DeviceCommandResult>

  /**
   * Turn device off
   */
  turnOff(device: Device): Promise<DeviceCommandResult>

  /**
   * Get current device state
   */
  getState(device: Device): Promise<DeviceState>

  /**
   * Set brightness (0-100) - only for lights
   */
  setBrightness?(device: Device, value: number): Promise<DeviceCommandResult>

  /**
   * Set color (hex or RGB) - only for color lights
   */
  setColor?(device: Device, color: string): Promise<DeviceCommandResult>

  /**
   * Set temperature in degrees - only for thermostats
   */
  setTemperature?(device: Device, value: number): Promise<DeviceCommandResult>

  /**
   * Check if adapter supports a specific capability
   */
  supportsCapability(capability: DeviceCapability): boolean
}

/**
 * Custom error class for device command failures
 */
export class CommandError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'NETWORK' | 'DEVICE_ERROR' | 'UNSUPPORTED' | 'UNKNOWN',
    public deviceId: string,
    public details?: any
  ) {
    super(message)
    this.name = 'CommandError'
  }
}

/**
 * Retry configuration for command execution
 */
export interface RetryConfig {
  /** Maximum number of attempts */
  maxAttempts: number

  /** Initial delay in milliseconds */
  initialDelay: number

  /** Multiplier for exponential backoff */
  backoffMultiplier: number

  /** Maximum delay in milliseconds */
  maxDelay: number
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 5000,
}
