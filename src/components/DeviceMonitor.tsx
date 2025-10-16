import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IOS26EmptyState } from '@/components/ui/ios26-error'
import { IOS26StatusBadge } from '@/components/ui/ios26-status'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { Switch } from '@/components/ui/switch'
import { KV_KEYS, MOCK_DEVICES } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import {
  AlertTriangleIcon,
  BatteryIcon,
  BatteryWarningIcon,
  BellIcon,
  BellOffIcon,
  CameraIcon,
  ClockIcon,
  LightbulbIcon,
  LineChartIcon,
  ShieldIcon,
  SpeakerIcon,
  ThermometerIcon,
  WifiIcon,
  WifiOffIcon,
} from '@/lib/icons'
import type { Device } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DeviceStatus {
  id: string
  name: string
  type: 'light' | 'thermostat' | 'security' | 'sensor' | 'camera' | 'speaker'
  room: string
  status: 'online' | 'offline' | 'warning' | 'error'
  lastSeen: Date
  batteryLevel?: number
  signalStrength?: number
  enabled: boolean
  value?: number
  unit?: string
  alerts: DeviceAlert[]
}

interface DeviceAlert {
  id: string
  type: 'offline' | 'low-battery' | 'weak-signal' | 'error' | 'maintenance'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  acknowledged: boolean
}

interface MonitoringSettings {
  alertsEnabled: boolean
  offlineThreshold: number // minutes
  batteryThreshold: number // percentage
  signalThreshold: number // percentage
  soundAlerts: boolean
  pushNotifications: boolean
}

const deviceIcons = {
  light: LightbulbIcon,
  thermostat: ThermometerIcon,
  security: ShieldIcon,
  sensor: WifiIcon,
  camera: CameraIcon,
  speaker: SpeakerIcon,
}

const statusColors = {
  online: 'text-green-500',
  offline: 'text-red-500',
  warning: 'text-yellow-500',
  error: 'text-red-600',
}

const statusBgColors = {
  online: 'bg-green-50 border-green-200',
  offline: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-300',
}

const alertSeverityColors = {
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  critical: 'text-red-600 bg-red-50 border-red-200',
}

