import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IOS26EmptyState, IOS26Error } from '@/components/ui/ios26-error'
import { IOS26Shimmer } from '@/components/ui/ios26-loading'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { KV_KEYS, MOCK_SCENES } from '@/constants'
import { useHaptic } from '@/hooks/use-haptic'
import { useKV } from '@/hooks/use-kv'
import {
  BedIcon,
  HomeRoomIcon,
  MoonIcon,
  PlayIcon,
  PlusIcon,
  ShieldIcon,
  SunRoomIcon,
  UtensilsIcon,
} from '@/lib/icons'
import { logger } from '@/lib/logger'
import type { Scene } from '@/types'
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
  sun: SunRoomIcon,
  moon: MoonIcon,
  home: HomeRoomIcon,
  shield: ShieldIcon,
  play: PlayIcon,
  filmslate: PlayIcon, // Movie Time scene uses FilmSlate icon
  coffee: UtensilsIcon,
  bed: BedIcon,
}

export function Scenes() {
  const [scenes, _setScenes, { isLoading, isError }] = useKV<Scene[]>(KV_KEYS.SCENES, MOCK_SCENES, {
    withMeta: true,
  })
  const [activeScene, setActiveScene] = useKV<string | null>(KV_KEYS.ACTIVE_SCENE, null)
  const haptic = useHaptic()

  const activateScene = (sceneId: string) => {
    try {
      haptic.success() // Success haptic for scene activation
      setActiveScene(sceneId)

      const scene = scenes.find(s => s.id === sceneId)
      const deviceCount = scene?.deviceStates.length || 0
      toast.success(`${scene?.name || 'Scene'} activated`, {
        description: `Adjusting ${deviceCount} device${deviceCount !== 1 ? 's' : ''}`,
      })

      setTimeout(() => {
        setActiveScene(null)
      }, 2000)
    } catch (error) {
      logger.error('Failed to activate scene', {
        error,
        sceneId,
      })
      toast.error('Failed to activate scene', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Smart loading state: Only show skeletons on initial load with no data
  const showSkeleton = isLoading && scenes.length === 0

  // Show loading state (initial load only)
  if (showSkeleton) {
    return (
      <div className="flex h-full flex-col">
        <div className="p-6 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">Scenes</h1>
              <p className="text-muted-foreground">Quick actions for your home</p>
            </div>
            <Button variant="outline" size="icon" className="rounded-full">
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <IOS26Shimmer className="h-40 rounded-2xl" />
            <IOS26Shimmer className="h-40 rounded-2xl" />
            <IOS26Shimmer className="h-40 rounded-2xl" />
            <IOS26Shimmer className="h-40 rounded-2xl" />
            <IOS26Shimmer className="h-40 rounded-2xl" />
            <IOS26Shimmer className="h-40 rounded-2xl" />
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
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-6">
          <IOS26Error
            variant="error"
            title="Unable to Load Scenes"
            message="There was a problem loading your scenes. Please check your connection and try again."
            action={{
              label: 'Refresh',
              onClick: () => window.location.reload(),
            }}
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
              <PlusIcon className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        {scenes.length === 0 ? (
          <div className="space-y-6">
            <IOS26EmptyState
              icon={<PlayIcon className="h-16 w-16" />}
              title="No Scenes Created"
              message="Create scenes to control multiple devices with a single tap. Perfect for routines like 'Movie Time' or 'Good Morning'."
              action={{
                label: 'Create Scene',
                onClick: () => {
                  toast.info('Scene creation coming soon!')
                },
              }}
            />

            <div>
              <h3 className="mb-4 text-base font-semibold sm:text-lg">Popular Scenes</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(sceneConfigs).map(([id, config]) => {
                  const IconComponent =
                    sceneIcons[config.icon as keyof typeof sceneIcons] || SunRoomIcon
                  return (
                    <motion.div
                      key={id}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{
                        y: -4,
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 20,
                        },
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      style={{
                        willChange: 'transform',
                      }}
                    >
                      <Card className="group hover:shadow-primary/10 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl">
                        {/* Border glow on hover */}
                        <motion.div
                          className="pointer-events-none absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(var(--primary-rgb), 0.3) 0%, rgba(var(--primary-rgb), 0) 50%, rgba(var(--primary-rgb), 0.3) 100%)',
                            filter: 'blur(8px)',
                          }}
                        />

                        <CardContent className="p-0">
                          <div
                            className={`${config.color} relative overflow-hidden p-4 text-white`}
                          >
                            <div className="absolute top-2 right-2 opacity-20">
                              <IconComponent className="h-8 w-8 fill-current" />
                            </div>
                            <div className="relative z-10">
                              <IconComponent className="mb-2 h-6 w-6 fill-current" />
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
              const IconComponent =
                sceneIcons[iconName.toLowerCase() as keyof typeof sceneIcons] || SunRoomIcon
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
                  whileHover={{
                    y: -6,
                    transition: {
                      type: 'spring',
                      stiffness: 400,
                      damping: 20,
                    },
                  }}
                  style={{
                    // GPU-accelerated transforms
                    willChange: 'transform',
                  }}
                >
                  <Card
                    role="button"
                    tabIndex={0}
                    className={`group relative cursor-pointer overflow-hidden transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      scene.id === activeScene
                        ? 'ring-primary shadow-primary/20 shadow-2xl ring-2'
                        : 'focus-visible:ring-primary/50 hover:shadow-primary/10 hover:shadow-2xl'
                    }`}
                    onClick={() => activateScene(scene.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        activateScene(scene.id)
                      }
                    }}
                  >
                    {/* Animated border glow on hover (non-active scenes) */}
                    {scene.id !== activeScene && (
                      <motion.div
                        className="pointer-events-none absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(var(--primary-rgb), 0.4) 0%, rgba(var(--primary-rgb), 0) 50%, rgba(var(--primary-rgb), 0.4) 100%)',
                          filter: 'blur(12px)',
                        }}
                      />
                    )}

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
                        {/* Shimmer effect on hover */}
                        <motion.div
                          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          style={{
                            background:
                              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                          }}
                          animate={{
                            x: ['-100%', '200%'],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: 'linear',
                          }}
                        />

                        <div className="absolute top-2 right-2 opacity-20">
                          <IconComponent className="h-10 w-10 fill-current" />
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
                            <IconComponent className="mb-3 h-7 w-7 fill-current" />
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
                          <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground cursor-help text-xs">
                                {scene.deviceStates?.length || 0} devices
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                This scene controls {scene.deviceStates?.length || 0} smart devices
                              </p>
                            </TooltipContent>
                          </Tooltip>
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
