import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Lightbulb, 
  Thermometer, 
  Shield, 
  Wifi, 
  Plus,
  DotsThree
} from "@phosphor-icons/react"
import { motion } from "framer-motion"

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

interface Room {
  id: string
  name: string
  devices: Device[]
  temperature?: number
  humidity?: number
}

const deviceIcons = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: Wifi
}

export function Rooms() {
  const [rooms, setRooms] = useKV<Room[]>("rooms", [
    {
      id: "living-room",
      name: "Living Room", 
      devices: []
    },
    {
      id: "bedroom", 
      name: "Bedroom",
      devices: []
    },
    {
      id: "kitchen",
      name: "Kitchen", 
      devices: []
    },
    {
      id: "entryway",
      name: "Entryway",
      devices: []
    }
  ])
  const [devices] = useKV<Device[]>("devices", [])

  const getRoomDevices = (roomName: string) => {
    return devices.filter(device => device.room === roomName)
  }

  const getActiveDevicesCount = (roomDevices: Device[]) => {
    return roomDevices.filter(device => device.enabled && device.status === 'online').length
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rooms</h1>
            <p className="text-muted-foreground">Manage devices by location</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Plus size={20} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {rooms.length === 0 ? (
          <Card className="border-dashed border-2 border-border/30">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Plus size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">No rooms configured</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create rooms to organize your devices by location
              </p>
              <Button variant="outline" size="sm">
                Add Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => {
              const roomDevices = getRoomDevices(room.name)
              const activeDevices = getActiveDevicesCount(roomDevices)
              
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <DotsThree size={16} />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {activeDevices} of {roomDevices.length} active
                          </span>
                          {room.temperature && (
                            <span className="text-muted-foreground">
                              {room.temperature}°C
                            </span>
                          )}
                        </div>
                        <Badge variant="secondary" className="h-5">
                          {roomDevices.length} devices
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {roomDevices.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Device Activity</span>
                            <span>{Math.round((activeDevices / roomDevices.length) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(activeDevices / roomDevices.length) * 100} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {roomDevices.slice(0, 4).map((device) => {
                          const IconComponent = deviceIcons[device.type]
                          return (
                            <div
                              key={device.id}
                              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                device.enabled ? 'bg-primary/20' : 'bg-muted'
                              }`}>
                                <IconComponent 
                                  size={14} 
                                  className={device.enabled ? "text-primary" : "text-muted-foreground"} 
                                />
                              </div>
                              <span className="text-xs text-center leading-tight">
                                {device.name.split(' ')[0]}
                              </span>
                            </div>
                          )
                        })}
                        
                        {roomDevices.length > 4 && (
                          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <Plus size={14} className="text-muted-foreground" />
                            </div>
                            <span className="text-xs text-center leading-tight">
                              +{roomDevices.length - 4}
                            </span>
                          </div>
                        )}
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
  )
}