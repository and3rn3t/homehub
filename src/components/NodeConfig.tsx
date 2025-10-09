import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { X } from '@phosphor-icons/react'
import { useState } from 'react'

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

interface NodeConfigProps {
  node: FlowNode
  onUpdate: (nodeId: string, data: any) => void
  onClose: () => void
}

export function NodeConfig({ node, onUpdate, onClose }: NodeConfigProps) {
  const [nodeData, setNodeData] = useState(node.data || {})

  const updateNodeData = (key: string, value: any) => {
    const newData = { ...nodeData, [key]: value }
    setNodeData(newData)
    onUpdate(node.id, newData)
  }

  const renderTriggerConfig = () => {
    switch (node.subtype) {
      case 'time':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={nodeData.time || '09:00'}
                onChange={e => updateNodeData('time', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="days">Days of Week</Label>
              <div className="mt-2 flex gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <Button
                    key={day}
                    variant={(nodeData.days || []).includes(index) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const days = nodeData.days || []
                      const newDays = days.includes(index)
                        ? days.filter((d: number) => d !== index)
                        : [...days, index]
                      updateNodeData('days', newDays)
                    }}
                    className="h-8 w-12 text-xs"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="location-type">Location Event</Label>
              <Select
                value={nodeData.event || 'enter'}
                onValueChange={value => updateNodeData('event', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enter">Enter Area</SelectItem>
                  <SelectItem value="exit">Leave Area</SelectItem>
                  <SelectItem value="arrive_home">Arrive Home</SelectItem>
                  <SelectItem value="leave_home">Leave Home</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="radius">Radius (meters)</Label>
              <Slider
                value={[nodeData.radius || 100]}
                onValueChange={([value]) => updateNodeData('radius', value)}
                max={1000}
                min={10}
                step={10}
                className="mt-2"
              />
              <div className="text-muted-foreground mt-1 text-sm">{nodeData.radius || 100}m</div>
            </div>
          </div>
        )

      case 'device':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="device">Device</Label>
              <Select
                value={nodeData.deviceId || ''}
                onValueChange={value => updateNodeData('deviceId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="living-room-light">Living Room Light</SelectItem>
                  <SelectItem value="front-door-lock">Front Door Lock</SelectItem>
                  <SelectItem value="thermostat">Thermostat</SelectItem>
                  <SelectItem value="motion-sensor">Motion Sensor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="state">State Change</Label>
              <Select
                value={nodeData.state || 'on'}
                onValueChange={value => updateNodeData('state', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Turned On</SelectItem>
                  <SelectItem value="off">Turned Off</SelectItem>
                  <SelectItem value="motion">Motion Detected</SelectItem>
                  <SelectItem value="no_motion">No Motion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return <div className="text-muted-foreground text-sm">No configuration available</div>
    }
  }

  const renderConditionConfig = () => {
    switch (node.subtype) {
      case 'time_range':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={nodeData.startTime || '08:00'}
                onChange={e => updateNodeData('startTime', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={nodeData.endTime || '22:00'}
                onChange={e => updateNodeData('endTime', e.target.value)}
              />
            </div>
          </div>
        )

      case 'temperature':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="temp-condition">Condition</Label>
              <Select
                value={nodeData.condition || 'greater'}
                onValueChange={value => updateNodeData('condition', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater">Greater than</SelectItem>
                  <SelectItem value="less">Less than</SelectItem>
                  <SelectItem value="between">Between</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="temperature">Temperature (°F)</Label>
              <Slider
                value={[nodeData.temperature || 70]}
                onValueChange={([value]) => updateNodeData('temperature', value)}
                max={85}
                min={60}
                step={1}
                className="mt-2"
              />
              <div className="text-muted-foreground mt-1 text-sm">
                {nodeData.temperature || 70}°F
              </div>
            </div>
          </div>
        )

      case 'presence':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="presence-type">Presence Check</Label>
              <Select
                value={nodeData.presenceType || 'anyone'}
                onValueChange={value => updateNodeData('presenceType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyone">Anyone home</SelectItem>
                  <SelectItem value="everyone">Everyone home</SelectItem>
                  <SelectItem value="nobody">Nobody home</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return <div className="text-muted-foreground text-sm">No configuration available</div>
    }
  }

  const renderActionConfig = () => {
    switch (node.subtype) {
      case 'light':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="light-device">Light</Label>
              <Select
                value={nodeData.deviceId || ''}
                onValueChange={value => updateNodeData('deviceId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select light" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="living-room-light">Living Room Light</SelectItem>
                  <SelectItem value="bedroom-light">Bedroom Light</SelectItem>
                  <SelectItem value="kitchen-light">Kitchen Light</SelectItem>
                  <SelectItem value="all-lights">All Lights</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="light-action">Action</Label>
              <Select
                value={nodeData.action || 'turn_on'}
                onValueChange={value => updateNodeData('action', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="turn_on">Turn On</SelectItem>
                  <SelectItem value="turn_off">Turn Off</SelectItem>
                  <SelectItem value="toggle">Toggle</SelectItem>
                  <SelectItem value="dim">Dim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {nodeData.action === 'dim' && (
              <div>
                <Label htmlFor="brightness">Brightness (%)</Label>
                <Slider
                  value={[nodeData.brightness || 50]}
                  onValueChange={([value]) => updateNodeData('brightness', value)}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-2"
                />
                <div className="text-muted-foreground mt-1 text-sm">
                  {nodeData.brightness || 50}%
                </div>
              </div>
            )}
          </div>
        )

      case 'lock':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lock-device">Lock</Label>
              <Select
                value={nodeData.deviceId || ''}
                onValueChange={value => updateNodeData('deviceId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front-door">Front Door</SelectItem>
                  <SelectItem value="back-door">Back Door</SelectItem>
                  <SelectItem value="garage-door">Garage Door</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lock-action">Action</Label>
              <Select
                value={nodeData.action || 'lock'}
                onValueChange={value => updateNodeData('action', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lock">Lock</SelectItem>
                  <SelectItem value="unlock">Unlock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'thermostat':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="thermostat-mode">Mode</Label>
              <Select
                value={nodeData.mode || 'heat'}
                onValueChange={value => updateNodeData('mode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heat">Heat</SelectItem>
                  <SelectItem value="cool">Cool</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="target-temp">Target Temperature (°F)</Label>
              <Slider
                value={[nodeData.targetTemp || 72]}
                onValueChange={([value]) => updateNodeData('targetTemp', value)}
                max={85}
                min={60}
                step={1}
                className="mt-2"
              />
              <div className="text-muted-foreground mt-1 text-sm">
                {nodeData.targetTemp || 72}°F
              </div>
            </div>
          </div>
        )

      case 'scene':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="scene">Scene</Label>
              <Select
                value={nodeData.sceneId || ''}
                onValueChange={value => updateNodeData('sceneId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scene" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good-morning">Good Morning</SelectItem>
                  <SelectItem value="movie-time">Movie Time</SelectItem>
                  <SelectItem value="bedtime">Bedtime</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return <div className="text-muted-foreground text-sm">No configuration available</div>
    }
  }

  const renderDelayConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="delay-duration">Duration</Label>
          <div className="mt-2 flex gap-2">
            <Input
              type="number"
              value={nodeData.hours || 0}
              onChange={e => updateNodeData('hours', parseInt(e.target.value) || 0)}
              placeholder="Hours"
              className="flex-1"
            />
            <Input
              type="number"
              value={nodeData.minutes || 5}
              onChange={e => updateNodeData('minutes', parseInt(e.target.value) || 0)}
              placeholder="Minutes"
              className="flex-1"
            />
            <Input
              type="number"
              value={nodeData.seconds || 0}
              onChange={e => updateNodeData('seconds', parseInt(e.target.value) || 0)}
              placeholder="Seconds"
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="delay-description">Description</Label>
          <Textarea
            id="delay-description"
            value={nodeData.description || ''}
            onChange={e => updateNodeData('description', e.target.value)}
            placeholder="Optional delay description..."
            className="mt-2"
          />
        </div>
      </div>
    )
  }

  const renderConfig = () => {
    switch (node.type) {
      case 'trigger':
        return renderTriggerConfig()
      case 'condition':
        return renderConditionConfig()
      case 'action':
        return renderActionConfig()
      case 'delay':
        return renderDelayConfig()
      default:
        return <div className="text-muted-foreground text-sm">Unknown node type</div>
    }
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <node.icon size={16} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-sm">{node.label}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs capitalize">
                {node.type}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{renderConfig()}</CardContent>
    </Card>
  )
}
