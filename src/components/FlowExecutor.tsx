import { useKV } from '@/hooks/use-kv'
import { toast } from 'sonner'

interface FlowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  subtype: string
  label: string
  icon: unknown
  position: { x: number; y: number }
  data: Record<string, unknown>
  connections: string[]
}

interface Flow {
  id: string
  name: string
  description?: string
  nodes: FlowNode[]
  enabled: boolean
  created: string
}

interface ExecutionContext {
  flowId: string
  executionId: string
  variables: Record<string, unknown>
  currentNodeId: string
  timestamp: string
}

export class FlowExecutor {
  private static instance: FlowExecutor
  private flows: Flow[] = []
  private activeExecutions: Map<string, ExecutionContext> = new Map()

  // Helper to format temperature based on user preferences
  private formatTemperature(value: number): string {
    const prefs = localStorage.getItem('unit-preferences')
    const preferences = prefs ? JSON.parse(prefs) : { temperature: 'fahrenheit' }

    if (preferences.temperature === 'celsius') {
      const celsius = Math.round(((value - 32) * 5) / 9)
      return `${celsius}°C`
    }
    return `${value}°F`
  }

  static getInstance(): FlowExecutor {
    if (!FlowExecutor.instance) {
      FlowExecutor.instance = new FlowExecutor()
    }
    return FlowExecutor.instance
  }

  setFlows(flows: Flow[]) {
    this.flows = flows
  }

  async executeFlow(flowId: string, triggerData?: Record<string, unknown>): Promise<boolean> {
    const flow = this.flows.find(f => f.id === flowId)
    if (!flow || !flow.enabled) {
      return false
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const context: ExecutionContext = {
      flowId,
      executionId,
      variables: triggerData || {},
      currentNodeId: '',
      timestamp: new Date().toISOString(),
    }

    this.activeExecutions.set(executionId, context)

    try {
      // Find trigger nodes (nodes with no incoming connections)
      const triggerNodes = flow.nodes.filter(
        node => node.type === 'trigger' && !flow.nodes.some(n => n.connections.includes(node.id))
      )

      if (triggerNodes.length === 0) {
        toast.error(`Flow "${flow.name}" has no trigger nodes`)
        return false
      }

      // Execute from each trigger node
      for (const triggerNode of triggerNodes) {
        await this.executeNode(flow, triggerNode, context)
      }

      toast.success(`Flow "${flow.name}" executed successfully`)
      return true
    } catch (error) {
      console.error('Flow execution error:', error)
      toast.error(`Flow "${flow.name}" failed to execute`)
      return false
    } finally {
      this.activeExecutions.delete(executionId)
    }
  }

  private async executeNode(
    flow: Flow,
    node: FlowNode,
    context: ExecutionContext
  ): Promise<boolean> {
    context.currentNodeId = node.id

    try {
      let result = true

      switch (node.type) {
        case 'trigger':
          result = await this.executeTrigger(node, context)
          break
        case 'condition':
          result = await this.executeCondition(node, context)
          break
        case 'action':
          result = await this.executeAction(node, context)
          break
        case 'delay':
          result = await this.executeDelay(node, context)
          break
      }

      // If node executed successfully, execute connected nodes
      if (result) {
        for (const connectionId of node.connections) {
          const connectedNode = flow.nodes.find(n => n.id === connectionId)
          if (connectedNode) {
            await this.executeNode(flow, connectedNode, context)
          }
        }
      }

      return result
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error)
      return false
    }
  }

  private async executeTrigger(node: FlowNode, context: ExecutionContext): Promise<boolean> {
    // Triggers are typically checked by external systems
    // For manual execution, we assume the trigger condition is met
    context.variables.triggerType = node.subtype
    context.variables.triggerData = node.data
    return true
  }

  private async executeCondition(node: FlowNode, _context: ExecutionContext): Promise<boolean> {
    switch (node.subtype) {
      case 'time_range':
        return this.checkTimeRange(node.data)
      case 'temperature':
        return this.checkTemperature(node.data)
      case 'presence':
        return this.checkPresence(node.data)
      default:
        return true
    }
  }

