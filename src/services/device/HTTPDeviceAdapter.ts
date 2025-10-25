/**
 * HTTP/REST Device Adapter
 *
 * Implements DeviceAdapter interface for HTTP/REST-based devices.
 * Supports polling-based state updates and various authentication methods.
 *
 * @example
 * ```typescript
 * import { HTTPDeviceAdapter } from '@/services/device'
 *
 * const adapter = new HTTPDeviceAdapter({
 *   baseUrl: 'http://192.168.1.100',
 *   authType: 'none',
 *   pollingInterval: 5000
 * })
 *
 * await adapter.connect()
 *
 * // Send command
 * await adapter.sendCommand({
 *   deviceId: 'light1',
 *   command: 'toggle'
 * })
 *
 * // Listen for state updates (via polling)
 * adapter.onStateUpdate('light1', (state) => {
 *   console.log('Device state:', state)
 * })
 * ```
 */

import type {
  DeviceAdapter,
  DeviceCommand,
  DeviceStateUpdate,
  DiscoveredDevice,
} from './DeviceAdapter'
import { NotConnectedError } from './DeviceAdapter'

/**
 * HTTP adapter configuration
 */
export interface HTTPAdapterConfig {
  /** Base URL for device API (e.g., 'http://192.168.1.100') */
  baseUrl: string

  /** Authentication type */
  authType: 'none' | 'basic' | 'bearer' | 'apikey'

  /** Authentication credentials */
  credentials?: {
    username?: string
    password?: string
    token?: string
    apiKey?: string
  }

  /** State polling interval in milliseconds (default: 5000) */
  pollingInterval?: number

  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number

  /** Number of retry attempts for failed requests (default: 3) */
  retryAttempts?: number

  /** Device type preset (shelly, tplink, hue, generic) */
  preset?: 'shelly' | 'tplink' | 'hue' | 'generic'
}

/**
 * Device preset configuration for common device types
 */
interface DevicePreset {
  discoverEndpoint: string
  statusEndpoint: (deviceId: string) => string
  commandEndpoint: (deviceId: string) => string
  parseDiscovery: (data: unknown) => DiscoveredDevice[]
  parseState: (data: unknown, deviceId: string) => DeviceStateUpdate
  buildCommand: (command: DeviceCommand) => { endpoint: string; body?: unknown; method: string }
}

/**
 * HTTP/REST Device Adapter
 */
export class HTTPDeviceAdapter implements DeviceAdapter {
  readonly protocol = 'http'

  private readonly config: Required<Omit<HTTPAdapterConfig, 'credentials'>> & {
    credentials?: HTTPAdapterConfig['credentials']
  }
  private connected = false
  private readonly stateCallbacks: Map<string, Set<(state: DeviceStateUpdate) => void>> = new Map()
  private readonly pollingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private readonly discoveredDevices: Map<string, DiscoveredDevice> = new Map()
  private readonly preset?: DevicePreset

  constructor(config: HTTPAdapterConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      authType: config.authType,
      credentials: config.credentials,
      pollingInterval: config.pollingInterval ?? 5000,
      timeout: config.timeout ?? 10000,
      retryAttempts: config.retryAttempts ?? 3,
      preset: config.preset ?? 'generic',
    }

