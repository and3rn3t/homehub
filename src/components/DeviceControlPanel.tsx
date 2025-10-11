import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@/hooks/use-kv'
import type { Device } from '@/types'
import { RefreshIcon, BatteryIcon, PaletteIcon, EditIcon, SunRoomIcon, ThermometerIcon, TrashIcon, WifiIcon, XIcon,  } from '@/lib/icons'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FavoriteButton } from './FavoriteButton'

interface DeviceControlPanelProps {
  device: Device
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (deviceId: string, updates: Partial<Device>) => void
  onDelete?: (deviceId: string) => void
}

export function DeviceControlPanel({
  device,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
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

  const handleBrightnessChange = async (value: number[]) => {
    const newBrightness = value[0] ?? brightness
    setBrightness(newBrightness)

    if (device.protocol === 'hue') {
      try {
        setIsUpdating(true)
        const { HueBridgeAdapter } = await import('@/services/devices/HueBridgeAdapter')
        const adapter = new HueBridgeAdapter({
          ip: '192.168.1.6',
          username: 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA',
          timeout: 5000,
        })

        const result = await adapter.setBrightness(device, newBrightness)

        if (result.success) {
          onUpdate(device.id, { value: newBrightness, ...result.newState })
          toast.success(`Brightness set to ${newBrightness}%`, {
            description: `Hue Bridge · ${result.duration}ms`,
          })
        } else {
          toast.error('Failed to set brightness', {
            description: result.error || 'Hue Bridge error',
          })
        }
      } catch (err) {
        console.error('Brightness control error:', err)
        toast.error('Error setting brightness', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleColorChange = async (hex: string) => {
    setColorHex(hex)

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
        console.error('Color control error:', err)
        toast.error('Error setting color', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleColorTempChange = async (value: number[]) => {
    const newTemp = value[0] ?? colorTemp
    setColorTemp(newTemp)

    if (device.protocol === 'hue' && hasColorTemp) {
      try {
        setIsUpdating(true)
        const { HueBridgeAdapter } = await import('@/services/devices/HueBridgeAdapter')
        const adapter = new HueBridgeAdapter({
          ip: '192.168.1.6',
          username: 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA',
          timeout: 5000,
        })

        const result = await adapter.setColorTemperature(device, newTemp)

        if (result.success) {
          onUpdate(device.id, result.newState ?? {})
          toast.success(`Color temperature set to ${newTemp}K`, {
            description: `Hue Bridge · ${result.duration}ms`,
          })
        } else {
          toast.error('Failed to set color temperature', {
            description: result.error || 'Hue Bridge error',
          })
        }
      } catch (err) {
        console.error('Color temperature control error:', err)
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
                    <X size={16} />
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
                    <Pencil size={14} />
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
                <Sun size={20} />
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun size={20} />
                    <Label className="text-base">Brightness</Label>
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">{brightness}%</span>
                </div>
                <Slider
                  value={[brightness]}
                  onValueChange={handleBrightnessChange}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!device.enabled || device.status === 'offline' || isUpdating}
                  className="cursor-pointer"
                />
              </motion.div>
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
                  <Palette size={20} />
                  <Label className="text-base">Color</Label>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={colorHex}
                      onChange={e => setColorHex(e.target.value.toUpperCase())}
                      onBlur={() => handleColorChange(colorHex)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleColorChange(colorHex)
                      }}
                      placeholder="#FFFFFF"
                      maxLength={7}
                      disabled={!device.enabled || device.status === 'offline' || isUpdating}
                      className="pr-12 font-mono"
                    />
                    <div
                      className="border-border absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded border-2"
                      style={{ backgroundColor: colorHex }}
                    />
                  </div>
                  <Input
                    type="color"
                    value={colorHex}
                    onChange={e => {
                      setColorHex(e.target.value.toUpperCase())
                      handleColorChange(e.target.value.toUpperCase())
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
                      onClick={() => {
                        setColorHex(color)
                        handleColorChange(color)
                      }}
                      disabled={!device.enabled || device.status === 'offline' || isUpdating}
                      className="hover:ring-primary ring-border h-8 w-8 rounded-full ring-2 transition-all hover:scale-110 hover:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Color Temperature Control */}
            {hasColorTemp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer size={20} />
                    <Label className="text-base">Color Temperature</Label>
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">{colorTemp}K</span>
                </div>
                <Slider
                  value={[colorTemp]}
                  onValueChange={handleColorTempChange}
                  min={2000}
                  max={6500}
                  step={100}
                  disabled={!device.enabled || device.status === 'offline' || isUpdating}
                  className="cursor-pointer"
                />
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>Warm (2000K)</span>
                  <span>Cool (6500K)</span>
                </div>
              </motion.div>
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
                    <BatteryFull size={16} />
                    <span className="text-muted-foreground text-sm">Battery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{device.batteryLevel}%</span>
                    <div className="bg-border h-2 w-16 rounded-full">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${device.batteryLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {device.signalStrength !== undefined && (
                <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <WifiHigh size={16} />
                    <span className="text-muted-foreground text-sm">Signal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{device.signalStrength}%</span>
                    <div className="bg-border h-2 w-16 rounded-full">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${device.signalStrength}%` }}
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Refresh device state
                  toast.info('Refreshing device state...')
                }}
              >
                <ArrowsClockwise size={16} className="mr-2" />
                Refresh State
              </Button>

              {onDelete && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDelete}
                >
                  <Trash size={16} className="mr-2" />
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
