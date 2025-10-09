import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { KV_KEYS, MOCK_SCENES } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { Scene } from '@/types'
import {
  Bed,
  Coffee,
  House as HomeIcon,
  Moon,
  Play,
  Plus,
  Shield,
  Sun,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const sceneConfigs = {
  'good-morning': {
    icon: 'sun',
    color: 'bg-gradient-to-br from-orange-400 to-yellow-400',
    description: 'Turn on lights, adjust temperature',
  },
  'good-night': {
    icon: 'moon',
    color: 'bg-gradient-to-br from-purple-500 to-blue-600',
    description: 'Dim lights, lock doors, set alarm',
  },
  home: {
    icon: 'home',
    color: 'bg-gradient-to-br from-green-400 to-blue-500',
    description: 'Welcome home setup',
  },
  away: {
    icon: 'shield',
    color: 'bg-gradient-to-br from-red-400 to-pink-500',
    description: 'Security mode, lights off',
  },
  'movie-time': {
    icon: 'play',
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    description: 'Dim lights, close blinds',
  },
  'morning-coffee': {
    icon: 'coffee',
    color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    description: 'Kitchen lights, coffee maker',
  },
  bedtime: {
    icon: 'bed',
    color: 'bg-gradient-to-br from-slate-500 to-gray-600',
    description: 'Night lights, temperature down',
  },
}

const sceneIcons = {
  sun: Sun,
  moon: Moon,
  home: HomeIcon,
  shield: Shield,
  play: Play,
  coffee: Coffee,
  bed: Bed,
}

export function Scenes() {
  const [scenes, _setScenes] = useKV<Scene[]>(KV_KEYS.SCENES, MOCK_SCENES)
  const [activeScene, setActiveScene] = useKV<string | null>(KV_KEYS.ACTIVE_SCENE, null)

  const activateScene = (sceneId: string) => {
    setActiveScene(sceneId)

    const scene = scenes.find(s => s.id === sceneId)
    toast.success(`${scene?.name || 'Scene'} activated`)

    setTimeout(() => {
      setActiveScene(null)
    }, 2000)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Scenes</h1>
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
            <Card className="border-border/30 border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No scenes created</p>
                <p className="text-muted-foreground mb-4 text-sm">
                  Create scenes to control multiple devices at once
                </p>
                <Button variant="outline" size="sm">
                  Create Scene
                </Button>
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Popular Scenes</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(sceneConfigs).map(([id, config]) => {
                  const IconComponent = sceneIcons[config.icon as keyof typeof sceneIcons]
                  return (
                    <motion.div
                      key={id}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Card className="cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg">
                        <CardContent className="p-0">
                          <div
                            className={`${config.color} relative overflow-hidden p-4 text-white`}
                          >
                            <div className="absolute top-2 right-2 opacity-20">
                              <IconComponent size={32} weight="fill" />
                            </div>
                            <div className="relative z-10">
                              <IconComponent size={24} weight="fill" className="mb-2" />
                              <h4 className="text-sm font-semibold capitalize">
                                {id.replace('-', ' ')}
                              </h4>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="text-muted-foreground text-xs">{config.description}</p>
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
            {scenes.map(scene => {
              const config = sceneConfigs[scene.id as keyof typeof sceneConfigs]
              const iconName = scene.icon || config?.icon || 'sun'
              const IconComponent = sceneIcons[iconName as keyof typeof sceneIcons]
              const bgColor = config?.color || 'bg-gradient-to-br from-blue-400 to-purple-500'

              return (
                <motion.div
                  key={scene.id}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={`cursor-pointer overflow-hidden transition-all duration-200 ${
                      scene.id === activeScene ? 'ring-primary shadow-lg ring-2' : 'hover:shadow-lg'
                    }`}
                    onClick={() => activateScene(scene.id)}
                  >
                    <CardContent className="p-0">
                      <div className={`${bgColor} relative overflow-hidden p-6 text-white`}>
                        <div className="absolute top-2 right-2 opacity-20">
                          <IconComponent size={40} weight="fill" />
                        </div>
                        <div className="relative z-10">
                          <IconComponent size={28} weight="fill" className="mb-3" />
                          <h4 className="mb-1 text-lg font-semibold">{scene.name}</h4>
                        </div>

                        {scene.id === activeScene && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute top-3 left-3 h-3 w-3 rounded-full bg-white"
                          />
                        )}
                      </div>

                      <div className="p-4">
                        <p className="text-muted-foreground mb-3 text-sm">{scene.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            {scene.deviceStates.length} devices
                          </span>
                          {scene.id === activeScene && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-primary text-xs font-medium"
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
