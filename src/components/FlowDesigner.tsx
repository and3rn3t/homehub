import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useKV } from '@/hooks/use-kv'
import {
  type LucideIcon,
  ArrowRightIcon,
  ClockIcon,
  LightbulbIcon,
  LockIcon,
  MapPinIcon,
  PlayIcon,
  PlusIcon,
  PowerIcon,
  SaveIcon,
  SettingsIcon,
  StopCircleIcon,
  ThermometerIcon,
  TrashIcon,
} from '@/lib/icons'
import { motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useFlowExecutor } from './FlowExecutor'
import { FlowMiniMap } from './FlowMiniMap'
import { FlowTutorial } from './FlowTutorial'
import { NodeConfig } from './NodeConfig'

interface FlowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  subtype: string
  label: string
  icon: LucideIcon
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

interface NodeTypeDefinition {
  type: string
  label: string
  icon: LucideIcon
  color: string
}

const nodeTypes = {
  trigger: [
    { type: 'time', label: 'Time Schedule', icon: ClockIcon, color: 'bg-blue-500' },
    { type: 'location', label: 'Location', icon: MapPinIcon, color: 'bg-green-500' },
    { type: 'device', label: 'Device State', icon: PowerIcon, color: 'bg-purple-500' },
  ],
  condition: [
    { type: 'time_range', label: 'Time Range', icon: ClockIcon, color: 'bg-orange-500' },
    { type: 'temperature', label: 'Temperature', icon: ThermometerIcon, color: 'bg-red-500' },
    { type: 'presence', label: 'Presence', icon: MapPinIcon, color: 'bg-teal-500' },
  ],
  action: [
    { type: 'light', label: 'Control Light', icon: LightbulbIcon, color: 'bg-yellow-500' },
    { type: 'lock', label: 'Control Lock', icon: LockIcon, color: 'bg-gray-500' },
    { type: 'thermostat', label: 'Set Temperature', icon: ThermometerIcon, color: 'bg-red-500' },
    { type: 'scene', label: 'Activate Scene', icon: PlayIcon, color: 'bg-indigo-500' },
  ],
  delay: [{ type: 'wait', label: 'Wait/Delay', icon: ClockIcon, color: 'bg-slate-500' }],
} as const

