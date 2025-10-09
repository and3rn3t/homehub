import { useState, useRef, useCallback } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Clock, 
  MapPin, 
  Lightbulb,
  Thermometer,
  Lock,
  Power,
  Plus,
  Trash,
  ArrowRight,
  Play,
  Stop,
  FloppyDisk,
  Gear
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { NodeConfig } from './NodeConfig'
import { useFlowExecutor } from './FlowExecutor'
import { FlowMiniMap } from './FlowMiniMap'
import { FlowTutorial } from './FlowTutorial'

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

const nodeTypes = {
  trigger: [
    { type: 'time', label: 'Time Schedule', icon: Clock, color: 'bg-blue-500' },
    { type: 'location', label: 'Location', icon: MapPin, color: 'bg-green-500' },
    { type: 'device', label: 'Device State', icon: Power, color: 'bg-purple-500' },
  ],
  condition: [
    { type: 'time_range', label: 'Time Range', icon: Clock, color: 'bg-orange-500' },
    { type: 'temperature', label: 'Temperature', icon: Thermometer, color: 'bg-red-500' },
    { type: 'presence', label: 'Presence', icon: MapPin, color: 'bg-teal-500' },
  ],
  action: [
    { type: 'light', label: 'Control Light', icon: Lightbulb, color: 'bg-yellow-500' },
    { type: 'lock', label: 'Control Lock', icon: Lock, color: 'bg-gray-500' },
    { type: 'thermostat', label: 'Set Temperature', icon: Thermometer, color: 'bg-red-500' },
    { type: 'scene', label: 'Activate Scene', icon: Play, color: 'bg-indigo-500' },
  ],
  delay: [
    { type: 'wait', label: 'Wait/Delay', icon: Clock, color: 'bg-slate-500' },
  ]
}

