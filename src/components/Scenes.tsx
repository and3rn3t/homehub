import { useKV } from '@/hooks/use-kv'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Sun, 
  Moon, 
  Home as HomeIcon, 
  Shield, 
  Coffee,
  Bed,
  Plus,
  Play
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface Scene {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  devices: Array<{
    deviceId: string
    action: string
    value?: any
  }>
  actions: Array<{
    deviceId: string
    action: string
    value?: any
  }>
  isActive?: boolean
}

const sceneConfigs = {
  'good-morning': {
    icon: 'sun',
    color: 'bg-gradient-to-br from-orange-400 to-yellow-400',
    description: 'Turn on lights, adjust temperature'
  },
  'good-night': {
    icon: 'moon',
    color: 'bg-gradient-to-br from-purple-500 to-blue-600',
    description: 'Dim lights, lock doors, set alarm'
  },
  'home': {
    icon: 'home',
    color: 'bg-gradient-to-br from-green-400 to-blue-500',
    description: 'Welcome home setup'
  },
  'away': {
    icon: 'shield',
    color: 'bg-gradient-to-br from-red-400 to-pink-500',
    description: 'Security mode, lights off'
  },
  'movie-time': {
    icon: 'play',
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    description: 'Dim lights, close blinds'
  },
  'morning-coffee': {
    icon: 'coffee',
    color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    description: 'Kitchen lights, coffee maker'
  },
  'bedtime': {
    icon: 'bed',
    color: 'bg-gradient-to-br from-slate-500 to-gray-600',
    description: 'Night lights, temperature down'
  }
}

const sceneIcons = {
  sun: Sun,
  moon: Moon,
  home: HomeIcon,
  shield: Shield,
  play: Play,
  coffee: Coffee,
  bed: Bed
}

export function Scenes() {
  const [scenes, setScenes] = useKV<Scene[]>("scenes", [
    {
      id: "good-morning",
      name: "Good Morning",
      isActive: false,
      devices: ["living-room-light", "thermostat-main"],
      actions: [
        { deviceId: "living-room-light", action: "turn_on", value: 100 },
        { deviceId: "thermostat-main", action: "set_temperature", value: 72 }
      ]
    },
    {
      id: "good-night", 
      name: "Good Night",
      isActive: false,
      devices: ["living-room-light", "front-door-lock"],
      actions: [
        { deviceId: "living-room-light", action: "turn_off", value: 0 },
        { deviceId: "front-door-lock", action: "lock", value: true }
      ]
    },
    {
      id: "movie-time",
      name: "Movie Time", 
      isActive: false,
      devices: ["living-room-light"],
      actions: [
        { deviceId: "living-room-light", action: "dim", value: 20 }
      ]
    }
  ])
  const [activeScene, setActiveScene] = useKV<string | null>("active-scene", null)

  const activateScene = (sceneId: string) => {
    setActiveScene(sceneId)
    setScenes(currentScenes => 
      currentScenes.map(scene => ({
        ...scene,
        isActive: scene.id === sceneId
      }))
    )
    
    const scene = scenes.find(s => s.id === sceneId)
    toast.success(`${scene?.name || 'Scene'} activated`)
    
    setTimeout(() => {
      setActiveScene(null)
      setScenes(currentScenes => 
        currentScenes.map(scene => ({
          ...scene,
          isActive: false
        }))
      )
    }, 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Scenes</h1>
            <p className="text-muted-foreground">One-touch home control</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Plus size={20} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {scenes.length === 0 ? (
          <div className="space-y-6">
            <Card className="border-dashed border-2 border-border/30">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No scenes created</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create scenes to control multiple devices at once
                </p>
                <Button variant="outline" size="sm">
                  Create Scene
                </Button>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-lg font-semibold mb-4">Popular Scenes</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(sceneConfigs).map(([id, config]) => {
                  const IconComponent = sceneIcons[config.icon as keyof typeof sceneIcons]
                  return (
                    <motion.div
                      key={id}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden">
                        <CardContent className="p-0">
                          <div className={`${config.color} p-4 text-white relative overflow-hidden`}>
                            <div className="absolute top-2 right-2 opacity-20">
                              <IconComponent size={32} weight="fill" />
                            </div>
                            <div className="relative z-10">
                              <IconComponent size={24} weight="fill" className="mb-2" />
                              <h4 className="font-semibold text-sm capitalize">
                                {id.replace('-', ' ')}
                              </h4>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-muted-foreground">
                              {config.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {scenes.map((scene) => {
              const config = sceneConfigs[scene.id as keyof typeof sceneConfigs]
              const iconName = scene.icon || config?.icon || 'sun'
              const IconComponent = sceneIcons[iconName as keyof typeof sceneIcons]
              const bgColor = config?.color || 'bg-gradient-to-br from-blue-400 to-purple-500'
              
              return (
                <motion.div
                  key={scene.id}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 overflow-hidden ${
                      scene.isActive 
                        ? 'ring-2 ring-primary shadow-lg' 
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => activateScene(scene.id)}
                  >
                    <CardContent className="p-0">
                      <div className={`${bgColor} p-6 text-white relative overflow-hidden`}>
                        <div className="absolute top-2 right-2 opacity-20">
                          <IconComponent size={40} weight="fill" />
                        </div>
                        <div className="relative z-10">
                          <IconComponent size={28} weight="fill" className="mb-3" />
                          <h4 className="font-semibold text-lg mb-1">
                            {scene.name}
                          </h4>
                        </div>
                        
                        {scene.isActive && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute top-3 left-3 w-3 h-3 bg-white rounded-full"
                          />
                        )}
                      </div>
                      
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          {scene.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {scene.devices.length} devices
                          </span>
                          {scene.isActive && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-primary font-medium"
                            >
                              Active
                            </motion.div>
                          )}
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
  )
}