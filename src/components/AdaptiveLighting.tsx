import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { 
  Sun, 
  Moon,
  Lightbulb,
  Clock,
  Info
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface AdaptiveLightingSettings {
  enabled: boolean
  autoTransition: boolean
  wakeUpTime: string
  sleepTime: string
  morningColorTemp: number
  dayColorTemp: number
  eveningColorTemp: number
  nightColorTemp: number
  transitionDuration: number
  affectedLights: string[]
}

interface LightDevice {
  id: string
  name: string
  room: string
  supportsColorTemp: boolean
  enabled: boolean
}

const SAMPLE_LIGHTS: LightDevice[] = [
  { id: "living-room-1", name: "Living Room Main", room: "Living Room", supportsColorTemp: true, enabled: true },
  { id: "living-room-2", name: "Living Room Accent", room: "Living Room", supportsColorTemp: true, enabled: true },
  { id: "bedroom-1", name: "Bedroom Ceiling", room: "Bedroom", supportsColorTemp: true, enabled: true },
  { id: "kitchen-1", name: "Kitchen Overhead", room: "Kitchen", supportsColorTemp: true, enabled: false },
  { id: "bathroom-1", name: "Bathroom Mirror", room: "Bathroom", supportsColorTemp: false, enabled: false },
]

export function AdaptiveLighting() {
  const [settings, setSettings] = useKV<AdaptiveLightingSettings>("adaptive-lighting", {
    enabled: true,
    autoTransition: true,
    wakeUpTime: "07:00",
    sleepTime: "22:00",
    morningColorTemp: 4000,
    dayColorTemp: 5500,
    eveningColorTemp: 3500,
    nightColorTemp: 2700,
    transitionDuration: 30,
    affectedLights: ["living-room-1", "living-room-2", "bedroom-1"]
  })

  const [lights, setLights] = useState<LightDevice[]>(SAMPLE_LIGHTS)

  const toggleLight = (lightId: string) => {
    setLights(lights.map(light => 
      light.id === lightId ? { ...light, enabled: !light.enabled } : light
    ))
    
    setSettings({
      ...settings,
      affectedLights: lights
        .filter(l => l.id === lightId ? !l.enabled : l.enabled)
        .map(l => l.id)
    })
  }

  const getCurrentPhase = () => {
    const now = new Date()
    const hour = now.getHours()
    
    if (hour >= 5 && hour < 9) return { phase: "Morning", icon: Sun, color: "text-orange-500" }
    if (hour >= 9 && hour < 17) return { phase: "Day", icon: Sun, color: "text-yellow-500" }
    if (hour >= 17 && hour < 21) return { phase: "Evening", icon: Sun, color: "text-orange-600" }
    return { phase: "Night", icon: Moon, color: "text-blue-500" }
  }

  const currentPhase = getCurrentPhase()
  const PhaseIcon = currentPhase.icon

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Adaptive Lighting</h1>
            <p className="text-muted-foreground">Circadian rhythm lighting automation</p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => {
              setSettings({ ...settings, enabled })
              toast.success(enabled ? "Adaptive lighting enabled" : "Adaptive lighting disabled")
            }}
          />
        </div>

        {/* Current Phase Indicator */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-secondary flex items-center justify-center`}>
                  <PhaseIcon size={24} className={currentPhase.color} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Current Phase: {currentPhase.phase}</h3>
                  <p className="text-sm text-muted-foreground">
                    Lights automatically adjust to support your natural rhythm
                  </p>
                </div>
              </div>
              <Badge variant="default" className="h-6">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock size={20} />
                Schedule Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Automatic Transitions</p>
                  <p className="text-xs text-muted-foreground">Smoothly adjust color temperature throughout the day</p>
                </div>
                <Switch
                  checked={settings.autoTransition}
                  onCheckedChange={(autoTransition) => setSettings({ ...settings, autoTransition })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Wake Up Time</label>
                  <input
                    type="time"
                    value={settings.wakeUpTime}
                    onChange={(e) => setSettings({ ...settings, wakeUpTime: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sleep Time</label>
                  <input
                    type="time"
                    value={settings.sleepTime}
                    onChange={(e) => setSettings({ ...settings, sleepTime: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Transition Duration (minutes)</label>
                <Slider
                  value={[settings.transitionDuration]}
                  onValueChange={([value]) => setSettings({ ...settings, transitionDuration: value })}
                  min={10}
                  max={60}
                  step={5}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground text-right">{settings.transitionDuration} minutes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sun size={20} />
                Color Temperature Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-2">
                <Info size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Lower temperatures (2700K) are warmer and better for evening/night. 
                  Higher temperatures (5500K+) are cooler and better for daytime alertness.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Morning (5AM - 9AM)</label>
                    <Badge variant="outline">{settings.morningColorTemp}K</Badge>
                  </div>
                  <Slider
                    value={[settings.morningColorTemp]}
                    onValueChange={([value]) => setSettings({ ...settings, morningColorTemp: value })}
                    min={2700}
                    max={6500}
                    step={100}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Day (9AM - 5PM)</label>
                    <Badge variant="outline">{settings.dayColorTemp}K</Badge>
                  </div>
                  <Slider
                    value={[settings.dayColorTemp]}
                    onValueChange={([value]) => setSettings({ ...settings, dayColorTemp: value })}
                    min={2700}
                    max={6500}
                    step={100}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Evening (5PM - 9PM)</label>
                    <Badge variant="outline">{settings.eveningColorTemp}K</Badge>
                  </div>
                  <Slider
                    value={[settings.eveningColorTemp]}
                    onValueChange={([value]) => setSettings({ ...settings, eveningColorTemp: value })}
                    min={2700}
                    max={6500}
                    step={100}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Night (9PM - 5AM)</label>
                    <Badge variant="outline">{settings.nightColorTemp}K</Badge>
                  </div>
                  <Slider
                    value={[settings.nightColorTemp]}
                    onValueChange={([value]) => setSettings({ ...settings, nightColorTemp: value })}
                    min={2700}
                    max={6500}
                    step={100}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb size={20} />
                Affected Lights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lights.map((light) => (
                <motion.div
                  key={light.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">{light.name}</p>
                    <p className="text-xs text-muted-foreground">{light.room}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!light.supportsColorTemp && (
                      <Badge variant="secondary" className="h-5 text-xs">
                        Not supported
                      </Badge>
                    )}
                    <Switch
                      checked={light.enabled}
                      onCheckedChange={() => toggleLight(light.id)}
                      disabled={!light.supportsColorTemp}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
