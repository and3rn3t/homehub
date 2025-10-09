import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { KV_KEYS, MOCK_DEVICES, MOCK_ROOMS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { Device, Room } from '@/types'
import { DotsThree, Lightbulb, Plus, Shield, Thermometer, WifiHigh } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

const deviceIcons = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: WifiHigh,
}

export function Rooms() {
  const [rooms] = useKV<Room[]>(KV_KEYS.ROOMS, MOCK_ROOMS)
  const [devices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)

  const getRoomDevices = (roomName: string) => {
    return devices.filter(device => device.room === roomName)
  }

  const getActiveDevicesCount = (roomDevices: Device[]) => {
    return roomDevices.filter(device => device.enabled && device.status === 'online').length
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Rooms</h1>
            <p className="text-muted-foreground">Manage devices by location</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Plus size={20} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {rooms.length === 0 ? (
          <Card className="border-border/30 border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <Plus size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">No rooms configured</p>
              <p className="text-muted-foreground mb-4 text-sm">
                Create rooms to organize your devices by location
              </p>
              <Button variant="outline" size="sm">
                Add Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rooms.map(room => {
              const roomDevices = getRoomDevices(room.name)
              const activeDevices = getActiveDevicesCount(roomDevices)

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <DotsThree size={16} />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {activeDevices} of {roomDevices.length} active
                          </span>
                          {room.temperature && (
                            <span className="text-muted-foreground">{room.temperature}°C</span>
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
                          <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                            <span>Device Activity</span>
                            <span>{Math.round((activeDevices / roomDevices.length) * 100)}%</span>
                          </div>
                          <Progress
                            value={(activeDevices / roomDevices.length) * 100}
                            className="h-1.5"
                          />
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {roomDevices.slice(0, 4).map(device => {
                          const IconComponent = deviceIcons[device.type]
                          return (
                            <div
                              key={device.id}
                              className="bg-secondary/50 flex flex-col items-center gap-1 rounded-lg p-2"
                            >
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                  device.enabled ? 'bg-primary/20' : 'bg-muted'
                                }`}
                              >
                                <IconComponent
                                  size={14}
                                  className={
                                    device.enabled ? 'text-primary' : 'text-muted-foreground'
                                  }
                                />
                              </div>
                              <span className="text-center text-xs leading-tight">
                                {device.name.split(' ')[0]}
                              </span>
                            </div>
                          )
                        })}

                        {roomDevices.length > 4 && (
                          <div className="bg-secondary/50 flex flex-col items-center gap-1 rounded-lg p-2">
                            <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full">
                              <Plus size={14} className="text-muted-foreground" />
                            </div>
                            <span className="text-center text-xs leading-tight">
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
