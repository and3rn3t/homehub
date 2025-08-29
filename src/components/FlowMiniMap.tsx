import { Card, CardContent } from "@/components/ui/card"

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
  created: Date
}

interface FlowMiniMapProps {
  flow: Flow
  selectedNodeId?: string
  onNodeClick?: (nodeId: string) => void
  className?: string
}

export function FlowMiniMap({ flow, selectedNodeId, onNodeClick, className = "" }: FlowMiniMapProps) {
  if (!flow.nodes.length) return null

  // Calculate bounds of all nodes
  const bounds = flow.nodes.reduce((acc, node) => ({
    minX: Math.min(acc.minX, node.position.x),
    maxX: Math.max(acc.maxX, node.position.x + 160), // Node width
    minY: Math.min(acc.minY, node.position.y),
    maxY: Math.max(acc.maxY, node.position.y + 100), // Estimated node height
  }), {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  })

  const canvasWidth = bounds.maxX - bounds.minX
  const canvasHeight = bounds.maxY - bounds.minY
  const scale = Math.min(200 / canvasWidth, 150 / canvasHeight, 1)

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-blue-500'
      case 'condition': return 'bg-orange-500'
      case 'action': return 'bg-green-500'
      case 'delay': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <Card className={`w-56 ${className}`}>
      <CardContent className="p-3">
        <div className="text-xs font-medium mb-2 text-muted-foreground">Flow Overview</div>
        <div 
          className="relative bg-muted/30 rounded border"
          style={{ 
            width: canvasWidth * scale || 200, 
            height: canvasHeight * scale || 150,
            minWidth: 200,
            minHeight: 150
          }}
        >
          {/* Render connections */}
          <svg className="absolute inset-0 w-full h-full">
            {flow.nodes.flatMap(node => 
              node.connections.map(connectionId => {
                const toNode = flow.nodes.find(n => n.id === connectionId)
                if (!toNode) return null

                const fromX = (node.position.x - bounds.minX + 80) * scale
                const fromY = (node.position.y - bounds.minY + 50) * scale
                const toX = (toNode.position.x - bounds.minX + 80) * scale
                const toY = (toNode.position.y - bounds.minY + 50) * scale

                return (
                  <line
                    key={`${node.id}-${connectionId}`}
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke="oklch(0.6 0.15 250)"
                    strokeWidth="1"
                  />
                )
              })
            ).filter(Boolean)}
          </svg>

          {/* Render nodes */}
          {flow.nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute w-3 h-3 rounded-sm cursor-pointer transition-all ${
                getNodeTypeColor(node.type)
              } ${
                selectedNodeId === node.id ? 'ring-2 ring-primary scale-125' : 'hover:scale-110'
              }`}
              style={{
                left: (node.position.x - bounds.minX) * scale,
                top: (node.position.y - bounds.minY) * scale,
              }}
              onClick={() => onNodeClick?.(node.id)}
              title={node.label}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-blue-500"></div>
            <span className="text-muted-foreground">Trigger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-orange-500"></div>
            <span className="text-muted-foreground">Condition</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-green-500"></div>
            <span className="text-muted-foreground">Action</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}