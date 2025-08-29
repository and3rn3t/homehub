import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Lightbulb, 
  Thermometer, 
  Shield, 
  Wifi, 
  Plus,
  Sun,
  Moon,
  Home as HomeIcon
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface Device {
  id: string
  name: string
  type: 'light' | 'thermostat' | 'security' | 'sensor'
  room: string
  status: 'online' | 'offline'
  enabled: boolean
  value?: number
  unit?: string
}

const deviceIcons = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: Wifi
}

export function Dashboard() {
  const [devices, setDevices] = useKV<Device[]>("devices", [
    {
      id: "living-room-light",
      name: "Living Room Light",
      type: "light",
      room: "Living Room",
      status: "online",
      enabled: true
    },
    {
      id: "thermostat-main", 
      name: "Main Thermostat",
      type: "thermostat",
      room: "Living Room", 
      status: "online",
      enabled: true,
      value: 72,
      unit: "°F"
    },
    {
      id: "front-door-lock",
      name: "Front Door Lock",
      type: "security", 
      room: "Entryway",
      status: "online", 
      enabled: true
    },
    {
      id: "motion-sensor",
      name: "Motion Sensor",
      type: "sensor",
      room: "Living Room",
      status: "online",
      enabled: true
    }
  ])
  const [favoriteDevices, setFavoriteDevices] = useKV<string[]>("favorite-devices", ["living-room-light", "thermostat-main"])
  
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good Morning</h1>
            <p className="text-muted-foreground">Welcome home</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Plus size={20} />
          </Button>
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
                                  variant={device.status === 'online' ? 'default' : 'secondary'}
                                  className="h-4 text-xs"
                                >
                                  {device.status}
                                </Badge>
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