export function FlowDesigner() {
  const [flows, setFlows] = useKV<Flow[]>('automation-flows', [])
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
  const [draggedNode, setDraggedNode] = useState<NodeTypeDefinition | null>(null)
  const [showNodePalette, setShowNodePalette] = useState(false)
  const [selectedNodeType, setSelectedNodeType] = useState<keyof typeof nodeTypes>('trigger')
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const { testFlow } = useFlowExecutor()

  const createNewFlow = () => {
    const newFlow: Flow = {
      id: `flow-${Date.now()}`,
      name: `Flow ${flows.length + 1}`,
      description: 'New automation flow',
      nodes: [],
      enabled: false,
      created: new Date().toISOString(),
    }

    setFlows(currentFlows => [...currentFlows, newFlow])
    setSelectedFlow(newFlow)
    setShowNodePalette(true)
    toast.success('New flow created')
  }

  const deleteFlow = (flowId: string) => {
    setFlows(currentFlows => currentFlows.filter(f => f.id !== flowId))
    if (selectedFlow?.id === flowId) {
      setSelectedFlow(null)
    }
    toast.success('Flow deleted')
  }

  const saveFlow = () => {
    if (!selectedFlow) return

    setFlows(currentFlows => currentFlows.map(f => (f.id === selectedFlow.id ? selectedFlow : f)))
    toast.success('Flow saved')
  }

  const addNodeToCanvas = useCallback(
    (nodeType: NodeTypeDefinition, position: { x: number; y: number }) => {
      if (!selectedFlow) return

      const newNode: FlowNode = {
        id: `node-${Date.now()}`,
        type: selectedNodeType,
        subtype: nodeType.type,
        label: nodeType.label,
        icon: nodeType.icon,
        position,
        data: {},
        connections: [],
      }

      const updatedFlow = {
        ...selectedFlow,
        nodes: [...selectedFlow.nodes, newNode],
      }

      setSelectedFlow(updatedFlow)
    },
    [selectedFlow, selectedNodeType]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!draggedNode || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const position = {
        x: e.clientX - rect.left - 75, // Center the node
        y: e.clientY - rect.top - 50,
      }

      addNodeToCanvas(draggedNode, position)
      setDraggedNode(null)
    },
    [draggedNode, addNodeToCanvas]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeNode = (nodeId: string) => {
    if (!selectedFlow) return

    const updatedFlow = {
      ...selectedFlow,
      nodes: selectedFlow.nodes.filter(n => n.id !== nodeId),
    }

    setSelectedFlow(updatedFlow)
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const updateNodeData = (nodeId: string, data: Record<string, unknown>) => {
    if (!selectedFlow) return

    const updatedFlow = {
      ...selectedFlow,
      nodes: selectedFlow.nodes.map(node => (node.id === nodeId ? { ...node, data } : node)),
    }

    setSelectedFlow(updatedFlow)
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, data })
    }
  }

  const connectNodes = (fromNodeId: string, toNodeId: string) => {
    if (!selectedFlow) return

    const updatedFlow = {
      ...selectedFlow,
      nodes: selectedFlow.nodes.map(node =>
        node.id === fromNodeId
          ? { ...node, connections: [...node.connections.filter(c => c !== toNodeId), toNodeId] }
          : node
      ),
    }

    setSelectedFlow(updatedFlow)
    setConnectingFrom(null)
    toast.success('Nodes connected')
  }

  const startConnection = (nodeId: string) => {
    setConnectingFrom(nodeId)
  }

  const completeConnection = (toNodeId: string) => {
    if (connectingFrom && connectingFrom !== toNodeId) {
      connectNodes(connectingFrom, toNodeId)
    }
  }

  const testCurrentFlow = async () => {
    if (!selectedFlow) return

    toast.info('Testing flow...')
    const success = await testFlow(selectedFlow)

    if (success) {
      toast.success('Flow test completed successfully')
    } else {
      toast.error('Flow test failed')
    }
  }

  const createConnectionPath = (fromNode: FlowNode, toNode: FlowNode, connectionId: string) => {
    const fromX = fromNode.position.x + 80 // Center of node (width 160 / 2 = 80)
    const fromY = fromNode.position.y + 50 // Center of node (estimated height)
    const toX = toNode.position.x + 80
    const toY = toNode.position.y + 50

    // Calculate control points for bezier curve
    const controlX1 = fromX + (toX - fromX) * 0.3
    const controlY1 = fromY
    const controlX2 = fromX + (toX - fromX) * 0.7
    const controlY2 = toY

    return (
      <path
        key={`${fromNode.id}-${connectionId}`}
        d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`}
        stroke="oklch(0.6 0.15 250)"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        className="pointer-events-none"
      />
    )
  }

  const renderNodeConnections = (node: FlowNode) => {
    if (!selectedFlow) return []

    return node.connections
      .map(connectionId => {
        const toNode = selectedFlow.nodes.find(n => n.id === connectionId)
        return toNode ? createConnectionPath(node, toNode, connectionId) : null
      })
      .filter(Boolean)
  }

  const renderConnections = () => {
    if (!selectedFlow) return null
    return selectedFlow.nodes.flatMap(renderNodeConnections)
  }

  if (!selectedFlow) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-bold">Flow Designer</h2>
            <p className="text-muted-foreground">Create visual automation workflows</p>
          </div>
          <Button onClick={createNewFlow} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            New Flow
          </Button>
        </div>

        {flows.length === 0 ? (
          <Card className="border-border/30 flex flex-1 items-center justify-center border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <ArrowRightIcon className="text-muted-foreground h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Create Your First Flow</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Design complex automation workflows with our visual drag-and-drop interface
              </p>
              <Button onClick={createNewFlow} className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flows.map(flow => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <Card
                  className="hover:bg-accent/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedFlow(flow)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{flow.name}</CardTitle>
                        <p className="text-muted-foreground text-sm">{flow.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={e => {
                          e.stopPropagation()
                          deleteFlow(flow.id)
                        }}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={flow.enabled ? 'default' : 'secondary'} className="h-5">
                          {flow.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-muted-foreground">{flow.nodes.length} nodes</span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(flow.created))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Node Palette */}
      <div
        className={`bg-card border-border w-80 border-r transition-transform ${showNodePalette ? 'translate-x-0' : '-translate-x-full'} absolute z-10 h-full overflow-y-auto`}
      >
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Node Palette</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNodePalette(false)}
              className="h-8 w-8"
            >
              ×
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-4 gap-1">
            {Object.keys(nodeTypes).map(type => (
              <Button
                key={type}
                variant={selectedNodeType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedNodeType(type as keyof typeof nodeTypes)}
                className="text-xs capitalize"
              >
                {type}
              </Button>
            ))}
          </div>

          <ul className="list-none space-y-2">
            {nodeTypes[selectedNodeType].map(nodeType => (
              <li
                key={nodeType.type}
                draggable
                aria-roledescription="draggable node"
                onDragStart={() => setDraggedNode(nodeType)}
                className="border-border hover:bg-accent/5 flex cursor-grab items-center gap-3 rounded-lg border p-3 transition-colors active:cursor-grabbing"
              >
                <div
                  className={`h-8 w-8 rounded-lg ${nodeType.color} flex items-center justify-center`}
                >
                  <nodeType.icon size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium">{nodeType.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative flex flex-1 flex-col">
        {/* Tutorial Overlay */}
        <FlowTutorial
          onComplete={() => toast.success('Tutorial completed! Start building your first flow.')}
        />

        {/* Header */}
        <div className="border-border bg-background/80 border-b p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFlow(null)}
                className="h-8 w-8"
              >
                ←
              </Button>
              <div>
                <Input
                  value={selectedFlow.name}
                  onChange={e => setSelectedFlow({ ...selectedFlow, name: e.target.value })}
                  className="border-none bg-transparent px-0 text-lg font-medium focus-visible:ring-0"
                />
                <Input
                  value={selectedFlow.description || ''}
                  onChange={e => setSelectedFlow({ ...selectedFlow, description: e.target.value })}
                  placeholder="Add description..."
                  className="text-muted-foreground border-none bg-transparent px-0 text-sm focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNodePalette(!showNodePalette)}
                id="add-node-button"
              >
                <PlusIcon className="h-4 w-4" />
                Add Node
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testCurrentFlow}
                disabled={selectedFlow.nodes.length === 0}
              >
                <PlayIcon className="h-4 w-4" />
                Test
              </Button>
              <Button variant="outline" size="sm" onClick={saveFlow}>
                <SaveIcon className="h-4 w-4" />
                Save
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const updatedFlow = { ...selectedFlow, enabled: !selectedFlow.enabled }
                  setSelectedFlow(updatedFlow)
                  toast.success(updatedFlow.enabled ? 'Flow activated' : 'Flow deactivated')
                }}
              >
                {selectedFlow.enabled ? (
                  <StopCircleIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                {selectedFlow.enabled ? 'Stop' : 'Start'}
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          role="application"
          aria-label="Flow designer canvas"
          className="bg-muted/20 flow-canvas-grid relative flex-1 overflow-hidden"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {/* SVG for connections */}
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="oklch(0.6 0.15 250)" />
              </marker>
            </defs>
            {renderConnections()}
          </svg>

          {selectedFlow.nodes.length === 0 ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <ArrowRightIcon className="text-muted-foreground h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-medium">Start Building Your Flow</h3>
                <p className="text-muted-foreground mb-4">
                  Drag nodes from the palette to create your automation workflow
                </p>
                <Button variant="outline" onClick={() => setShowNodePalette(true)}>
                  Open Node Palette
                </Button>
              </div>
            </div>
          ) : (
            selectedFlow.nodes.map(node => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute z-20"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
              >
                <Card
                  className={`bg-background w-40 cursor-pointer border-2 shadow-lg transition-all ${
                    selectedNode?.id === node.id
                      ? 'border-primary'
                      : 'border-border hover:border-primary/50'
                  } ${connectingFrom === node.id ? 'ring-primary ring-2' : ''}`}
                  onClick={() => setSelectedNode(node)}
                >
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-6 w-6 rounded ${nodeTypes[node.type].find(t => t.type === node.subtype)?.color} flex items-center justify-center`}
                        >
                          <node.icon size={12} className="text-white" />
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {node.type}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedNode(node)
                          }}
                        >
                          <SettingsIcon className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-5 w-5"
                          onClick={e => {
                            e.stopPropagation()
                            removeNode(node.id)
                          }}
                        >
                          <TrashIcon className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mb-2 text-xs font-medium">{node.label}</div>
                    <div className="flex justify-between">
                      {node.type !== 'trigger' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={e => {
                            e.stopPropagation()
                            if (connectingFrom) {
                              completeConnection(node.id)
                            }
                          }}
                        >
                          In
                        </Button>
                      )}
                      {node.type !== 'action' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={e => {
                            e.stopPropagation()
                            startConnection(node.id)
                          }}
                        >
                          Out
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}

          {connectingFrom && (
            <div className="absolute top-4 left-4 z-30">
              <Card className="bg-primary/10 border-primary">
                <CardContent className="p-3">
                  <div className="text-primary text-sm font-medium">Connection Mode</div>
                  <div className="text-muted-foreground text-xs">Click another node to connect</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setConnectingFrom(null)}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mini Map */}
          {selectedFlow.nodes.length > 3 && (
            <div className="absolute right-4 bottom-4 z-30">
              <FlowMiniMap
                flow={{ ...selectedFlow, created: new Date(selectedFlow.created) }}
                selectedNodeId={selectedNode?.id}
                onNodeClick={nodeId => {
                  const node = selectedFlow.nodes.find(n => n.id === nodeId)
                  if (node) setSelectedNode(node)
                }}
              />
            </div>
          )}

          {/* Node Configuration Panel */}
          {selectedNode && (
            <div className="absolute top-4 right-4 z-30">
              <NodeConfig
                node={selectedNode}
                onUpdate={updateNodeData}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
