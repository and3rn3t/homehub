import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@/hooks/use-kv'
import {
  DeviceMobile,
  Microphone,
  Phone,
  PhoneDisconnect,
  SpeakerHigh,
  Television,
  User,
  Users,
  Video,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'

interface IntercomDevice {
  id: string
  name: string
  room: string
  type: 'homepod' | 'display' | 'mobile' | 'tv'
  status: 'available' | 'busy' | 'offline'
  hasVideo: boolean
  hasAudio: boolean
}

interface ActiveCall {
  id: string
  fromDevice: string
  toDevice: string
  startTime: Date
  hasVideo: boolean
}

const DEVICES: IntercomDevice[] = [
  {
    id: 'living-room-homepod',
    name: 'Living Room',
    room: 'Living Room',
    type: 'homepod',
    status: 'available',
    hasVideo: false,
    hasAudio: true,
  },
  {
    id: 'kitchen-display',
    name: 'Kitchen Display',
    room: 'Kitchen',
    type: 'display',
    status: 'available',
    hasVideo: true,
    hasAudio: true,
  },
  {
    id: 'bedroom-homepod',
    name: 'Bedroom',
    room: 'Bedroom',
    type: 'homepod',
    status: 'available',
    hasVideo: false,
    hasAudio: true,
  },
  {
    id: 'kids-room-display',
    name: 'Kids Room',
    room: 'Kids Room',
    type: 'display',
    status: 'available',
    hasVideo: true,
    hasAudio: true,
  },
  {
    id: 'mobile-primary',
    name: 'iPhone',
    room: 'Mobile',
    type: 'mobile',
    status: 'available',
    hasVideo: true,
    hasAudio: true,
  },
  {
    id: 'living-tv',
    name: 'Living Room TV',
    room: 'Living Room',
    type: 'tv',
    status: 'offline',
    hasVideo: true,
    hasAudio: true,
  },
]

export function Intercom() {
  const [devices, setDevices] = useState<IntercomDevice[]>(DEVICES)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [_intercomEnabled, _setIntercomEnabled] = useKV<boolean>('intercom-enabled', true)

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'homepod':
        return SpeakerHigh
      case 'display':
        return Television
      case 'mobile':
        return DeviceMobile
      case 'tv':
        return Television
      default:
        return SpeakerHigh
    }
  }

  const startCall = (fromDeviceId: string, toDeviceId: string, withVideo: boolean) => {
    const fromDevice = devices.find(d => d.id === fromDeviceId)
    const toDevice = devices.find(d => d.id === toDeviceId)

    if (!fromDevice || !toDevice) return

    if (toDevice.status !== 'available') {
      toast.error(`${toDevice.name} is ${toDevice.status}`)
      return
    }

    const call: ActiveCall = {
      id: `call-${Date.now()}`,
      fromDevice: fromDevice.name,
      toDevice: toDevice.name,
      startTime: new Date(),
      hasVideo: withVideo && fromDevice.hasVideo && toDevice.hasVideo,
    }

    setActiveCall(call)

    // Update device statuses
    setDevices(
      devices.map(d => {
        if (d.id === fromDeviceId || d.id === toDeviceId) {
          return { ...d, status: 'busy' }
        }
        return d
      })
    )

    toast.success(`Calling ${toDevice.name}...`)
  }

  const endCall = () => {
    if (!activeCall) return

    setActiveCall(null)

    // Reset device statuses
    setDevices(
      devices.map(d => {
        if (d.status === 'busy') {
          return { ...d, status: 'available' }
        }
        return d
      })
    )

    toast.success('Call ended')
  }

  const broadcastToAll = () => {
    const availableDevices = devices.filter(d => d.status === 'available')

    if (availableDevices.length === 0) {
      toast.error('No devices available for broadcast')
      return
    }

    toast.success(`Broadcasting to ${availableDevices.length} devices`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Intercom</h1>
            <p className="text-muted-foreground">Communicate between devices and rooms</p>
          </div>
          <div className="flex items-center gap-2">
            {activeCall && (
              <Badge variant="default" className="h-6 animate-pulse">
                Active Call
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="devices" className="flex flex-col">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="quick">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-6">
            {/* Active Call Card */}
            {activeCall && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="border-primary border-2">
                  <CardContent className="p-6">
                    <div className="space-y-4 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className="bg-primary/10 mb-2 flex h-16 w-16 items-center justify-center rounded-full">
                            <User size={32} className="text-primary" />
                          </div>
                          <p className="font-medium">{activeCall.fromDevice}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {activeCall.hasVideo ? (
                            <Video size={24} className="text-primary" />
                          ) : (
                            <Microphone size={24} className="text-primary" />
                          )}
                          <div className="bg-primary h-1 w-8 animate-pulse" />
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="bg-primary/10 mb-2 flex h-16 w-16 items-center justify-center rounded-full">
                            <User size={32} className="text-primary" />
                          </div>
                          <p className="font-medium">{activeCall.toDevice}</p>
                        </div>
                      </div>

                      <div className="flex justify-center gap-3">
                        <Button variant="destructive" onClick={endCall}>
                          <PhoneDisconnect size={20} className="mr-2" />
                          End Call
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Device List */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {devices.map(device => {
                const DeviceIcon = getDeviceIcon(device.type)
                const isAvailable = device.status === 'available'

                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all ${
                        selectedDevice === device.id ? 'border-primary border-2' : ''
                      } ${!isAvailable ? 'opacity-60' : ''}`}
                      onClick={() => isAvailable && setSelectedDevice(device.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-secondary flex h-12 w-12 items-center justify-center rounded-full">
                              <DeviceIcon
                                size={24}
                                className={isAvailable ? 'text-primary' : 'text-muted-foreground'}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{device.name}</h3>
                              <p className="text-muted-foreground text-sm">{device.room}</p>
                              <div className="mt-1 flex gap-2">
                                <Badge
                                  variant={isAvailable ? 'default' : 'secondary'}
                                  className="h-4 text-xs"
                                >
                                  {device.status}
                                </Badge>
                                {device.hasVideo && (
                                  <Badge variant="outline" className="h-4 text-xs">
                                    Video
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {selectedDevice && selectedDevice !== device.id && isAvailable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation()
                                startCall(selectedDevice, device.id, device.hasVideo)
                              }}
                            >
                              <Phone size={16} className="mr-1" />
                              Call
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="h-auto w-full justify-start py-4"
                  onClick={broadcastToAll}
                >
                  <Users size={20} className="mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Broadcast to All Rooms</p>
                    <p className="text-muted-foreground text-sm">Send message to all devices</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto w-full justify-start py-4"
                  onClick={() => {
                    const firstDevice = devices.find(d => d.status === 'available')
                    const secondDevice = devices.find(
                      d => d.status === 'available' && d.id !== firstDevice?.id
                    )
                    if (firstDevice && secondDevice) {
                      startCall(firstDevice.id, secondDevice.id, false)
                    }
                  }}
                >
                  <Microphone size={20} className="mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Family Announcement</p>
                    <p className="text-muted-foreground text-sm">Call everyone for dinner, etc.</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto w-full justify-start py-4"
                  onClick={() => toast.info('Setting up bedtime routine...')}
                >
                  <Phone size={20} className="mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Bedtime Check-in</p>
                    <p className="text-muted-foreground text-sm">Call kids' rooms for goodnight</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-muted-foreground text-sm">
                  <p className="mb-2">• Requires HomeKit-enabled devices</p>
                  <p className="mb-2">• Works with HomePod, iPad, iPhone, Apple TV</p>
                  <p className="mb-2">• End-to-end encrypted communication</p>
                  <p>• Low latency for real-time conversations</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
