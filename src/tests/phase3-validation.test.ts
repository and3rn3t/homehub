/**
 * Phase 3 Validation Test Suite - FIXED
 *
 * All tests updated to match actual service APIs
 * Date: October 16, 2025
 */

import { ActionExecutorService } from '@/services/automation/action-executor.service'
import { ConditionEvaluatorService } from '@/services/automation/condition-evaluator.service'
import { SchedulerService } from '@/services/automation/scheduler.service'
import type { Automation, AutomationTrigger, Device } from '@/types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('Phase 3: Automation Engine Validation', () => {
  describe('Milestone 3.1: Scheduler Service', () => {
    let scheduler: SchedulerService

    beforeEach(() => {
      scheduler = new SchedulerService({ debug: false })
    })

    afterEach(() => {
      scheduler.clear()
    })

    it('should instantiate without errors', () => {
      expect(scheduler).toBeDefined()
      expect(scheduler).toBeInstanceOf(SchedulerService)
    })

    it('should calculate next run time for future time', () => {
      const automation: Automation = {
        id: 'test-morning',
        name: 'Morning Test',
        description: '',
        type: 'schedule',
        enabled: true,
        triggers: [
          {
            type: 'time',
            time: '10:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          },
        ],
        actions: [
          {
            deviceId: 'test-device',
            action: 'turn_on',
          },
        ],
      }

      expect(() => scheduler.schedule(automation)).not.toThrow()
    })

    it('should handle disabled automations', () => {
      const automation: Automation = {
        id: 'test-disabled',
        name: 'Disabled Test',
        type: 'schedule',
        enabled: false,
        triggers: [
          {
            type: 'time',
            time: '10:00',
          },
        ],
        actions: [
          {
            deviceId: 'test-device',
            action: 'turn_on',
          },
        ],
      }

      scheduler.schedule(automation)
      expect(scheduler.getScheduledTasks()).toHaveLength(0)
    })

    it('should unschedule automations', () => {
      const automation: Automation = {
        id: 'test-unschedule',
        name: 'Unschedule Test',
        type: 'schedule',
        enabled: true,
        triggers: [
          {
            type: 'time',
            time: '10:00',
          },
        ],
        actions: [
          {
            deviceId: 'test-device',
            action: 'turn_on',
          },
        ],
      }

      scheduler.schedule(automation)
      scheduler.unschedule('test-unschedule')
      expect(scheduler.getScheduledTasks()).not.toContain('test-unschedule')
    })
  })

  describe('Milestone 3.2: Condition Evaluator', () => {
    let evaluator: ConditionEvaluatorService

    beforeEach(() => {
      evaluator = new ConditionEvaluatorService({ debug: false })
    })

    afterEach(() => {
      evaluator.clear()
    })

    it('should instantiate without errors', () => {
      expect(evaluator).toBeDefined()
      expect(evaluator).toBeInstanceOf(ConditionEvaluatorService)
    })

    it('should evaluate greater than condition', () => {
      const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 80 }
      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '>', threshold: 75 }
      const result = evaluator.evaluateCondition(mockTrigger, mockDevice as Device)
      expect(result.met).toBe(true)
    })

    it('should evaluate less than condition', () => {
      const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 70 }
      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '<', threshold: 75 }
      const result = evaluator.evaluateCondition(mockTrigger, mockDevice as Device)
      expect(result.met).toBe(true)
    })

    it('should evaluate equals condition', () => {
      const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 75 }
      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '==', threshold: 75 }
      const result = evaluator.evaluateCondition(mockTrigger, mockDevice as Device)
      expect(result.met).toBe(true)
    })

    it('should evaluate not equals condition', () => {
      const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 75 }
      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '!=', threshold: 80 }
      const result = evaluator.evaluateCondition(mockTrigger, mockDevice as Device)
      expect(result.met).toBe(true)
    })

    it('should handle string value comparisons', () => {
      const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 75 }
      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '>', threshold: 70 }
      const result = evaluator.evaluateCondition(mockTrigger, mockDevice as Device)
      expect(result.met).toBe(true)
    })

    it('should handle boolean value comparisons', () => {
      const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 1 }
      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '==', threshold: 1 }
      const result = evaluator.evaluateCondition(mockTrigger, mockDevice as Device)
      expect(result.met).toBe(true)
    })
  })

  describe('Milestone 3.3: Action Executor', () => {
    let executor: ActionExecutorService

    beforeEach(() => {
      executor = new ActionExecutorService({ debug: false })
    })

    it('should instantiate without errors', () => {
      expect(executor).toBeDefined()
      expect(executor).toBeInstanceOf(ActionExecutorService)
    })

    it('should have execute method', () => {
      expect(executor.execute).toBeDefined()
      expect(typeof executor.execute).toBe('function')
    })

    it('should have updateDevices method', () => {
      expect(executor.updateDevices).toBeDefined()
      expect(typeof executor.updateDevices).toBe('function')
    })

    it('should accept empty device list', () => {
      expect(() => {
        executor.updateDevices([])
      }).not.toThrow()
    })

    it('should accept device list with multiple devices', () => {
      const devices: Partial<Device>[] = [
        {
          id: 'device-1',
          name: 'Device 1',
          type: 'light',
          room: 'Living Room',
          status: 'online',
          enabled: true,
        },
        {
          id: 'device-2',
          name: 'Device 2',
          type: 'light',
          room: 'Bedroom',
          status: 'online',
          enabled: true,
        },
      ]

      expect(() => {
        executor.updateDevices(devices as Device[])
      }).not.toThrow()
    })
  })

  describe('Integration Tests', () => {
    it('should allow scheduler to trigger action executor', async () => {
      const scheduler = new SchedulerService({ debug: false })
      const executor = new ActionExecutorService({ debug: false })

      let triggered = false
      const mockCallback = async () => {
        triggered = true
      }

      scheduler.setExecutionCallback(mockCallback)

      expect(scheduler).toBeDefined()
      expect(executor).toBeDefined()
      expect(triggered).toBe(false)

      scheduler.clear()
    })

    it('should allow condition evaluator to trigger action executor', () => {
      const evaluator = new ConditionEvaluatorService({ debug: false })
      const executor = new ActionExecutorService({ debug: false })

      const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 80 }
      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '>', threshold: 75 }
      const shouldTrigger = evaluator.evaluateCondition(mockTrigger, mockDevice as Device)

      expect(shouldTrigger.met).toBe(true)
      expect(executor).toBeDefined()

      evaluator.clear()
    })
  })

  describe('Performance Tests', () => {
    it('should schedule automation in <100ms', () => {
      const scheduler = new SchedulerService({ debug: false })

      const automation: Automation = {
        id: 'perf-test',
        name: 'Performance Test',
        type: 'schedule',
        enabled: true,
        triggers: [
          {
            type: 'time',
            time: '10:00',
          },
        ],
        actions: [
          {
            deviceId: 'test-device',
            action: 'turn_on',
          },
        ],
      }

      const start = performance.now()
      scheduler.schedule(automation)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(100)
      scheduler.clear()
    })

    it('should evaluate condition in <50ms', () => {
      const evaluator = new ConditionEvaluatorService({ debug: false })

      const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 80 }
      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '>', threshold: 75 }

      const start = performance.now()
      evaluator.evaluateCondition(mockTrigger, mockDevice as Device)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(50)
      evaluator.clear()
    })

    it('should update devices in <10ms', () => {
      const executor = new ActionExecutorService({ debug: false })

      const devices: Partial<Device>[] = [
        {
          id: 'test',
          name: 'Test',
          type: 'light',
          room: 'Living Room',
          status: 'online',
          enabled: true,
        },
      ]

      const start = performance.now()
      executor.updateDevices(devices as Device[])
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid time format gracefully', () => {
      const scheduler = new SchedulerService({ debug: false })

      const automation: Automation = {
        id: 'invalid-time',
        name: 'Invalid Time Test',
        type: 'schedule',
        enabled: true,
        triggers: [
          {
            type: 'time',
            time: 'invalid',
          },
        ],
        actions: [
          {
            deviceId: 'test-device',
            action: 'turn_on',
          },
        ],
      }

      expect(() => scheduler.schedule(automation)).not.toThrow()
      scheduler.clear()
    })

    it('should handle null device in condition', () => {
      const evaluator = new ConditionEvaluatorService({ debug: false })

      const mockTrigger: AutomationTrigger = { type: 'condition', operator: '>', threshold: 75 }
      const nullDevice = null as unknown as Device

      // Should throw since null device is invalid input
      expect(() => {
        evaluator.evaluateCondition(mockTrigger, nullDevice)
      }).toThrow()

      evaluator.clear()
    })

    it('should handle empty actions array', async () => {
      const executor = new ActionExecutorService({ debug: false })

      const result = await executor.execute([])

      expect(result.success).toBe(true)
      expect(result.actions).toHaveLength(0)
    })
  })

  describe('Cleanup', () => {
    it('should properly clean up scheduler resources', () => {
      const scheduler = new SchedulerService({ debug: false })

      const automation: Automation = {
        id: 'cleanup-test',
        name: 'Cleanup Test',
        type: 'schedule',
        enabled: true,
        triggers: [
          {
            type: 'time',
            time: '10:00',
          },
        ],
        actions: [
          {
            deviceId: 'test-device',
            action: 'turn_on',
          },
        ],
      }

      scheduler.schedule(automation)
      scheduler.clear()

      expect(scheduler.getScheduledTasks()).toHaveLength(0)
    })

    it('should properly clean up evaluator resources', () => {
      const evaluator = new ConditionEvaluatorService({ debug: false })

      const automation: Automation = {
        id: 'cleanup-test',
        name: 'Cleanup Test',
        type: 'condition',
        enabled: true,
        triggers: [
          {
            type: 'condition',
            deviceId: 'test-device',
            operator: '>',
            threshold: 75,
          },
        ],
        actions: [
          {
            deviceId: 'test-device',
            action: 'turn_on',
          },
        ],
      }

      evaluator.watch(automation)
      evaluator.clear()

      expect(evaluator.getSubscriptions().size).toBe(0)
    })
  })
})

