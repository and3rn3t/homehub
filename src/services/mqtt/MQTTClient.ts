/**
 * MQTT Client Service
 *
 * Singleton service for managing MQTT broker connection.
 * Handles auto-reconnect, message routing, and connection state.
 *
 * @example
 * ```typescript
 * import { MQTTClientService } from '@/services/mqtt'
 *
 * // Initialize (only once)
 * const mqtt = MQTTClientService.getInstance({
 *   brokerUrl: 'ws://localhost:9001'
 * })
 *
 * // Connect
 * await mqtt.connect()
 *
 * // Subscribe to topic
 * const unsubscribe = mqtt.subscribe('homehub/devices/+/state', (message) => {
 *   console.log('Device state:', JSON.parse(message))
 * })
 *
 * // Publish message
 * await mqtt.publish('homehub/devices/light1/set', JSON.stringify({ command: 'toggle' }))
 *
 * // Unsubscribe
 * unsubscribe()
 * ```
 */

import type { MQTTConfig, MQTTConnectionState } from '@/types/mqtt.types'
import { EventEmitter } from 'events'
import mqtt, { type IClientOptions, type MqttClient } from 'mqtt'

export class MQTTClientService extends EventEmitter {
  private static instance: MQTTClientService | null = null
  private client: MqttClient | null = null
  private config: Required<MQTTConfig>
  private subscriptions: Map<string, Set<(message: string) => void>> = new Map()
  private connectionState: MQTTConnectionState = 'offline'

  private constructor(config: MQTTConfig) {
    super()
    this.config = {
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
      clean: true,
      clientId: `homehub-${Math.random().toString(16).slice(2, 8)}`,
      username: '',
      password: '',
      ...config,
    }
  }

  /**
   * Get singleton instance
   *
   * @param config Configuration (required for first initialization)
   * @returns MQTTClientService instance
   * @throws {Error} If config not provided on first call
   */
  static getInstance(config?: MQTTConfig): MQTTClientService {
    if (!MQTTClientService.instance) {
      if (!config) {
        throw new Error('MQTTClientService: config required for first initialization')
      }
      MQTTClientService.instance = new MQTTClientService(config)
    }
    return MQTTClientService.instance
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    if (MQTTClientService.instance) {
      MQTTClientService.instance.disconnect()
      MQTTClientService.instance = null
    }
  }

  /**
   * Connect to MQTT broker
   *
   * @returns Promise that resolves when connected
   * @throws {Error} If connection fails
   */
  async connect(): Promise<void> {
    if (this.client?.connected) {
      console.log('[MQTT] Already connected')
      return
    }

    return new Promise((resolve, reject) => {
      const options: IClientOptions = {
        clientId: this.config.clientId,
        username: this.config.username || undefined,
        password: this.config.password || undefined,
        reconnectPeriod: this.config.reconnectPeriod,
        connectTimeout: this.config.connectTimeout,
        keepalive: this.config.keepalive,
        clean: this.config.clean,
      }

      console.log('[MQTT] Connecting to broker:', this.config.brokerUrl)
      this.connectionState = 'reconnecting'
      this.client = mqtt.connect(this.config.brokerUrl, options)

      const connectionTimeout = setTimeout(() => {
        this.connectionState = 'error'
        reject(new Error('Connection timeout'))
      }, this.config.connectTimeout)

      this.client.on('connect', () => {
        clearTimeout(connectionTimeout)
        console.log('[MQTT] Connected to broker:', this.config.brokerUrl)
        this.connectionState = 'connected'
        this.emit('connected')
        resolve()

        // Resubscribe to all topics after reconnect
        if (this.subscriptions.size > 0 && this.client) {
          console.log('[MQTT] Resubscribing to', this.subscriptions.size, 'topics')
          for (const topic of this.subscriptions.keys()) {
            this.client.subscribe(topic, { qos: 1 }, error => {
              if (error) {
                console.error(`[MQTT] Resubscribe error on ${topic}:`, error)
              }
            })
          }
        }
      })

      this.client.on('error', error => {
        clearTimeout(connectionTimeout)
        console.error('[MQTT] Connection error:', error)
        this.connectionState = 'error'
        this.emit('error', error)
        reject(error)
      })

      this.client.on('message', (topic, payload) => {
        const message = payload.toString()
        console.log(`[MQTT] Received on ${topic}:`, message.substring(0, 100))

        // Route to topic-specific handlers
        const handlers = this.subscriptions.get(topic)
        if (handlers) {
          handlers.forEach(handler => handler(message))
        }

        // Also check wildcard subscriptions
        for (const [pattern, handlers] of this.subscriptions.entries()) {
          if (pattern.includes('+') || pattern.includes('#')) {
            if (this.matchTopic(topic, pattern)) {
              handlers.forEach(handler => handler(message))
            }
          }
        }

        // Emit global message event
        this.emit('message', { topic, message })
      })

      this.client.on('disconnect', () => {
        console.log('[MQTT] Disconnected from broker')
        this.connectionState = 'disconnected'
        this.emit('disconnected')
      })

      this.client.on('reconnect', () => {
        console.log('[MQTT] Reconnecting to broker...')
        this.connectionState = 'reconnecting'
        this.emit('reconnecting')
      })

      this.client.on('offline', () => {
        console.log('[MQTT] Client offline')
        this.connectionState = 'offline'
        this.emit('offline')
      })

      this.client.on('close', () => {
        console.log('[MQTT] Connection closed')
        this.connectionState = 'disconnected'
      })
    })
  }

