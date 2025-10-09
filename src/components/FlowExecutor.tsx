import { useKV } from '@/hooks/use-kv'
import { toast } from 'sonner'

interface FlowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  subtype: string
  label: string
  icon: any
  position: { x: number; y: number }
  data: any
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
  variables: Record<string, any>
  currentNodeId: string
  timestamp: string
}

export class FlowExecutor {
  private static instance: FlowExecutor
  private flows: Flow[] = []
  private activeExecutions: Map<string, ExecutionContext> = new Map()

  static getInstance(): FlowExecutor {
    if (!FlowExecutor.instance) {
      FlowExecutor.instance = new FlowExecutor()
    }
    return FlowExecutor.instance
  }

  setFlows(flows: Flow[]) {
    this.flows = flows
  }

  async executeFlow(flowId: string, triggerData?: any): Promise<boolean> {
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
    const { hours = 0, minutes = 0, seconds = 0 } = node.data
    const delayMs = (hours * 3600 + minutes * 60 + seconds) * 1000

    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    return true
  }

  // Condition implementations
  private checkTimeRange(data: any): boolean {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const [startHour, startMin] = (data.startTime || '00:00').split(':').map(Number)
    const [endHour, endMin] = (data.endTime || '23:59').split(':').map(Number)

    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    return currentTime >= startTime && currentTime <= endTime
  }

  private checkTemperature(data: any): boolean {
    // Simulate temperature check - in real implementation, this would query sensors
    const currentTemp = 72 // Mock current temperature
    const targetTemp = data.temperature || 70
    const condition = data.condition || 'greater'

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

  private checkPresence(data: any): boolean {
    // Simulate presence check - in real implementation, this would query presence sensors
    const presenceType = data.presenceType || 'anyone'
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
  private async controlLight(data: any): Promise<boolean> {
    const { deviceId, action, brightness } = data

    // Simulate device control - in real implementation, this would control actual devices
    let message = `Light control: ${deviceId || 'unknown device'}`

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
        message += ` dimmed to ${brightness || 50}%`
        break
    }

    toast.info(message)
    return true
  }

  private async controlLock(data: any): Promise<boolean> {
    const { deviceId, action } = data

    const message = `Lock control: ${deviceId || 'unknown lock'} ${action === 'lock' ? 'locked' : 'unlocked'}`
    toast.info(message)
    return true
  }

  private async controlThermostat(data: any): Promise<boolean> {
    const { mode, targetTemp } = data

    const message = `Thermostat: Set to ${mode || 'auto'} mode at ${targetTemp || 72}°F`
    toast.info(message)
    return true
  }

  private async activateScene(data: any): Promise<boolean> {
    const { sceneId } = data

    const message = `Scene activated: ${sceneId || 'unknown scene'}`
    toast.info(message)
    return true
  }
}

// Hook for using the flow executor in React components
export function useFlowExecutor() {
  const [flows] = useKV<Flow[]>('automation-flows', [])
  const executor = FlowExecutor.getInstance()
  executor.setFlows(flows)

  const executeFlow = async (flowId: string, triggerData?: any) => {
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
