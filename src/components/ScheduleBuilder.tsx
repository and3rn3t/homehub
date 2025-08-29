import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Clock, 
  Plus, 
  CalendarBlank,
  Sun,
  MoonStars,
  X,
  Check
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface ScheduleTrigger {
  id: string
  type: 'time' | 'sunrise' | 'sunset' | 'recurring'
  time?: string
  offset?: number // minutes offset for sunrise/sunset
  days?: string[] // for recurring schedules
  name: string
}

interface ScheduleAction {
  id: string
  deviceId: string
  deviceName: string
  action: string
  value: any
}

interface ScheduleRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  triggers: ScheduleTrigger[]
  actions: ScheduleAction[]
  conditions?: {
    onlyWhenHome?: boolean
    onlyWhenAway?: boolean
    weatherCondition?: string
  }
  createdAt: Date
  lastTriggered?: Date
  nextTrigger?: Date
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
]

const SAMPLE_DEVICES = [
  { id: 'living-room-lights', name: 'Living Room Lights', type: 'light' },
  { id: 'thermostat', name: 'Main Thermostat', type: 'climate' },
  { id: 'bedroom-lights', name: 'Bedroom Lights', type: 'light' },
  { id: 'kitchen-lights', name: 'Kitchen Lights', type: 'light' },
  { id: 'front-door-lock', name: 'Front Door Lock', type: 'lock' },
  { id: 'garage-door', name: 'Garage Door', type: 'cover' }
]

