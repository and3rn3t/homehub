/**
 * Device Control Hook
 *
 * React hook for controlling smart home devices across all protocols.
 * Provides simple interface for turn on/off, brightness, color, etc.
 *
 * @example
 * ```tsx
 * function DeviceCard({ device }: { device: Device }) {
 *   const { turnOn, turnOff, setBrightness, isLoading } = useDeviceControl(device)
 *
 *   return (
 *     <button onClick={turnOn} disabled={isLoading}>
 *       Turn On
 *     </button>
 *   )
 * }
 * ```
 */

import { getDeviceManager, type DeviceManagerOptions } from '@/services/devices/DeviceManager'
import type { Device } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

/**
 * Device control hook return type
 */
export interface UseDeviceControlReturn {
  /** Turn device on */
  turnOn: () => Promise<void>

  /** Turn device off */
  turnOff: () => Promise<void>

  /** Toggle device on/off */
  toggle: () => Promise<void>

  /** Set brightness (0-100) */
  setBrightness: (value: number) => Promise<void>

  /** Set color (hex string) */
  setColor: (color: string) => Promise<void>

  /** Set color temperature (in Kelvin) */
  setColorTemperature: (kelvin: number) => Promise<void>

  /** Set temperature (for thermostats) */
  setTemperature: (value: number) => Promise<void>

  /** Whether a command is currently executing */
  isLoading: boolean

  /** Last error message (if any) */
  error: string | null

  /** Clear error message */
  clearError: () => void
}

/**
 * Hook options
 */
export interface UseDeviceControlOptions {
  /** Show toast notifications on success/error */
  showToast?: boolean

  /** Custom success message */
  successMessage?: string

  /** Custom error message */
  errorMessage?: string

  /** Callback after successful command */
  onSuccess?: () => void

  /** Callback after failed command */
  onError?: (error: string) => void

  /** Device manager options */
  managerOptions?: DeviceManagerOptions
}

/**
 * React hook for controlling smart home devices
 *
 * Provides simple interface for device control with automatic error handling,
 * loading states, and optional toast notifications.
 */
export function useDeviceControl(
  device: Device,
  options: UseDeviceControlOptions = {}
): UseDeviceControlReturn {
  const {
    showToast = true,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    managerOptions,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get device manager instance
  const manager = getDeviceManager(managerOptions)

  // Clear error when device changes
  useEffect(() => {
    setError(null)
  }, [device.id])

  /**
   * Execute command with error handling
   */
  const executeCommand = useCallback(
    async (commandFn: () => Promise<{ success: boolean; error?: string }>, actionName: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await commandFn()

        if (result.success) {
          if (showToast) {
            toast.success(successMessage || `${device.name} ${actionName}`)
          }
          onSuccess?.()
        } else {
          const errMsg = result.error || 'Command failed'
          setError(errMsg)

          if (showToast) {
            toast.error(errorMessage || `Failed to ${actionName.toLowerCase()}`, {
              description: errMsg,
            })
          }
          onError?.(errMsg)
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(errMsg)

        if (showToast) {
          toast.error(errorMessage || `Failed to ${actionName.toLowerCase()}`, {
            description: errMsg,
          })
        }
        onError?.(errMsg)
      } finally {
        setIsLoading(false)
      }
    },
    [device.name, successMessage, errorMessage, showToast, onSuccess, onError]
  )

  /**
   * Turn device on
   */
  const turnOn = useCallback(async () => {
    await executeCommand(() => manager.turnOn(device), 'turned on')
  }, [device, manager, executeCommand])

  /**
   * Turn device off
   */
  const turnOff = useCallback(async () => {
    await executeCommand(() => manager.turnOff(device), 'turned off')
  }, [device, manager, executeCommand])

  /**
   * Toggle device on/off
   */
  const toggle = useCallback(async () => {
    if (device.enabled) {
      await turnOff()
    } else {
      await turnOn()
    }
  }, [device.enabled, turnOn, turnOff])

  /**
   * Set brightness (0-100)
   */
  const setBrightness = useCallback(
    async (value: number) => {
      await executeCommand(
        () => manager.setBrightness(device, value),
        `brightness set to ${value}%`
      )
    },
    [device, manager, executeCommand]
  )

  /**
   * Set color (hex string)
   */
  const setColor = useCallback(
    async (color: string) => {
      await executeCommand(() => manager.setColor(device, color), 'color changed')
    },
    [device, manager, executeCommand]
  )

  /**
   * Set color temperature (in Kelvin)
   */
  const setColorTemperature = useCallback(
    async (kelvin: number) => {
      await executeCommand(
        () => manager.setColorTemperature(device, kelvin),
        `color temperature set to ${kelvin}K`
      )
    },
    [device, manager, executeCommand]
  )

  /**
   * Set temperature (for thermostats)
   */
  const setTemperature = useCallback(
    async (value: number) => {
      await executeCommand(
        () => manager.setTemperature(device, value),
        `temperature set to ${value}°`
      )
    },
    [device, manager, executeCommand]
  )

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    turnOn,
    turnOff,
    toggle,
    setBrightness,
    setColor,
    setColorTemperature,
    setTemperature,
    isLoading,
    error,
    clearError,
  }
}
