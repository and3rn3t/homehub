import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ControlTile } from '@/components/ui/control-tile'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { DeviceCardSkeleton, StatusCardSkeleton } from '@/components/ui/skeleton'
import { KV_KEYS } from '@/constants'
import { useHaptic } from '@/hooks/use-haptic'
import { useKV } from '@/hooks/use-kv'
import { useMQTTConnection } from '@/hooks/use-mqtt-connection'
import { useMQTTDevices } from '@/hooks/use-mqtt-devices'
import {
  ActivityIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  HouseIcon,
  LightbulbIcon,
  LockIcon,
  MoonIcon,
  PlayIcon,
  PlusIcon,
  RefreshIcon,
  ShieldIcon,
  SofaIcon,
  SunRoomIcon,
  ThermometerIcon,
  TreeIcon,
  UsersIcon,
  UtensilsIcon,
  WifiIcon,
  WifiOffIcon,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { DeviceRegistry } from '@/services/device'
import { HTTPDeviceAdapter } from '@/services/device/HTTPDeviceAdapter'
import type { Device, DeviceAlert, Room, Scene } from '@/types'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DeviceCardEnhanced } from './DeviceCardEnhanced'
import { DeviceControlPanel } from './DeviceControlPanel'
import { DeviceDiscovery } from './DeviceDiscovery'
import { DeviceEditDialog } from './DeviceEditDialog'
import { NotificationBell } from './NotificationCenter'
import { ThemeToggle } from './ThemeToggle'

