/**
 * Action Executor Service
 *
 * Executes automation actions with retry logic, error handling, and rollback support.
 * Integrates with DeviceManager to control actual devices.
 */

import type { AutomationAction, Device } from '@/types'
import { getDeviceManager, type DeviceManager } from '../devices/DeviceManager'
import type { DeviceCommandResult } from '../devices/types'

/**
 * Single action execution result
 */
export interface ActionExecutionResult {
  /** Device ID that was controlled */
  deviceId: string
  /** Action that was performed */
  action: string
  /** Whether the action succeeded */
  success: boolean
  /** Time taken in milliseconds */
  duration: number
  /** Error message if failed */
  error?: string
  /** Number of retry attempts */
  retries: number
}

/**
 * Complete automation execution result
 */
export interface ExecutionResult {
  /** All action results */
  actions: ActionExecutionResult[]
  /** Overall success (all actions succeeded) */
  success: boolean
  /** Total execution time in ms */
  totalDuration: number
  /** Timestamp of execution */
  timestamp: Date
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  /** Maximum retry attempts per action */
  maxRetries?: number
  /** Initial retry delay in ms (doubles each retry) */
  retryDelay?: number
  /** Timeout for each action in ms */
  timeout?: number
  /** Execute actions in parallel (default: sequential) */
  parallel?: boolean
  /** Rollback on partial failure */
  rollback?: boolean
}

/**
 * Action Executor Service
 *
 * Executes automation actions with retry logic and error handling.
 */
export class ActionExecutorService {
  private readonly deviceManager: DeviceManager
  private readonly devices = new Map<string, Device>()
  private readonly defaultOptions: Required<ExecutionOptions>
  private readonly debug: boolean