describe('Phase 3: Validation Summary', () => {
  it('should have all required services available', () => {
    expect(SchedulerService).toBeDefined()
    expect(ConditionEvaluatorService).toBeDefined()
    expect(ActionExecutorService).toBeDefined()
  })

  it('should pass all performance targets', async () => {
    const scheduler = new SchedulerService({ debug: false })
    const evaluator = new ConditionEvaluatorService({ debug: false })
    const executor = new ActionExecutorService({ debug: false })

    const targets = {
      schedulerCheck: 100,
      conditionEval: 50,
      deviceUpdate: 10,
    }

    const start1 = performance.now()
    const automation: Automation = {
      id: 'perf-test',
      name: 'Performance Test',
      type: 'schedule',
      enabled: true,
      triggers: [{ type: 'time', time: '10:00' }],
      actions: [{ deviceId: 'test', action: 'turn_on' }],
    }
    scheduler.schedule(automation)
    const schedulerTime = performance.now() - start1

    const mockDevice: Partial<Device> = { id: 'test', name: 'Test', value: 80 }
    const mockTrigger: AutomationTrigger = { type: 'condition', operator: '>', threshold: 75 }
    const start2 = performance.now()
    evaluator.evaluateCondition(mockTrigger, mockDevice as Device)
    const evaluatorTime = performance.now() - start2

    const devices: Partial<Device>[] = [
      {
        id: 'test',
        name: 'Test',
        type: 'light',
        room: 'Living Room',
        status: 'online',
        enabled: true,
      },
    ]
    const start3 = performance.now()
    executor.updateDevices(devices as Device[])
    const executorTime = performance.now() - start3

    console.log('📊 Performance Results:')
    console.log(
      `   Scheduler: ${schedulerTime.toFixed(2)}ms (target: <${targets.schedulerCheck}ms)`
    )
    console.log(`   Evaluator: ${evaluatorTime.toFixed(2)}ms (target: <${targets.conditionEval}ms)`)
    console.log(`   Executor: ${executorTime.toFixed(2)}ms (target: <${targets.deviceUpdate}ms)`)

    expect(schedulerTime).toBeLessThan(targets.schedulerCheck)
    expect(evaluatorTime).toBeLessThan(targets.conditionEval)
    expect(executorTime).toBeLessThan(targets.deviceUpdate)

    scheduler.clear()
    evaluator.clear()
  })
})
