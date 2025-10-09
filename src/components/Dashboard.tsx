import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { KV_KEYS, MOCK_DEVICES } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { Device, DeviceAlert } from '@/types'
import {
  CheckCircle,
  House as HomeIcon,
  Lightbulb,
  Moon,
  Plus,
  Pulse,
  Shield,
  Sun,
  Thermometer,
  Warning,
  WifiHigh,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { NotificationBell } from './NotificationCenter'

const deviceIcons = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: WifiHigh,
}

export function Dashboard() {
  const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)

  const [deviceAlerts] = useKV<DeviceAlert[]>('device-alerts', [])
  const [favoriteDevices] = useKV<string[]>('favorite-devices', [
    'living-room-light',
    'thermostat-main',
  ])

  const quickScenesData = [
    { id: 'good-morning', name: 'Good Morning', icon: 'sun' },
    { id: 'good-night', name: 'Good Night', icon: 'moon' },
    { id: 'home', name: "I'm Home", icon: 'home' },
    { id: 'away', name: 'Away', icon: 'shield' },
  ]

  const sceneIcons = {
    sun: Sun,
    moon: Moon,
    home: HomeIcon,
    shield: Shield,
  }

  const toggleDevice = (deviceId: string) => {
    setDevices(currentDevices =>
      currentDevices.map(device =>
        device.id === deviceId ? { ...device, enabled: !device.enabled } : device
      )
    )
    toast.success('Device updated')
  }

  const activateScene = (sceneName: string) => {
    toast.success(`${sceneName} activated`)
  }

  const favoriteDeviceList = devices.filter(device => favoriteDevices.includes(device.id))

  // Get alert summary
  const activeAlerts = deviceAlerts.filter(alert => !alert.acknowledged)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
  const offlineDevices = devices.filter(device => device.status === 'offline')
  const lowBatteryDevices = devices.filter(
    device => device.batteryLevel !== undefined && device.batteryLevel <= 20
  )

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Good Morning</h1>
            <p className="text-muted-foreground">Welcome home</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button variant="outline" size="icon" className="rounded-full">
              <Plus size={20} />
            </Button>
          </div>
        </div>

        {/* Alert Summary */}
        {(criticalAlerts.length > 0 ||
          offlineDevices.length > 0 ||
          lowBatteryDevices.length > 0) && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <Warning size={16} className="text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="flex items-center justify-between">
                <div>
                  {criticalAlerts.length > 0 && (
                    <span>
                      {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {offlineDevices.length > 0 && (
                    <span className="ml-2">
                      {offlineDevices.length} device{offlineDevices.length > 1 ? 's' : ''} offline
                    </span>
                  )}
                  {lowBatteryDevices.length > 0 && (
                    <span className="ml-2">
                      {lowBatteryDevices.length} low batter
                      {lowBatteryDevices.length > 1 ? 'ies' : 'y'}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-red-700">
                  View Details
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* System Status */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3 text-center">
              <CheckCircle size={20} className="mx-auto mb-1 text-green-600" />
              <div className="text-lg font-semibold text-green-800">
                {devices.filter(d => d.status === 'online').length}
              </div>
              <div className="text-xs text-green-700">Online</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 text-center">
              <Warning size={20} className="mx-auto mb-1 text-red-600" />
              <div className="text-lg font-semibold text-red-800">{offlineDevices.length}</div>
              <div className="text-xs text-red-700">Offline</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 text-center">
              <Pulse size={20} className="mx-auto mb-1 text-blue-600" />
              <div className="text-lg font-semibold text-blue-800">{activeAlerts.length}</div>
              <div className="text-xs text-blue-700">Alerts</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {quickScenesData.map(scene => {
            const IconComponent = sceneIcons[scene.icon as keyof typeof sceneIcons]
            return (
              <motion.div
                key={scene.id}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Card
                  className="hover:bg-accent/5 border-border/50 cursor-pointer transition-colors"
                  onClick={() => activateScene(scene.name)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <IconComponent size={20} className="text-primary" />
                    </div>
                    <span className="text-sm font-medium">{scene.name}</span>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Favorite Devices</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              Edit
            </Button>
          </div>

          {favoriteDeviceList.length === 0 ? (
            <Card className="border-border/30 border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No favorite devices</p>
                <p className="text-muted-foreground text-sm">
                  Add devices to favorites to control them quickly
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {favoriteDeviceList.map(device => {
                const IconComponent = deviceIcons[device.type]
                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <Card className="hover:bg-accent/5 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
                              <IconComponent
                                size={20}
                                className={
                                  device.enabled ? 'text-primary' : 'text-muted-foreground'
                                }
                              />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium">{device.name}</h3>
                              <div className="flex items-center gap-2">
                                <p className="text-muted-foreground text-xs">{device.room}</p>
                                <Badge
                                  variant={
                                    device.status === 'online'
                                      ? 'default'
                                      : device.status === 'warning'
                                        ? 'secondary'
                                        : 'destructive'
                                  }
                                  className="h-4 text-xs"
                                >
                                  {device.status}
                                </Badge>
                                {device.batteryLevel !== undefined && device.batteryLevel <= 20 && (
                                  <Badge variant="destructive" className="h-4 text-xs">
                                    Low Battery
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {device.value !== undefined && (
                              <span className="text-sm font-medium">
                                {device.value}
                                {device.unit}
                              </span>
                            )}
                            <Switch
                              checked={device.enabled}
                              onCheckedChange={() => toggleDevice(device.id)}
                              disabled={device.status === 'offline'}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
