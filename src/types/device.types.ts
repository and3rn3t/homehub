/**
 * Device Type Definitions
 *
 * Core entity representing smart home devices across all platforms.
 * Used for lights, thermostats, sensors, security devices, etc.
 */

export type DeviceType = 'light' | 'thermostat' | 'security' | 'sensor'
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error'
export type DeviceProtocol = 'mqtt' | 'http'

export interface Device {
  /** Unique identifier (UUID recommended) */
  id: string

  /** Human-readable display name */
  name: string

  /** Device category for icon/behavior mapping */
  type: DeviceType

  /** Room association for grouping */
  room: string

  /** Current connection/operational status */
  status: DeviceStatus

  /** Power state (on/off) */
  enabled: boolean

  /** Communication protocol used by device */
  protocol: DeviceProtocol

  /** Current value (brightness %, temperature °F, etc.) */
  value?: number

  /** Measurement unit for value display */
  unit?: string

  /** Last successful communication timestamp */
  lastSeen?: Date

  /** Battery level percentage (0-100) */
  batteryLevel?: number

  /** WiFi/network signal strength (0-100) */
  signalStrength?: number

  /** Device-specific capabilities (future use) */
  capabilities?: string[]

  /** Communication endpoint (future use for real devices) */
  endpoint?: string

  /** Protocol-specific configuration */
  config?: {
    // MQTT-specific
    mqttTopic?: string
    mqttClientId?: string

    // HTTP-specific
    httpEndpoint?: string
    httpPreset?: 'shelly' | 'tplink' | 'hue' | 'generic'
    httpAuth?: {
      type: 'basic' | 'bearer' | 'apikey' | 'custom'
      username?: string
      password?: string
      token?: string
      apiKey?: string
      headers?: Record<string, string>
    }
    pollInterval?: number // Polling interval in ms
  }
}

/**
 * Device Alert/Notification
 *
 * Represents issues or maintenance notifications for devices.
 */
export type AlertType = 'offline' | 'low-battery' | 'weak-signal' | 'error' | 'maintenance'
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface DeviceAlert {
  /** Unique identifier */
  id: string

  /** Alert category */
  type: AlertType

  /** User-facing alert message */
  message: string

  /** Priority level for sorting/filtering */
  severity: AlertSeverity

  /** When the alert was generated */
  timestamp: Date

  /** Whether user has seen/dismissed the alert */
  acknowledged: boolean

  /** Optional reference to affected device */
  deviceId?: string
}
