import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendUp, 
  TrendDown, 
  Zap, 
  Wifi, 
  Battery, 
  Clock, 
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle
} from "@phosphor-icons/react"

interface DeviceHealth {
  id: string
  name: string
  type: string
  status: 'online' | 'offline' | 'warning'
  batteryLevel?: number
  signalStrength: number
  lastSeen: string
  firmwareVersion: string
  uptime: number
}

interface UsagePattern {
  hour: number
  deviceCount: number
  energyUsage: number
}

interface Insight {
  type: 'energy' | 'usage' | 'optimization' | 'security'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
}

export function InsightsDashboard() {
  const [devices] = useKV<DeviceHealth[]>("device-health", [
    {
      id: "1",
      name: "Living Room Lights",
      type: "Light",
      status: 'online',
      signalStrength: 85,
      lastSeen: new Date().toISOString(),
      firmwareVersion: "1.2.3",
      uptime: 847
    },
    {
      id: "2",
      name: "Front Door Lock",
      type: "Lock",
      status: 'online',
      batteryLevel: 23,
      signalStrength: 92,
      lastSeen: new Date().toISOString(),
      firmwareVersion: "2.1.0",
      uptime: 1205
    },
    {
      id: "3",
      name: "Kitchen Motion Sensor",
      type: "Sensor",
      status: 'warning',
      batteryLevel: 8,
      signalStrength: 67,
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      firmwareVersion: "1.0.1",
      uptime: 2847
    }
  ])

  const [usageData] = useKV<UsagePattern[]>("usage-patterns", 
    Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      deviceCount: Math.floor(Math.random() * 20) + 5,
      energyUsage: Math.floor(Math.random() * 500) + 100
    }))
  )

  const [insights] = useKV<Insight[]>("system-insights", [
    {
      type: 'optimization',
      title: 'Battery Alert',
      description: 'Kitchen Motion Sensor battery is critically low (8%)',
      impact: 'high',
      actionable: true
    },
    {
      type: 'energy',
      title: 'Peak Usage Detected',
      description: 'Your energy usage peaks at 7 PM. Consider shifting some activities to save costs.',
      impact: 'medium',
      actionable: true
    },
    {
      type: 'security',
      title: 'Device Security Update',
      description: 'Front Door Lock has a firmware update available with security improvements.',
      impact: 'high',
      actionable: true
    },
    {
      type: 'usage',
      title: 'Automation Opportunity',
      description: 'Living room lights are manually controlled 90% of the time. Consider automation.',
      impact: 'low',
      actionable: true
    }
  ])

  const getStatusColor = (status: DeviceHealth['status']) => {
    switch (status) {
      case 'online': return 'text-green-500'
      case 'warning': return 'text-yellow-500' 
      case 'offline': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'energy': return <Zap size={16} className="text-yellow-500" />
      case 'usage': return <Activity size={16} className="text-blue-500" />
      case 'optimization': return <TrendUp size={16} className="text-green-500" />
      case 'security': return <Shield size={16} className="text-red-500" />
    }
  }

  const getImpactBadge = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">High Impact</Badge>
      case 'medium': return <Badge variant="secondary">Medium Impact</Badge>
      case 'low': return <Badge variant="outline">Low Impact</Badge>
    }
  }

  const onlineDevices = devices.filter(d => d.status === 'online').length
  const warningDevices = devices.filter(d => d.status === 'warning').length
  const offlineDevices = devices.filter(d => d.status === 'offline').length
  const lowBatteryDevices = devices.filter(d => d.batteryLevel && d.batteryLevel < 20).length

  const averageSignalStrength = Math.round(
    devices.reduce((acc, device) => acc + device.signalStrength, 0) / devices.length
  )

  const peakUsageHour = usageData.reduce((max, current) => 
    current.energyUsage > max.energyUsage ? current : max
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insights & Analytics</h1>
        <p className="text-muted-foreground">Monitor your smart home health and optimize performance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Devices</p>
                <p className="text-2xl font-bold text-green-500">{onlineDevices}</p>
              </div>
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-500">{warningDevices}</p>
              </div>
              <AlertTriangle size={24} className="text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Battery</p>
                <p className="text-2xl font-bold text-red-500">{lowBatteryDevices}</p>
              </div>
              <Battery size={24} className="text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Signal</p>
                <p className="text-2xl font-bold">{averageSignalStrength}%</p>
              </div>
              <Wifi size={24} className="text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Smart Insights</TabsTrigger>
          <TabsTrigger value="health">Device Health</TabsTrigger>
          <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
              <CardDescription>
                Actionable insights to improve your smart home performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      {getImpactBadge(insight.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    {insight.actionable && (
                      <Button size="sm" variant="outline">Take Action</Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Health Monitor</CardTitle>
              <CardDescription>
                Real-time status of all connected devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' :
                      device.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <h4 className="font-medium">{device.name}</h4>
                      <p className="text-sm text-muted-foreground">{device.type} • v{device.firmwareVersion}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    {device.batteryLevel && (
                      <div className="flex items-center gap-2">
                        <Battery size={16} className={device.batteryLevel < 20 ? 'text-red-500' : 'text-muted-foreground'} />
                        <span className={device.batteryLevel < 20 ? 'text-red-500' : ''}>{device.batteryLevel}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Wifi size={16} className="text-muted-foreground" />
                      <span>{device.signalStrength}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <span>{Math.floor(device.uptime / 24)}d {device.uptime % 24}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Understand how and when your devices are most active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Peak Usage Time</h4>
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold mb-2">{peakUsageHour.hour}:00</div>
                    <div className="text-sm text-muted-foreground">
                      {peakUsageHour.energyUsage}W peak consumption
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Daily Energy Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Today</span>
                      <span className="font-medium">4.2 kWh</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>vs. yesterday: </span>
                      <span className="flex items-center gap-1 text-green-500">
                        <TrendDown size={12} />
                        -12%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Hourly Activity Pattern</h4>
                <div className="grid grid-cols-12 gap-1">
                  {usageData.map((data) => (
                    <div key={data.hour} className="text-center">
                      <div 
                        className="bg-primary/20 rounded-sm mb-1 transition-all hover:bg-primary/40"
                        style={{ height: `${(data.deviceCount / 25) * 60}px` }}
                      />
                      <div className="text-xs text-muted-foreground">
                        {data.hour}h
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Device activity throughout the day
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}