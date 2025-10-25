/**
 * Condition Evaluator Service
 *
 * Monitors device states and triggers automations when conditions are met.
 * Supports threshold comparisons, boolean logic, and hysteresis.
 */

import type { Automation, AutomationTrigger, ComparisonOperator, Device } from '@/types'

/**
 * Condition evaluation result
 */
export interface ConditionResult {
  /** Whether the condition is met */
  met: boolean
  /** Current value being evaluated */
  currentValue: number | string | boolean | undefined
  /** Threshold value */
  threshold?: number
  /** Operator used */
  operator?: ComparisonOperator
  /** Additional debug info */
  debug?: string
}

/**
 * Device state subscription
 */
interface Subscription {
  /** Automation ID */
  automationId: string
  /** Device ID being monitored */
  deviceId: string
  /** Trigger configuration */
  trigger: AutomationTrigger
  /** Last evaluation result */
  lastResult: boolean
  /** Timestamp of last evaluation */
  lastEvaluated: Date
}

/**
 * Hysteresis configuration to prevent rapid toggling
 */
interface HysteresisConfig {
  /** Minimum time between triggers (ms) */
  cooldown: number
  /** Value threshold buffer */
  buffer: number
}

/**
 * Main condition evaluator service
 */
export class ConditionEvaluatorService {
  private subscriptions = new Map<string, Subscription[]>()
  private devices = new Map<string, Device>()
  private hysteresis = new Map<string, number>() // automationId -> last trigger time
  private hysteresisConfig: HysteresisConfig
  private onTrigger?: (automation: Automation) => Promise<void>
  private debug: boolean

  constructor(options: { debug?: boolean; cooldown?: number; buffer?: number } = {}) {
    this.debug = options.debug ?? false
    this.hysteresisConfig = {
      cooldown: options.cooldown ?? 60000, // 1 minute default
      buffer: options.buffer ?? 0.5, // 0.5 unit buffer
    }
  }

  /**
   * Set the trigger callback for when conditions are met
   */
  setTriggerCallback(callback: (automation: Automation) => Promise<void>): void {
    this.onTrigger = callback
  }

  /**
   * Watch an automation's condition triggers
   */
  watch(automation: Automation): void {
    if (!automation.enabled) {
      this.log(`Skipping disabled automation: ${automation.name}`)
      return
    }

    // Remove existing subscriptions
    this.unwatch(automation.id)

    const conditionTriggers = automation.triggers.filter(
      t => t.type === 'condition' || t.type === 'device-state'
    )

    if (conditionTriggers.length === 0) {
      this.log(`No condition triggers found for automation: ${automation.name}`)
      return
    }

    // Create subscriptions for each condition trigger
    conditionTriggers.forEach(trigger => {
      if (!trigger.deviceId) {
        console.error(`Trigger missing deviceId for automation: ${automation.name}`)
        return
      }

      const subscription: Subscription = {
        automationId: automation.id,
        deviceId: trigger.deviceId,
        trigger,
        lastResult: false,
        lastEvaluated: new Date(),
      }

      // Add to subscriptions map
      const deviceSubs = this.subscriptions.get(trigger.deviceId) || []
      deviceSubs.push(subscription)
      this.subscriptions.set(trigger.deviceId, deviceSubs)

      this.log(`Watching device ${trigger.deviceId} for automation ${automation.name}`)
    })
  }