  private async executeAction(node: FlowNode, _context: ExecutionContext): Promise<boolean> {
    switch (node.subtype) {
      case 'light':
        return this.controlLight(node.data)
      case 'lock':
        return this.controlLock(node.data)
      case 'thermostat':
        return this.controlThermostat(node.data)
      case 'scene':
        return this.activateScene(node.data)
      default:
        return true
    }
  }

  private async executeDelay(node: FlowNode, _context: ExecutionContext): Promise<boolean> {
    const delayData = node.data as { hours?: number; minutes?: number; seconds?: number }
    const { hours = 0, minutes = 0, seconds = 0 } = delayData
    const delayMs = (hours * 3600 + minutes * 60 + seconds) * 1000

    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    return true
  }

  // Condition implementations
  private checkTimeRange(data: Record<string, unknown>): boolean {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const startParts = ((data.startTime as string) || '00:00').split(':').map(Number)
    const endParts = ((data.endTime as string) || '23:59').split(':').map(Number)

    const startTime = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0)
    const endTime = (endParts[0] ?? 23) * 60 + (endParts[1] ?? 59)

    return currentTime >= startTime && currentTime <= endTime
  }

  private checkTemperature(data: Record<string, unknown>): boolean {
    // Simulate temperature check - in real implementation, this would query sensors
    const currentTemp = 72 // Mock current temperature
    const targetTemp = (data.temperature as number) || 70
    const condition = (data.condition as string) || 'greater'

    switch (condition) {
      case 'greater':
        return currentTemp > targetTemp
      case 'less':
        return currentTemp < targetTemp
      case 'between':
        return currentTemp >= targetTemp - 2 && currentTemp <= targetTemp + 2
      default:
        return true
    }
  }

  private checkPresence(data: Record<string, unknown>): boolean {
    // Simulate presence check - in real implementation, this would query presence sensors
    const presenceType = (data.presenceType as string) || 'anyone'
    const mockPresence = true // Mock presence state

    switch (presenceType) {
      case 'anyone':
        return mockPresence
      case 'everyone':
        return mockPresence
      case 'nobody':
        return !mockPresence
      default:
        return true
    }
  }

  // Action implementations
  private async controlLight(data: Record<string, unknown>): Promise<boolean> {
    const deviceId = (data.deviceId as string) || 'unknown device'
    const action = data.action as string
    const brightness = (data.brightness as number) || 50

    // Simulate device control - in real implementation, this would control actual devices
    let message = `Light control: ${deviceId}`

    switch (action) {
      case 'turn_on':
        message += ' turned on'
        break
      case 'turn_off':
        message += ' turned off'
        break
      case 'toggle':
        message += ' toggled'
        break
      case 'dim':
        message += ` dimmed to ${brightness}%`
        break
    }

    toast.info(message)
    return true
  }

  private async controlLock(data: Record<string, unknown>): Promise<boolean> {
    const deviceId = (data.deviceId as string) || 'unknown lock'
    const action = data.action as string

    const message = `Lock control: ${deviceId} ${action === 'lock' ? 'locked' : 'unlocked'}`
    toast.info(message)
    return true
  }

  private async controlThermostat(data: Record<string, unknown>): Promise<boolean> {
    const mode = (data.mode as string) || 'auto'
    const targetTemp = (data.targetTemp as number) || 72

    const formattedTemp = this.formatTemperature(targetTemp)
    const message = `Thermostat: Set to ${mode} mode at ${formattedTemp}`
    toast.info(message)
    return true
  }

  private async activateScene(data: Record<string, unknown>): Promise<boolean> {
    const sceneId = (data.sceneId as string) || 'unknown scene'

    const message = `Scene activated: ${sceneId}`
    toast.info(message)
    return true
  }
}

// Hook for using the flow executor in React components
export function useFlowExecutor() {
  const [flows] = useKV<Flow[]>('automation-flows', [])
  const executor = FlowExecutor.getInstance()
  executor.setFlows(flows)

  const executeFlow = async (flowId: string, triggerData?: Record<string, unknown>) => {
    return await executor.executeFlow(flowId, triggerData)
  }

  const testFlow = async (flow: Flow) => {
    const tempExecutor = new FlowExecutor()
    tempExecutor.setFlows([flow])
    return await tempExecutor.executeFlow(flow.id, { manual: true })
  }

  return {
    executeFlow,
    testFlow,
  }
}
