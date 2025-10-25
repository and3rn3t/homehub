/**
 * Flow Interpreter Hook
 *
 * React integration for the FlowInterpreterService. Provides functions to
 * execute flows, track active executions, and control debug mode.
 *
 * Features:
 * - Execute flows by ID
 * - Track active executions
 * - Debug controls (breakpoints, step mode)
 * - Toast notifications for execution results
 *
 * @example
 * ```tsx
 * const { executeFlow, activeExecutions, isExecuting } = useFlowInterpreter()
 *
 * const handleTest = async () => {
 *   const result = await executeFlow('flow-123')
 *   console.log('Flow result:', result)
 * }
 * ```
 */

import { useKV } from '@/hooks/use-kv'
import { FlowInterpreterService } from '@/services/automation/flow-interpreter.service'
import type { ExecutionContext, FlowResult } from '@/services/automation/types'
import type { Flow } from '@/types'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

export function useFlowInterpreter() {
  const [flows] = useKV<Flow[]>('automation-flows', [])
  const [activeExecutions, setActiveExecutions] = useState<ExecutionContext[]>([])
  const interpreterRef = useRef(FlowInterpreterService.getInstance())

  /**
   * Execute a flow by ID
   *
   * @param flowId - Flow ID to execute
   * @param triggerData - Optional initial variables for the flow
   * @returns Flow execution result
   */
  const executeFlow = useCallback(
    async (flowId: string, triggerData?: Record<string, unknown>): Promise<FlowResult | null> => {
      const flow = flows.find(f => f.id === flowId)

      if (!flow) {
        toast.error('Flow not found', {
          description: `Flow ${flowId} does not exist`,
        })
        return null
      }

      if (!flow.enabled) {
        toast.warning('Flow is disabled', {
          description: `Enable "${flow.name}" before executing`,
        })
        return null
      }

      // Create execution context
      const context: ExecutionContext = {
        flowId,
        executionId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        variables: triggerData || {},
        currentNodeId: null,
        visitedNodes: new Set(),
        executionStack: [],
        branchConditions: {},
        loopCounters: {},
        loopMaxIterations: {},
        debugMode: false,
        breakpoints: new Set(),
        stepMode: false,
        nodeExecutionTimes: {},
        totalExecutionTime: 0,
      }

      // Add to active executions
      setActiveExecutions(prev => [...prev, context])

      try {
        // Execute the flow
        const result = await interpreterRef.current.executeFlow(flow, context)

        // Show result notification
        if (result.success) {
          toast.success(`✅ Flow "${flow.name}" completed`, {
            description: `Executed ${result.executedNodes.length} nodes in ${result.executionTime}ms`,
          })
        } else {
          toast.error(`❌ Flow "${flow.name}" failed`, {
            description: result.error || 'Unknown error',
          })
        }

        return result
      } catch (error) {
        toast.error(`❌ Flow "${flow.name}" crashed`, {
          description: error instanceof Error ? error.message : 'Unknown error',
        })

        return {
          success: false,
          flowId,
          executionId: context.executionId,
          executedNodes: [],
          failedNodes: [],
          variables: context.variables,
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      } finally {
        // Remove from active executions
        setActiveExecutions(prev => prev.filter(e => e.executionId !== context.executionId))
      }
    },
    [flows]
  )

  /**
   * Execute a flow with debug mode enabled
   *
   * @param flowId - Flow ID to execute
   * @param breakpoints - Node IDs to pause at
   * @param stepMode - Whether to pause after each node
   */
  const executeFlowDebug = useCallback(
    async (
      flowId: string,
      breakpoints: string[] = [],
      stepMode = false
    ): Promise<FlowResult | null> => {
      const flow = flows.find(f => f.id === flowId)

      if (!flow) {
        toast.error('Flow not found')
        return null
      }

      // Create execution context with debug enabled
      const context: ExecutionContext = {
        flowId,
        executionId: `exec-debug-${Date.now()}`,
        timestamp: new Date().toISOString(),
        variables: {},
        currentNodeId: null,
        visitedNodes: new Set(),
        executionStack: [],
        branchConditions: {},
        loopCounters: {},
        loopMaxIterations: {},
        debugMode: true,
        breakpoints: new Set(breakpoints),
        stepMode,
        nodeExecutionTimes: {},
        totalExecutionTime: 0,
      }

      setActiveExecutions(prev => [...prev, context])

      try {
        const result = await interpreterRef.current.executeFlow(flow, context)

        toast.info(`🐛 Debug: Flow "${flow.name}" completed`, {
          description: `Executed ${result.executedNodes.length} nodes`,
        })

        return result
      } finally {
        setActiveExecutions(prev => prev.filter(e => e.executionId !== context.executionId))
      }
    },
    [flows]
  )

  /**
   * Validate a flow without executing it
   *
   * @param flowId - Flow ID to validate
   * @returns Validation result
   */
  const validateFlow = useCallback(
    (flowId: string) => {
      const flow = flows.find(f => f.id === flowId)

      if (!flow) {
        return {
          valid: false,
          errors: ['Flow not found'],
          warnings: [],
        }
      }

      const result = interpreterRef.current.validateFlow(flow)

      if (!result.valid) {
        toast.error(`❌ Flow "${flow.name}" is invalid`, {
          description: result.errors[0] || 'Validation failed',
        })
      } else if (result.warnings.length > 0) {
        toast.warning(`⚠️ Flow "${flow.name}" has warnings`, {
          description: result.warnings[0] || 'Check console for details',
        })
      } else {
        toast.success(`✅ Flow "${flow.name}" is valid`)
      }

      return result
    },
    [flows]
  )

  return {
    /** Execute a flow by ID */
    executeFlow,

    /** Execute a flow in debug mode */
    executeFlowDebug,

    /** Validate a flow structure */
    validateFlow,

    /** Currently executing flows */
    activeExecutions,

    /** Whether any flows are currently executing */
    isExecuting: activeExecutions.length > 0,

    /** Number of active executions */
    executionCount: activeExecutions.length,
  }
}
