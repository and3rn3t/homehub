import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Camera, 
  Shield, 
  Bell, 
  Eye,
  EyeSlash,
  Warning,
  CheckCircle,
  Play,
  Pause,
  Maximize,
  Record,
  Clock,
  MapPin,
  Phone
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface Camera {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'recording'
  enabled: boolean
  nightVision: boolean
  motionDetection: boolean
  recordingEnabled: boolean
  lastMotion?: string
  batteryLevel?: number
}

interface SecurityEvent {
  id: string
  type: 'motion' | 'door' | 'window' | 'alarm' | 'camera_offline'
  location: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
  message: string
  cameraId?: string
}

const mockStreamUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjMWUyMDI0Ii8+CiAgICA8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMjAiIHI9IjQwIiBmaWxsPSIjMzc0MTUxIi8+CiAgICA8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMjAiIHI9IjIwIiBmaWxsPSIjNjM2NjcxIi8+CiAgICA8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMjAiIHI9IjgiIGZpbGw9IiM5NzkyOTkiLz4KICAgIDx0ZXh0IHg9IjE2MCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM2NjcxIiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgc2Fucy1zZXJpZiI+TGl2ZSBGZWVkPC90ZXh0Pgo8L3N2Zz4="

export function Security() {
  const [cameras, setCameras] = useKV<Camera[]>("security-cameras", [
    {
      id: "front-door-cam",
      name: "Front Door",
      location: "Entrance",
      status: "online",
      enabled: true,
      nightVision: true,
      motionDetection: true,
      recordingEnabled: true,
      lastMotion: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      batteryLevel: 85
    },
    {
      id: "backyard-cam",
      name: "Backyard",
      location: "Garden",
      status: "recording",
      enabled: true,
      nightVision: false,
      motionDetection: true,
      recordingEnabled: true,
      lastMotion: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    },
    {
      id: "garage-cam",
      name: "Garage",
      location: "Garage",
      status: "offline",
      enabled: false,
      nightVision: true,
      motionDetection: true,
      recordingEnabled: false,
      batteryLevel: 12
    },
    {
      id: "living-room-cam",
      name: "Living Room",
      location: "Living Room",
      status: "online",
      enabled: true,
      nightVision: false,
      motionDetection: false,
      recordingEnabled: false
    }
  ])

  const [securityEvents, setSecurityEvents] = useKV<SecurityEvent[]>("security-events", [
    {
      id: "evt-1",
      type: "motion",
      location: "Front Door",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      severity: "medium",
      message: "Motion detected at front entrance",
      cameraId: "front-door-cam"
    },
    {
      id: "evt-2", 
      type: "motion",
      location: "Backyard",
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      severity: "low",
      message: "Motion detected in garden area",
      cameraId: "backyard-cam"
    },
    {
      id: "evt-3",
      type: "camera_offline",
      location: "Garage",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      severity: "high",
      message: "Camera lost connection - low battery",
      cameraId: "garage-cam"
    },
    {
      id: "evt-4",
      type: "door",
      location: "Front Door",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      severity: "low",
      message: "Door unlocked using keypad",
    }
  ])

  const [armedMode, setArmedMode] = useKV("security-armed", false)
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)

  const toggleCamera = (cameraId: string) => {
    setCameras(currentCameras => 
      currentCameras.map(camera => 
        camera.id === cameraId 
          ? { ...camera, enabled: !camera.enabled }
          : camera
      )
    )
    toast.success("Camera settings updated")
  }

  const toggleCameraFeature = (cameraId: string, feature: 'motionDetection' | 'recordingEnabled' | 'nightVision') => {
    setCameras(currentCameras => 
      currentCameras.map(camera => 
        camera.id === cameraId 
          ? { ...camera, [feature]: !camera[feature] }
          : camera
      )
    )
    toast.success("Camera feature updated")
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)
      
      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      return date.toLocaleDateString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getStatusColor = (status: Camera['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'recording': return 'bg-red-500 animate-pulse'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'motion': return <Eye size={16} />
      case 'door': case 'window': return <Shield size={16} />
      case 'alarm': return <Bell size={16} />
      case 'camera_offline': return <Warning size={16} />
      default: return <Shield size={16} />
    }
  }

  const getEventColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const onlineCameras = cameras.filter(cam => cam.status !== 'offline')
  const recordingCameras = cameras.filter(cam => cam.recordingEnabled && cam.status !== 'offline')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Security</h1>
            <p className="text-muted-foreground">
              {onlineCameras.length} cameras online • {recordingCameras.length} recording
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={armedMode ? "destructive" : "secondary"}
              className="px-3 py-1"
            >
              {armedMode ? "Armed" : "Disarmed"}
            </Badge>
            <Switch
              checked={armedMode}
              onCheckedChange={setArmedMode}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{onlineCameras.length}</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{recordingCameras.length}</div>
              <div className="text-xs text-muted-foreground">Recording</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {securityEvents.filter(e => e.severity === 'high').length}
              </div>
              <div className="text-xs text-muted-foreground">Alerts</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="cameras" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
            <TabsTrigger value="cameras">Live Feeds</TabsTrigger>
            <TabsTrigger value="events">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="cameras" className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {cameras.map((camera) => (
                <motion.div
                  key={camera.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:bg-accent/5 transition-colors relative overflow-hidden">
                        <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                          {camera.status !== 'offline' ? (
                            <img 
                              src={mockStreamUrl} 
                              alt={`${camera.name} feed`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                              <div className="text-center">
                                <EyeSlash size={32} className="text-gray-500 mx-auto mb-2" />
                                <p className="text-xs text-gray-500">Camera Offline</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Status indicator */}
                          <div className="absolute top-2 left-2 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`} />
                            {camera.status === 'recording' && (
                              <Record size={12} className="text-red-500" />
                            )}
                          </div>

                          {/* Battery level */}
                          {camera.batteryLevel !== undefined && (
                            <div className="absolute top-2 right-2">
                              <Badge 
                                variant={camera.batteryLevel < 20 ? "destructive" : "secondary"}
                                className="text-xs px-1 py-0"
                              >
                                {camera.batteryLevel}%
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-sm">{camera.name}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin size={10} />
                                {camera.location}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {camera.nightVision && (
                                <Badge variant="outline" className="text-xs p-1">
                                  <Eye size={10} />
                                </Badge>
                              )}
                              {camera.motionDetection && (
                                <Badge variant="outline" className="text-xs p-1">
                                  <Bell size={10} />
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {camera.lastMotion && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock size={10} />
                              Last motion: {formatRelativeTime(camera.lastMotion)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DialogTrigger>

                    {/* Full Screen Camera View */}
                    <DialogContent className="max-w-4xl w-full">
                      <DialogHeader>
                        <DialogTitle>{camera.name} - Live Feed</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                          {camera.status !== 'offline' ? (
                            <img 
                              src={mockStreamUrl} 
                              alt={`${camera.name} full feed`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <EyeSlash size={48} className="mx-auto mb-4" />
                                <p>Camera Offline</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <Button size="sm" variant="secondary">
                              <Play size={16} />
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Record size={16} />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Motion Detection</span>
                            <Switch
                              checked={camera.motionDetection}
                              onCheckedChange={() => toggleCameraFeature(camera.id, 'motionDetection')}
                              disabled={camera.status === 'offline'}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Recording</span>
                            <Switch
                              checked={camera.recordingEnabled}
                              onCheckedChange={() => toggleCameraFeature(camera.id, 'recordingEnabled')}
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

          <TabsContent value="events" className="flex-1 overflow-y-auto p-6 space-y-3">
            {securityEvents.length === 0 ? (
              <Card className="border-dashed border-2 border-border/30">
                <CardContent className="p-8 text-center">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent security events</p>
                </CardContent>
              </Card>
            ) : (
              securityEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card className={`border ${getEventColor(event.severity)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.severity === 'high' ? 'bg-red-100 text-red-600' :
                            event.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {getEventIcon(event.type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{event.message}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin size={10} />
                              <span>{event.location}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(event.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {event.cameraId && (
                          <Button size="sm" variant="outline">
                            <Camera size={14} />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="flex-1 overflow-y-auto p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Phone size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Emergency Services</p>
                      <p className="text-sm text-muted-foreground">911</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Edit</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Phone size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Security Company</p>
                      <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Edit</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Camera Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cameras.map((camera) => (
                  <div key={camera.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <Camera size={20} className={camera.enabled ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <div>
                        <p className="font-medium">{camera.name}</p>
                        <p className="text-sm text-muted-foreground">{camera.location}</p>
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