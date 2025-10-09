import { useKV } from '@/hooks/use-kv'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Lightbulb, 
  Thermometer, 
  Shield, 
  WifiHigh, 
  Plus,
  Sun,
  Moon,
  House as HomeIcon,
  Warning,
  Pulse,
  CheckCircle
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { NotificationBell } from './NotificationCenter'

interface Device {
  id: string
  name: string
  type: 'light' | 'thermostat' | 'security' | 'sensor'
  room: string
  status: 'online' | 'offline' | 'warning' | 'error'
  enabled: boolean
  value?: number
  unit?: string
  lastSeen?: Date
  batteryLevel?: number
  signalStrength?: number
}

interface DeviceAlert {
  id: string
  type: 'offline' | 'low-battery' | 'weak-signal' | 'error' | 'maintenance'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  acknowledged: boolean
}

const deviceIcons = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: WifiHigh
}

export function Dashboard() {
  const [devices, setDevices] = useKV<Device[]>("devices", [
    {
      id: "living-room-light",
      name: "Living Room Light",
      type: "light",
      room: "Living Room",
      status: "online",
      enabled: true,
      lastSeen: new Date(),
      signalStrength: 95
    },
    {
      id: "thermostat-main", 
      name: "Main Thermostat",
      type: "thermostat",
      room: "Living Room", 
      status: "online",
      enabled: true,
      value: 72,
      unit: "°F",
      lastSeen: new Date(),
      batteryLevel: 85,
      signalStrength: 88
    },
    {
      id: "front-door-lock",
      name: "Front Door Lock",
      type: "security", 
      room: "Entryway",
      status: "warning", 
      enabled: true,
      lastSeen: new Date(Date.now() - 300000),
      batteryLevel: 15,
      signalStrength: 92
    },
    {
      id: "motion-sensor",
      name: "Motion Sensor",
      type: "sensor",
      room: "Living Room",
      status: "offline",
      enabled: true,
      lastSeen: new Date(Date.now() - 900000),
      batteryLevel: 45,
      signalStrength: 0
    }
  ])
  
  const [deviceAlerts] = useKV<DeviceAlert[]>("device-alerts", [])
  const [favoriteDevices] = useKV<string[]>("favorite-devices", ["living-room-light", "thermostat-main"])
  
  const quickScenesData = [
    { id: "good-morning", name: "Good Morning", icon: "sun" },
    { id: "good-night", name: "Good Night", icon: "moon" },
    { id: "home", name: "I'm Home", icon: "home" },
    { id: "away", name: "Away", icon: "shield" }
  ]

  const sceneIcons = {
    sun: Sun,
    moon: Moon,
    home: HomeIcon,
    shield: Shield
  }

  const toggleDevice = (deviceId: string) => {
    setDevices(currentDevices => 
      currentDevices.map(device => 
        device.id === deviceId 
          ? { ...device, enabled: !device.enabled }
          : device
      )
    )
    toast.success("Device updated")
  }

  const activateScene = (sceneName: string) => {
    toast.success(`${sceneName} activated`)
  }

  const favoriteDeviceList = devices.filter(device => favoriteDevices.includes(device.id))
  
  // Get alert summary
  const activeAlerts = deviceAlerts.filter(alert => !alert.acknowledged)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
  const offlineDevices = devices.filter(device => device.status === 'offline')
  const lowBatteryDevices = devices.filter(device => device.batteryLevel !== undefined && device.batteryLevel <= 20)

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good Morning</h1>
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
        {(criticalAlerts.length > 0 || offlineDevices.length > 0 || lowBatteryDevices.length > 0) && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <Warning size={16} className="text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="flex items-center justify-between">
                <div>
                  {criticalAlerts.length > 0 && (
                    <span>{criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''}</span>
                  )}
                  {offlineDevices.length > 0 && (
                    <span className="ml-2">{offlineDevices.length} device{offlineDevices.length > 1 ? 's' : ''} offline</span>
                  )}
                  {lowBatteryDevices.length > 0 && (
                    <span className="ml-2">{lowBatteryDevices.length} low batter{lowBatteryDevices.length > 1 ? 'ies' : 'y'}</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-red-700 h-6">
                  View Details
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* System Status */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3 text-center">
              <CheckCircle size={20} className="text-green-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-green-800">
                {devices.filter(d => d.status === 'online').length}
              </div>
              <div className="text-xs text-green-700">Online</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 text-center">
              <Warning size={20} className="text-red-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-red-800">
                {offlineDevices.length}
              </div>
              <div className="text-xs text-red-700">Offline</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 text-center">
              <Pulse size={20} className="text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-blue-800">
                {activeAlerts.length}
              </div>
              <div className="text-xs text-blue-700">Alerts</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickScenesData.map((scene) => {
            const IconComponent = sceneIcons[scene.icon as keyof typeof sceneIcons]
            return (
              <motion.div
                key={scene.id}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Card 
                  className="cursor-pointer hover:bg-accent/5 transition-colors border-border/50"
                  onClick={() => activateScene(scene.name)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent size={20} className="text-primary" />
                    </div>
                    <span className="font-medium text-sm">{scene.name}</span>
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
            <Card className="border-dashed border-2 border-border/30">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No favorite devices</p>
                <p className="text-sm text-muted-foreground">
                  Add devices to favorites to control them quickly
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {favoriteDeviceList.map((device) => {
                const IconComponent = deviceIcons[device.type]
                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Card className="hover:bg-accent/5 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                              <IconComponent 
                                size={20} 
                                className={device.enabled ? "text-primary" : "text-muted-foreground"} 
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">{device.name}</h3>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">{device.room}</p>
                                <Badge 
                                  variant={device.status === 'online' ? 'default' : device.status === 'warning' ? 'secondary' : 'destructive'}
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
                                {device.value}{device.unit}
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