export function DeviceMonitor() {
  // Read actual devices from KV store
  const [kvDevices] = useKV<Device[]>(KV_KEYS.DEVICES, MOCK_DEVICES)

  // Convert Device[] to DeviceStatus[] for monitoring
  const convertToDeviceStatus = (device: Device): DeviceStatus => ({
    id: device.id,
    name: device.name,
    type: device.type as DeviceStatus['type'],
    room: device.room,
    status: device.status,
    lastSeen: device.lastSeen || new Date(),
    enabled: device.enabled,
    batteryLevel: device.batteryLevel,
    signalStrength: device.signalStrength,
    value: device.value,
    unit: device.unit,
    alerts: [], // Alerts would be populated from separate KV store or logic
  })

  const [devices, setDevices] = useState<DeviceStatus[]>(() => kvDevices.map(convertToDeviceStatus))

  // Sync with KV store when kvDevices changes
  useEffect(() => {
    setDevices(kvDevices.map(convertToDeviceStatus))
  }, [kvDevices])

  const [settings, setSettings] = useKV<MonitoringSettings>('monitoring-settings', {
    alertsEnabled: true,
    offlineThreshold: 10,
    batteryThreshold: 20,
    signalThreshold: 50,
    soundAlerts: true,
    pushNotifications: true,
  })

  const [activeAlerts, setActiveAlerts] = useState<DeviceAlert[]>([])
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'warning' | 'error'>('all')

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      // Simulate device status refresh
      await new Promise(resolve => setTimeout(resolve, 800))

      // Force a device status update
      setDevices(kvDevices.map(convertToDeviceStatus))

      toast.success('Device status refreshed', {
        description: `Checked ${kvDevices.length} devices`,
      })
    } catch (_error) {
      toast.error('Failed to refresh device status')
    }
  }, [kvDevices])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(currentDevices =>
        currentDevices.map(device => {
          // Simulate random status changes for demo
          const randomChange = Math.random()
          let newStatus = device.status

          if (randomChange < 0.02) {
            // 2% chance of status change
            const statuses: DeviceStatus['status'][] = ['online', 'warning', 'error']
            newStatus = statuses[Math.floor(Math.random() * statuses.length)] ?? device.status
          }

          // Update battery levels
          let newBatteryLevel = device.batteryLevel
          if (device.batteryLevel !== undefined && randomChange < 0.1) {
            newBatteryLevel = Math.max(0, device.batteryLevel - Math.random() * 2)
          }

          // Update signal strength
          let newSignalStrength = device.signalStrength
          if (device.signalStrength !== undefined && randomChange < 0.05) {
            newSignalStrength = Math.max(
              0,
              Math.min(100, device.signalStrength + (Math.random() - 0.5) * 10)
            )
          }

          return {
            ...device,
            status: newStatus,
            lastSeen: newStatus === 'online' ? new Date() : device.lastSeen,
            batteryLevel: newBatteryLevel,
            signalStrength: newSignalStrength,
          }
        })
      )
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [setDevices])

  // Monitor for new alerts
  useEffect(() => {
    const newAlerts: DeviceAlert[] = []

    devices.forEach(device => {
      // Check for offline devices
      if (device.status === 'offline' && settings.alertsEnabled) {
        const lastSeenDate =
          typeof device.lastSeen === 'string' ? new Date(device.lastSeen) : device.lastSeen
        const offlineMinutes = Math.floor((Date.now() - lastSeenDate.getTime()) / 60000)
        if (offlineMinutes >= settings.offlineThreshold) {
          const existingAlert = device.alerts.find(
            alert => alert.type === 'offline' && !alert.acknowledged
          )
          if (!existingAlert) {
            newAlerts.push({
              id: `offline-${device.id}-${Date.now()}`,
              type: 'offline',
              message: `${device.name} has been offline for ${offlineMinutes} minutes`,
              severity: offlineMinutes > 30 ? 'critical' : 'high',
              timestamp: new Date(),
              acknowledged: false,
            })
          }
        }
      }

      // Check for low battery
      if (
        device.batteryLevel !== undefined &&
        device.batteryLevel <= settings.batteryThreshold &&
        settings.alertsEnabled
      ) {
        const existingAlert = device.alerts.find(
          alert => alert.type === 'low-battery' && !alert.acknowledged
        )
        if (!existingAlert) {
          newAlerts.push({
            id: `battery-${device.id}-${Date.now()}`,
            type: 'low-battery',
            message: `${device.name} battery is low (${device.batteryLevel}%)`,
            severity: device.batteryLevel <= 10 ? 'critical' : 'high',
            timestamp: new Date(),
            acknowledged: false,
          })
        }
      }

      // Check for weak signal
      if (
        device.signalStrength !== undefined &&
        device.signalStrength <= settings.signalThreshold &&
        settings.alertsEnabled
      ) {
        const existingAlert = device.alerts.find(
          alert => alert.type === 'weak-signal' && !alert.acknowledged
        )
        if (!existingAlert) {
          newAlerts.push({
            id: `signal-${device.id}-${Date.now()}`,
            type: 'weak-signal',
            message: `${device.name} has weak signal (${device.signalStrength}%)`,
            severity: device.signalStrength <= 25 ? 'high' : 'medium',
            timestamp: new Date(),
            acknowledged: false,
          })
        }
      }
    })

    if (newAlerts.length > 0) {
      setDevices(currentDevices =>
        currentDevices.map(device => {
          const deviceAlerts = newAlerts.filter(alert => alert.message.includes(device.name))
          if (deviceAlerts.length > 0) {
            return {
              ...device,
              alerts: [...device.alerts, ...deviceAlerts],
            }
          }
          return device
        })
      )

      // Show toast notifications
      newAlerts.forEach(alert => {
        if (settings.soundAlerts) {
          toast.error(alert.message, {
            duration: 5000,
          })
        }
      })
    }

    // Update active alerts
    const allAlerts = devices.flatMap(device => device.alerts.filter(alert => !alert.acknowledged))
    setActiveAlerts(allAlerts)
  }, [devices, settings, setDevices])

  const acknowledgeAlert = (deviceId: string, alertId: string) => {
    setDevices(currentDevices =>
      currentDevices.map(device =>
        device.id === deviceId
          ? {
              ...device,
              alerts: device.alerts.map(alert =>
                alert.id === alertId ? { ...alert, acknowledged: true } : alert
              ),
            }
          : device
      )
    )
    toast.success('Alert acknowledged')
  }

  const toggleAlertsEnabled = (enabled: boolean) => {
    setSettings(currentSettings => ({
      ...currentSettings,
      alertsEnabled: enabled,
    }))
    toast.success(enabled ? 'Alerts enabled' : 'Alerts disabled')
  }

  const filteredDevices = devices.filter(device => {
    if (filter === 'all') return true
    return device.status === filter
  })

  const getTimeAgo = (date: Date | string | undefined) => {
    if (!date) return 'Unknown'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const minutes = Math.floor((Date.now() - dateObj.getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical').length
  const highAlerts = activeAlerts.filter(alert => alert.severity === 'high').length

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Device Monitor</h1>
            <p className="text-muted-foreground">Real-time device status and alerts</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={settings.alertsEnabled} onCheckedChange={toggleAlertsEnabled} />
            {settings.alertsEnabled ? (
              <BellIcon className="text-primary h-5 w-5" />
            ) : (
              <BellOffIcon className="text-muted-foreground h-5 w-5" />
            )}
          </div>
        </div>

        {/* Alert Summary */}
        {activeAlerts.length > 0 && (
          <Alert
            className={`mb-6 ${criticalAlerts > 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}
          >
            <AlertTriangleIcon
              className={`h-4 w-4 ${criticalAlerts > 0 ? 'text-red-600' : 'text-yellow-600'}`}
            />
            <AlertDescription className={criticalAlerts > 0 ? 'text-red-700' : 'text-yellow-700'}>
              {criticalAlerts > 0 ? (
                <>
                  You have {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} requiring
                  immediate attention
                </>
              ) : (
                <>
                  You have {highAlerts} high priority alert{highAlerts > 1 ? 's' : ''}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {(['all', 'online', 'offline', 'warning', 'error'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="whitespace-nowrap capitalize"
            >
              {status === 'all' ? 'All Devices' : status}
              {status !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {devices.filter(d => d.status === status).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="flex-1 px-6 pb-6">
        <div className="space-y-4">
          <AnimatePresence>
            {filteredDevices.map(device => {
              const IconComponent = deviceIcons[device.type]
              const unacknowledgedAlerts = device.alerts.filter(alert => !alert.acknowledged)

              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Card
                    className={`hover:bg-accent/5 transition-colors ${statusBgColors[device.status]}`}
                  >
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-background relative flex h-12 w-12 items-center justify-center rounded-full">
                            <IconComponent size={24} className={statusColors[device.status]} />
                            {device.status === 'online' && (
                              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-foreground font-semibold">{device.name}</h3>
                            <p className="text-muted-foreground text-sm">{device.room}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <IOS26StatusBadge
                                status={
                                  device.status === 'online'
                                    ? 'idle'
                                    : device.status === 'warning'
                                      ? 'alert'
                                      : 'offline'
                                }
                                label={device.status}
                                showPulse={
                                  device.status === 'online' || device.status === 'warning'
                                }
                              />
                              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                <ClockIcon className="h-3 w-3" />
                                {getTimeAgo(device.lastSeen)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {device.value !== undefined && (
                            <div className="text-foreground text-lg font-semibold">
                              {device.value}
                              {device.unit}
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            {device.batteryLevel !== undefined && (
                              <div className="flex items-center gap-1 text-xs">
                                {device.batteryLevel <= 20 ? (
                                  <BatteryWarningIcon className="h-3.5 w-3.5 text-red-500" />
                                ) : (
                                  <BatteryIcon className="h-3.5 w-3.5 text-green-500" />
                                )}
                                <span
                                  className={
                                    device.batteryLevel <= 20
                                      ? 'text-red-600'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  {device.batteryLevel}%
                                </span>
                              </div>
                            )}
                            {device.signalStrength !== undefined && (
                              <div className="flex items-center gap-1 text-xs">
                                {device.signalStrength > 0 ? (
                                  <WifiIcon
                                    className={`h-3.5 w-3.5 ${
                                      device.signalStrength > 50
                                        ? 'text-green-500'
                                        : 'text-yellow-500'
                                    }`}
                                  />
                                ) : (
                                  <WifiOffIcon className="h-3.5 w-3.5 text-red-500" />
                                )}
                                <span
                                  className={
                                    device.signalStrength <= 25
                                      ? 'text-red-600'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  {device.signalStrength}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Device Alerts */}
                      {unacknowledgedAlerts.length > 0 && (
                        <div className="space-y-2">
                          {unacknowledgedAlerts.map(alert => (
                            <motion.div
                              key={alert.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className={`rounded-lg border p-3 ${alertSeverityColors[alert.severity]}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{alert.message}</p>
                                  <p className="mt-1 text-xs opacity-75">
                                    {getTimeAgo(alert.timestamp)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => acknowledgeAlert(device.id, alert.id)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Acknowledge
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredDevices.length === 0 && (
            <IOS26EmptyState
              icon={<LineChartIcon className="h-16 w-16" />}
              title={filter === 'all' ? 'No Devices Monitored' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Devices`}
              message={
                filter === 'all'
                  ? 'Add devices to start monitoring their health, connectivity, and performance metrics in real-time.'
                  : `No devices currently have "${filter}" status. This is good news!`
              }
              action={
                filter === 'all'
                  ? {
                      label: 'Discover Devices',
                      onClick: () => toast.info('Go to Dashboard to discover devices'),
                    }
                  : {
                      label: 'View All Devices',
                      onClick: () => setFilter('all'),
                    }
              }
            />
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}
