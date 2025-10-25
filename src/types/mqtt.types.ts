/**
 * MQTT Type Definitions
 *
 * TypeScript types for MQTT communication and device control.
 */

export interface MQTTConfig {
  brokerUrl: string // 'mqtt://localhost:1883' or 'ws://localhost:9001'
  clientId?: string
  username?: string
  password?: string
  reconnectPeriod?: number // Default 5000ms
  connectTimeout?: number // Default 30000ms
  keepalive?: number // Default 60 seconds
  clean?: boolean // Default true
}

export interface MQTTMessage {
  topic: string
  payload: string | Buffer
  qos: 0 | 1 | 2
  retain?: boolean
}

export interface MQTTSubscription {
  topic: string
  qos: 0 | 1 | 2
  handler: (message: string) => void
  unsubscribe: () => void
}

export type MQTTConnectionState =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'offline'
  | 'error'

export interface MQTTClientEvents {
  connected: () => void
  disconnected: () => void
  reconnecting: () => void
  error: (error: Error) => void
  message: (data: { topic: string; message: string }) => void
}
