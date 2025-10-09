import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@/hooks/use-kv'
import { Bell, ChartLineUp, Check, Gear, Plus, Shield, WifiHigh } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdaptiveLighting } from './AdaptiveLighting'
import { Intercom } from './Intercom'
import { MonitoringSettings } from './MonitoringSettings'

interface Integration {
  id: string
  name: string
  type: 'homekit' | 'alexa' | 'google' | 'matter' | 'thread' | 'zigbee' | 'zwave'
  status: 'connected' | 'disconnected' | 'error'
  enabled: boolean
  devices: number
  protocol?: string
  details?: string
}

interface SystemSetting {
  id: string
  name: string
  description: string
  enabled: boolean
  category: 'security' | 'notifications' | 'automation' | 'system'
}

const integrationIcons = {
  homekit: WifiHigh,
  alexa: Bell,
  google: WifiHigh,
  matter: Check,
  thread: ChartLineUp,
  zigbee: ChartLineUp,
  zwave: ChartLineUp,
}

const categoryIcons = {
  security: Shield,
  notifications: Bell,
  automation: Gear,
  system: Gear,
}

export function DeviceSettings() {
  const [currentTab, setCurrentTab] = useState('integrations')
  const [integrations, setIntegrations] = useKV<Integration[]>('integrations', [
    {
      id: 'homekit',
      name: 'Apple HomeKit',
      type: 'homekit',
      status: 'connected',
      enabled: true,
      devices: 4,
      protocol: 'Voice Assistant',
    },
    {
      id: 'alexa',
      name: 'Amazon Alexa',
      type: 'alexa',
      status: 'disconnected',
      enabled: false,
      devices: 0,
      protocol: 'Voice Assistant',
    },
    {
      id: 'google',
      name: 'Google Assistant',
      type: 'google',
      status: 'connected',
      enabled: true,
      devices: 3,
      protocol: 'Voice Assistant',
    },
    {
      id: 'thread',
      name: 'Thread Network',
      type: 'thread',
      status: 'connected',
      enabled: true,
      devices: 8,
      protocol: 'Low-Power Mesh',
      details: 'Border Router Active',
    },
    {
      id: 'zigbee',
      name: 'Zigbee',
      type: 'zigbee',
      status: 'connected',
      enabled: true,
      devices: 12,
      protocol: 'Mesh Network',
      details: 'ConBee II Coordinator',
    },
    {
      id: 'zwave',
      name: 'Z-Wave',
      type: 'zwave',
      status: 'disconnected',
      enabled: false,
      devices: 0,
      protocol: 'Mesh Network',
      details: 'No controller detected',
    },
    {
      id: 'matter',
      name: 'Matter',
      type: 'matter',
      status: 'connected',
      enabled: true,
      devices: 5,
      protocol: 'Universal Standard',
      details: 'Controller Active',
    },
  ])
  const [systemSettings, setSystemSettings] = useKV<SystemSetting[]>('system-settings', [
    {
      id: 'auto-discovery',
      name: 'Auto Device Discovery',
      description: 'Automatically detect new devices on your network',
      enabled: true,
      category: 'system',
    },
    {
      id: 'offline-mode',
      name: 'Offline Mode',
      description: 'Continue operating without internet connection',
      enabled: false,
      category: 'system',
    },
  ])
  const [notifications, setNotifications] = useKV('notifications-enabled', true)
  const [autoUpdates, setAutoUpdates] = useKV('auto-updates', true)
  const [geofencing, setGeofencing] = useKV('geofencing-enabled', false)

  const toggleIntegration = (integrationId: string) => {
    setIntegrations(currentIntegrations =>
      currentIntegrations.map(integration =>
        integration.id === integrationId
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    )
    toast.success('Integration updated')
  }

  const toggleSystemSetting = (settingId: string) => {
    setSystemSettings(currentSettings =>
      currentSettings.map(setting =>
        setting.id === settingId ? { ...setting, enabled: !setting.enabled } : setting
      )
    )
    toast.success('Setting updated')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your home automation</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Gear size={20} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex h-full flex-col">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="adaptive">Adaptive</TabsTrigger>
              <TabsTrigger value="intercom">Intercom</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="integrations" className="mt-6 flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Push Notifications</p>
                        <p className="text-muted-foreground text-xs">Device alerts and updates</p>
                      </div>
                    </div>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <WifiHigh size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Automatic Updates</p>
                        <p className="text-muted-foreground text-xs">Keep devices up to date</p>
                      </div>
                    </div>
                    <Switch checked={autoUpdates} onCheckedChange={setAutoUpdates} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <WifiHigh size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Geofencing</p>
                        <p className="text-muted-foreground text-xs">Location-based automation</p>
                      </div>
                    </div>
                    <Switch checked={geofencing} onCheckedChange={setGeofencing} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Platform Integrations</CardTitle>
                    <Button variant="outline" size="sm">
                      <Plus size={16} className="mr-2" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {integrations.length === 0 ? (
                    <div className="py-8 text-center">
                      <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                        <WifiHigh size={24} className="text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-2">No integrations</p>
                      <p className="text-muted-foreground mb-4 text-sm">
                        Connect with HomeKit, Alexa, Google Home, and more
                      </p>
                      <Button variant="outline" size="sm">
                        Add Integration
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {integrations.map(integration => {
                        const IconComponent = integrationIcons[integration.type]

                        return (
                          <motion.div
                            key={integration.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            <div className="flex items-center justify-between rounded-lg border p-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
                                  <IconComponent
                                    size={20}
                                    className={
                                      integration.enabled ? 'text-primary' : 'text-muted-foreground'
                                    }
                                  />
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium">{integration.name}</h3>
                                  {integration.protocol && (
                                    <p className="text-muted-foreground mb-1 text-xs">
                                      {integration.protocol}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant={
                                        integration.status === 'connected' ? 'default' : 'secondary'
                                      }
                                      className="h-4 text-xs"
                                    >
                                      {integration.status}
                                    </Badge>
                                    <span className="text-muted-foreground text-xs">
                                      {integration.devices} devices
                                    </span>
                                    {integration.details && (
                                      <span className="text-muted-foreground text-xs">
                                        • {integration.details}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <Switch
                                checked={integration.enabled}
                                onCheckedChange={() => toggleIntegration(integration.id)}
                                disabled={integration.status === 'error'}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="mt-6 flex-1 overflow-y-auto px-6 pb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {systemSettings.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                      <Gear size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">No custom settings</p>
                    <p className="text-muted-foreground text-sm">
                      System is running with default configuration
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {systemSettings.map(setting => {
                      const IconComponent = categoryIcons[setting.category]

                      return (
                        <div
                          key={setting.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent size={16} className="text-muted-foreground" />
                            <div>
                              <h3 className="text-sm font-medium">{setting.name}</h3>
                              <p className="text-muted-foreground text-xs">{setting.description}</p>
                            </div>
                          </div>

                          <Switch
                            checked={setting.enabled}
                            onCheckedChange={() => toggleSystemSetting(setting.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-accent/10 border-accent/20 flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Check size={20} className="text-accent" />
                      <div>
                        <p className="text-sm font-medium">System Health</p>
                        <p className="text-muted-foreground text-xs">All systems operational</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/20 text-accent">
                      Online
                    </Badge>
                  </div>

                  <div className="bg-secondary flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <WifiHigh size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Network Status</p>
                        <p className="text-muted-foreground text-xs">Connected to Wi-Fi</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Strong</Badge>
                  </div>

                  <div className="bg-primary/10 border-primary/20 flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <WifiHigh size={20} className="text-primary" />
                      <div>
                        <p className="text-sm font-medium">Cloud Sync</p>
                        <p className="text-muted-foreground text-xs">Last sync: 2 minutes ago</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="m-0 flex-1 overflow-hidden p-0">
            <MonitoringSettings />
          </TabsContent>

          <TabsContent value="adaptive" className="m-0 flex-1 overflow-hidden p-0">
            <AdaptiveLighting />
          </TabsContent>

          <TabsContent value="intercom" className="m-0 flex-1 overflow-hidden p-0">
            <Intercom />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
