import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@/hooks/use-kv'
import { ChartLine, Cpu, House, Lightning, ShieldCheck, Sliders } from '@phosphor-icons/react'
import { Automations } from './components/Automations'
import { BackupRecovery } from './components/BackupRecovery'
import { Dashboard } from './components/Dashboard'
import { DeviceMonitor } from './components/DeviceMonitor'
import { DeviceSettings } from './components/DeviceSettings'
import { Energy } from './components/Energy'
import { InsightsDashboard } from './components/InsightsDashboard'
import { Rooms } from './components/Rooms'
import { Scenes } from './components/Scenes'
import { Security } from './components/Security'
import { UserManagement } from './components/UserManagement'

function App() {
  const [currentTab, setCurrentTab] = useKV('current-tab', 'home')
  const [devicesSubTab, setDevicesSubTab] = useKV('devices-subtab', 'rooms')
  const [controlSubTab, setControlSubTab] = useKV('control-subtab', 'scenes')
  const [settingsSubTab, setSettingsSubTab] = useKV('settings-subtab', 'settings')

  return (
    <div className="bg-background min-h-screen">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex h-screen flex-col">
        <div className="flex-1 overflow-hidden">
          <TabsContent value="home" className="m-0 h-full p-0">
            <Dashboard />
          </TabsContent>

          <TabsContent value="devices" className="m-0 h-full p-0">
            <Tabs
              value={devicesSubTab}
              onValueChange={setDevicesSubTab}
              className="flex h-full flex-col"
            >
              <div className="border-border bg-card/50 border-b backdrop-blur-sm">
                <TabsList className="h-12 w-full justify-start rounded-none bg-transparent px-6">
                  <TabsTrigger value="rooms" className="data-[state=active]:bg-primary/10">
                    Rooms
                  </TabsTrigger>
                  <TabsTrigger value="monitor" className="data-[state=active]:bg-primary/10">
                    Monitor
                  </TabsTrigger>
                  <TabsTrigger value="energy" className="data-[state=active]:bg-primary/10">
                    Energy
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="rooms" className="m-0 h-full p-0">
                  <Rooms />
                </TabsContent>
                <TabsContent value="monitor" className="m-0 h-full p-0">
                  <DeviceMonitor />
                </TabsContent>
                <TabsContent value="energy" className="m-0 h-full p-0">
                  <Energy />
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>

          <TabsContent value="control" className="m-0 h-full p-0">
            <Tabs
              value={controlSubTab}
              onValueChange={setControlSubTab}
              className="flex h-full flex-col"
            >
              <div className="border-border bg-card/50 border-b backdrop-blur-sm">
                <TabsList className="h-12 w-full justify-start rounded-none bg-transparent px-6">
                  <TabsTrigger value="scenes" className="data-[state=active]:bg-primary/10">
                    Scenes
                  </TabsTrigger>
                  <TabsTrigger value="automations" className="data-[state=active]:bg-primary/10">
                    Automations
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="scenes" className="m-0 h-full p-0">
                  <Scenes />
                </TabsContent>
                <TabsContent value="automations" className="m-0 h-full p-0">
                  <Automations />
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>

          <TabsContent value="security" className="m-0 h-full p-0">
            <Security />
          </TabsContent>

          <TabsContent value="insights" className="m-0 h-full p-0">
            <InsightsDashboard />
          </TabsContent>

          <TabsContent value="settings" className="m-0 h-full p-0">
            <Tabs
              value={settingsSubTab}
              onValueChange={setSettingsSubTab}
              className="flex h-full flex-col"
            >
              <div className="border-border bg-card/50 border-b backdrop-blur-sm">
                <TabsList className="h-12 w-full justify-start rounded-none bg-transparent px-6">
                  <TabsTrigger value="settings" className="data-[state=active]:bg-primary/10">
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-primary/10">
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="backup" className="data-[state=active]:bg-primary/10">
                    Backup
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="settings" className="m-0 h-full p-0">
                  <DeviceSettings />
                </TabsContent>
                <TabsContent value="users" className="m-0 h-full p-0">
                  <UserManagement />
                </TabsContent>
                <TabsContent value="backup" className="m-0 h-full p-0">
                  <BackupRecovery />
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>
        </div>

        <TabsList className="bg-card/80 border-border grid h-20 w-full grid-cols-6 rounded-none border-t p-2 backdrop-blur-xl">
          <TabsTrigger
            value="home"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 p-2"
          >
            <House size={24} weight="regular" />
            <span className="text-xs font-medium">Home</span>
          </TabsTrigger>

          <TabsTrigger
            value="devices"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 p-2"
          >
            <Cpu size={24} weight="regular" />
            <span className="text-xs font-medium">Devices</span>
          </TabsTrigger>

          <TabsTrigger
            value="control"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 p-2"
          >
            <Lightning size={24} weight="regular" />
            <span className="text-xs font-medium">Control</span>
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 p-2"
          >
            <ShieldCheck size={24} weight="regular" />
            <span className="text-xs font-medium">Security</span>
          </TabsTrigger>

          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 p-2"
          >
            <ChartLine size={24} weight="regular" />
            <span className="text-xs font-medium">Insights</span>
          </TabsTrigger>

          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 p-2"
          >
            <Sliders size={24} weight="regular" />
            <span className="text-xs font-medium">Settings</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Toaster />
    </div>
  )
}

export default App
