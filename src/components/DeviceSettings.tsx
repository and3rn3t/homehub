import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Bell, 
  Shield, 
  Wifi, 
  Plus,
  Check
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface Integration {
  id: string
  name: string
  type: 'homekit' | 'alexa' | 'google' | 'matter'
  status: 'connected' | 'disconnected' | 'error'
  enabled: boolean
  devices: number
}

interface SystemSetting {
  id: string
  name: string
  description: string
  enabled: boolean
  category: 'security' | 'notifications' | 'automation' | 'system'
}

const integrationIcons = {
  homekit: Wifi,
  alexa: Bell,
  google: Wifi,
  matter: Check
}

const categoryIcons = {
  security: Shield,
  notifications: Bell,
  automation: Settings,
  system: Settings
}

export function DeviceSettings() {
  const [integrations, setIntegrations] = useKV<Integration[]>("integrations", [
    {
      id: "homekit",
      name: "Apple HomeKit", 
      type: "homekit",
      status: "connected",
      enabled: true,
      devices: 4
    },
    {
      id: "alexa",
      name: "Amazon Alexa",
      type: "alexa", 
      status: "disconnected",
      enabled: false,
      devices: 0
    },
    {
      id: "google",
      name: "Google Assistant",
      type: "google",
      status: "connected", 
      enabled: true,
      devices: 3
    }
  ])
  const [systemSettings, setSystemSettings] = useKV<SystemSetting[]>("system-settings", [
    {
      id: "auto-discovery",
      name: "Auto Device Discovery",
      description: "Automatically detect new devices on your network",
      enabled: true,
      category: "system"
    },
    {
      id: "offline-mode", 
      name: "Offline Mode",
      description: "Continue operating without internet connection",
      enabled: false,
      category: "system"
    }
  ])
  const [notifications, setNotifications] = useKV("notifications-enabled", true)
  const [autoUpdates, setAutoUpdates] = useKV("auto-updates", true)
  const [geofencing, setGeofencing] = useKV("geofencing-enabled", false)

  const toggleIntegration = (integrationId: string) => {
    setIntegrations(currentIntegrations => 
      currentIntegrations.map(integration => 
        integration.id === integrationId 
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    )
    toast.success("Integration updated")
  }

  const toggleSystemSetting = (settingId: string) => {
    setSystemSettings(currentSettings => 
      currentSettings.map(setting => 
        setting.id === settingId 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    )
    toast.success("Setting updated")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your home automation</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Settings size={20} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Device alerts and updates</p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi size={20} className="text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Automatic Updates</p>
                  <p className="text-xs text-muted-foreground">Keep devices up to date</p>
                </div>
              </div>
              <Switch
                checked={autoUpdates}
                onCheckedChange={setAutoUpdates}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi size={20} className="text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Geofencing</p>
                  <p className="text-xs text-muted-foreground">Location-based automation</p>
                </div>
              </div>
              <Switch
                checked={geofencing}
                onCheckedChange={setGeofencing}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Integrations</CardTitle>
              <Button variant="outline" size="sm">
                <Plus size={16} className="mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {integrations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Wifi size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No integrations</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with HomeKit, Alexa, Google Home, and more
                </p>
                <Button variant="outline" size="sm">
                  Add Integration
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration) => {
                  const IconComponent = integrationIcons[integration.type]
                  
                  return (
                    <motion.div
                      key={integration.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <IconComponent 
                              size={20} 
                              className={integration.enabled ? "text-primary" : "text-muted-foreground"} 
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">{integration.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={integration.status === 'connected' ? 'default' : 'secondary'}
                                className="h-4 text-xs"
                              >
                                {integration.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {integration.devices} devices
                              </span>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {systemSettings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Settings size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No custom settings</p>
                <p className="text-sm text-muted-foreground">
                  System is running with default configuration
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {systemSettings.map((setting) => {
                  const IconComponent = categoryIcons[setting.category]
                  
                  return (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent size={16} className="text-muted-foreground" />
                        <div>
                          <h3 className="font-medium text-sm">{setting.name}</h3>
                          <p className="text-xs text-muted-foreground">{setting.description}</p>
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
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-3">
                  <Check size={20} className="text-accent" />
                  <div>
                    <p className="font-medium text-sm">System Health</p>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-accent/20 text-accent">
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border">
                <div className="flex items-center gap-3">
                  <Wifi size={20} className="text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Network Status</p>
                    <p className="text-xs text-muted-foreground">Connected to Wi-Fi</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  Strong
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Wifi size={20} className="text-primary" />
                  <div>
                    <p className="font-medium text-sm">Cloud Sync</p>
                    <p className="text-xs text-muted-foreground">Last sync: 2 minutes ago</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}