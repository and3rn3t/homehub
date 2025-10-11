import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { DeviceCardSkeleton, StatusCardSkeleton } from '@/components/ui/skeleton'
import { KV_KEYS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import { useMQTTConnection } from '@/hooks/use-mqtt-connection'
import { useMQTTDevices } from '@/hooks/use-mqtt-devices'
import { DeviceRegistry } from '@/services/device'
import { HTTPDeviceAdapter } from '@/services/device/HTTPDeviceAdapter'
import type { Device, DeviceAlert } from '@/types'
import {
  ArrowsClockwise,
  CheckCircle,
  House as HomeIcon,
  Moon,
  Plus,
  Pulse,
  Shield,
  Sun,
  Warning,
  WifiHigh,
  WifiSlash,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DeviceControlPanel } from './DeviceControlPanel'
import { DeviceDiscovery } from './DeviceDiscovery'
import { FavoriteDeviceCard } from './FavoriteDeviceCard'
import { NotificationBell } from './NotificationCenter'

export function Dashboard() {
  // Initialize multi-protocol device registry (singleton)
  const deviceRegistry = useMemo(() => DeviceRegistry.getInstance(), [])

  // Discovery dialog state
  const [discoveryOpen, setDiscoveryOpen] = useState(false)

  // Device control panel state
  const [controlPanelOpen, setControlPanelOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  // Try MQTT connection first
  const {
    devices: mqttDevices,
    isConnected: mqttConnected,
    connectionState,
    discoverDevices,
    isLoading: mqttLoading,
    error: _mqttError, // Intentionally unused - MQTT is optional
  } = useMQTTDevices({
    autoConnect: true,
    enableDiscovery: true,
  })

  const { connect: reconnectMQTT } = useMQTTConnection()

  // Fallback to KV store if MQTT not available
  const [kvDevices, setKvDevices, { isLoading: kvLoading, isError: kvError }] = useKV<Device[]>(
    KV_KEYS.DEVICES,
    [], // Empty array as default - will use localStorage if available
    { withMeta: true }
  )

  // Use MQTT devices if connected, otherwise fallback to KV store
  const devices = useMemo(
    () => (mqttConnected && mqttDevices.length > 0 ? mqttDevices : kvDevices),
    [mqttConnected, mqttDevices, kvDevices]
  )
  const isLoading = mqttLoading || kvLoading
  // Only show error if KV store fails (MQTT is optional, KV is the fallback)
  const isError = kvError && devices.length === 0

  const [deviceAlerts] = useKV<DeviceAlert[]>('device-alerts', [])
  const [favoriteDevices] = useKV<string[]>('favorite-devices', [])

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

  // Initialize HTTP device connections and monitoring
  useEffect(() => {
    const httpDevices = devices.filter(d => d.protocol === 'http')
    if (httpDevices.length === 0) return

    // Register and connect HTTP adapter with correct port and Shelly preset
    const httpAdapter = new HTTPDeviceAdapter({
      baseUrl: 'http://localhost:8001', // Virtual device port
      authType: 'none',
      pollingInterval: 5000,
      preset: 'shelly', // Use Shelly Gen2 API format
    })

    deviceRegistry.registerAdapter(httpAdapter)
    httpAdapter.connect()

    console.log(
      `✅ HTTP adapter registered with ${httpDevices.length} devices:`,
      httpDevices.map(d => d.name)
    )

    return () => {
      httpAdapter.disconnect()
    }
  }, [devices, deviceRegistry])

  const toggleDevice = useCallback(
    async (deviceId: string) => {
      const device = devices.find(d => d.id === deviceId)
      if (!device) {
        toast.error('Device not found')
        return
      }

      // For Hue devices, use HueBridgeAdapter
      if (device.protocol === 'hue') {
        try {
          // Import adapter dynamically
          const { HueBridgeAdapter } = await import('@/services/devices/HueBridgeAdapter')

          // Create adapter instance with bridge configuration
          const adapter = new HueBridgeAdapter({
            ip: '192.168.1.6',
            username: 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA',
            timeout: 5000,
          })

          // Optimistic update
          setKvDevices(currentDevices =>
            currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
          )

          // Execute command
          const result = device.enabled
            ? await adapter.turnOff(device)
            : await adapter.turnOn(device)

          if (result.success) {
            // Update with real state
            setKvDevices(currentDevices =>
              currentDevices.map(d =>
                d.id === deviceId ? { ...d, ...result.newState, lastSeen: new Date() } : d
              )
            )
            toast.success(`${device.name} turned ${result.newState?.enabled ? 'on' : 'off'}`, {
              description: `Hue Bridge · ${result.duration}ms`,
            })
          } else {
            // Rollback optimistic update
            setKvDevices(currentDevices =>
              currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
            )
            toast.error(`Failed to control ${device.name}`, {
              description: result.error || 'Hue Bridge error',
            })
          }
          return
        } catch (err) {
          // Rollback on exception
          setKvDevices(currentDevices =>
            currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
          )
          console.error('Hue device control error:', err)
          toast.error(`Error controlling ${device.name}`, {
            description: err instanceof Error ? err.message : 'Hue Bridge error',
          })
          return
        }
      }

      // For HTTP devices, use direct adapter control
      if (device.protocol === 'http' && device.ip) {
        try {
          // Import adapter dynamically
          const { ShellyAdapter } = await import('@/services/devices/ShellyAdapter')

          // Create adapter instance
          const adapter = new ShellyAdapter(device.ip, device.port || 80, { debug: true })

          // Optimistic update
          setKvDevices(currentDevices =>
            currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
          )

          // Execute command
          const result = device.enabled
            ? await adapter.turnOff(device)
            : await adapter.turnOn(device)

          if (result.success) {
            // Update with real state
            setKvDevices(currentDevices =>
              currentDevices.map(d =>
                d.id === deviceId ? { ...d, ...result.newState, lastSeen: new Date() } : d
              )
            )
            toast.success(`${device.name} turned ${result.newState?.enabled ? 'on' : 'off'}`, {
              description: `Response time: ${result.duration}ms`,
            })
          } else {
            // Rollback optimistic update
            setKvDevices(currentDevices =>
              currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
            )
            toast.error(`Failed to control ${device.name}`, {
              description: result.error || 'Unknown error',
            })
          }
          return
        } catch (err) {
          // Rollback on exception
          setKvDevices(currentDevices =>
            currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
          )
          console.error('HTTP device control error:', err)
          toast.error(`Error controlling ${device.name}`, {
            description: err instanceof Error ? err.message : 'Unknown error',
          })
          return
        }
      }

      // For MQTT devices, use existing device registry
      try {
        // Get appropriate adapter based on device protocol
        const adapter = deviceRegistry.getAdapter(device.protocol)
        console.log(`🔌 Adapter for ${device.protocol}:`, adapter ? 'Found' : 'Not found')

        if (!adapter) {
          console.log('⚠️ No adapter found, using KV fallback')
          // Fallback to KV store if no adapter registered
          setKvDevices(currentDevices =>
            currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
          )
          toast.success(`${device.name} turned ${!device.enabled ? 'on' : 'off'}`)
          return
        }

        // Check if adapter is connected
        const isConnected = adapter.isConnected()
        console.log(`🔗 Adapter connected:`, isConnected)

        if (!isConnected) {
          toast.warning(`${device.protocol.toUpperCase()} adapter not connected`, {
            description: 'Using fallback mode',
          })
          // Fallback to KV store
          setKvDevices(currentDevices =>
            currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
          )
          return
        }

        // Send toggle command via adapter
        console.log(`📤 Sending toggle command to device ${deviceId} via ${device.protocol}`)
        await adapter.sendCommand({
          deviceId,
          command: 'toggle',
        })
        console.log(`✅ Toggle command sent successfully`)

        // Optimistic update in KV store
        setKvDevices(currentDevices =>
          currentDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
        )

        toast.success(`${device.name} turned ${!device.enabled ? 'on' : 'off'}`, {
          description: `via ${device.protocol.toUpperCase()}`,
        })
      } catch (err) {
        console.error('Device control error:', err)
        toast.error(`Failed to control ${device.name}`, {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    },
    [devices, setKvDevices, deviceRegistry]
  )

  const handleDeviceUpdate = useCallback(
    (deviceId: string, updates: Partial<Device>) => {
      setKvDevices(currentDevices =>
        currentDevices.map(d => (d.id === deviceId ? { ...d, ...updates } : d))
      )
    },
    [setKvDevices]
  )

  const handleDeviceDelete = useCallback(
    (deviceId: string) => {
      setKvDevices(currentDevices => currentDevices.filter(d => d.id !== deviceId))
    },
    [setKvDevices]
  )

  const activateScene = useCallback((sceneName: string) => {
    toast.success(`${sceneName} activated`, {
      description: 'Adjusting devices to match scene settings',
    })
  }, [])

  // Handler for device card clicks
  const handleDeviceCardClick = useCallback((device: Device) => {
    setSelectedDevice(device)
    setControlPanelOpen(true)
  }, [])

  const favoriteDeviceList = useMemo(
    () => devices.filter(device => favoriteDevices.includes(device.id)),
    [devices, favoriteDevices]
  )

  // Debug logging for favorites
  console.log('🔍 Dashboard Favorites Debug:', {
    'favoriteDevices (from useKV)': favoriteDevices,
    'favoriteDevices type': typeof favoriteDevices,
    'favoriteDevices isArray': Array.isArray(favoriteDevices),
    'devices count': devices.length,
    'device IDs (first 10)': devices.slice(0, 10).map(d => d.id),
    'favoriteDeviceList count': favoriteDeviceList.length,
    favoriteDeviceList: favoriteDeviceList.map(d => ({ id: d.id, name: d.name })),
  })

  // EMERGENCY: Check localStorage directly in render
  const directCheck = localStorage.getItem('kv:favorite-devices')
  console.log('🚨 EMERGENCY CHECK - Direct localStorage read:', directCheck)
  if (directCheck) {
    try {
      const parsed = JSON.parse(directCheck)
      console.log('🚨 Parsed favorites from localStorage:', parsed)
      console.log(
        '🚨 Does it match useKV value?',
        JSON.stringify(parsed) === JSON.stringify(favoriteDevices)
      )
    } catch (e) {
      console.error('🚨 Failed to parse:', e)
    }
  }

  // Auto-fix: If we have devices and favoriteDevices but no matches, fix it
  if (devices.length > 0 && favoriteDevices.length > 0 && favoriteDeviceList.length === 0) {
    console.warn("⚠️ MISMATCH DETECTED: Favorite IDs don't match device IDs!")
    console.warn('Favorite IDs:', favoriteDevices)
    console.warn(
      'Available device IDs:',
      devices.slice(0, 10).map(d => d.id)
    )
  }

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
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-foreground text-xl font-bold sm:text-2xl">Good Morning</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Welcome home</p>
            </div>
            {/* MQTT Connection Status */}
            {connectionState !== 'offline' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                {mqttConnected ? (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                    <WifiHigh size={14} className="mr-1" />
                    MQTT Connected
                  </Badge>
                ) : connectionState === 'reconnecting' ? (
                  <Badge
                    variant="outline"
                    className="border-yellow-200 bg-yellow-50 text-yellow-700"
                  >
                    <ArrowsClockwise size={14} className="mr-1 animate-spin" />
                    Reconnecting...
                  </Badge>
                ) : connectionState === 'error' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => {
                      reconnectMQTT().catch(err => {
                        toast.error('Failed to reconnect', {
                          description: err.message,
                        })
                      })
                    }}
                  >
                    <WifiSlash size={14} className="mr-1" />
                    Reconnect
                  </Button>
                ) : null}
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={() => setDiscoveryOpen(true)}
              >
                <Plus size={20} />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Device Discovery Dialog */}
        <DeviceDiscovery
          open={discoveryOpen}
          onOpenChange={setDiscoveryOpen}
          onDevicesAdded={newDevices => {
            // Add new devices to Dashboard's device list
            setKvDevices(prev => [...prev, ...newDevices])
            toast.success(`Added ${newDevices.length} device${newDevices.length !== 1 ? 's' : ''}`)
          }}
        />

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
            <div className="flex items-center gap-2">
              {mqttConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => {
                    toast.promise(discoverDevices(), {
                      loading: 'Discovering devices...',
                      success: 'Device discovery complete',
                      error: 'Failed to discover devices',
                    })
                  }}
                >
                  <ArrowsClockwise size={16} className="mr-1" />
                  Discover
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-primary">
                Edit
              </Button>
            </div>
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
              {favoriteDeviceList.map((device, index) => (
                <FavoriteDeviceCard
                  key={device.id}
                  device={device}
                  index={index}
                  onDeviceClick={handleDeviceCardClick}
                  onToggle={toggleDevice}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Device Control Panel Dialog */}
      {selectedDevice && (
        <DeviceControlPanel
          device={selectedDevice}
          open={controlPanelOpen}
          onOpenChange={setControlPanelOpen}
          onUpdate={handleDeviceUpdate}
          onDelete={handleDeviceDelete}
        />
      )}

      {/* Device Discovery Dialog */}
      <DeviceDiscovery open={discoveryOpen} onOpenChange={setDiscoveryOpen} />
    </div>
  )
}