  /**
   * Disconnect from MQTT broker
   *
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    if (!this.client) return

    const client = this.client
    return new Promise(resolve => {
      client.end(false, {}, () => {
        console.log('[MQTT] Disconnected cleanly')
        this.client = null
        this.connectionState = 'offline'
        resolve()
      })
    })
  }

  /**
   * Publish message to topic
   *
   * @param topic Topic to publish to
   * @param message Message payload (string or object)
   * @param qos Quality of Service level (0, 1, or 2)
   * @returns Promise that resolves when published
   * @throws {Error} If not connected or publish fails
   */
  async publish(topic: string, message: string | object, qos: 0 | 1 | 2 = 1): Promise<void> {
    if (!this.client?.connected) {
      throw new Error('MQTT client not connected')
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message)

    const client = this.client
    return new Promise((resolve, reject) => {
      client.publish(topic, payload, { qos }, error => {
        if (error) {
          console.error(`[MQTT] Publish error on ${topic}:`, error)
          reject(error)
        } else {
          console.log(`[MQTT] Published to ${topic}:`, payload.substring(0, 100))
          resolve()
        }
      })
    })
  }

  /**
   * Subscribe to topic
   *
   * @param topic Topic or pattern to subscribe to (supports + and # wildcards)
   * @param handler Function called when message received
   * @returns Unsubscribe function
   * @throws {Error} If not connected
   */
  subscribe(topic: string, handler: (message: string) => void): () => void {
    if (!this.client?.connected) {
      throw new Error('MQTT client not connected')
    }

    // Add handler to subscriptions map
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set())

      // Subscribe to topic on broker
      this.client.subscribe(topic, { qos: 1 }, error => {
        if (error) {
          console.error(`[MQTT] Subscribe error on ${topic}:`, error)
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`)
        }
      })
    }

    const handlers = this.subscriptions.get(topic)
    if (handlers) {
      handlers.add(handler)
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(topic)
      if (handlers) {
        handlers.delete(handler)

        // If no more handlers, unsubscribe from broker
        if (handlers.size === 0) {
          this.subscriptions.delete(topic)
          this.client?.unsubscribe(topic, error => {
            if (error) {
              console.error(`[MQTT] Unsubscribe error on ${topic}:`, error)
            } else {
              console.log(`[MQTT] Unsubscribed from ${topic}`)
            }
          })
        }
      }
    }
  }

  /**
   * Check if connected to broker
   */
  isConnected(): boolean {
    return this.client?.connected ?? false
  }

  /**
   * Get current connection state
   */
  getState(): MQTTConnectionState {
    return this.connectionState
  }

  /**
   * Get broker URL
   */
  getBrokerUrl(): string {
    return this.config.brokerUrl
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.config.clientId
  }

  /**
   * Match topic against pattern with wildcards
   * @private
   */
  private matchTopic(topic: string, pattern: string): boolean {
    const topicParts = topic.split('/')
    const patternParts = pattern.split('/')

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]

      if (patternPart === '#') {
        return true // # matches all remaining levels
      }

      if (patternPart === '+') {
        if (i >= topicParts.length) return false
        continue // + matches single level
      }

      if (patternPart !== topicParts[i]) {
        return false
      }
    }

    return topicParts.length === patternParts.length
  }
}
