/**
 * MQTT Device Adapter
 *
 * Implements DeviceAdapter interface for MQTT protocol.
 * Translates device commands to MQTT messages and vice versa.
 *
 * @example
 * ```typescript
 * import { MQTTDeviceAdapter } from '@/services/device'
 * import { MQTTClientService } from '@/services/mqtt'
 *
 * const mqtt = MQTTClientService.getInstance({ brokerUrl: 'ws://localhost:9001' })
 * await mqtt.connect()
 *
 * const adapter = new MQTTDeviceAdapter(mqtt)
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

import type { MQTTClientService } from '../mqtt/MQTTClient'
import { MQTT_TOPICS } from '../mqtt/MQTTTopics'
import {
  type DeviceAdapter,
  type DeviceCommand,
  type DeviceStateUpdate,
  type DiscoveredDevice,
  NotConnectedError,
} from './DeviceAdapter'

export class MQTTDeviceAdapter implements DeviceAdapter {
  readonly protocol = 'mqtt'
  private stateCallbacks: Map<string, Set<(state: DeviceStateUpdate) => void>> = new Map()
  private discoveredDevices: Map<string, DiscoveredDevice> = new Map()
  private unsubscribeHandlers: Map<string, () => void> = new Map()

  constructor(private mqttClient: MQTTClientService) {}

  /**
   * Check if MQTT client is connected
   */
  isConnected(): boolean {
    return this.mqttClient.isConnected()
  }

  /**
   * Connect to MQTT broker
   */
  async connect(): Promise<void> {
    if (this.isConnected()) {
      console.log('[MQTTAdapter] Already connected')
      return
    }

    await this.mqttClient.connect()

    // Subscribe to discovery announcements
    const discoveryUnsub = this.mqttClient.subscribe(MQTT_TOPICS.DEVICE_ANNOUNCE, message => {
      try {
        const device = JSON.parse(message) as DiscoveredDevice
        console.log('[MQTTAdapter] Device announced:', device)
        this.discoveredDevices.set(device.id, device)
      } catch (error) {
        console.error('[MQTTAdapter] Failed to parse discovery message:', error)
      }
    })

    this.unsubscribeHandlers.set('discovery', discoveryUnsub)

    console.log('[MQTTAdapter] Connected and listening for device announcements')
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect(): Promise<void> {
    // Unsubscribe from all topics
    for (const unsubscribe of this.unsubscribeHandlers.values()) {
      unsubscribe()
    }
    this.unsubscribeHandlers.clear()
    this.stateCallbacks.clear()

    await this.mqttClient.disconnect()
    console.log('[MQTTAdapter] Disconnected')
  }

  /**
   * Send command to device via MQTT
   */
  async sendCommand(command: DeviceCommand): Promise<void> {
    if (!this.isConnected()) {
      throw new NotConnectedError(this.protocol)
    }

    const topic = MQTT_TOPICS.DEVICE_SET(command.deviceId)
    const payload = {
      command: command.command,
      value: command.value,
      metadata: command.metadata,
      timestamp: new Date().toISOString(),
    }

    console.log(`[MQTTAdapter] Sending command to ${command.deviceId}:`, command.command)

    try {
      await this.mqttClient.publish(topic, JSON.stringify(payload), 1)
    } catch (error) {
      console.error(`[MQTTAdapter] Failed to send command to ${command.deviceId}:`, error)
      throw error
    }
  }

  /**
   * Subscribe to device state updates
   */
  onStateUpdate(deviceId: string, callback: (state: DeviceStateUpdate) => void): () => void {
    // Add callback to map
    if (!this.stateCallbacks.has(deviceId)) {
      this.stateCallbacks.set(deviceId, new Set())

      // Subscribe to device state topic
      const topic = MQTT_TOPICS.DEVICE_STATE(deviceId)
      const unsubscribe = this.mqttClient.subscribe(topic, message => {
        try {
          const rawState = JSON.parse(message)

          // Transform MQTT message to DeviceStateUpdate
          const enabled = rawState.enabled ?? rawState.state === 'ON'
          const state: DeviceStateUpdate = {
            deviceId: rawState.id || rawState.deviceId || deviceId,
            enabled,
            value: rawState.value ?? rawState.brightness ?? undefined,
            status: rawState.status || 'online',
            lastSeen: rawState.lastSeen ? new Date(rawState.lastSeen) : new Date(),
            metadata: rawState.metadata || {},
          }

          // Notify all callbacks for this device
          const callbacks = this.stateCallbacks.get(deviceId)
          if (callbacks) {
            callbacks.forEach(cb => cb(state))
          }
        } catch (error) {
          console.error(`[MQTTAdapter] Failed to parse state update for ${deviceId}:`, error)
        }
      })

      this.unsubscribeHandlers.set(`state:${deviceId}`, unsubscribe)
      console.log(`[MQTTAdapter] Subscribed to state updates for ${deviceId}`)
    }

    const callbacks = this.stateCallbacks.get(deviceId)
    if (callbacks) {
      callbacks.add(callback)
    }

    // Request current state
    this.requestDeviceState(deviceId).catch(error => {
      console.error(`[MQTTAdapter] Failed to request state for ${deviceId}:`, error)
    })

    // Return unsubscribe function
    return () => {
      const callbacks = this.stateCallbacks.get(deviceId)
      if (callbacks) {
        callbacks.delete(callback)

        // If no more callbacks, unsubscribe from topic
        if (callbacks.size === 0) {
          const unsubscribe = this.unsubscribeHandlers.get(`state:${deviceId}`)
          if (unsubscribe) {
            unsubscribe()
            this.unsubscribeHandlers.delete(`state:${deviceId}`)
          }
          this.stateCallbacks.delete(deviceId)
          console.log(`[MQTTAdapter] Unsubscribed from state updates for ${deviceId}`)
        }
      }
    }
  }

  /**
   * Discover devices on MQTT network
   */
  async discoverDevices(): Promise<DiscoveredDevice[]> {
    if (!this.isConnected()) {
      throw new NotConnectedError(this.protocol)
    }

    console.log('[MQTTAdapter] Starting device discovery...')

    // Clear previous discoveries
    this.discoveredDevices.clear()

    // Publish discovery request
    await this.mqttClient.publish(
      MQTT_TOPICS.SYSTEM_STATUS,
      JSON.stringify({ action: 'discover', timestamp: new Date().toISOString() }),
      1
    )

    // Wait for devices to announce themselves (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000))

    const devices = Array.from(this.discoveredDevices.values())
    console.log(`[MQTTAdapter] Discovered ${devices.length} devices`)

    return devices
  }

  /**
   * Get current connection state
   */
  getState(): 'connected' | 'disconnected' | 'reconnecting' | 'offline' | 'error' {
    return this.mqttClient.getState()
  }

  /**
   * Request current state from device
   * @private
   */
  private async requestDeviceState(deviceId: string): Promise<void> {
    const topic = MQTT_TOPICS.DEVICE_GET(deviceId)
    await this.mqttClient.publish(
      topic,
      JSON.stringify({ command: 'get_state', timestamp: new Date().toISOString() }),
      1
    )
  }
}