export function Dashboard() {
  // Initialize multi-protocol device registry (singleton)
  const deviceRegistry = useMemo(() => DeviceRegistry.getInstance(), [])

  // Discovery dialog state
  const [discoveryOpen, setDiscoveryOpen] = useState(false)

  // Device control panel state
  const [controlPanelOpen, setControlPanelOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  // Device edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editDevice, setEditDevice] = useState<Device | null>(null)

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
  const [scenes] = useKV<Scene[]>(KV_KEYS.SCENES, [])
  const [rooms] = useKV<Room[]>(KV_KEYS.ROOMS, [])
  const haptic = useHaptic()

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    haptic.medium() // Haptic feedback on refresh

    try {
      // Reconnect MQTT if needed
      if (connectionState !== 'connected') {
        await reconnectMQTT()
      }

      // Discover new devices
      await discoverDevices()

      toast.success('Dashboard refreshed', {
        description: 'Devices and connections updated',
      })
    } catch (error) {
      console.error('Refresh error:', error)
      toast.error('Refresh failed', {
        description: 'Could not update dashboard',
      })
    }
  }, [connectionState, reconnectMQTT, discoverDevices, haptic])

  // Helper to get icon component for device type
  const getDeviceIcon = (device: Device) => {
    switch (device.type) {
      case 'light':
        return LightbulbIcon
      case 'thermostat':
        return ThermometerIcon
      case 'security':
        return LockIcon
      case 'sensor':
        return ShieldIcon
      default:
        return HouseIcon
    }
  }

  // Helper to get tint color for device type
  const getDeviceTint = (device: Device): string => {
    switch (device.type) {
      case 'light':
        return 'yellow'
      case 'thermostat':
        return 'orange'
      case 'security':
        return 'red'
      case 'sensor':
        return 'blue'
      default:
        return 'primary'
    }
  }

  const quickScenesData = [
    { id: 'good-morning', name: 'Good Morning', icon: 'sun' },
    { id: 'good-night', name: 'Good Night', icon: 'moon' },
    { id: 'home', name: "I'm Home", icon: 'home' },
    { id: 'away', name: 'Away', icon: 'shield' },
  ]

  const sceneIcons = {
    sun: SunRoomIcon,
    moon: MoonIcon,
    home: HouseIcon,
    shield: ShieldIcon,
    play: PlayIcon,
    coffee: SofaIcon,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceRegistry]) // Only re-run if deviceRegistry changes (stable)

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

  // Smart loading state: Only show skeletons on initial load with no data
  // After first load, use optimistic updates for instant feedback
  const showSkeleton = isLoading && devices.length === 0

  // Show skeleton state (initial load only)
  if (showSkeleton) {
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
                <PlusIcon className="h-5 w-5" />
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
                <PlusIcon className="h-5 w-5" />
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
    <div className="bg-background flex h-full flex-col">
      {/* Header */}
      <div className="p-4 pb-0 sm:p-6 sm:pb-0">
        <div className="mb-4 flex items-center justify-between">
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
                    <WifiIcon className="mr-1 h-3.5 w-3.5" />
                    MQTT
                  </Badge>
                ) : connectionState === 'reconnecting' ? (
                  <Badge
                    variant="outline"
                    className="border-yellow-200 bg-yellow-50 text-yellow-700"
                  >
                    <RefreshIcon className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Reconnecting
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
                    <WifiOffIcon className="mr-1 h-3.5 w-3.5" />
                    Reconnect
                  </Button>
                ) : null}
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setDiscoveryOpen(true)}
              >
                <PlusIcon className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Alert Summary */}
        {isLoading && devices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-3"
          >
            <div className="border-primary/20 bg-primary/5 flex items-center gap-2 rounded-lg border px-3 py-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
              >
                <div className="border-primary h-4 w-4 rounded-full border-2 border-t-transparent" />
              </motion.div>
              <span className="text-muted-foreground text-sm">Refreshing data...</span>
            </div>
          </motion.div>
        )}

        {(criticalAlerts.length > 0 ||
          offlineDevices.length > 0 ||
          lowBatteryDevices.length > 0) && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="flex items-center justify-between">
                <div className="text-sm">
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
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Sectioned Content - iOS Home Style - Wrapped with Pull-to-Refresh */}
      <PullToRefresh onRefresh={handleRefresh} className="flex-1 px-4 pb-6 sm:px-6">
        {/* Section 1: Status Summary */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
            >
              <Card variant="glass" className="border-green-200/50 bg-green-50/50">
                <CardContent className="p-3 text-center">
                  <CheckCircleIcon className="mx-auto mb-1 h-5 w-5 text-green-600" />
                  <div className="text-lg font-semibold text-green-800 tabular-nums">
                    {devices.filter(d => d.status === 'online').length}
                  </div>
                  <div className="text-xs text-green-700">Online</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 0.8,
                delay: 0.05,
              }}
            >
              <Card variant="glass" className="border-red-200/50 bg-red-50/50">
                <CardContent className="p-3 text-center">
                  <AlertTriangleIcon className="mx-auto mb-1 h-5 w-5 text-red-600" />
                  <div className="text-lg font-semibold text-red-800 tabular-nums">
                    {offlineDevices.length}
                  </div>
                  <div className="text-xs text-red-700">Offline</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 0.8,
                delay: 0.1,
              }}
            >
              <Card variant="glass" className="border-blue-200/50 bg-blue-50/50">
                <CardContent className="p-3 text-center">
                  <ActivityIcon className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                  <div className="text-lg font-semibold text-blue-800 tabular-nums">
                    {activeAlerts.length}
                  </div>
                  <div className="text-xs text-blue-700">Alerts</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Section 2: Quick Controls (Control Tiles) */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold sm:text-lg">Quick Controls</h2>
            <Button variant="ghost" size="sm" className="text-primary h-auto py-1 text-sm">
              <span>See All</span>
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {favoriteDeviceList.slice(0, 4).map((device, index) => (
              <ControlTile
                key={device.id}
                device={device}
                icon={getDeviceIcon(device)}
                onTap={toggleDevice}
                onLongPress={handleDeviceCardClick}
                tint={getDeviceTint(device)}
                size="medium"
              />
            ))}
          </div>
        </div>

        {/* Section 3: Scenes (Horizontal Scroll) */}
        {scenes.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Scenes</h2>
              <Button variant="ghost" size="sm" className="text-primary h-auto py-1 text-sm">
                <span>See All</span>
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
              {scenes.slice(0, 6).map((scene, index) => {
                const IconComponent = sceneIcons[scene.icon as keyof typeof sceneIcons] || HouseIcon
                return (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8,
                      delay: index * 0.05,
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0"
                  >
                    <Card
                      variant="glass"
                      role="button"
                      tabIndex={0}
                      className="hover:bg-accent/5 w-[140px] cursor-pointer transition-all duration-200 hover:shadow-md"
                      onClick={() => activateScene(scene.name)}
                    >
                      <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                          <IconComponent className="text-primary h-6 w-6" />
                        </div>
                        <span className="line-clamp-2 text-sm font-medium">{scene.name}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section 4: Favorite Devices (Full Cards) */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold sm:text-lg">Favorite Devices</h2>
            <div className="flex items-center gap-2">
              {mqttConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary h-auto py-1 text-sm"
                  onClick={() => {
                    toast.promise(discoverDevices(), {
                      loading: 'Discovering devices...',
                      success: 'Device discovery complete',
                      error: 'Failed to discover devices',
                    })
                  }}
                >
                  <RefreshIcon className="mr-1 h-4 w-4" />
                  Discover
                </Button>
              )}
            </div>
          </div>

          {favoriteDeviceList.length === 0 ? (
            <EmptyState
              type="favorites"
              onAction={() => {
                // Scroll to devices section or open device browser
                toast.info('Browse your devices below to add favorites')
              }}
            />
          ) : (
            <div className="grid gap-3">
              {favoriteDeviceList.map((device, index) => (
                <DeviceCardEnhanced
                  key={device.id}
                  device={device}
                  index={index}
                  onDeviceClick={handleDeviceCardClick}
                  onToggle={toggleDevice}
                  onEdit={device => {
                    setEditDevice(device)
                    setEditDialogOpen(true)
                  }}
                  onDelete={deviceId => {
                    handleDeviceDelete(deviceId)
                    toast.success('Device removed')
                  }}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Rooms (Compact List) */}
        {rooms.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Rooms</h2>
              <Button variant="ghost" size="sm" className="text-primary h-auto py-1 text-sm">
                <span>See All</span>
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rooms.slice(0, 6).map((room, index) => {
                const roomDevices = devices.filter(d => room.deviceIds?.includes(d.id))
                const activeCount = roomDevices.filter(
                  d => d.enabled && d.status === 'online'
                ).length

                // Icon mapping for room types (PascalCase from data)
                const iconMap: Record<string, typeof UsersIcon> = {
                  UtensilsIcon: UtensilsIcon,
                  UsersIcon: UsersIcon,
                  House: HouseIcon,
                  BriefcaseIcon: BriefcaseIcon,
                  TreeIcon: TreeIcon,
                  HouseIcon: HouseIcon,
                  SunRoomIcon: SunRoomIcon,
                }
                const RoomIcon = iconMap[room.icon || ''] || HouseIcon

                // Room-specific color tinting (if room has a color defined)
                const roomColorClass = room.color
                  ? `bg-${room.color}-50/30 border-${room.color}-200/50`
                  : ''

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8,
                      delay: index * 0.05,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      variant="glass"
                      className={cn(
                        'cursor-pointer transition-all duration-200 hover:shadow-md',
                        roomColorClass
                      )}
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                            room.color ? `bg-${room.color}-500/20` : 'bg-primary/10'
                          )}
                        >
                          <RoomIcon
                            size={20}
                            className={room.color ? `text-${room.color}-600` : 'text-primary'}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{room.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {activeCount > 0 ? `${activeCount} active` : 'All off'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </PullToRefresh>

      {/* Device Control Panel Dialog */}
      {selectedDevice && (
        <DeviceControlPanel
          device={selectedDevice}
          open={controlPanelOpen}
          onOpenChange={setControlPanelOpen}
          onUpdate={handleDeviceUpdate}
          onDelete={handleDeviceDelete}
          onEdit={() => {
            setEditDevice(selectedDevice)
            setEditDialogOpen(true)
          }}
        />
      )}

      {/* Device Edit Dialog */}
      <DeviceEditDialog
        device={editDevice}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onDeviceUpdated={device => {
          setKvDevices(prev => prev.map(d => (d.id === device.id ? device : d)))
          toast.success('Device updated')
        }}
        onDeviceRemoved={deviceId => {
          setKvDevices(prev => prev.filter(d => d.id !== deviceId))
        }}
      />

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
    </div>
  )
}