export function FlowDesigner() {
  const [flows, setFlows] = useKV<Flow[]>("automation-flows", [])
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
  const [draggedNode, setDraggedNode] = useState<any>(null)
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
      created: new Date().toISOString()
    }
    
    setFlows(currentFlows => [...currentFlows, newFlow])
    setSelectedFlow(newFlow)
    setShowNodePalette(true)
    toast.success("New flow created")
  }

  const deleteFlow = (flowId: string) => {
    setFlows(currentFlows => currentFlows.filter(f => f.id !== flowId))
    if (selectedFlow?.id === flowId) {
      setSelectedFlow(null)
    }
    toast.success("Flow deleted")
  }

  const saveFlow = () => {
    if (!selectedFlow) return
    
    setFlows(currentFlows => 
      currentFlows.map(f => 
        f.id === selectedFlow.id ? selectedFlow : f
      )
    )
    toast.success("Flow saved")
  }

  const addNodeToCanvas = useCallback((nodeType: any, position: { x: number; y: number }) => {
    if (!selectedFlow) return

    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type: selectedNodeType,
      subtype: nodeType.type,
      label: nodeType.label,
      icon: nodeType.icon,
      position,
      data: {},
      connections: []
    }

    const updatedFlow = {
      ...selectedFlow,
      nodes: [...selectedFlow.nodes, newNode]
    }
    
    setSelectedFlow(updatedFlow)
  }, [selectedFlow, selectedNodeType])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedNode || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const position = {
      x: e.clientX - rect.left - 75, // Center the node
      y: e.clientY - rect.top - 50
    }

    addNodeToCanvas(draggedNode, position)
    setDraggedNode(null)
  }, [draggedNode, addNodeToCanvas])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeNode = (nodeId: string) => {
    if (!selectedFlow) return

    const updatedFlow = {
      ...selectedFlow,
      nodes: selectedFlow.nodes.filter(n => n.id !== nodeId)
    }
    
    setSelectedFlow(updatedFlow)
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const updateNodeData = (nodeId: string, data: any) => {
    if (!selectedFlow) return

    const updatedFlow = {
      ...selectedFlow,
      nodes: selectedFlow.nodes.map(node => 
        node.id === nodeId ? { ...node, data } : node
      )
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
      )
    }
    
    setSelectedFlow(updatedFlow)
    setConnectingFrom(null)
    toast.success("Nodes connected")
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
    
    toast.info("Testing flow...")
    const success = await testFlow(selectedFlow)
    
    if (success) {
      toast.success("Flow test completed successfully")
    } else {
      toast.error("Flow test failed")
    }
  }

  const renderConnections = () => {
    if (!selectedFlow) return null

    return selectedFlow.nodes.flatMap(node => 
      node.connections.map(connectionId => {
        const toNode = selectedFlow.nodes.find(n => n.id === connectionId)
        if (!toNode) return null

        const fromX = node.position.x + 80 // Center of node (width 160 / 2 = 80)
        const fromY = node.position.y + 50 // Center of node (estimated height)
        const toX = toNode.position.x + 80
        const toY = toNode.position.y + 50

        // Calculate control points for bezier curve
        const controlX1 = fromX + (toX - fromX) * 0.3
        const controlY1 = fromY
        const controlX2 = fromX + (toX - fromX) * 0.7
        const controlY2 = toY

        return (
          <path
            key={`${node.id}-${connectionId}`}
            d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`}
            stroke="oklch(0.6 0.15 250)"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="pointer-events-none"
          />
        )
      })
    ).filter(Boolean)
  }

  if (!selectedFlow) {
    return (
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Flow Designer</h2>
            <p className="text-muted-foreground">Create visual automation workflows</p>
          </div>
          <Button onClick={createNewFlow} className="flex items-center gap-2">
            <Plus size={16} />
            New Flow
          </Button>
        </div>

        {flows.length === 0 ? (
          <Card className="border-dashed border-2 border-border/30 flex-1 flex items-center justify-center">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <ArrowRight size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Create Your First Flow</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Design complex automation workflows with our visual drag-and-drop interface
              </p>
              <Button onClick={createNewFlow} className="flex items-center gap-2">
                <Plus size={16} />
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flows.map((flow) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setSelectedFlow(flow)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{flow.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{flow.description}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFlow(flow.id)
                        }}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={flow.enabled ? 'default' : 'secondary'} className="h-5">
                          {flow.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-muted-foreground">
                          {flow.nodes.length} nodes
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
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
      <div className={`w-80 bg-card border-r border-border transition-transform ${showNodePalette ? 'translate-x-0' : '-translate-x-full'} absolute z-10 h-full overflow-y-auto`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Node Palette</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowNodePalette(false)}
              className="w-8 h-8"
            >
              ×
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-4">
            {Object.keys(nodeTypes).map((type) => (
              <Button
                key={type}
                variant={selectedNodeType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedNodeType(type as keyof typeof nodeTypes)}
                className="capitalize text-xs"
              >
                {type}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {nodeTypes[selectedNodeType].map((nodeType) => (
              <div
                key={nodeType.type}
                draggable
                onDragStart={() => setDraggedNode(nodeType)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/5 cursor-grab active:cursor-grabbing transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${nodeType.color} flex items-center justify-center`}>
                  <nodeType.icon size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium">{nodeType.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col relative">
        {/* Tutorial Overlay */}
        <FlowTutorial onComplete={() => toast.success("Tutorial completed! Start building your first flow.")} />

        {/* Header */}
        <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedFlow(null)}
                className="w-8 h-8"
              >
                ←
              </Button>
              <div>
                <Input 
                  value={selectedFlow.name}
                  onChange={(e) => setSelectedFlow({...selectedFlow, name: e.target.value})}
                  className="font-medium text-lg border-none bg-transparent px-0 focus-visible:ring-0"
                />
                <Input 
                  value={selectedFlow.description || ''}
                  onChange={(e) => setSelectedFlow({...selectedFlow, description: e.target.value})}
                  placeholder="Add description..."
                  className="text-sm text-muted-foreground border-none bg-transparent px-0 focus-visible:ring-0"
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
                <Plus size={16} />
                Add Node
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testCurrentFlow}
                disabled={selectedFlow.nodes.length === 0}
              >
                <Play size={16} />
                Test
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={saveFlow}
              >
                <FloppyDisk size={16} />
                Save
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  const updatedFlow = {...selectedFlow, enabled: !selectedFlow.enabled}
                  setSelectedFlow(updatedFlow)
                  toast.success(updatedFlow.enabled ? "Flow activated" : "Flow deactivated")
                }}
              >
                {selectedFlow.enabled ? <Stop size={16} /> : <Play size={16} />}
                {selectedFlow.enabled ? 'Stop' : 'Start'}
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-muted/20 overflow-hidden"
          onDrop={onDrop}
          onDragOver={onDragOver}
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0'
          }}
        >
          {/* SVG for connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="oklch(0.6 0.15 250)"
                />
              </marker>
            </defs>
            {renderConnections()}
          </svg>

          {selectedFlow.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <ArrowRight size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start Building Your Flow</h3>
                <p className="text-muted-foreground mb-4">
                  Drag nodes from the palette to create your automation workflow
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNodePalette(true)}
                >
                  Open Node Palette
                </Button>
              </div>
            </div>
          ) : (
            selectedFlow.nodes.map((node) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute z-20"
                style={{ 
                  left: node.position.x, 
                  top: node.position.y 
                }}
              >
                <Card 
                  className={`w-40 shadow-lg border-2 bg-background cursor-pointer transition-all ${
                    selectedNode?.id === node.id ? 'border-primary' : 'border-border hover:border-primary/50'
                  } ${connectingFrom === node.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedNode(node)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${nodeTypes[node.type].find(t => t.type === node.subtype)?.color} flex items-center justify-center`}>
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
                          className="w-5 h-5"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedNode(node)
                          }}
                        >
                          <Gear size={10} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-5 h-5 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNode(node.id)
                          }}
                        >
                          <Trash size={10} />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs font-medium mb-2">{node.label}</div>
                    <div className="flex justify-between">
                      {node.type !== 'trigger' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={(e) => {
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
                          className="text-xs h-6 px-2"
                          onClick={(e) => {
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
                  <div className="text-sm font-medium text-primary">Connection Mode</div>
                  <div className="text-xs text-muted-foreground">Click another node to connect</div>
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
            <div className="absolute bottom-4 right-4 z-30">
              <FlowMiniMap 
                flow={selectedFlow}
                selectedNodeId={selectedNode?.id}
                onNodeClick={(nodeId) => {
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