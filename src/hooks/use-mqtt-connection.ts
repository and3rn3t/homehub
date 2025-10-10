/**
 * MQTT Connection Status Hook
 *
 * Lightweight hook for monitoring and controlling MQTT connection.
 * Use this when you only need connection status without full device management.
 *
 * Usage:
 *   const { isConnected, connectionState, connect, disconnect } = useMQTTConnection()
 */

import { MQTTClientService } from '@/services/mqtt/MQTTClient'
import type { MQTTConnectionState } from '@/types/mqtt.types'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseMQTTConnectionReturn {
  isConnected: boolean
  connectionState: MQTTConnectionState
  connect: () => Promise<void>
  disconnect: () => void
  error: Error | null
}

/**
 * Hook to monitor MQTT connection status
 */
export function useMQTTConnection(): UseMQTTConnectionReturn {
  const [connectionState, setConnectionState] = useState<MQTTConnectionState>('offline')
  const [error, setError] = useState<Error | null>(null)
  const clientRef = useRef<MQTTClientService | null>(null)

  /**
   * Get MQTT client instance
   */
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = MQTTClientService.getInstance()
    }
    return clientRef.current
  }, [])

  /**
   * Connect to MQTT broker
   */
  const connect = useCallback(async () => {
    try {
      setError(null)
      const client = getClient()
      await client.connect()
    } catch (err) {
      console.error('Failed to connect to MQTT broker:', err)
      setError(err as Error)
      throw err
    }
  }, [getClient])

  /**
   * Disconnect from MQTT broker
   */
  const disconnect = useCallback(() => {
    const client = getClient()
    client.disconnect()
  }, [getClient])

  /**
   * Monitor connection state changes
   */
  useEffect(() => {
    const client = getClient()

    const handleConnect = () => {
      setConnectionState('connected')
      setError(null)
    }

    const handleDisconnect = () => {
      setConnectionState('disconnected')
    }

    const handleReconnecting = () => {
      setConnectionState('reconnecting')
    }

    const handleError = (err: Error) => {
      setConnectionState('error')
      setError(err)
    }

    // Subscribe to connection events
    client.on('connect', handleConnect)
    client.on('disconnect', handleDisconnect)
    client.on('reconnect', handleReconnecting)
    client.on('error', handleError)

    // Get initial state
    if (client.isConnected()) {
      setConnectionState('connected')
    }

    return () => {
      // Cleanup event listeners
      client.off('connect', handleConnect)
      client.off('disconnect', handleDisconnect)
      client.off('reconnect', handleReconnecting)
      client.off('error', handleError)
    }
  }, [getClient])

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    connect,
    disconnect,
    error,
  }
}
