import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useKV } from '@/hooks/use-kv'
import {
  Buildings,
  CircleDashed,
  House,
  MapPin,
  NavigationArrow,
  Plus,
  ShoppingBag,
  Target,
  X,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface GeofenceZone {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number // in meters
  type: 'home' | 'work' | 'school' | 'store' | 'custom'
  address?: string
}

interface GeofenceRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  zoneId: string
  zoneName: string
  triggerType: 'enter' | 'exit' | 'dwell'
  dwellTime?: number // minutes for dwell triggers
  actions: Array<{
    id: string
    deviceId: string
    deviceName: string
    action: string
    value: any
  }>
  conditions?: {
    timeRange?: { start: string; end: string }
    daysOfWeek?: string[]
    userIds?: string[] // specific family members
  }
  createdAt: string
  lastTriggered?: string
  triggerCount: number
}

const ZONE_TYPES = [
  { value: 'home', label: 'Home', icon: House },
  { value: 'work', label: 'Work', icon: Buildings },
  { value: 'school', label: 'School', icon: Buildings },
  { value: 'store', label: 'Store', icon: ShoppingBag },
  { value: 'custom', label: 'Custom', icon: MapPin },
]

const SAMPLE_DEVICES = [
  { id: 'living-room-lights', name: 'Living Room Lights', type: 'light' },
  { id: 'thermostat', name: 'Main Thermostat', type: 'climate' },
  { id: 'front-door-lock', name: 'Front Door Lock', type: 'lock' },
  { id: 'garage-door', name: 'Garage Door', type: 'cover' },
  { id: 'security-system', name: 'Security System', type: 'alarm' },
  { id: 'all-lights', name: 'All Lights', type: 'group' },
]

const FAMILY_MEMBERS = [
  { id: 'user-1', name: 'John', avatar: '👨' },
  { id: 'user-2', name: 'Sarah', avatar: '👩' },
  { id: 'user-3', name: 'Kids', avatar: '👶' },
]