  constructor(options: { debug?: boolean } & ExecutionOptions = {}) {
    this.deviceManager = getDeviceManager()
    this.debug = options.debug ?? false
    this.defaultOptions = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      timeout: options.timeout ?? 5000,
      parallel: options.parallel ?? false,
      rollback: options.rollback ?? false,
    }
  }

  /**
   * Update device registry (called by hooks when devices change)
   */
  updateDevices(devices: Device[]): void {
    this.devices.clear()
    devices.forEach(device => {
      this.devices.set(device.id, device)
    })
    this.log(`Updated device registry: ${devices.length} devices`)
  }

  /**
   * Execute a list of actions
   */
  async execute(
    actions: AutomationAction[],
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }

    this.log(`Executing ${actions.length} actions (${opts.parallel ? 'parallel' : 'sequential'})`)

    let results: ActionExecutionResult[]

    try {
      if (opts.parallel) {
        results = await this.executeParallel(actions, opts)
      } else {
        results = await this.executeSequential(actions, opts)
      }
    } catch (error) {
      // Catastrophic failure - log and return error result
      console.error('[ActionExecutor] Catastrophic execution failure:', error)
      return {
        actions: [],
        success: false,
        totalDuration: Date.now() - startTime,
        timestamp: new Date(),
      }
    }

    const success = results.every(r => r.success)
    const totalDuration = Date.now() - startTime

    // If rollback enabled and some actions failed, attempt rollback
    if (opts.rollback && !success) {
      await this.rollbackActions(results.filter(r => r.success))
    }

    return {
      actions: results,
      success,
      totalDuration,
      timestamp: new Date(),
    }
  }

  /**
   * Execute actions sequentially (one after another)
   */
  private async executeSequential(
    actions: AutomationAction[],
    options: Required<ExecutionOptions>
  ): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = []

    for (const action of actions) {
      const result = await this.executeAction(action, options)
      results.push(result)

      // Stop on failure if rollback is disabled
      if (!result.success && !options.rollback) {
        this.log(`Action failed, stopping execution: ${result.error}`)
        break
      }
    }

    return results
  }

  /**
   * Execute actions in parallel (all at once)
   */
  private async executeParallel(
    actions: AutomationAction[],
    options: Required<ExecutionOptions>
  ): Promise<ActionExecutionResult[]> {
    const promises = actions.map(action => this.executeAction(action, options))
    return await Promise.all(promises)
  }

  /**
   * Execute a single action with retry logic
   */
  private async executeAction(
    action: AutomationAction,
    options: Required<ExecutionOptions>
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now()
    let retries = 0
    let lastError: string | undefined

    // Get device
    const device = action.deviceId ? this.devices.get(action.deviceId) : undefined
    if (!device) {
      return {
        deviceId: action.deviceId || 'unknown',
        action: action.action,
        success: false,
        duration: Date.now() - startTime,
        error: `Device not found: ${action.deviceId}`,
        retries: 0,
      }
    }

    // Retry loop
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        // Execute action with timeout
        const result = await Promise.race([
          this.performAction(device, action),
          this.timeout(options.timeout),
        ])

        if (result.success) {
          return {
            deviceId: device.id,
            action: action.action,
            success: true,
            duration: Date.now() - startTime,
            retries: attempt,
          }
        }

        lastError = result.error
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        this.log(`Action attempt ${attempt + 1} failed: ${lastError}`)
      }

      // Don't retry on last attempt
      if (attempt < options.maxRetries) {
        const delay = options.retryDelay * Math.pow(2, attempt) // Exponential backoff
        this.log(`Retrying in ${delay}ms...`)
        await this.delay(delay)
        retries++
      }
    }

    // All retries exhausted
    return {
      deviceId: device.id,
      action: action.action,
      success: false,
      duration: Date.now() - startTime,
      error: lastError || 'All retries exhausted',
      retries,
    }
  }

  /**
   * Perform the actual device control action
   */
  private async performAction(
    device: Device,
    action: AutomationAction
  ): Promise<DeviceCommandResult> {
    this.log(`Performing action: ${action.action} on device ${device.name}`)

    switch (action.action) {
      case 'turn_on':
        return await this.deviceManager.turnOn(device)

      case 'turn_off':
        return await this.deviceManager.turnOff(device)

      case 'toggle':
        // Toggle based on current state
        return device.enabled
          ? await this.deviceManager.turnOff(device)
          : await this.deviceManager.turnOn(device)

      case 'set_brightness':
        if (action.value === undefined) {
          return {
            success: false,
            error: 'Brightness value required',
            timestamp: new Date(),
          }
        }
        return await this.deviceManager.setBrightness(device, action.value)

      case 'set_color':
        if (!action.value) {
          return {
            success: false,
            error: 'Color value required',
            timestamp: new Date(),
          }
        }
        return await this.deviceManager.setColor(device, action.value)

      case 'set_temperature':
        if (action.value === undefined) {
          return {
            success: false,
            error: 'Temperature value required',
            timestamp: new Date(),
          }
        }
        return await this.deviceManager.setColorTemperature(device, action.value)

      default:
        return {
          success: false,
          error: `Unknown action: ${action.action}`,
          timestamp: new Date(),
        }
    }
  }

  /**
   * Rollback successfully executed actions (best effort)
   */
  private async rollbackActions(successfulActions: ActionExecutionResult[]): Promise<void> {
    this.log(`Rolling back ${successfulActions.length} actions...`)

    for (const result of successfulActions) {
      const device = this.devices.get(result.deviceId)
      if (!device) continue

      try {
        // Attempt to reverse the action
        switch (result.action) {
          case 'turn_on':
            await this.deviceManager.turnOff(device)
            break
          case 'turn_off':
            await this.deviceManager.turnOn(device)
            break
          // For other actions, we don't have previous state to restore
          // This is a limitation - future enhancement could track state history
        }
      } catch (error) {
        this.log(`Rollback failed for ${result.deviceId}: ${error}`)
      }
    }
  }

  /**
   * Helper: Create a timeout promise
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Action timeout after ${ms}ms`)), ms)
    )
  }

  /**
   * Helper: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Helper: Debug logging
   */
  private log(message: string): void {
    if (this.debug) {
      console.log(`[ActionExecutor] ${message}`)
    }
  }
}

// Export singleton instance
export const actionExecutorService = new ActionExecutorService({
  debug: true,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
})
