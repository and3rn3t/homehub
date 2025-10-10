/**
 * Device Adapter Interface
 *
 * Contract for all device protocol implementations.
 * Each protocol (MQTT, HTTP, Zigbee, etc.) must implement this interface.
 *
 * @example
 * ```typescript
 * // Create an MQTT adapter
 * const adapter = new MQTTDeviceAdapter(mqttClient)
 * await adapter.connect()
 *
 * // Send command
 * await adapter.sendCommand({
 *   deviceId: 'light1',
 *   command: 'toggle'
 * })
 *
 * // Listen for state updates
 * adapter.onStateUpdate('light1', (state) => {
 *   console.log('Device state:', state)
 * })
 * ```
 */

import type { Device } from '@/types'

/**
 * Device command structure
 */
export interface DeviceCommand {
  deviceId: string
  command: 'toggle' | 'set_value' | 'get_state' | 'set_color' | 'set_temperature'
  value?: number | boolean | string
  metadata?: Record<string, unknown>
}

/**
 * Device state update structure
 */
export interface DeviceStateUpdate {
  deviceId: string
  enabled: boolean
  value?: number
  status: 'online' | 'offline' | 'warning' | 'error'
  lastSeen: Date
  metadata?: Record<string, unknown>
}

/**
 * Device discovery result
 */
export interface DiscoveredDevice {
  id: string
  name: string
  type: Device['type']
  protocol: string
  capabilities: string[]
  metadata?: Record<string, unknown>
}

/**
 * Device Adapter Interface
 *
 * All device protocol implementations must implement this interface.
 */
export interface DeviceAdapter {
  /**
   * Unique identifier for this adapter type
   */
  readonly protocol: string

  /**
   * Check if adapter is connected to broker/hub
   */
  isConnected(): boolean

  /**
   * Connect to device broker or hub
   * @throws {Error} If connection fails
   */
  connect(): Promise<void>

  /**
   * Disconnect from device broker or hub
   */
  disconnect(): Promise<void>

  /**
   * Send command to device
   * @param command Device command to execute
   * @throws {Error} If command fails or device is offline
   */
  sendCommand(command: DeviceCommand): Promise<void>

  /**
   * Subscribe to device state updates
   * @param deviceId Device ID to monitor
   * @param callback Function called when device state changes
   * @returns Unsubscribe function
   */
  onStateUpdate(deviceId: string, callback: (state: DeviceStateUpdate) => void): () => void

  /**
   * Discover devices on the network
   * @returns List of discovered devices
   */
  discoverDevices(): Promise<DiscoveredDevice[]>

  /**
   * Get current connection state
   */
  getState(): 'connected' | 'disconnected' | 'reconnecting' | 'offline' | 'error'
}

/**
 * Base error class for device adapter errors
 */
export class DeviceAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly deviceId?: string
  ) {
    super(message)
    this.name = 'DeviceAdapterError'
  }
}

/**
 * Error thrown when device is offline
 */
export class DeviceOfflineError extends DeviceAdapterError {
  constructor(deviceId: string) {
    super(`Device ${deviceId} is offline`, 'DEVICE_OFFLINE', deviceId)
    this.name = 'DeviceOfflineError'
  }
}

/**
 * Error thrown when command times out
 */
export class CommandTimeoutError extends DeviceAdapterError {
  constructor(deviceId: string) {
    super(`Command to device ${deviceId} timed out`, 'COMMAND_TIMEOUT', deviceId)
    this.name = 'CommandTimeoutError'
  }
}

/**
 * Error thrown when adapter is not connected
 */
export class NotConnectedError extends DeviceAdapterError {
  constructor(protocol: string) {
    super(`${protocol} adapter is not connected`, 'NOT_CONNECTED')
    this.name = 'NotConnectedError'
  }
}