export function ScheduleBuilder() {
  const [schedules, setSchedules] = useKV<ScheduleRule[]>("schedule-rules", [])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRule | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'time',
    time: '07:00',
    offset: 0,
    selectedDays: [] as string[],
    deviceId: '',
    action: 'turn_on',
    value: true,
    onlyWhenHome: false,
    onlyWhenAway: false
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerType: 'time',
      time: '07:00',
      offset: 0,
      selectedDays: [],
      deviceId: '',
      action: 'turn_on',
      value: true,
      onlyWhenHome: false,
      onlyWhenAway: false
    })
  }

  const createSchedule = () => {
    if (!formData.name || !formData.deviceId) {
      toast.error("Please fill in all required fields")
      return
    }

    const selectedDevice = SAMPLE_DEVICES.find(d => d.id === formData.deviceId)
    if (!selectedDevice) return

    const newTrigger: ScheduleTrigger = {
      id: crypto.randomUUID(),
      type: formData.triggerType as any,
      name: formData.triggerType === 'time' ? `At ${formData.time}` : 
           formData.triggerType === 'sunrise' ? `${formData.offset} min after sunrise` :
           `${formData.offset} min after sunset`
    }

    if (formData.triggerType === 'time') {
      newTrigger.time = formData.time
    } else {
      newTrigger.offset = formData.offset
    }

    if (formData.selectedDays.length > 0) {
      newTrigger.days = formData.selectedDays
      newTrigger.type = 'recurring'
    }

    const newAction: ScheduleAction = {
      id: crypto.randomUUID(),
      deviceId: formData.deviceId,
      deviceName: selectedDevice.name,
      action: formData.action,
      value: formData.value
    }

    const newSchedule: ScheduleRule = {
      id: crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      enabled: true,
      triggers: [newTrigger],
      actions: [newAction],
      conditions: {
        onlyWhenHome: formData.onlyWhenHome,
        onlyWhenAway: formData.onlyWhenAway
      },
      createdAt: new Date(),
      nextTrigger: calculateNextTrigger(newTrigger)
    }

    setSchedules(current => [...current, newSchedule])
    setIsCreateDialogOpen(false)
    resetForm()
    toast.success("Schedule created successfully")
  }

  const calculateNextTrigger = (trigger: ScheduleTrigger): Date => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (trigger.type === 'time' && trigger.time) {
      const [hours, minutes] = trigger.time.split(':').map(Number)
      const nextRun = new Date(now)
      nextRun.setHours(hours, minutes, 0, 0)
      
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      
      return nextRun
    }
    
    return tomorrow
  }

  const toggleSchedule = (scheduleId: string) => {
    setSchedules(current => 
      current.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, enabled: !schedule.enabled }
          : schedule
      )
    )
    toast.success("Schedule updated")
  }

  const deleteSchedule = (scheduleId: string) => {
    setSchedules(current => current.filter(s => s.id !== scheduleId))
    toast.success("Schedule deleted")
  }

  const runScheduleNow = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (schedule) {
      setSchedules(current => 
        current.map(s => 
          s.id === scheduleId 
            ? { ...s, lastTriggered: new Date() }
            : s
        )
      )
      toast.success(`Running "${schedule.name}"`)
    }
  }

  const formatNextTrigger = (date?: Date) => {
    if (!date) return 'Not scheduled'
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 24) {
      return `${hours}h ${minutes}m`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schedule Builder</h1>
            <p className="text-muted-foreground">Create time-based automations</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus size={20} className="mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Schedule</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="schedule-name">Schedule Name</Label>
                  <Input
                    id="schedule-name"
                    placeholder="e.g., Morning Routine"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-desc">Description (optional)</Label>
                  <Input
                    id="schedule-desc"
                    placeholder="What does this schedule do?"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Trigger</Label>
                  <Select 
                    value={formData.triggerType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, triggerType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Specific Time</SelectItem>
                      <SelectItem value="sunrise">Sunrise</SelectItem>
                      <SelectItem value="sunset">Sunset</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.triggerType === 'time' && (
                    <div className="space-y-2">
                      <Label htmlFor="trigger-time">Time</Label>
                      <Input
                        id="trigger-time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  )}

                  {(formData.triggerType === 'sunrise' || formData.triggerType === 'sunset') && (
                    <div className="space-y-2">
                      <Label htmlFor="offset">Offset (minutes)</Label>
                      <Input
                        id="offset"
                        type="number"
                        placeholder="0"
                        value={formData.offset}
                        onChange={(e) => setFormData(prev => ({ ...prev, offset: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Positive for after {formData.triggerType}, negative for before
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Repeat on days (optional)</Label>
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map(day => (
                        <Button
                          key={day.value}
                          variant={formData.selectedDays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          className="w-12 h-8 p-0"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              selectedDays: prev.selectedDays.includes(day.value)
                                ? prev.selectedDays.filter(d => d !== day.value)
                                : [...prev.selectedDays, day.value]
                            }))
                          }}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Action</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="device-select">Device</Label>
                    <Select 
                      value={formData.deviceId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, deviceId: value }))}
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
                      value={formData.action}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, action: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turn_on">Turn On</SelectItem>
                        <SelectItem value="turn_off">Turn Off</SelectItem>
                        <SelectItem value="set_brightness">Set Brightness</SelectItem>
                        <SelectItem value="set_temperature">Set Temperature</SelectItem>
                        <SelectItem value="lock">Lock</SelectItem>
                        <SelectItem value="unlock">Unlock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Conditions (optional)</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="only-when-home"
                      checked={formData.onlyWhenHome}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, onlyWhenHome: checked }))}
                    />
                    <Label htmlFor="only-when-home" className="text-sm">Only when someone is home</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="only-when-away"
                      checked={formData.onlyWhenAway}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, onlyWhenAway: checked }))}
                    />
                    <Label htmlFor="only-when-away" className="text-sm">Only when everyone is away</Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={createSchedule} className="flex-1">
                    Create Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {schedules.filter(s => s.enabled).length}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {schedules.filter(s => s.nextTrigger && s.nextTrigger > new Date()).length}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          
          <Card className="bg-secondary border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {schedules.length}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {schedules.length === 0 ? (
          <Card className="border-dashed border-2 border-border/30">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Clock size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">No schedules created yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create time-based automations to control your devices
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create First Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="hover:bg-accent/5 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mt-0.5">
                          <Clock 
                            size={20} 
                            className={schedule.enabled ? "text-primary" : "text-muted-foreground"} 
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1">{schedule.name}</h3>
                          {schedule.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {schedule.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {schedule.triggers.map(trigger => (
                              <Badge key={trigger.id} variant="secondary" className="h-5 text-xs">
                                {trigger.name}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Next: {formatNextTrigger(schedule.nextTrigger)}</span>
                            {schedule.lastTriggered && (
                              <span>Last: {schedule.lastTriggered.toLocaleTimeString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => runScheduleNow(schedule.id)}
                        >
                          <Sun size={14} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-destructive hover:text-destructive"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <X size={14} />
                        </Button>
                        
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={() => toggleSchedule(schedule.id)}
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {schedule.actions.map(action => (
                        <div key={action.id}>
                          {action.action.replace('_', ' ')} {action.deviceName}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}