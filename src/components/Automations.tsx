import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KV_KEYS, MOCK_AUTOMATIONS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { Automation } from '@/types'
import { CalendarBlank, Clock, FlowArrow, Gear, MapPin, Pencil, Play } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { FlowDesigner } from './FlowDesigner'
import { GeofenceBuilder } from './GeofenceBuilder'
import { ScheduleBuilder } from './ScheduleBuilder'

const automationIcons = {
  schedule: Clock,
  geofence: MapPin,
  condition: CalendarBlank,
  'device-state': FlowArrow,
} as const

export function Automations() {
  const [automations, setAutomations] = useKV<Automation[]>(KV_KEYS.AUTOMATIONS, MOCK_AUTOMATIONS)

  const [currentTab, setCurrentTab] = useKV('automations-tab', 'overview')

  const toggleAutomation = (automationId: string) => {
    setAutomations(currentAutomations =>
      currentAutomations.map(automation =>
        automation.id === automationId
          ? { ...automation, enabled: !automation.enabled }
          : automation
      )
    )
    toast.success('Automation updated')
  }

  const runAutomation = (automationId: string) => {
    const automation = automations.find(a => a.id === automationId)
    if (automation) {
      toast.success(`Running "${automation.name}"`)
    }
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date)
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Invalid date'
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex h-full flex-col">
        <div className="p-6 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">Automations</h1>
              <p className="text-muted-foreground">Smart rules for your home</p>
            </div>
          </div>

          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Gear size={16} />
              Overview
            </TabsTrigger>
            <TabsTrigger value="flows" className="flex items-center gap-2">
              <FlowArrow size={16} />
              Flows
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Clock size={16} />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="geofence" className="flex items-center gap-2">
              <MapPin size={16} />
              Geofencing
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="overview" className="m-0 h-full">
            <div className="px-6 pb-6">
              <div className="mb-6 grid grid-cols-3 gap-3">
                <Card className="bg-accent/10 border-accent/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-accent mb-1 text-2xl font-bold">
                      {automations.filter(a => a.enabled).length}
                    </div>
                    <div className="text-muted-foreground text-xs">Active</div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/10 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-primary mb-1 text-2xl font-bold">
                      {automations.filter(a => a.type === 'schedule').length}
                    </div>
                    <div className="text-muted-foreground text-xs">Scheduled</div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary border-border/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-foreground mb-1 text-2xl font-bold">
                      {automations.length}
                    </div>
                    <div className="text-muted-foreground text-xs">Total</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {automations.length === 0 ? (
                <Card className="border-border/30 border-2 border-dashed">
                  <CardContent className="p-8 text-center">
                    <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                      <Clock size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">No automations yet</p>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Create smart rules to automate your home devices
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentTab('flows')}>
                        Create Flow
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentTab('schedules')}
                      >
                        Create Schedule
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentTab('geofence')}>
                        Create Geofence
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {automations.map(automation => {
                    const IconComponent = automationIcons[automation.type]

                    return (
                      <motion.div
                        key={automation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <Card className="hover:bg-accent/5 transition-colors">
                          <CardContent className="p-4">
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex flex-1 items-start gap-3">
                                <div className="bg-secondary mt-0.5 flex h-10 w-10 items-center justify-center rounded-full">
                                  <IconComponent
                                    size={20}
                                    className={
                                      automation.enabled ? 'text-primary' : 'text-muted-foreground'
                                    }
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h3 className="mb-1 text-sm font-medium">{automation.name}</h3>
                                  <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">
                                    {automation.description}
                                  </p>

                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant={
                                        automation.type === 'schedule' ? 'default' : 'secondary'
                                      }
                                      className="h-5 text-xs capitalize"
                                    >
                                      {automation.type}
                                    </Badge>

                                    {automation.nextRun && (
                                      <span className="text-muted-foreground text-xs">
                                        Next: {formatTime(automation.nextRun)}
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
                                  onClick={() => runAutomation(automation.id)}
                                >
                                  <Play size={14} />
                                </Button>

                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Pencil size={14} />
                                </Button>

                                <Switch
                                  checked={automation.enabled}
                                  onCheckedChange={() => toggleAutomation(automation.id)}
                                />
                              </div>
                            </div>

                            {automation.lastRun && (
                              <div className="text-muted-foreground text-xs">
                                Last run: {formatTime(automation.lastRun)}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="flows" className="m-0 h-full">
            <FlowDesigner />
          </TabsContent>

          <TabsContent value="schedules" className="m-0 h-full">
            <ScheduleBuilder />
          </TabsContent>

          <TabsContent value="geofence" className="m-0 h-full">
            <GeofenceBuilder />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
