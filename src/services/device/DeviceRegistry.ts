/**
 * Device Registry
 *
 * Central registry for managing device adapters and device state.
 * Provides unified interface for device control across multiple protocols.
 *
 * @example
 * ```typescript
 * import { DeviceRegistry } from '@/services/device'
 * import { MQTTDeviceAdapter } from '@/services/device'
 * import { MQTTClientService } from '@/services/mqtt'
 *
 * const registry = DeviceRegistry.getInstance()
 *
 * // Register MQTT adapter
 * const mqtt = MQTTClientService.getInstance({ brokerUrl: 'ws://localhost:9001' })
 * const mqttAdapter = new MQTTDeviceAdapter(mqtt)
 * registry.registerAdapter(mqttAdapter)
 *
 * // Send command to device
 * await registry.sendCommand({
 *   deviceId: 'light1',
 *   command: 'toggle'
 * })
 * ```
 */

import type {
  DeviceAdapter,
  DeviceCommand,
  DeviceStateUpdate,
  DiscoveredDevice,
} from './DeviceAdapter'

export class DeviceRegistry {
  private static instance: DeviceRegistry | null = null
  private adapters: Map<string, DeviceAdapter> = new Map()
  private deviceProtocols: Map<string, string> = new Map() // deviceId -> protocol
  private stateCallbacks: Map<string, Set<(state: DeviceStateUpdate) => void>> = new Map()

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DeviceRegistry {
    if (!DeviceRegistry.instance) {
      DeviceRegistry.instance = new DeviceRegistry()
    }
    return DeviceRegistry.instance
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    if (DeviceRegistry.instance) {
      // Disconnect all adapters
      for (const adapter of DeviceRegistry.instance.adapters.values()) {
        adapter.disconnect().catch(error => {
          console.error('Failed to disconnect adapter:', error)
        })
      }
      DeviceRegistry.instance = null
    }
  }

  /**
   * Register a device adapter
   *
   * @param adapter Device adapter to register
   */
  registerAdapter(adapter: DeviceAdapter): void {
    const protocol = adapter.protocol
    if (this.adapters.has(protocol)) {
      console.warn(`[DeviceRegistry] Adapter for ${protocol} already registered, replacing`)
    }

    this.adapters.set(protocol, adapter)
    console.log(`[DeviceRegistry] Registered adapter for ${protocol}`)

    // Connect adapter if not connected
    if (!adapter.isConnected()) {
      adapter.connect().catch(error => {
        console.error(`[DeviceRegistry] Failed to connect ${protocol} adapter:`, error)
      })
    }
  }

  /**
   * Unregister a device adapter
   *
   * @param protocol Protocol name to unregister
   */
  async unregisterAdapter(protocol: string): Promise<void> {
    const adapter = this.adapters.get(protocol)
    if (adapter) {
      await adapter.disconnect()
      this.adapters.delete(protocol)

      // Remove device mappings for this protocol
      for (const [deviceId, deviceProtocol] of this.deviceProtocols.entries()) {
        if (deviceProtocol === protocol) {
          this.deviceProtocols.delete(deviceId)
        }
      }

      console.log(`[DeviceRegistry] Unregistered adapter for ${protocol}`)
    }
  }

  /**
   * Map device to specific protocol
   *
   * @param deviceId Device ID
   * @param protocol Protocol name
   */
  mapDeviceToProtocol(deviceId: string, protocol: string): void {
    if (!this.adapters.has(protocol)) {
      throw new Error(`Protocol ${protocol} not registered`)
    }
    this.deviceProtocols.set(deviceId, protocol)
    console.log(`[DeviceRegistry] Mapped ${deviceId} to ${protocol}`)
  }

  /**
   * Get adapter for device
   *
   * @param deviceId Device ID
   * @returns Device adapter or undefined if not found
   */
  private getAdapterForDevice(deviceId: string): DeviceAdapter | undefined {
    // First check if device has explicit protocol mapping
    const protocol = this.deviceProtocols.get(deviceId)
    if (protocol) {
      return this.adapters.get(protocol)
    }

    // Otherwise, try all adapters (first connected one)
    for (const adapter of this.adapters.values()) {
      if (adapter.isConnected()) {
        return adapter
      }
    }

    return undefined
  }

  /**
   * Send command to device
   *
   * @param command Device command
   * @throws {Error} If no adapter available for device
   */
  async sendCommand(command: DeviceCommand): Promise<void> {
    const adapter = this.getAdapterForDevice(command.deviceId)
    if (!adapter) {
      throw new Error(`No adapter available for device ${command.deviceId}`)
    }

    await adapter.sendCommand(command)
  }

  /**
   * Subscribe to device state updates
   *
   * @param deviceId Device ID to monitor
   * @param callback Function called when device state changes
   * @returns Unsubscribe function
   */
  onStateUpdate(deviceId: string, callback: (state: DeviceStateUpdate) => void): () => void {
    const adapter = this.getAdapterForDevice(deviceId)
    if (!adapter) {
      throw new Error(`No adapter available for device ${deviceId}`)
    }

    // Add to local callbacks
    if (!this.stateCallbacks.has(deviceId)) {
      this.stateCallbacks.set(deviceId, new Set())
    }
    const callbacks = this.stateCallbacks.get(deviceId)
    if (callbacks) {
      callbacks.add(callback)
    }

    // Subscribe via adapter
    const adapterUnsub = adapter.onStateUpdate(deviceId, callback)

    // Return unsubscribe function
    return () => {
      adapterUnsub()
      const callbacks = this.stateCallbacks.get(deviceId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.stateCallbacks.delete(deviceId)
        }
      }
    }
  }

  /**
   * Discover devices across all adapters
   *
   * @returns List of discovered devices
   */
  async discoverDevices(): Promise<DiscoveredDevice[]> {
    console.log('[DeviceRegistry] Starting device discovery across all adapters')

    const allDevices: DiscoveredDevice[] = []

    for (const adapter of this.adapters.values()) {
      if (adapter.isConnected()) {
        try {
          const devices = await adapter.discoverDevices()
          console.log(`[DeviceRegistry] ${adapter.protocol} discovered ${devices.length} devices`)

          // Map devices to their protocol
          for (const device of devices) {
            this.mapDeviceToProtocol(device.id, adapter.protocol)
          }

          allDevices.push(...devices)
        } catch (error) {
          console.error(`[DeviceRegistry] Discovery failed for ${adapter.protocol}:`, error)
        }
      }
    }

    console.log(`[DeviceRegistry] Total discovered: ${allDevices.length} devices`)
    return allDevices
  }

  /**
   * Get list of registered protocols
   */
  getRegisteredProtocols(): string[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * Check if protocol is registered
   */
  hasProtocol(protocol: string): boolean {
    return this.adapters.has(protocol)
  }

  /**
   * Get adapter by protocol
   */
  getAdapter(protocol: string): DeviceAdapter | undefined {
    return this.adapters.get(protocol)
  }

  /**
   * Get protocol for device
   */
  getDeviceProtocol(deviceId: string): string | undefined {
    return this.deviceProtocols.get(deviceId)
  }

  /**
   * Get connection states of all adapters
   */
  getAdapterStates(): Record<string, string> {
    const states: Record<string, string> = {}
    for (const [protocol, adapter] of this.adapters.entries()) {
      states[protocol] = adapter.getState()
    }
    return states
  }
}
