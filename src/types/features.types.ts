/**
 * Additional Feature Type Definitions
 *
 * Types for specialized features.
 */

/**
 * Intercom System
 */
export type IntercomDeviceType = 'homepod' | 'display' | 'mobile' | 'tv'
export type IntercomDeviceStatus = 'available' | 'busy' | 'offline'

export interface IntercomDevice {
  id: string
  name: string
  room: string
  type: IntercomDeviceType
  status: IntercomDeviceStatus
  hasVideo: boolean
  hasAudio: boolean
}

export interface ActiveCall {
  id: string
  fromDevice: string
  toDevice: string
  startTime: Date
  hasVideo: boolean
}

/**
 * Settings & Integrations
 */
export interface Integration {
  id: string
  name: string
  type: 'homekit' | 'alexa' | 'google' | 'matter' | 'thread'
  enabled: boolean
  connected: boolean
  lastSync?: Date
}

export interface SystemSetting {
  id: string
  category: 'general' | 'notifications' | 'security' | 'integrations'
  name: string
  description: string
  value: boolean | string | number
  type: 'toggle' | 'select' | 'input'
  options?: string[]
}

/**
 * Monitoring Settings
 */
export type MonitoringMetric = 'uptime' | 'latency' | 'battery' | 'signal'

export interface MonitoringSettings {
  enabledMetrics: MonitoringMetric[]
  alertThresholds: {
    uptime: number
    latency: number
    battery: number
    signal: number
  }
  notificationsEnabled: boolean
}

/**
 * Adaptive Lighting
 */
export interface AdaptiveLightingSettings {
  enabled: boolean
  sunriseTime: string
  sunsetTime: string
  colorTemperatureRange: {
    min: number
    max: number
  }
  affectedDeviceIds: string[]
}
