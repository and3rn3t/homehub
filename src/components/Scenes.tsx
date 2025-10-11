import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { SceneCardSkeleton } from '@/components/ui/skeleton'
import { KV_KEYS, MOCK_SCENES } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { Scene } from '@/types'
import { Bed, Coffee, House as HomeIcon, Moon, PlayIcon, PlusIcon, ShieldIcon, SunRoomIcon,  } from '@/lib/icons'
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
  const [scenes, _setScenes, { isLoading, isError }] = useKV<Scene[]>(KV_KEYS.SCENES, MOCK_SCENES, {
    withMeta: true,
  })
  const [activeScene, setActiveScene] = useKV<string | null>(KV_KEYS.ACTIVE_SCENE, null)

  const activateScene = (sceneId: string) => {
    setActiveScene(sceneId)

    const scene = scenes.find(s => s.id === sceneId)
    const deviceCount = scene?.deviceStates.length || 0
    toast.success(`${scene?.name || 'Scene'} activated`, {
      description: `Adjusting ${deviceCount} device${deviceCount !== 1 ? 's' : ''}`,
    })

    setTimeout(() => {
      setActiveScene(null)
    }, 2000)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="p-6 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">Scenes</h1>
              <p className="text-muted-foreground">Quick actions for your home</p>
            </div>
            <Button variant="outline" size="icon" className="rounded-full">
              <Plus size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <SceneCardSkeleton />
            <SceneCardSkeleton />
            <SceneCardSkeleton />
            <SceneCardSkeleton />
            <SceneCardSkeleton />
            <SceneCardSkeleton />
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
              <h1 className="text-foreground text-2xl font-bold">Scenes</h1>
              <p className="text-muted-foreground">Quick actions for your home</p>
            </div>
            <Button variant="outline" size="icon" className="rounded-full">
              <Plus size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ErrorState
            title="Unable to Load Scenes"
            description="There was a problem loading your scenes. Please try again."
            onRetry={() => window.location.reload()}
            size="lg"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 pb-3 sm:p-6 sm:pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-xl font-bold sm:text-2xl">Scenes</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Quick actions for your home
            </p>
          </div>
          <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
              <Plus size={20} />
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
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
              <h3 className="mb-4 text-base font-semibold sm:text-lg">Popular Scenes</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenes.map((scene, index) => {
              const config = sceneConfigs[scene.id as keyof typeof sceneConfigs]
              const iconName = scene.icon || config?.icon || 'sun'
              const IconComponent = sceneIcons[iconName as keyof typeof sceneIcons]
              const bgColor = config?.color || 'bg-gradient-to-br from-blue-400 to-purple-500'

              return (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer overflow-hidden transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      scene.id === activeScene
                        ? 'ring-primary shadow-lg ring-2'
                        : 'focus-visible:ring-primary/50 hover:shadow-lg'
                    }`}
                    onClick={() => activateScene(scene.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        activateScene(scene.id)
                      }
                    }}
                  >
                    <CardContent className="p-0">
                      <motion.div
                        className={`${bgColor} relative overflow-hidden p-6 text-white`}
                        animate={{
                          scale: scene.id === activeScene ? [1, 1.02, 1] : 1,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: 'easeInOut',
                        }}
                      >
                        <div className="absolute top-2 right-2 opacity-20">
                          <IconComponent size={40} weight="fill" />
                        </div>
                        <div className="relative z-10">
                          <motion.div
                            animate={{
                              rotate: scene.id === activeScene ? [0, 10, -10, 0] : 0,
                            }}
                            transition={{
                              duration: 0.5,
                              ease: 'easeInOut',
                            }}
                          >
                            <IconComponent size={28} weight="fill" className="mb-3" />
                          </motion.div>
                          <h4 className="mb-1 text-lg font-semibold">{scene.name}</h4>
                        </div>

                        {scene.id === activeScene && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            className="absolute top-3 left-3 h-3 w-3 rounded-full bg-white shadow-lg"
                          />
                        )}
                      </motion.div>

                      <div className="p-4">
                        <p className="text-muted-foreground mb-3 text-sm">{scene.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            {scene.deviceStates?.length || 0} devices
                          </span>
                          {scene.id === activeScene && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
