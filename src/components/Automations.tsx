import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'
import { IOS26EmptyState } from '@/components/ui/ios26-error'
import { AutomationCardSkeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KV_KEYS, MOCK_AUTOMATIONS } from '@/constants'
import { useConditionEvaluator } from '@/hooks/use-condition-evaluator'
import { useHaptic } from '@/hooks/use-haptic'
import { useKV } from '@/hooks/use-kv'
import { useScheduler } from '@/hooks/use-scheduler'
import {
  CalendarIcon,
  ClockIcon,
  CopyIcon,
  EditIcon,
  MapPinIcon,
  MoonIcon,
  PlayIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SunRoomIcon,
  ThermometerIcon,
  TrashIcon,
  WorkflowIcon,
  XIcon,
} from '@/lib/icons'
import { logger } from '@/lib/logger'
import type { Automation } from '@/types'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'
import { FlowDesigner } from './FlowDesigner'
import { GeofenceBuilder } from './GeofenceBuilder'
import { ScheduleBuilder } from './ScheduleBuilder'

const automationIcons = {
  schedule: ClockIcon,
  geofence: MapPinIcon,
  condition: CalendarIcon,
  'device-state': WorkflowIcon,
} as const

export function Automations() {
  const [automations, setAutomations, { isLoading }] = useKV<Automation[]>(
    KV_KEYS.AUTOMATIONS,
    MOCK_AUTOMATIONS,
    { withMeta: true }
  )
  const [currentTab, setCurrentTab] = useKV('automations-tab', 'overview')
  const [searchQuery, setSearchQuery] = useState('')
  const haptic = useHaptic()

  // Initialize scheduler (triggers in background)
  const { triggerAutomation } = useScheduler()

  // Initialize condition evaluator (monitors device states)
  useConditionEvaluator()

  // Smart loading state: Only show skeletons on initial load with no data
  const showSkeleton = isLoading && automations.length === 0

  const toggleAutomation = (automationId: string) => {
    try {
      setAutomations(currentAutomations =>
        currentAutomations.map(automation =>
          automation.id === automationId
            ? { ...automation, enabled: !automation.enabled }
            : automation
        )
      )
      toast.success('Automation updated')
    } catch (error) {
      logger.error('Failed to toggle automation', {
        error,
        automationId,
      })
      toast.error('Failed to toggle automation', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Context menu handlers
  const handleEditAutomation = (automation: Automation) => {
    haptic.light()
    toast.info(`Edit ${automation.name}`, {
      description: 'Automation editor coming soon',
    })
  }

  const handleDuplicateAutomation = (automation: Automation) => {
    haptic.light()

    // Create duplicate with new ID and modified name
    const duplicateAutomation: Automation = {
      ...automation,
      id: `${automation.id}-copy-${Date.now()}`,
      name: `${automation.name} (Copy)`,
      enabled: false, // Start disabled for safety
      lastRun: undefined, // Reset execution history
    }

    // Add to automations array
    setAutomations([...automations, duplicateAutomation])

    toast.success(`Duplicated ${automation.name}`, {
      description: 'New automation created (disabled)',
    })

    logger.info('Automation duplicated', {
      originalId: automation.id,
      duplicateId: duplicateAutomation.id,
    })
  }

  const handleDeleteAutomation = (automation: Automation) => {
    haptic.heavy()

    // Store original state for undo
    const originalAutomations = [...automations]
    const deletedAutomation = automation

    // Remove automation from array (optimistic)
    const updatedAutomations = automations.filter(a => a.id !== automation.id)
    setAutomations(updatedAutomations)

    // Show toast with undo action
    toast.success(`Deleted ${automation.name}`, {
      description: 'Automation removed successfully',
      duration: 5000, // 5-second undo window
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore the deleted automation
          setAutomations(originalAutomations)
          haptic.light()
          toast.success(`Restored ${deletedAutomation.name}`, {
            description: 'Automation has been restored',
          })
          logger.info('Automation deletion undone', {
            automationId: deletedAutomation.id,
            automationName: deletedAutomation.name,
          })
        },
      },
    })

    logger.info('Automation deleted', {
      automationId: automation.id,
      automationName: automation.name,
    })
  }

  // Filter automations by search query
  const filteredAutomations = automations.filter(automation => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const triggerTypes = automation.triggers?.map(t => t.type).join(' ') || ''
    const searchableText = [automation.name, automation.type, triggerTypes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchableText.includes(query)
  })

  const runAutomation = async (automationId: string) => {
    try {
      const automation = automations.find(a => a.id === automationId)
      if (automation) {
        toast.info(`Running "${automation.name}"...`)
        await triggerAutomation(automationId)
      }
    } catch (error) {
      logger.error('Failed to run automation', {
        error,
        automationId,
      })
      toast.error('Failed to run automation', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
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
      logger.error('Date formatting error', { error, dateString })
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
              <SettingsIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="flows" className="flex items-center gap-2">
              <WorkflowIcon size={16} />
              Flows
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <ClockIcon size={16} />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="geofence" className="flex items-center gap-2">
              <MapPinIcon size={16} />
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

              {/* Search Input */}
              <div className="relative mb-6">
                <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search automations by name or type..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-10 pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:bg-accent absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {showSkeleton ? (
                // Loading state with skeletons
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <AutomationCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredAutomations.length === 0 ? (
                <div className="space-y-6">
                  <IOS26EmptyState
                    icon={<ClockIcon className="h-16 w-16" />}
                    title="No Automations Yet"
                    message="Automate your home with smart rules based on time, device state, or location. Save time and energy with intelligent automation."
                    action={{
                      label: 'Create Visual Flow',
                      onClick: () => setCurrentTab('flows'),
                    }}
                  />

                  {/* Quick Start Templates */}
                  <div>
                    <h3 className="mb-4 text-base font-semibold sm:text-lg">Quick Start Ideas</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        {
                          icon: SunRoomIcon,
                          title: 'Wake Up Routine',
                          description: 'Turn on lights gradually at sunrise',
                          type: 'time',
                        },
                        {
                          icon: MoonIcon,
                          title: 'Good Night',
                          description: 'Lock doors and turn off lights at bedtime',
                          type: 'time',
                        },
                        {
                          icon: ThermometerIcon,
                          title: 'Climate Control',
                          description: 'Adjust temperature when you arrive home',
                          type: 'location',
                        },
                        {
                          icon: ShieldIcon,
                          title: 'Security Alert',
                          description: 'Send notification when door opens',
                          type: 'device-state',
                        },
                      ].map((template, index) => (
                        <motion.button
                          key={template.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ y: -2 }}
                          onClick={() => {
                            toast.info(`${template.title} template coming soon!`)
                          }}
                          className="group text-left"
                        >
                          <Card className="hover:bg-accent/5 border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
                            <CardContent className="p-4">
                              <div className="mb-2 flex items-start gap-3">
                                <div className="bg-primary/10 group-hover:bg-primary/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors">
                                  <template.icon className="text-primary h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="mb-1 font-medium">{template.title}</h4>
                                  <p className="text-muted-foreground text-sm">
                                    {template.description}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {template.type}
                              </Badge>
                            </CardContent>
                          </Card>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAutomations.map(automation => {
                    const IconComponent = automationIcons[automation.type]

                    const cardContent = (
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
                              <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => runAutomation(automation.id)}
                                >
                                  <PlayIcon size={14} />
                                </Button>
                              </motion.div>

                              <motion.div whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <EditIcon size={14} />
                                </Button>
                              </motion.div>

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
                    )

                    return (
                      <motion.div
                        key={automation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <div>{cardContent}</div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48">
                            <ContextMenuItem
                              onClick={() => handleEditAutomation(automation)}
                              className="gap-2"
                            >
                              <EditIcon className="h-4 w-4" />
                              Edit Automation
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => handleDuplicateAutomation(automation)}
                              className="gap-2"
                            >
                              <CopyIcon className="h-4 w-4" />
                              Duplicate
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() => handleDeleteAutomation(automation)}
                              className="gap-2 text-red-600 dark:text-red-400"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
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
