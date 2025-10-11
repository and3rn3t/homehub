import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useKV } from '@/hooks/use-kv'
import { BatteryIcon, BellIcon, LineChartIcon, CheckCircleIcon, ClockIcon, Gear as SettingsIcon, ShieldIcon, AlertTriangleIcon, WifiIcon, XCircleIcon,  } from '@/lib/icons'
import { toast } from 'sonner'

interface MonitoringSettings {
  alertsEnabled: boolean
  offlineThreshold: number // minutes
  batteryThreshold: number // percentage
  signalThreshold: number // percentage
  soundAlerts: boolean
  pushNotifications: boolean
  emailNotifications: boolean
  autoAcknowledge: boolean
  maintenanceMode: boolean
  heartbeatInterval: number // seconds
  retryAttempts: number
  alertCategories: {
    offline: boolean
    battery: boolean
    signal: boolean
    security: boolean
    maintenance: boolean
  }
}

interface NetworkSettings {
  pingInterval: number // seconds
  timeoutThreshold: number // seconds
  signalQualityChecks: boolean
  bandwidthMonitoring: boolean
  latencyMonitoring: boolean
}

interface SecuritySettings {
  intrusion: boolean
  tampering: boolean
  unauthorizedAccess: boolean
  deviceRemoval: boolean
  encryptionChecks: boolean
}