    // Load device preset
    if (this.config.preset) {
      this.preset = this.getPreset(this.config.preset)
    }
  }

  /**
   * Get device preset configuration
   */
  private getPreset(presetName: string): DevicePreset {
    switch (presetName) {
      case 'shelly':
        return this.getShellyPreset()
      case 'tplink':
        return this.getTPLinkPreset()
      case 'hue':
        return this.getHuePreset()
      case 'generic':
      default:
        return this.getGenericPreset()
    }
  }

  /**
   * Shelly Gen2 device preset
   */
  private getShellyPreset(): DevicePreset {
    return {
      discoverEndpoint: '/shelly',
      statusEndpoint: (deviceId: string) => `/rpc/Switch.GetStatus?id=${deviceId}`,
      commandEndpoint: (deviceId: string) => `/rpc/Switch.Set?id=${deviceId}`,
      parseDiscovery: (data: unknown) => {
        const info = data as { name: string; type: string; mac: string }
        return [
          {
            id: info.mac || 'shelly-device',
            name: info.name || 'Shelly Device',
            type: 'light',
            protocol: 'http',
            capabilities: ['toggle', 'set_value'],
            metadata: { preset: 'shelly', ...info },
          },
        ]
      },
      parseState: (data: unknown, deviceId: string) => {
        const status = data as { id: number; output: boolean; apower?: number }
        return {
          deviceId,
          enabled: status.output ?? false,
          value: status.apower,
          status: 'online',
          lastSeen: new Date(),
          metadata: status,
        }
      },
      buildCommand: (command: DeviceCommand) => {
        // For Shelly devices, use switch ID 0 (first relay) as default
        // Real devices would map device IDs to switch IDs via metadata
        const switchId = '0'

        if (command.command === 'toggle') {
          return {
            endpoint: `/rpc/Switch.Toggle?id=${switchId}`,
            method: 'POST',
          }
        } else if (command.command === 'set_value') {
          const on = command.value ? 'true' : 'false'
          return {
            endpoint: `/rpc/Switch.Set?id=${switchId}&on=${on}`,
            method: 'POST',
          }
        }
        throw new Error(`Unsupported command: ${command.command}`)
      },
    }
  }

  /**
   * TPLink Kasa device preset
   */
  private getTPLinkPreset(): DevicePreset {
    return {
      discoverEndpoint: '/api/system/get_sysinfo',
      statusEndpoint: () => '/api/system/get_sysinfo',
      commandEndpoint: () => '/api/system/set_relay_state',
      parseDiscovery: (data: unknown) => {
        const info = data as { alias: string; model: string; deviceId: string }
        return [
          {
            id: info.deviceId || 'tplink-device',
            name: info.alias || 'TPLink Device',
            type: 'light',
            protocol: 'http',
            capabilities: ['toggle', 'set_value'],
            metadata: { preset: 'tplink', ...info },
          },
        ]
      },
      parseState: (data: unknown, deviceId: string) => {
        const info = data as { relay_state: number }
        return {
          deviceId,
          enabled: info.relay_state === 1,
          status: 'online',
          lastSeen: new Date(),
          metadata: info,
        }
      },
      buildCommand: (command: DeviceCommand) => {
        if (command.command === 'toggle' || command.command === 'set_value') {
          const state = command.value ? 1 : 0
          return {
            endpoint: '/api/system/set_relay_state',
            method: 'POST',
            body: { state },
          }
        }
        throw new Error(`Unsupported command: ${command.command}`)
      },
    }
  }

  /**
   * Philips Hue device preset
   */
  private getHuePreset(): DevicePreset {
    return {
      discoverEndpoint: '/api/lights',
      statusEndpoint: (deviceId: string) => `/api/lights/${deviceId}`,
      commandEndpoint: (deviceId: string) => `/api/lights/${deviceId}/state`,
      parseDiscovery: (data: unknown) => {
        const lights = data as Record<string, { name: string; type: string }>
        return Object.entries(lights).map(([id, light]) => ({
          id,
          name: light.name,
          type: 'light' as const,
          protocol: 'http',
          capabilities: ['toggle', 'set_value', 'set_color'],
          metadata: { preset: 'hue', ...light },
        }))
      },
      parseState: (data: unknown, deviceId: string) => {
        const light = data as { state: { on: boolean; bri: number } }
        return {
          deviceId,
          enabled: light.state.on,
          value: Math.round((light.state.bri / 254) * 100),
          status: 'online',
          lastSeen: new Date(),
          metadata: light,
        }
      },
      buildCommand: (command: DeviceCommand) => {
        if (command.command === 'toggle') {
          return {
            endpoint: `/api/lights/${command.deviceId}/state`,
            method: 'PUT',
            body: { on: !command.value },
          }
        } else if (command.command === 'set_value') {
          const bri = Math.round((Number(command.value) / 100) * 254)
          return {
            endpoint: `/api/lights/${command.deviceId}/state`,
            method: 'PUT',
            body: { on: true, bri },
          }
        }
        throw new Error(`Unsupported command: ${command.command}`)
      },
    }
  }

  /**
   * Generic HTTP device preset
   */
  private getGenericPreset(): DevicePreset {
    return {
      discoverEndpoint: '/api/devices',
      statusEndpoint: (deviceId: string) => `/api/devices/${deviceId}/status`,
      commandEndpoint: (deviceId: string) => `/api/devices/${deviceId}/command`,
      parseDiscovery: (data: unknown) => {
        const devices = data as Array<{ id: string; name: string; type: string }>
        return devices.map(device => ({
          id: device.id,
          name: device.name,
          type: (device.type as DiscoveredDevice['type']) || 'light',
          protocol: 'http',
          capabilities: ['toggle', 'set_value'],
          metadata: { preset: 'generic', ...device },
        }))
      },
      parseState: (data: unknown, deviceId: string) => {
        const state = data as { enabled: boolean; value?: number; status?: string }
        return {
          deviceId,
          enabled: state.enabled ?? false,
          value: state.value,
          status: (state.status as DeviceStateUpdate['status']) || 'online',
          lastSeen: new Date(),
          metadata: state,
        }
      },
      buildCommand: (command: DeviceCommand) => {
        return {
          endpoint: `/api/devices/${command.deviceId}/command`,
          method: 'POST',
          body: {
            command: command.command,
            value: command.value,
            metadata: command.metadata,
          },
        }
      },
    }
  }

  /**
   * Make HTTP request with authentication and retry logic
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: string
      body?: unknown
      attempt?: number
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, attempt = 1 } = options
    const url = `${this.config.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add authentication headers
    if (this.config.authType === 'basic' && this.config.credentials) {
      const { username, password } = this.config.credentials
      const auth = btoa(`${username}:${password}`)
      headers['Authorization'] = `Basic ${auth}`
    } else if (this.config.authType === 'bearer' && this.config.credentials?.token) {
      headers['Authorization'] = `Bearer ${this.config.credentials.token}`
    } else if (this.config.authType === 'apikey' && this.config.credentials?.apiKey) {
      headers['X-API-Key'] = this.config.credentials.apiKey
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      // Retry on failure
      if (attempt < this.config.retryAttempts) {
        console.warn(
          `[HTTPAdapter] Request failed (attempt ${attempt}/${this.config.retryAttempts}), retrying...`
        )
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        return this.request<T>(endpoint, { method, body, attempt: attempt + 1 })
      }

      console.error(`[HTTPAdapter] Request failed after ${attempt} attempts:`, error)
      throw error
    }
  }

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Connect to HTTP device
   */
  async connect(): Promise<void> {
    if (this.connected) {
      console.log('[HTTPAdapter] Already connected')
      return
    }

    try {
      // Test connection by making a simple request to /health endpoint
      await this.request('/health')
      this.connected = true
      console.log('[HTTPAdapter] Connected to', this.config.baseUrl)
    } catch (error) {
      console.error('[HTTPAdapter] Connection failed:', error)
      throw new Error(`Failed to connect to ${this.config.baseUrl}`)
    }
  }

  /**
   * Disconnect from HTTP device
   */
  async disconnect(): Promise<void> {
    // Stop all polling intervals
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval)
    }
    this.pollingIntervals.clear()
    this.stateCallbacks.clear()
    this.connected = false

    console.log('[HTTPAdapter] Disconnected')
  }

  /**
   * Send command to device
   */
  async sendCommand(command: DeviceCommand): Promise<void> {
    if (!this.connected) {
      throw new NotConnectedError(this.protocol)
    }

    if (!this.preset) {
      throw new Error('No device preset configured')
    }

    try {
      const { endpoint, body, method } = this.preset.buildCommand(command)
      await this.request(endpoint, { method, body })

      console.log(`[HTTPAdapter] Command sent to ${command.deviceId}:`, command.command)

      // Immediately poll for updated state
      this.pollDeviceState(command.deviceId)
    } catch (error) {
      console.error(`[HTTPAdapter] Failed to send command to ${command.deviceId}:`, error)
      throw error
    }
  }

  /**
   * Subscribe to device state updates (via polling)
   */
  onStateUpdate(deviceId: string, callback: (state: DeviceStateUpdate) => void): () => void {
    // Add callback
    if (!this.stateCallbacks.has(deviceId)) {
      this.stateCallbacks.set(deviceId, new Set())
    }
    this.stateCallbacks.get(deviceId)!.add(callback)

    // Start polling if not already polling
    if (!this.pollingIntervals.has(deviceId)) {
      const interval = setInterval(() => {
        this.pollDeviceState(deviceId)
      }, this.config.pollingInterval)

      this.pollingIntervals.set(deviceId, interval)

      // Initial poll
      this.pollDeviceState(deviceId)
    }

    console.log(`[HTTPAdapter] Started polling for ${deviceId}`)

    // Return unsubscribe function
    return () => {
      const callbacks = this.stateCallbacks.get(deviceId)
      if (callbacks) {
        callbacks.delete(callback)

        // Stop polling if no more callbacks
        if (callbacks.size === 0) {
          const interval = this.pollingIntervals.get(deviceId)
          if (interval) {
            clearInterval(interval)
            this.pollingIntervals.delete(deviceId)
          }
          this.stateCallbacks.delete(deviceId)
          console.log(`[HTTPAdapter] Stopped polling for ${deviceId}`)
        }
      }
    }
  }

  /**
   * Poll device state
   */
  private async pollDeviceState(deviceId: string): Promise<void> {
    if (!this.preset) return

    try {
      const endpoint = this.preset.statusEndpoint(deviceId)
      const data = await this.request(endpoint)
      const state = this.preset.parseState(data, deviceId)

      // Notify callbacks
      const callbacks = this.stateCallbacks.get(deviceId)
      if (callbacks) {
        callbacks.forEach(callback => callback(state))
      }
    } catch (error) {
      console.error(`[HTTPAdapter] Failed to poll state for ${deviceId}:`, error)

      // Notify offline state
      const callbacks = this.stateCallbacks.get(deviceId)
      if (callbacks) {
        const offlineState: DeviceStateUpdate = {
          deviceId,
          enabled: false,
          status: 'offline',
          lastSeen: new Date(),
        }
        callbacks.forEach(callback => callback(offlineState))
      }
    }
  }

  /**
   * Discover devices
   */
  async discoverDevices(): Promise<DiscoveredDevice[]> {
    if (!this.connected) {
      throw new NotConnectedError(this.protocol)
    }

    if (!this.preset) {
      throw new Error('No device preset configured')
    }

    try {
      const data = await this.request(this.preset.discoverEndpoint)
      const devices = this.preset.parseDiscovery(data)

      // Cache discovered devices
      for (const device of devices) {
        this.discoveredDevices.set(device.id, device)
      }

      console.log(`[HTTPAdapter] Discovered ${devices.length} devices`)
      return devices
    } catch (error) {
      console.error('[HTTPAdapter] Discovery failed:', error)
      return []
    }
  }

  /**
   * Get connection state
   */
  getState(): 'connected' | 'disconnected' | 'reconnecting' | 'offline' | 'error' {
    return this.connected ? 'connected' : 'disconnected'
  }
}
