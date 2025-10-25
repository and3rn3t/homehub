/**
 * Condition Evaluator Hook
 *
 * React hook for integrating the ConditionEvaluatorService with automations.
 * Monitors device state changes and triggers condition-based automations.
 */

import { KV_KEYS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { Automation, Device } from '@/types'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { actionExecutorService } from '../services/automation/action-executor.service'
import { conditionEvaluatorService } from '../services/automation/condition-evaluator.service'

/**
 * Hook for managing condition-based automations
 */
export function useConditionEvaluator() {
  const [automations] = useKV<Automation[]>(KV_KEYS.AUTOMATIONS, [])
  const [devices] = useKV<Device[]>(KV_KEYS.DEVICES, [])
  const isInitialized = useRef(false)
  const lastDeviceStates = useRef<Map<string, Device>>(new Map())

  // Update action executor with current devices
  useEffect(() => {
    actionExecutorService.updateDevices(devices)
  }, [devices])

  // Execute automation callback
  const executeAutomation = useCallback(async (automation: Automation) => {
    toast.info(`Condition met: "${automation.name}"`, {
      description: `Executing ${automation.actions.length} action(s)`,
    })

    try {
      // Execute actions using ActionExecutor
      const result = await actionExecutorService.execute(automation.actions)

      if (result.success) {
        toast.success(`"${automation.name}" completed`, {
          description: `${result.actions.length} actions in ${result.totalDuration}ms`,
        })
      } else {
        const failedCount = result.actions.filter(a => !a.success).length
        toast.error(`"${automation.name}" failed`, {
          description: `${failedCount} of ${result.actions.length} actions failed`,
        })
      }
    } catch (error) {
      console.error(`Automation execution failed:`, error)
      toast.error(`"${automation.name}" error`, {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [])

  // Initialize condition evaluator with callback
  useEffect(() => {
    if (!isInitialized.current) {
      conditionEvaluatorService.setTriggerCallback(executeAutomation)
      isInitialized.current = true
    }
  }, [executeAutomation])

  // Watch all condition-based automations
  useEffect(() => {
    // Clear existing subscriptions
    conditionEvaluatorService.clear()

    // Watch all enabled automations with condition triggers
    automations.forEach(automation => {
      const hasConditionTriggers = automation.triggers.some(
        t => t.type === 'condition' || t.type === 'device-state'
      )
      if (automation.enabled && hasConditionTriggers) {
        conditionEvaluatorService.watch(automation)
      }
    })

    // Cleanup on unmount
    return () => {
      conditionEvaluatorService.clear()
    }
  }, [automations])

  // Monitor device state changes
  useEffect(() => {
    // Check each device for state changes
    devices.forEach(device => {
      const lastState = lastDeviceStates.current.get(device.id)

      // If device state changed, evaluate conditions
      if (!lastState || lastState.value !== device.value || lastState.status !== device.status) {
        conditionEvaluatorService.updateDeviceState(device)
        lastDeviceStates.current.set(device.id, device)
      }
    })
  }, [devices])

  // Get active subscriptions
  const getSubscriptions = useCallback(() => {
    return conditionEvaluatorService.getSubscriptions()
  }, [])

  // Get hysteresis status for an automation
  const getHysteresisStatus = useCallback((automationId: string) => {
    return conditionEvaluatorService.getHysteresisStatus(automationId)
  }, [])

  // Manually evaluate a condition (for testing)
  const evaluateCondition = useCallback(
    (automationId: string) => {
      const automation = automations.find(a => a.id === automationId)
      if (automation) {
        automation.triggers
          .filter(t => t.type === 'condition' || t.type === 'device-state')
          .forEach(trigger => {
            if (trigger.deviceId) {
              const device = devices.find(d => d.id === trigger.deviceId)
              if (device) {
                const result = conditionEvaluatorService.evaluateCondition(trigger, device)
                console.log(`Condition evaluation:`, result)

                if (result.met) {
                  toast.success(`Condition met!`, {
                    description: result.debug,
                  })
                } else {
                  toast.info(`Condition not met`, {
                    description: result.debug,
                  })
                }
              }
            }
          })
      }
    },
    [automations, devices]
  )

  return {
    subscriptions: getSubscriptions(),
    getHysteresisStatus,
    evaluateCondition,
  }
}