export function GeofenceBuilder() {
  const [geofenceZones, setGeofenceZones] = useKV<GeofenceZone[]>('geofence-zones', [
    {
      id: 'home-zone',
      name: 'Home',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 100,
      type: 'home',
      address: '123 Main St, San Francisco, CA',
    },
  ])

  const [geofenceRules, setGeofenceRules] = useKV<GeofenceRule[]>('geofence-rules', [])
  const [isCreateZoneDialogOpen, setIsCreateZoneDialogOpen] = useState(false)
  const [isCreateRuleDialogOpen, setIsCreateRuleDialogOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Zone form state
  const [zoneForm, setZoneForm] = useState({
    name: '',
    type: 'home',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 100,
    address: '',
  })

  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    zoneId: '',
    triggerType: 'enter',
    dwellTime: 5,
    deviceId: '',
    action: 'turn_on',
    value: true,
    startTime: '00:00',
    endTime: '23:59',
    selectedDays: [] as string[],
    selectedUsers: [] as string[],
  })

  useEffect(() => {
    // Get user's current location for easier zone setup
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        error => {
          console.log('Location access denied:', error)
        }
      )
    }
  }, [])

  const resetZoneForm = () => {
    setZoneForm({
      name: '',
      type: 'home',
      latitude: currentLocation?.lat || 37.7749,
      longitude: currentLocation?.lng || -122.4194,
      radius: 100,
      address: '',
    })
  }

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      description: '',
      zoneId: '',
      triggerType: 'enter',
      dwellTime: 5,
      deviceId: '',
      action: 'turn_on',
      value: true,
      startTime: '00:00',
      endTime: '23:59',
      selectedDays: [],
      selectedUsers: [],
    })
  }

  const createZone = () => {
    if (!zoneForm.name) {
      toast.error('Please enter a zone name')
      return
    }

    const newZone: GeofenceZone = {
      id: crypto.randomUUID(),
      name: zoneForm.name,
      type: zoneForm.type as any,
      latitude: zoneForm.latitude,
      longitude: zoneForm.longitude,
      radius: zoneForm.radius,
      address: zoneForm.address,
    }

    setGeofenceZones(current => [...current, newZone])
    setIsCreateZoneDialogOpen(false)
    resetZoneForm()
    toast.success('Geofence zone created')
  }

  const createRule = () => {
    if (!ruleForm.name || !ruleForm.zoneId || !ruleForm.deviceId) {
      toast.error('Please fill in all required fields')
      return
    }

    const selectedZone = geofenceZones.find(z => z.id === ruleForm.zoneId)
    const selectedDevice = SAMPLE_DEVICES.find(d => d.id === ruleForm.deviceId)

    if (!selectedZone || !selectedDevice) return

    const newRule: GeofenceRule = {
      id: crypto.randomUUID(),
      name: ruleForm.name,
      description: ruleForm.description,
      enabled: true,
      zoneId: ruleForm.zoneId,
      zoneName: selectedZone.name,
      triggerType: ruleForm.triggerType as any,
      dwellTime: ruleForm.triggerType === 'dwell' ? ruleForm.dwellTime : undefined,
      actions: [
        {
          id: crypto.randomUUID(),
          deviceId: ruleForm.deviceId,
          deviceName: selectedDevice.name,
          action: ruleForm.action,
          value: ruleForm.value,
        },
      ],
      conditions: {
        timeRange: { start: ruleForm.startTime, end: ruleForm.endTime },
        daysOfWeek: ruleForm.selectedDays.length > 0 ? ruleForm.selectedDays : undefined,
        userIds: ruleForm.selectedUsers.length > 0 ? ruleForm.selectedUsers : undefined,
      },
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    }

    setGeofenceRules(current => [...current, newRule])
    setIsCreateRuleDialogOpen(false)
    resetRuleForm()
    toast.success('Geofence rule created')
  }

  const toggleRule = (ruleId: string) => {
    setGeofenceRules(current =>
      current.map(rule => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
    )
    toast.success('Rule updated')
  }

  const deleteRule = (ruleId: string) => {
    setGeofenceRules(current => current.filter(r => r.id !== ruleId))
    toast.success('Rule deleted')
  }

  const deleteZone = (zoneId: string) => {
    // Check if any rules use this zone
    const rulesUsingZone = geofenceRules.filter(r => r.zoneId === zoneId)
    if (rulesUsingZone.length > 0) {
      toast.error("Cannot delete zone - it's being used by geofence rules")
      return
    }

    setGeofenceZones(current => current.filter(z => z.id !== zoneId))
    toast.success('Zone deleted')
  }

  const testRule = (ruleId: string) => {
    const rule = geofenceRules.find(r => r.id === ruleId)
    if (rule) {
      setGeofenceRules(current =>
        current.map(r =>
          r.id === ruleId
            ? { ...r, lastTriggered: new Date().toISOString(), triggerCount: r.triggerCount + 1 }
            : r
        )
      )
      toast.success(`Testing "${rule.name}" - ${rule.triggerType} ${rule.zoneName}`)
    }
  }

  const useCurrentLocation = () => {
    if (currentLocation) {
      setZoneForm(prev => ({
        ...prev,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      }))
      toast.success('Using current location')
    } else {
      toast.error('Location not available')
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'enter':
        return Target
      case 'exit':
        return Navigation
      case 'dwell':
        return CircleDashed
      default:
        return MapPin
    }
  }

  const formatTriggerText = (rule: GeofenceRule) => {
    const baseText = `${rule.triggerType} ${rule.zoneName}`
    if (rule.triggerType === 'dwell' && rule.dwellTime) {
      return `${baseText} (${rule.dwellTime}min)`
    }
    return baseText
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Geofencing</h1>
            <p className="text-muted-foreground">Location-based automations</p>
          </div>

          <div className="flex gap-2">
            <Dialog open={isCreateZoneDialogOpen} onOpenChange={setIsCreateZoneDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus size={16} className="mr-2" />
                  Zone
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Geofence Zone</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone-name">Zone Name</Label>
                    <Input
                      id="zone-name"
                      placeholder="e.g., Home, Work, School"
                      value={zoneForm.name}
                      onChange={e => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Zone Type</Label>
                    <Select
                      value={zoneForm.type}
                      onValueChange={value => setZoneForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={zoneForm.latitude}
                        onChange={e =>
                          setZoneForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={zoneForm.longitude}
                        onChange={e =>
                          setZoneForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={useCurrentLocation}
                    disabled={!currentLocation}
                    className="w-full"
                  >
                    <NavigationArrow size={16} className="mr-2" />
                    Use Current Location
                  </Button>

                  <div className="space-y-2">
                    <Label htmlFor="radius">Radius: {zoneForm.radius}m</Label>
                    <Slider
                      value={[zoneForm.radius]}
                      onValueChange={([value]) => setZoneForm(prev => ({ ...prev, radius: value }))}
                      max={1000}
                      min={25}
                      step={25}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address (optional)</Label>
                    <Input
                      id="address"
                      placeholder="Street address for reference"
                      value={zoneForm.address}
                      onChange={e => setZoneForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateZoneDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={createZone} className="flex-1">
                      Create Zone
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateRuleDialogOpen} onOpenChange={setIsCreateRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full">
                  <Plus size={20} className="mr-2" />
                  Rule
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Geofence Rule</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      placeholder="e.g., Arrive Home, Leave Work"
                      value={ruleForm.name}
                      onChange={e => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-desc">Description (optional)</Label>
                    <Input
                      id="rule-desc"
                      placeholder="What does this rule do?"
                      value={ruleForm.description}
                      onChange={e =>
                        setRuleForm(prev => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Trigger</Label>

                    <div className="space-y-2">
                      <Label htmlFor="zone-select">Zone</Label>
                      <Select
                        value={ruleForm.zoneId}
                        onValueChange={value => setRuleForm(prev => ({ ...prev, zoneId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {geofenceZones.map(zone => (
                            <SelectItem key={zone.id} value={zone.id}>
                              {zone.name} ({zone.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trigger-type">Trigger Type</Label>
                      <Select
                        value={ruleForm.triggerType}
                        onValueChange={value =>
                          setRuleForm(prev => ({ ...prev, triggerType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enter">Enter Zone</SelectItem>
                          <SelectItem value="exit">Exit Zone</SelectItem>
                          <SelectItem value="dwell">Stay in Zone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {ruleForm.triggerType === 'dwell' && (
                      <div className="space-y-2">
                        <Label htmlFor="dwell-time">Dwell Time (minutes)</Label>
                        <Input
                          id="dwell-time"
                          type="number"
                          min="1"
                          value={ruleForm.dwellTime}
                          onChange={e =>
                            setRuleForm(prev => ({
                              ...prev,
                              dwellTime: parseInt(e.target.value) || 5,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Action</Label>

                    <div className="space-y-2">
                      <Label htmlFor="device-select">Device</Label>
                      <Select
                        value={ruleForm.deviceId}
                        onValueChange={value => setRuleForm(prev => ({ ...prev, deviceId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_DEVICES.map(device => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="action-select">Action</Label>
                      <Select
                        value={ruleForm.action}
                        onValueChange={value => setRuleForm(prev => ({ ...prev, action: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="turn_on">Turn On</SelectItem>
                          <SelectItem value="turn_off">Turn Off</SelectItem>
                          <SelectItem value="arm">Arm</SelectItem>
                          <SelectItem value="disarm">Disarm</SelectItem>
                          <SelectItem value="lock">Lock</SelectItem>
                          <SelectItem value="unlock">Unlock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Conditions (optional)</Label>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Start Time</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={ruleForm.startTime}
                          onChange={e =>
                            setRuleForm(prev => ({ ...prev, startTime: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">End Time</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={ruleForm.endTime}
                          onChange={e =>
                            setRuleForm(prev => ({ ...prev, endTime: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Family Members (leave empty for all)</Label>
                      <div className="flex flex-wrap gap-2">
                        {FAMILY_MEMBERS.map(member => (
                          <Button
                            key={member.id}
                            variant={
                              ruleForm.selectedUsers.includes(member.id) ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              setRuleForm(prev => ({
                                ...prev,
                                selectedUsers: prev.selectedUsers.includes(member.id)
                                  ? prev.selectedUsers.filter(id => id !== member.id)
                                  : [...prev.selectedUsers, member.id],
                              }))
                            }}
                          >
                            <span className="mr-2">{member.avatar}</span>
                            {member.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateRuleDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={createRule} className="flex-1">
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="text-accent mb-1 text-2xl font-bold">{geofenceZones.length}</div>
              <div className="text-muted-foreground text-xs">Zones</div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-primary mb-1 text-2xl font-bold">
                {geofenceRules.filter(r => r.enabled).length}
              </div>
              <div className="text-muted-foreground text-xs">Active Rules</div>
            </CardContent>
          </Card>

          <Card className="bg-secondary border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-foreground mb-1 text-2xl font-bold">
                {geofenceRules.reduce((sum, rule) => sum + rule.triggerCount, 0)}
              </div>
              <div className="text-muted-foreground text-xs">Total Triggers</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-6">
          {/* Zones Section */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Geofence Zones</h2>
            {geofenceZones.length === 0 ? (
              <Card className="border-border/30 border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <MapPin size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">No zones created yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateZoneDialogOpen(true)}
                  >
                    Create First Zone
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {geofenceZones.map(zone => {
                  const ZoneIcon = ZONE_TYPES.find(t => t.value === zone.type)?.icon || MapPin
                  return (
                    <Card key={zone.id} className="hover:bg-accent/5 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-1 items-start gap-3">
                            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
                              <ZoneIcon size={20} className="text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="mb-1 text-sm font-medium">{zone.name}</h3>
                              <p className="text-muted-foreground mb-2 text-xs capitalize">
                                {zone.type} • {zone.radius}m radius
                              </p>
                              {zone.address && (
                                <p className="text-muted-foreground text-xs">{zone.address}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            onClick={() => deleteZone(zone.id)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Rules Section */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Geofence Rules</h2>
            {geofenceRules.length === 0 ? (
              <Card className="border-border/30 border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <Target size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">No rules created yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateRuleDialogOpen(true)}
                    disabled={geofenceZones.length === 0}
                  >
                    Create First Rule
                  </Button>
                  {geofenceZones.length === 0 && (
                    <p className="text-muted-foreground mt-2 text-xs">Create a zone first</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {geofenceRules.map(rule => {
                  const TriggerIcon = getTriggerIcon(rule.triggerType)
                  return (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <Card className="hover:bg-accent/5 transition-colors">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex flex-1 items-start gap-3">
                              <div className="bg-secondary mt-0.5 flex h-10 w-10 items-center justify-center rounded-full">
                                <TriggerIcon
                                  size={20}
                                  className={
                                    rule.enabled ? 'text-primary' : 'text-muted-foreground'
                                  }
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <h3 className="mb-1 text-sm font-medium">{rule.name}</h3>
                                {rule.description && (
                                  <p className="text-muted-foreground mb-2 text-xs">
                                    {rule.description}
                                  </p>
                                )}

                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary" className="h-5 text-xs">
                                    {formatTriggerText(rule)}
                                  </Badge>
                                  <Badge variant="outline" className="h-5 text-xs">
                                    {rule.actions[0]?.action.replace('_', ' ')}{' '}
                                    {rule.actions[0]?.deviceName}
                                  </Badge>
                                </div>

                                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                                  <span>Triggered {rule.triggerCount} times</span>
                                  {rule.lastTriggered && (
                                    <span>
                                      Last:{' '}
                                      {(() => {
                                        try {
                                          return new Date(rule.lastTriggered).toLocaleTimeString()
                                        } catch {
                                          return 'Invalid date'
                                        }
                                      })()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="ml-3 flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => testRule(rule.id)}
                              >
                                <Target size={14} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive h-8 w-8"
                                onClick={() => deleteRule(rule.id)}
                              >
                                <X size={14} />
                              </Button>

                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={() => toggleRule(rule.id)}
                              />
                            </div>
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
      </div>
    </div>
  )
}