export function MonitoringSettings() {
  const [settings, setSettings] = useKV<MonitoringSettings>('monitoring-settings', {
    alertsEnabled: true,
    offlineThreshold: 10,
    batteryThreshold: 20,
    signalThreshold: 50,
    soundAlerts: true,
    pushNotifications: true,
    emailNotifications: false,
    autoAcknowledge: false,
    maintenanceMode: false,
    heartbeatInterval: 30,
    retryAttempts: 3,
    alertCategories: {
      offline: true,
      battery: true,
      signal: true,
      security: true,
      maintenance: true,
    },
  })

  const [networkSettings, setNetworkSettings] = useKV<NetworkSettings>('network-settings', {
    pingInterval: 60,
    timeoutThreshold: 10,
    signalQualityChecks: true,
    bandwidthMonitoring: false,
    latencyMonitoring: true,
  })

  const [securitySettings, setSecuritySettings] = useKV<SecuritySettings>('security-settings', {
    intrusion: true,
    tampering: true,
    unauthorizedAccess: true,
    deviceRemoval: true,
    encryptionChecks: false,
  })

  const updateSetting = <T extends keyof MonitoringSettings>(
    key: T,
    value: MonitoringSettings[T]
  ) => {
    setSettings(current => ({ ...current, [key]: value }))
    toast.success('Settings updated')
  }

  const updateNetworkSetting = <T extends keyof NetworkSettings>(
    key: T,
    value: NetworkSettings[T]
  ) => {
    setNetworkSettings(current => ({ ...current, [key]: value }))
    toast.success('Network settings updated')
  }

  const updateSecuritySetting = <T extends keyof SecuritySettings>(
    key: T,
    value: SecuritySettings[T]
  ) => {
    setSecuritySettings(current => ({ ...current, [key]: value }))
    toast.success('Security settings updated')
  }

  const updateAlertCategory = (
    category: keyof MonitoringSettings['alertCategories'],
    enabled: boolean
  ) => {
    setSettings(current => ({
      ...current,
      alertCategories: {
        ...current.alertCategories,
        [category]: enabled,
      },
    }))
    toast.success(`${category} alerts ${enabled ? 'enabled' : 'disabled'}`)
  }

  const resetToDefaults = () => {
    setSettings({
      alertsEnabled: true,
      offlineThreshold: 10,
      batteryThreshold: 20,
      signalThreshold: 50,
      soundAlerts: true,
      pushNotifications: true,
      emailNotifications: false,
      autoAcknowledge: false,
      maintenanceMode: false,
      heartbeatInterval: 30,
      retryAttempts: 3,
      alertCategories: {
        offline: true,
        battery: true,
        signal: true,
        security: true,
        maintenance: true,
      },
    })
    toast.success('Settings reset to defaults')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Monitoring Settings</h1>
            <p className="text-muted-foreground">Configure device monitoring and alerts</p>
          </div>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset Defaults
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-6">
          {/* Alert Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} className="text-primary" />
                Alert Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Alerts</Label>
                  <p className="text-muted-foreground text-sm">
                    Master switch for all monitoring alerts
                  </p>
                </div>
                <Switch
                  checked={settings.alertsEnabled}
                  onCheckedChange={checked => updateSetting('alertsEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Offline Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.offlineThreshold}
                      onChange={e => updateSetting('offlineThreshold', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">minutes</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Alert when device is offline for this duration
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Battery Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="5"
                      max="50"
                      value={settings.batteryThreshold}
                      onChange={e => updateSetting('batteryThreshold', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Alert when battery drops below this level
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Signal Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="10"
                      max="80"
                      value={settings.signalThreshold}
                      onChange={e => updateSetting('signalThreshold', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Alert when signal strength drops below this level
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Heartbeat Interval</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="10"
                      max="300"
                      value={settings.heartbeatInterval}
                      onChange={e => updateSetting('heartbeatInterval', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">seconds</span>
                  </div>
                  <p className="text-muted-foreground text-xs">How often to check device status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warning size={20} className="text-primary" />
                Notification Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Sound Alerts</Label>
                  <p className="text-muted-foreground text-sm">
                    Play notification sounds for alerts
                  </p>
                </div>
                <Switch
                  checked={settings.soundAlerts}
                  onCheckedChange={checked => updateSetting('soundAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-muted-foreground text-sm">Show browser notifications</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={checked => updateSetting('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-muted-foreground text-sm">Send alerts via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={checked => updateSetting('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Auto Acknowledge</Label>
                  <p className="text-muted-foreground text-sm">
                    Automatically mark low priority alerts as read
                  </p>
                </div>
                <Switch
                  checked={settings.autoAcknowledge}
                  onCheckedChange={checked => updateSetting('autoAcknowledge', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Alert Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon size={20} className="text-primary" />
                Alert Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.alertCategories).map(([category, enabled]) => {
                const icons = {
                  offline: XCircle,
                  battery: BatteryMedium,
                  signal: WifiHigh,
                  security: Shield,
                  maintenance: Clock,
                }
                const IconComponent = icons[category as keyof typeof icons]

                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent size={18} className="text-muted-foreground" />
                      <div>
                        <Label className="text-base font-medium capitalize">
                          {category} Alerts
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          {category === 'offline' && 'Device connectivity issues'}
                          {category === 'battery' && 'Low battery warnings'}
                          {category === 'signal' && 'Weak signal strength alerts'}
                          {category === 'security' && 'Security breach notifications'}
                          {category === 'maintenance' && 'Scheduled maintenance reminders'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={checked =>
                        updateAlertCategory(
                          category as keyof MonitoringSettings['alertCategories'],
                          checked
                        )
                      }
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Network Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WifiHigh size={20} className="text-primary" />
                Network Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ping Interval</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="30"
                      max="300"
                      value={networkSettings.pingInterval}
                      onChange={e => updateNetworkSetting('pingInterval', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">seconds</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Timeout Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="5"
                      max="30"
                      value={networkSettings.timeoutThreshold}
                      onChange={e =>
                        updateNetworkSetting('timeoutThreshold', parseInt(e.target.value))
                      }
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">seconds</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Signal Quality Checks</Label>
                    <p className="text-muted-foreground text-sm">
                      Monitor wireless signal strength
                    </p>
                  </div>
                  <Switch
                    checked={networkSettings.signalQualityChecks}
                    onCheckedChange={checked =>
                      updateNetworkSetting('signalQualityChecks', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Latency Monitoring</Label>
                    <p className="text-muted-foreground text-sm">Track network response times</p>
                  </div>
                  <Switch
                    checked={networkSettings.latencyMonitoring}
                    onCheckedChange={checked => updateNetworkSetting('latencyMonitoring', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} className="text-primary" />
                Security Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(securitySettings).map(([setting, enabled]) => (
                <div key={setting} className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium capitalize">
                      {setting.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {setting === 'intrusion' && 'Detect unauthorized access attempts'}
                      {setting === 'tampering' && 'Monitor device physical tampering'}
                      {setting === 'unauthorizedAccess' && 'Track unauthorized login attempts'}
                      {setting === 'deviceRemoval' && 'Alert when devices are removed'}
                      {setting === 'encryptionChecks' && 'Verify encryption status'}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={checked =>
                      updateSecuritySetting(setting as keyof SecuritySettings, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLineUp size={20} className="text-primary" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm">Monitoring Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm">Network Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={settings.maintenanceMode ? 'destructive' : 'default'}
                    className="h-5"
                  >
                    {settings.maintenanceMode ? 'Maintenance Mode' : 'Normal Operation'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="h-5">
                    {settings.retryAttempts} Retry Attempts
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
