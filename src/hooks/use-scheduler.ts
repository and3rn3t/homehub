/**
 * Scheduler Hook
 *
 * React hook for integrating the SchedulerService with automations.
 */

import { KV_KEYS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { Automation, Device } from '@/types'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { actionExecutorService } from '../services/automation/action-executor.service'
import { schedulerService } from '../services/automation/scheduler.service'

/**
 * Hook for managing automation scheduling
 */
export function useScheduler() {
  const [automations] = useKV<Automation[]>(KV_KEYS.AUTOMATIONS, [])
  const [devices] = useKV<Device[]>(KV_KEYS.DEVICES, [])
  const isInitialized = useRef(false)

  // Update action executor with current devices
  useEffect(() => {
    actionExecutorService.updateDevices(devices)
  }, [devices])

  // Execute automation callback
  const executeAutomation = useCallback(async (automation: Automation) => {
    toast.info(`Running "${automation.name}"`, {
      description: `${automation.actions.length} action(s)`,
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

  // Initialize scheduler with callback
  useEffect(() => {
    if (!isInitialized.current) {
      schedulerService.setExecutionCallback(executeAutomation)
      isInitialized.current = true
    }
  }, [executeAutomation])

  // Schedule all time-based automations
  useEffect(() => {
    // Clear existing schedules
    schedulerService.clear()

    // Schedule all enabled automations with time triggers
    automations.forEach(automation => {
      const hasTimeTriggers = automation.triggers.some(t => t.type === 'time')
      if (automation.enabled && hasTimeTriggers) {
        schedulerService.schedule(automation)
      }
    })

    // Cleanup on unmount
    return () => {
      schedulerService.clear()
    }
  }, [automations])

  // Get scheduled tasks
  const getScheduledTasks = useCallback(() => {
    return schedulerService.getScheduledTasks()
  }, [])

  // Get execution history
  const getExecutionHistory = useCallback(() => {
    return schedulerService.getExecutionHistory()
  }, [])

  // Manually trigger an automation
  const triggerAutomation = useCallback(
    async (automationId: string) => {
      const automation = automations.find(a => a.id === automationId)
      if (automation) {
        await schedulerService.executeAutomation(automation)
      }
    },
    [automations]
  )

  return {
    scheduledTasks: getScheduledTasks(),
    executionHistory: getExecutionHistory(),
    triggerAutomation,
  }
}
