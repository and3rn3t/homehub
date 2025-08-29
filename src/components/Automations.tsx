import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Clock, 
  CalendarBlank, 
  MapPin, 
  Plus,
  Play,
  Pause,
  Pencil
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface Automation {
  id: string
  name: string
  description: string
  type: 'schedule' | 'geofence' | 'condition'
  enabled: boolean
  trigger: {
    type: string
    value: string
  }
  actions: Array<{
    deviceId: string
    action: string
    value?: any
  }>
  lastRun?: Date
  nextRun?: Date
}

const automationIcons = {
  schedule: Clock,
  geofence: MapPin,
  condition: CalendarBlank
}

export function Automations() {
  const [automations, setAutomations] = useKV<Automation[]>("automations", [])

  const toggleAutomation = (automationId: string) => {
    setAutomations(currentAutomations => 
      currentAutomations.map(automation => 
        automation.id === automationId 
          ? { ...automation, enabled: !automation.enabled }
          : automation
      )
    )
    toast.success("Automation updated")
  }

  const runAutomation = (automationId: string) => {
    const automation = automations.find(a => a.id === automationId)
    if (automation) {
      toast.success(`Running "${automation.name}"`)
    }
  }

  const formatTime = (date?: Date) => {
    if (!date) return ''
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automations</h1>
            <p className="text-muted-foreground">Smart rules for your home</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Plus size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {automations.filter(a => a.enabled).length}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {automations.filter(a => a.type === 'schedule').length}
              </div>
              <div className="text-xs text-muted-foreground">Scheduled</div>
            </CardContent>
          </Card>
          
          <Card className="bg-secondary border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {automations.length}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {automations.length === 0 ? (
          <Card className="border-dashed border-2 border-border/30">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Clock size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">No automations yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create smart rules to automate your home devices
              </p>
              <Button variant="outline" size="sm">
                Create Automation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => {
              const IconComponent = automationIcons[automation.type]
              
              return (
                <motion.div
                  key={automation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card className="hover:bg-accent/5 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mt-0.5">
                            <IconComponent 
                              size={20} 
                              className={automation.enabled ? "text-primary" : "text-muted-foreground"} 
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm mb-1">{automation.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {automation.description}
                            </p>
                            
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={automation.type === 'schedule' ? 'default' : 'secondary'}
                                className="h-5 text-xs capitalize"
                              >
                                {automation.type}
                              </Badge>
                              
                              {automation.nextRun && (
                                <span className="text-xs text-muted-foreground">
                                  Next: {formatTime(automation.nextRun)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => runAutomation(automation.id)}
                          >
                            <Play size={14} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                          >
                            <Pencil size={14} />
                          </Button>
                          
                          <Switch
                            checked={automation.enabled}
                            onCheckedChange={() => toggleAutomation(automation.id)}
                          />
                        </div>
                      </div>
                      
                      {automation.lastRun && (
                        <div className="text-xs text-muted-foreground">
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
    </div>
  )
}