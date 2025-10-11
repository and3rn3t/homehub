import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KV_KEYS, MOCK_CAMERAS, MOCK_SECURITY_EVENTS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import {
  AlertTriangleIcon,
  BellIcon,
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  MapPinIcon,
  PhoneIcon,
  PlayIcon,
  ShieldIcon,
  StopCircleIcon,
} from '@/lib/icons'
import type { Camera, SecurityEvent } from '@/types'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'

const mockStreamUrl =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjMWUyMDI0Ii8+CiAgICA8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMjAiIHI9IjQwIiBmaWxsPSIjMzc0MTUxIi8+CiAgICA8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMjAiIHI9IjIwIiBmaWxsPSIjNjM2NjcxIi8+CiAgICA8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMjAiIHI9IjgiIGZpbGw9IiM5NzkyOTkiLz4KICAgIDx0ZXh0IHg9IjE2MCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM2NjcxIiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgc2Fucy1zZXJpZiI+TGl2ZSBGZWVkPC90ZXh0Pgo8L3N2Zz4='

export function Security() {
  const [cameras, setCameras] = useKV<Camera[]>(KV_KEYS.SECURITY_CAMERAS, MOCK_CAMERAS)

  const [securityEvents, _setSecurityEvents] = useKV<SecurityEvent[]>(
    KV_KEYS.SECURITY_EVENTS,
    MOCK_SECURITY_EVENTS
  )

  const [armedMode, setArmedMode] = useKV('security-armed', false)
  const [_selectedCamera, _setSelectedCamera] = useState<string | null>(null)

  const toggleCamera = (cameraId: string) => {
    setCameras(currentCameras =>
      currentCameras.map(camera =>
        camera.id === cameraId ? { ...camera, enabled: !camera.enabled } : camera
      )
    )
    toast.success('Camera settings updated')
  }

  const toggleCameraFeature = (
    cameraId: string,
    feature: 'motionDetection' | 'recordingEnabled' | 'nightVision'
  ) => {
    setCameras(currentCameras =>
      currentCameras.map(camera =>
        camera.id === cameraId ? { ...camera, [feature]: !camera[feature] } : camera
      )
    )
    toast.success('Camera feature updated')
  }

  const formatRelativeTime = (dateInput: string | Date) => {
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
      if (isNaN(date.getTime())) return 'Invalid date'

      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      return date.toLocaleDateString()
    } catch (_error) {
      return 'Invalid date'
    }
  }

  const getStatusColor = (status: Camera['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'recording':
        return 'bg-red-500 animate-pulse'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'motion':
        return <EyeIcon className="h-4 w-4" />
      case 'door':
      case 'window':
        return <ShieldIcon className="h-4 w-4" />
      case 'alarm':
        return <BellIcon className="h-4 w-4" />
      case 'camera_offline':
        return <AlertTriangleIcon className="h-4 w-4" />
      default:
        return <ShieldIcon className="h-4 w-4" />
    }
  }

  const getEventColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const onlineCameras = cameras.filter(cam => cam.status !== 'offline')
  const recordingCameras = cameras.filter(cam => cam.recordingEnabled && cam.status !== 'offline')

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border/50 border-b p-6 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Security</h1>
            <p className="text-muted-foreground">
              {onlineCameras.length} cameras online • {recordingCameras.length} recording
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={armedMode ? 'destructive' : 'secondary'} className="px-3 py-1">
              {armedMode ? 'Armed' : 'Disarmed'}
            </Badge>
            <Switch checked={armedMode} onCheckedChange={setArmedMode} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-foreground text-2xl font-bold">{onlineCameras.length}</div>
              <div className="text-muted-foreground text-xs">Online</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{recordingCameras.length}</div>
              <div className="text-muted-foreground text-xs">Recording</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {securityEvents.filter(e => e.severity === 'high').length}
              </div>
              <div className="text-muted-foreground text-xs">Alerts</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="cameras" className="flex h-full flex-col">
          <TabsList className="mx-6 mt-4 grid w-full grid-cols-3">
            <TabsTrigger value="cameras">Live Feeds</TabsTrigger>
            <TabsTrigger value="events">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="cameras" className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              {cameras.map(camera => (
                <motion.div
                  key={camera.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <Card className="hover:bg-accent/5 relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg">
                        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-black">
                          {camera.status !== 'offline' ? (
                            <img
                              src={mockStreamUrl}
                              alt={`${camera.name} feed`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-900">
                              <div className="text-center">
                                <EyeOffIcon className="mx-auto mb-2 h-8 w-8 text-gray-500" />
                                <p className="text-xs text-gray-500">Camera Offline</p>
                              </div>
                            </div>
                          )}

                          {/* Status indicator */}
                          <div className="absolute top-2 left-2 flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${getStatusColor(camera.status)}`}
                            />
                            {camera.status === 'recording' && (
                              <StopCircleIcon className="h-3 w-3 text-red-500" />
                            )}
                          </div>

                          {/* Battery level */}
                          {camera.batteryLevel !== undefined && (
                            <div className="absolute top-2 right-2">
                              <Badge
                                variant={camera.batteryLevel < 20 ? 'destructive' : 'secondary'}
                                className="px-1 py-0 text-xs"
                              >
                                {camera.batteryLevel}%
                              </Badge>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium">{camera.name}</h3>
                              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                <MapPinIcon className="h-2.5 w-2.5" />
                                {camera.location}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {camera.nightVision && (
                                <Badge variant="outline" className="p-1 text-xs">
                                  <EyeIcon className="h-2.5 w-2.5" />
                                </Badge>
                              )}
                              {camera.motionDetection && (
                                <Badge variant="outline" className="p-1 text-xs">
                                  <BellIcon className="h-2.5 w-2.5" />
                                </Badge>
                              )}
                            </div>
                          </div>

                          {camera.lastMotion && (
                            <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                              <ClockIcon className="h-2.5 w-2.5" />
                              Last motion: {formatRelativeTime(camera.lastMotion)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DialogTrigger>

                    {/* Full Screen Camera View */}
                    <DialogContent className="w-full max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{camera.name} - Live Feed</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                          {camera.status !== 'offline' ? (
                            <img
                              src={mockStreamUrl}
                              alt={`${camera.name} full feed`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="text-center text-gray-500">
                                <EyeOffIcon className="mx-auto mb-4 h-12 w-12" />
                                <p>Camera Offline</p>
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <Button size="sm" variant="secondary">
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="secondary">
                              <StopCircleIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Motion Detection</span>
                            <Switch
                              checked={camera.motionDetection}
                              onCheckedChange={() =>
                                toggleCameraFeature(camera.id, 'motionDetection')
                              }
                              disabled={camera.status === 'offline'}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Recording</span>
                            <Switch
                              checked={camera.recordingEnabled}
                              onCheckedChange={() =>
                                toggleCameraFeature(camera.id, 'recordingEnabled')
                              }
                              disabled={camera.status === 'offline'}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Night Vision</span>
                            <Switch
                              checked={camera.nightVision}
                              onCheckedChange={() => toggleCameraFeature(camera.id, 'nightVision')}
                              disabled={camera.status === 'offline'}
                            />
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="flex-1 space-y-3 overflow-y-auto p-6">
            {securityEvents.length === 0 ? (
              <Card className="border-border/30 border-2 border-dashed">
                <CardContent className="p-8 text-center">
                  <CheckCircleIcon className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p className="text-muted-foreground">No recent security events</p>
                </CardContent>
              </Card>
            ) : (
              securityEvents.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Card className={`border ${getEventColor(event.severity)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              event.severity === 'high'
                                ? 'bg-red-100 text-red-600'
                                : event.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-green-100 text-green-600'
                            }`}
                          >
                            {getEventIcon(event.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{event.message}</p>
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                              <MapPinIcon className="h-2.5 w-2.5" />
                              <span>{event.location}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(event.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        {event.cameraId && (
                          <Button size="sm" variant="outline">
                            <CameraIcon className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="flex-1 space-y-6 overflow-y-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-border flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                      <PhoneIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Emergency Services</p>
                      <p className="text-muted-foreground text-sm">911</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>

                <div className="border-border flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <PhoneIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Security Company</p>
                      <p className="text-muted-foreground text-sm">(555) 123-4567</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Camera Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cameras.map(camera => (
                  <div
                    key={camera.id}
                    className="border-border flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
                        <CameraIcon
                          size={20}
                          className={camera.enabled ? 'text-primary' : 'text-muted-foreground'}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{camera.name}</p>
                        <p className="text-muted-foreground text-sm">{camera.location}</p>
                      </div>
                    </div>
                    <Switch
                      checked={camera.enabled}
                      onCheckedChange={() => toggleCamera(camera.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
