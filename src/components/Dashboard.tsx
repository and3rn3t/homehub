import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { DeviceCardSkeleton, StatusCardSkeleton } from '@/components/ui/skeleton'
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
  const [devices, setDevices, { isLoading, isError }] = useKV<Device[]>(
    KV_KEYS.DEVICES,
    MOCK_DEVICES,
    { withMeta: true }
  )

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
    const device = devices.find(d => d.id === deviceId)
    toast.success(`${device?.name} turned ${device?.enabled ? 'off' : 'on'}`)
  }

  const activateScene = (sceneName: string) => {
    toast.success(`${sceneName} activated`, {
      description: 'Adjusting devices to match scene settings',
    })
  }

  const favoriteDeviceList = devices.filter(device => favoriteDevices.includes(device.id))

  // Get alert summary
  const activeAlerts = deviceAlerts.filter(alert => !alert.acknowledged)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
  const offlineDevices = devices.filter(device => device.status === 'offline')
  const lowBatteryDevices = devices.filter(
    device => device.batteryLevel !== undefined && device.batteryLevel <= 20
  )

  // Show loading state
  if (isLoading) {
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="mb-6 grid grid-cols-3 gap-3">
            <StatusCardSkeleton />
            <StatusCardSkeleton />
            <StatusCardSkeleton />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <StatusCardSkeleton />
            <StatusCardSkeleton />
            <StatusCardSkeleton />
            <StatusCardSkeleton />
          </div>

          <div className="mb-6">
            <h2 className="text-foreground mb-3 text-lg font-semibold">Favorite Devices</h2>
            <div className="grid grid-cols-2 gap-3">
              <DeviceCardSkeleton />
              <DeviceCardSkeleton />
              <DeviceCardSkeleton />
              <DeviceCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (isError) {
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ErrorState
            title="Unable to Load Devices"
            description="There was a problem loading your devices. Please check your connection and try again."
            onRetry={() => window.location.reload()}
            size="lg"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 pb-3 sm:p-6 sm:pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-xl font-bold sm:text-2xl">Good Morning</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Welcome home</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
                <Plus size={20} />
              </Button>
            </motion.div>
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
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3 text-center">
                <CheckCircle size={20} className="mx-auto mb-1 text-green-600" />
                <div className="text-lg font-semibold text-green-800">
                  {devices.filter(d => d.status === 'online').length}
                </div>
                <div className="text-xs text-green-700">Online</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3 text-center">
                <Warning size={20} className="mx-auto mb-1 text-red-600" />
                <div className="text-lg font-semibold text-red-800">{offlineDevices.length}</div>
                <div className="text-xs text-red-700">Offline</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 text-center">
                <Pulse size={20} className="mx-auto mb-1 text-blue-600" />
                <div className="text-lg font-semibold text-blue-800">{activeAlerts.length}</div>
                <div className="text-xs text-blue-700">Alerts</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickScenesData.map((scene, index) => {
            const IconComponent = sceneIcons[scene.icon as keyof typeof sceneIcons]
            return (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: 0.4 + index * 0.1,
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Card
                  role="button"
                  tabIndex={0}
                  className="hover:bg-accent/5 focus-visible:ring-primary/50 border-border/50 cursor-pointer transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  onClick={() => activateScene(scene.name)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      activateScene(scene.name)
                    }
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <motion.div
                      className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full"
                      whileTap={{ rotate: 15 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <IconComponent size={20} className="text-primary" />
                    </motion.div>
                    <span className="text-sm font-medium">{scene.name}</span>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold sm:text-lg">Favorite Devices</h2>
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
              {favoriteDeviceList.map((device, index) => {
                const IconComponent = deviceIcons[device.type]
                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                      delay: index * 0.05,
                    }}
                    layout
                  >
                    <Card className="hover:bg-accent/5 transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div
                              className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full"
                              animate={{
                                scale: device.enabled ? [1, 1.1, 1] : 1,
                              }}
                              transition={{
                                duration: 0.3,
                                ease: 'easeInOut',
                              }}
                            >
                              <IconComponent
                                size={20}
                                className={
                                  device.enabled ? 'text-primary' : 'text-muted-foreground'
                                }
                              />
                            </motion.div>
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
                              <motion.span
                                className="text-sm font-medium"
                                key={device.value}
                                initial={{ scale: 1.2, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              >
                                {device.value}
                                {device.unit}
                              </motion.span>
                            )}
                            <motion.div whileTap={{ scale: 0.95 }}>
                              <Switch
                                checked={device.enabled}
                                onCheckedChange={() => toggleDevice(device.id)}
                                disabled={device.status === 'offline'}
                              />
                            </motion.div>
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