  /**
   * Remove subscriptions for an automation
   */
  unwatch(automationId: string): void {
    // Remove from all device subscriptions
    for (const [deviceId, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter(s => s.automationId !== automationId)
      if (filtered.length === 0) {
        this.subscriptions.delete(deviceId)
      } else {
        this.subscriptions.set(deviceId, filtered)
      }
    }
    this.log(`Unwatched automation: ${automationId}`)
  }

  /**
   * Update device state and evaluate conditions
   */
  async updateDeviceState(device: Device): Promise<void> {
    // Store device state
    this.devices.set(device.id, device)

    // Get all subscriptions for this device
    const subs = this.subscriptions.get(device.id)
    if (!subs || subs.length === 0) {
      return
    }

    this.log(`Evaluating ${subs.length} conditions for device ${device.id}`)

    // Evaluate each subscription
    for (const sub of subs) {
      const result = this.evaluateCondition(sub.trigger, device)

      // Check for state change (false -> true transition)
      if (result.met && !sub.lastResult) {
        // Check hysteresis cooldown
        if (this.canTrigger(sub.automationId)) {
          this.log(`Condition met for automation ${sub.automationId}`)
          await this.triggerAutomation(sub.automationId)
          this.hysteresis.set(sub.automationId, Date.now())
        } else {
          this.log(`Cooldown active for automation ${sub.automationId}`)
        }
      }

      // Update subscription state
      sub.lastResult = result.met
      sub.lastEvaluated = new Date()
    }
  }

  /**
   * Evaluate a single condition trigger
   */
  evaluateCondition(trigger: AutomationTrigger, device: Device): ConditionResult {
    const result: ConditionResult = {
      met: false,
      currentValue: device.value,
      threshold: trigger.threshold,
      operator: trigger.operator,
    }

    // Get the value to compare
    const currentValue = device.value

    // For boolean devices (switches, sensors)
    if (typeof currentValue === 'boolean') {
      result.met = currentValue === (trigger.threshold === 1)
      result.debug = `Boolean: ${currentValue} === ${trigger.threshold === 1}`
      return result
    }

    // For numeric devices (temperature, brightness, etc.)
    if (typeof currentValue === 'number' && trigger.operator && trigger.threshold !== undefined) {
      result.met = this.compareValues(currentValue, trigger.operator, trigger.threshold)
      result.debug = `${currentValue} ${trigger.operator} ${trigger.threshold} = ${result.met}`
      return result
    }

    // For string equality
    if (typeof currentValue === 'string' && trigger.value) {
      result.met = currentValue === trigger.value
      result.debug = `String: ${currentValue} === ${trigger.value}`
      return result
    }

    return result
  }

  /**
   * Compare values using an operator
   */
  private compareValues(current: number, operator: ComparisonOperator, threshold: number): boolean {
    switch (operator) {
      case '<':
        return current < threshold
      case '>':
        return current > threshold
      case '==':
        return Math.abs(current - threshold) < 0.01 // Floating point tolerance
      case '!=':
        return Math.abs(current - threshold) >= 0.01
      default:
        return false
    }
  }

  /**
   * Check if automation can trigger (hysteresis check)
   */
  private canTrigger(automationId: string): boolean {
    const lastTrigger = this.hysteresis.get(automationId)
    if (!lastTrigger) return true

    const elapsed = Date.now() - lastTrigger
    return elapsed >= this.hysteresisConfig.cooldown
  }

  /**
   * Trigger an automation
   */
  private async triggerAutomation(automationId: string): Promise<void> {
    if (!this.onTrigger) {
      console.error('No trigger callback configured')
      return
    }

    // This would need access to the full automation object
    // In practice, this will be called from a higher level
    // For now, we'll emit an event that the hook can listen to
    this.log(`Triggering automation: ${automationId}`)
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): Map<string, Subscription[]> {
    return new Map(this.subscriptions)
  }

  /**
   * Get hysteresis status for an automation
   */
  getHysteresisStatus(automationId: string): { canTrigger: boolean; remainingMs: number } {
    const lastTrigger = this.hysteresis.get(automationId)
    if (!lastTrigger) {
      return { canTrigger: true, remainingMs: 0 }
    }

    const elapsed = Date.now() - lastTrigger
    const remaining = Math.max(0, this.hysteresisConfig.cooldown - elapsed)

    return {
      canTrigger: remaining === 0,
      remainingMs: remaining,
    }
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear()
    this.devices.clear()
    this.hysteresis.clear()
    this.log('Cleared all subscriptions')
  }

  /**
   * Helper: Debug logging
   */
  private log(message: string): void {
    if (this.debug) {
      console.log(`[ConditionEvaluator] ${message}`)
    }
  }
}

// Export singleton instance
export const conditionEvaluatorService = new ConditionEvaluatorService({
  debug: true,
  cooldown: 60000, // 1 minute cooldown
  buffer: 0.5,
})
