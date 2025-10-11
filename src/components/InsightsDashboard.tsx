import { ActivityBar } from '@/components/ui/activity-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@/hooks/use-kv'
import {
  AlertTriangleIcon,
  BatteryIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  LineChartIcon,
  ShieldIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WifiIcon,
} from '@/lib/icons'

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
  const [devices] = useKV<DeviceHealth[]>('device-health', [
    {
      id: '1',
      name: 'Living Room Lights',
      type: 'Light',
      status: 'online',
      signalStrength: 85,
      lastSeen: new Date().toISOString(),
      firmwareVersion: '1.2.3',
      uptime: 847,
    },
    {
      id: '2',
      name: 'Front Door Lock',
      type: 'Lock',
      status: 'online',
      batteryLevel: 23,
      signalStrength: 92,
      lastSeen: new Date().toISOString(),
      firmwareVersion: '2.1.0',
      uptime: 1205,
    },
    {
      id: '3',
      name: 'Kitchen Motion Sensor',
      type: 'Sensor',
      status: 'warning',
      batteryLevel: 8,
      signalStrength: 67,
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      firmwareVersion: '1.0.1',
      uptime: 2847,
    },
  ])

  const [usageData] = useKV<UsagePattern[]>(
    'usage-patterns',
    Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      deviceCount: Math.floor(Math.random() * 20) + 5,
      energyUsage: Math.floor(Math.random() * 500) + 100,
    }))
  )

  const [insights] = useKV<Insight[]>('system-insights', [
    {
      type: 'optimization',
      title: 'Battery Alert',
      description: 'Kitchen Motion Sensor battery is critically low (8%)',
      impact: 'high',
      actionable: true,
    },
    {
      type: 'energy',
      title: 'Peak Usage Detected',
      description:
        'Your energy usage peaks at 7 PM. Consider shifting some activities to save costs.',
      impact: 'medium',
      actionable: true,
    },
    {
      type: 'security',
      title: 'Device Security Update',
      description: 'Front Door Lock has a firmware update available with security improvements.',
      impact: 'high',
      actionable: true,
    },
    {
      type: 'usage',
      title: 'Automation Opportunity',
      description:
        'Living room lights are manually controlled 90% of the time. Consider automation.',
      impact: 'low',
      actionable: true,
    },
  ])

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'energy':
        return <BoltIcon className="h-4 w-4 text-yellow-500" />
      case 'usage':
        return <LineChartIcon className="h-4 w-4 text-blue-500" />
      case 'optimization':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />
      case 'security':
        return <ShieldIcon className="h-4 w-4 text-red-500" />
    }
  }

  const getImpactBadge = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">High Impact</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium Impact</Badge>
      case 'low':
        return <Badge variant="outline">Low Impact</Badge>
    }
  }

  const onlineDevices = devices.filter(d => d.status === 'online').length
  const warningDevices = devices.filter(d => d.status === 'warning').length
  const lowBatteryDevices = devices.filter(d => d.batteryLevel && d.batteryLevel < 20).length

  const averageSignalStrength = Math.round(
    devices.reduce((acc, device) => acc + device.signalStrength, 0) / devices.length
  )

  const defaultUsagePattern: UsagePattern = { hour: 0, energyUsage: 0, deviceCount: 0 }
  const peakUsageHour: UsagePattern =
    usageData.length > 0
      ? usageData.reduce(
          (max, current) => (current.energyUsage > max.energyUsage ? current : max),
          usageData[0] || defaultUsagePattern
        )
      : defaultUsagePattern

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Insights & Analytics</h1>
        <p className="text-muted-foreground">
          Monitor your smart home health and optimize performance
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Online Devices</p>
                <p className="text-2xl font-bold text-green-500">{onlineDevices}</p>
              </div>
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Warnings</p>
                <p className="text-2xl font-bold text-yellow-500">{warningDevices}</p>
              </div>
              <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Low Battery</p>
                <p className="text-2xl font-bold text-red-500">{lowBatteryDevices}</p>
              </div>
              <BatteryIcon className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Avg Signal</p>
                <p className="text-2xl font-bold">{averageSignalStrength}%</p>
              </div>
              <WifiIcon className="text-primary h-6 w-6" />
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
              {insights.map(insight => (
                <div
                  key={`${insight.type}-${insight.title}`}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      {getImpactBadge(insight.impact)}
                    </div>
                    <p className="text-muted-foreground mb-3 text-sm">{insight.description}</p>
                    {insight.actionable && (
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
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
              <CardDescription>Real-time status of all connected devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {devices.map(device => {
                const getStatusColor = () => {
                  if (device.status === 'online') return 'bg-green-500'
                  if (device.status === 'warning') return 'bg-yellow-500'
                  return 'bg-red-500'
                }

                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
                      <div>
                        <h4 className="font-medium">{device.name}</h4>
                        <p className="text-muted-foreground text-sm">
                          {device.type} • v{device.firmwareVersion}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      {device.batteryLevel && (
                        <div className="flex items-center gap-2">
                          <BatteryIcon
                            className={
                              device.batteryLevel < 20
                                ? 'h-4 w-4 text-red-500'
                                : 'text-muted-foreground h-4 w-4'
                            }
                          />
                          <span className={device.batteryLevel < 20 ? 'text-red-500' : ''}>
                            {device.batteryLevel}%
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <WifiIcon className="text-muted-foreground h-4 w-4" />
                        <span>{device.signalStrength}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="text-muted-foreground h-4 w-4" />
                        <span>
                          {Math.floor(device.uptime / 24)}d {device.uptime % 24}h
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-4 font-medium">Peak Usage Time</h4>
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <div className="mb-2 text-3xl font-bold">{peakUsageHour.hour}:00</div>
                    <div className="text-muted-foreground text-sm">
                      {peakUsageHour.energyUsage}W peak consumption
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 font-medium">Daily Energy Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Today</span>
                      <span className="font-medium">4.2 kWh</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span>vs. yesterday: </span>
                      <span className="flex items-center gap-1 text-green-500">
                        <TrendingDownIcon className="h-3 w-3" />
                        -12%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-4 font-medium">Hourly Activity Pattern</h4>
                <div className="grid grid-cols-12 gap-1">
                  {usageData.map(data => (
                    <ActivityBar
                      key={data.hour}
                      deviceCount={data.deviceCount}
                      maxCount={25}
                      label={`${data.hour}h`}
                    />
                  ))}
                </div>
                <div className="text-muted-foreground mt-2 text-center text-xs">
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
