import { Badge } from '@/components/ui/badge'
import { BrightnessSlider } from '@/components/ui/brightness-slider'
import { Button } from '@/components/ui/button'
import { ColorTemperatureSlider } from '@/components/ui/color-temperature-slider'
import { ColorWheelPicker } from '@/components/ui/color-wheel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@/hooks/use-kv'
import {
  BatteryIcon,
  EditIcon,
  PowerIcon,
  RefreshIcon,
  TrashIcon,
  WifiIcon,
  XIcon,
} from '@/lib/icons'
import { logger } from '@/lib/logger'
import type { Device } from '@/types'
import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FavoriteButton } from './FavoriteButton'

interface DeviceControlPanelProps {
  readonly device: Device
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onUpdate: (deviceId: string, updates: Partial<Device>) => void
  readonly onDelete?: (deviceId: string) => void
  readonly onEdit?: () => void
}

export function DeviceControlPanel({
  device,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onEdit,
}: DeviceControlPanelProps) {
  const [brightness, setBrightness] = useState(device.value || 100)
  const [colorHex, setColorHex] = useState('#FFFFFF')
  const [colorTemp, setColorTemp] = useState(3000)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deviceName, setDeviceName] = useState(device.name)
  const [isRenaming, setIsRenaming] = useState(false)
  const [favoriteDevices] = useKV<string[]>('favorite-devices', [])

  // Sync state when device changes
  useEffect(() => {
    setBrightness(device.value || 100)
    setDeviceName(device.name)
  }, [device])

  // Capability checks
  const hasBrightness = device.capabilities?.includes('dimming') ?? false
  const hasColor = device.capabilities?.includes('color') ?? false
  const hasColorTemp = device.capabilities?.includes('color-temp') ?? false

  const handleBrightnessChange = (value: number) => {
    // Update local state immediately for smooth UI
    setBrightness(value)
  }

  const handleBrightnessCommit = async (value: number) => {
    if (device.protocol === 'hue') {
      try {
        setIsUpdating(true)
        const { HueBridgeAdapter } = await import('@/services/devices/HueBridgeAdapter')
        const adapter = new HueBridgeAdapter({
          ip: '192.168.1.6',
          username: 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA',
          timeout: 5000,
        })

        const result = await adapter.setBrightness(device, value)

        if (result.success) {
          onUpdate(device.id, { value: value, ...result.newState })
          toast.success(`Brightness set to ${value}%`, {
            description: `Hue Bridge · ${result.duration}ms`,
          })
        } else {
          toast.error('Failed to set brightness', {
            description: result.error || 'Hue Bridge error',
          })
        }
      } catch (err) {
        logger.error('Brightness control error', {
          error: err,
          deviceId: device.id,
          brightness: value,
        })
        toast.error('Error setting brightness', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleColorChange = (hex: string) => {
    // Update local state immediately for smooth UI
    setColorHex(hex)
  }

  const handleColorCommit = async (hex: string) => {
    // Only update if valid hex color
    if (!/^#[0-9A-F]{6}$/i.test(hex)) return

    if (device.protocol === 'hue' && hasColor) {
      try {
        setIsUpdating(true)
        const { HueBridgeAdapter } = await import('@/services/devices/HueBridgeAdapter')
        const adapter = new HueBridgeAdapter({
          ip: '192.168.1.6',
          username: 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA',
          timeout: 5000,
        })

        const result = await adapter.setColor(device, hex)

        if (result.success) {
          onUpdate(device.id, result.newState ?? {})
          toast.success(`Color set to ${hex}`, {
            description: `Hue Bridge · ${result.duration}ms`,
          })
        } else {
          toast.error('Failed to set color', {
            description: result.error || 'Hue Bridge error',
          })
        }
      } catch (err) {
        logger.error('Color control error', {
          error: err,
          deviceId: device.id,
          color: hex,
        })
        toast.error('Error setting color', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleColorTempChange = (value: number) => {
    // Update local state immediately for smooth UI
    setColorTemp(value)
  }

  const handleColorTempCommit = async (value: number) => {
    if (device.protocol === 'hue' && hasColorTemp) {
      try {
        setIsUpdating(true)
        const { HueBridgeAdapter } = await import('@/services/devices/HueBridgeAdapter')
        const adapter = new HueBridgeAdapter({
          ip: '192.168.1.6',
          username: 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA',
          timeout: 5000,
        })

        const result = await adapter.setColorTemperature(device, value)

        if (result.success) {
          onUpdate(device.id, result.newState ?? {})
          toast.success(`Color temperature set to ${value}K`, {
            description: `Hue Bridge · ${result.duration}ms`,
          })
        } else {
          toast.error('Failed to set color temperature', {
            description: result.error || 'Hue Bridge error',
          })
        }
      } catch (err) {
        logger.error('Color temperature control error', {
          error: err,
          deviceId: device.id,
          colorTemp: value,
        })
        toast.error('Error setting color temperature', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleRename = () => {
    if (deviceName.trim() === '') {
      toast.error('Device name cannot be empty')
      return
    }
    onUpdate(device.id, { name: deviceName })
    toast.success(`Renamed to "${deviceName}"`)
    setIsRenaming(false)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(device.id)
      onOpenChange(false)
      toast.success(`${device.name} removed`)
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={deviceName}
                    onChange={e => setDeviceName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename()
                      if (e.key === 'Escape') {
                        setIsRenaming(false)
                        setDeviceName(device.name)
                      }
                    }}
                    autoFocus
                    className="text-lg font-semibold"
                  />
                  <Button size="sm" onClick={handleRename}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsRenaming(false)
                      setDeviceName(device.name)
                    }}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">{device.name}</DialogTitle>
                  <FavoriteButton
                    deviceId={device.id}
                    deviceName={device.name}
                    isFavorite={favoriteDevices.includes(device.id)}
                    size={18}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setIsRenaming(true)}
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <DialogDescription className="mt-1 flex items-center gap-2">
                <span>{device.room}</span>
                <Badge
                  variant={
                    device.status === 'online'
                      ? 'default'
                      : device.status === 'warning'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="h-5 text-xs"
                >
                  {device.status}
                </Badge>
                {device.protocol && (
                  <Badge variant="outline" className="h-5 text-xs capitalize">
                    {device.protocol}
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="controls" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="space-y-6 pt-4">
            {/* Power Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PowerIcon className="h-5 w-5" />
                <Label htmlFor="power-toggle" className="text-base">
                  Power
                </Label>
              </div>
              <Switch
                id="power-toggle"
                checked={device.enabled}
                onCheckedChange={checked => onUpdate(device.id, { enabled: checked })}
                disabled={device.status === 'offline'}
              />
            </div>

            {/* Brightness Control */}
            {hasBrightness && (
              <BrightnessSlider
                value={brightness}
                onChange={handleBrightnessChange}
                onValueCommit={handleBrightnessCommit}
                isUpdating={isUpdating}
                disabled={!device.enabled || device.status === 'offline'}
              />
            )}

            {/* Color Control */}
            {hasColor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  <Label className="text-base">Color</Label>
                </div>

                {/* Color Selection Tabs */}
                <Tabs defaultValue="wheel" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wheel">Color Wheel</TabsTrigger>
                    <TabsTrigger value="picker">Hex Input</TabsTrigger>
                  </TabsList>

                  <TabsContent value="wheel" className="mt-4">
                    <ColorWheelPicker
                      value={colorHex}
                      onChange={handleColorChange}
                      onValueCommit={handleColorCommit}
                      disabled={!device.enabled || device.status === 'offline'}
                    />
                  </TabsContent>

                  <TabsContent value="picker" className="mt-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          value={colorHex}
                          onChange={e => {
                            const newValue = e.target.value.toUpperCase()
                            handleColorChange(newValue)
                          }}
                          onBlur={() => handleColorCommit(colorHex)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleColorCommit(colorHex)
                          }}
                          placeholder="#FFFFFF"
                          maxLength={7}
                          disabled={!device.enabled || device.status === 'offline' || isUpdating}
                          className="pr-12 font-mono"
                        />
                        <div
                          className="border-border absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded border-2"
                          style={{ backgroundColor: colorHex }}
                          aria-label="Current color preview"
                        />
                      </div>
                      <Input
                        type="color"
                        value={colorHex}
                        onChange={e => {
                          const newValue = e.target.value.toUpperCase()
                          handleColorChange(newValue)
                          handleColorCommit(newValue)
                        }}
                        disabled={!device.enabled || device.status === 'offline' || isUpdating}
                        className="h-10 w-16 cursor-pointer p-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[
                        '#FF0000',
                        '#FF8800',
                        '#FFFF00',
                        '#00FF00',
                        '#0088FF',
                        '#4400FF',
                        '#FF00FF',
                      ].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            handleColorChange(color)
                            handleColorCommit(color)
                          }}
                          disabled={!device.enabled || device.status === 'offline' || isUpdating}
                          className="ring-border hover:ring-primary h-8 w-8 rounded-full ring-2 transition-all hover:scale-110 hover:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100"
                          style={{ backgroundColor: color }}
                          title={color}
                          aria-label={`Set color to ${color}`}
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {/* Color Temperature Control */}
            {hasColorTemp && (
              <ColorTemperatureSlider
                value={colorTemp}
                onChange={handleColorTempChange}
                onValueCommit={handleColorTempCommit}
                isUpdating={isUpdating}
                disabled={!device.enabled || device.status === 'offline'}
              />
            )}

            {/* No capabilities message */}
            {!hasBrightness && !hasColor && !hasColorTemp && (
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-sm">
                  This device only supports on/off control
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4 pt-4">
            {/* Device Information */}
            <div className="space-y-3">
              <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                <span className="text-muted-foreground text-sm">Device ID</span>
                <span className="font-mono text-sm">{device.id}</span>
              </div>

              <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                <span className="text-muted-foreground text-sm">Type</span>
                <span className="text-sm capitalize">{device.type}</span>
              </div>

              {device.lastSeen && (
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <span className="text-muted-foreground text-sm">Last Seen</span>
                  <span className="text-sm">{getTimeAgo(device.lastSeen)}</span>
                </div>
              )}

              {device.batteryLevel !== undefined && (
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <BatteryIcon className="h-4 w-4" />
                    <span className="text-muted-foreground text-sm">Battery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{device.batteryLevel}%</span>
                    <div className="bg-border h-2 w-16 rounded-full">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${device.batteryLevel}%` }}
                        aria-label={`Battery level: ${device.batteryLevel}%`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {device.signalStrength !== undefined && (
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <WifiIcon className="h-4 w-4" />
                    <span className="text-muted-foreground text-sm">Signal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{device.signalStrength}%</span>
                    <div className="bg-border h-2 w-16 rounded-full">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${device.signalStrength}%` }}
                        aria-label={`Signal strength: ${device.signalStrength}%`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {device.metadata && (
                <>
                  {device.metadata.modelId && (
                    <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                      <span className="text-muted-foreground text-sm">Model</span>
                      <span className="text-sm">{device.metadata.modelId}</span>
                    </div>
                  )}

                  {device.metadata.manufacturer && (
                    <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                      <span className="text-muted-foreground text-sm">Manufacturer</span>
                      <span className="text-sm">{device.metadata.manufacturer}</span>
                    </div>
                  )}

                  {device.metadata.firmwareVersion && (
                    <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                      <span className="text-muted-foreground text-sm">Firmware</span>
                      <span className="text-sm">{device.metadata.firmwareVersion}</span>
                    </div>
                  )}
                </>
              )}

              {device.capabilities && device.capabilities.length > 0 && (
                <div className="bg-secondary/50 space-y-2 rounded-lg p-3">
                  <span className="text-muted-foreground text-sm">Capabilities</span>
                  <div className="flex flex-wrap gap-2">
                    {device.capabilities.map(cap => (
                      <Badge key={cap} variant="outline" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              {onEdit && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    onEdit()
                    onOpenChange(false) // Close control panel when opening edit
                  }}
                >
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit Device
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Refresh device state
                  toast.info('Refreshing device state...')
                }}
              >
                <RefreshIcon className="mr-2 h-4 w-4" />
                Refresh State
              </Button>

              {onDelete && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDelete}
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Remove Device
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
