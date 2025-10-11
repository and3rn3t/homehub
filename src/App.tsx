import { CommandPalette, useKeyboardShortcut } from '@/components/ui/command-palette'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@/hooks/use-kv'
import {
  CogIcon,
  HomeRoomIcon,
  HouseIcon,
  LayoutGridIcon,
  LineChartIcon,
  PlayIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersIconAlt,
  UsersIcon,
  ZapIcon,
} from '@/lib/icons'
import { Automations } from './components/Automations'
import { BackupRecovery } from './components/BackupRecovery'
import { Dashboard } from './components/Dashboard'
import { DeviceMonitor } from './components/DeviceMonitor'
import { DeviceSettings } from './components/DeviceSettings'
import { Energy } from './components/Energy'
import { GeofenceTest } from './components/GeofenceTest'
import { InsightsDashboard } from './components/InsightsDashboard'
import { LoadingStatesDemo } from './components/LoadingStatesDemo'
import { Rooms } from './components/Rooms'
import { Scenes } from './components/Scenes'
import { Security } from './components/Security'
import { TestAdvancedControls } from './components/TestAdvancedControls'
import { ThemeToggle } from './components/ThemeToggle'
import { UserManagement } from './components/UserManagement'

function App() {
  const [currentTab, setCurrentTab] = useKV('current-tab', 'home')
  const [devicesSubTab, setDevicesSubTab] = useKV('devices-subtab', 'rooms')
  const [controlSubTab, setControlSubTab] = useKV('control-subtab', 'scenes')
  const [settingsSubTab, setSettingsSubTab] = useKV('settings-subtab', 'settings')

  // Command palette actions
  const commandActions = [
    // Navigation - Main Tabs
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View home overview and quick controls',
      icon: HouseIcon,
      shortcut: ['⌘', 'D'],
      onSelect: () => setCurrentTab('home'),
      category: 'navigation' as const,
    },
    {
      id: 'nav-rooms',
      label: 'Go to Rooms',
      description: 'View and manage rooms',
      icon: HomeRoomIcon,
      shortcut: ['⌘', 'R'],
      onSelect: () => {
        setCurrentTab('devices')
        setDevicesSubTab('rooms')
      },
      category: 'navigation' as const,
    },
    {
      id: 'nav-monitor',
      label: 'Go to Device Monitor',
      description: 'Monitor device health and activity',
      icon: LayoutGridIcon,
      shortcut: ['⌘', 'M'],
      onSelect: () => {
        setCurrentTab('devices')
        setDevicesSubTab('monitor')
      },
      category: 'navigation' as const,
    },
    {
      id: 'nav-scenes',
      label: 'Go to Scenes',
      description: 'Manage and activate scenes',
      icon: PlayIcon,
      shortcut: ['⌘', 'S'],
      onSelect: () => {
        setCurrentTab('control')
        setControlSubTab('scenes')
      },
      category: 'navigation' as const,
    },
    {
      id: 'nav-automations',
      label: 'Go to Automations',
      description: 'Manage automation rules',
      icon: ZapIcon,
      shortcut: ['⌘', 'A'],
      onSelect: () => {
        setCurrentTab('control')
        setControlSubTab('automations')
      },
      category: 'navigation' as const,
    },
    {
      id: 'nav-security',
      label: 'Go to Security',
      description: 'View security cameras and events',
      icon: ShieldCheckIcon,
      shortcut: ['⌘', 'E'],
      onSelect: () => setCurrentTab('security'),
      category: 'navigation' as const,
    },
    {
      id: 'nav-insights',
      label: 'Go to Insights',
      description: 'View analytics and insights',
      icon: LineChartIcon,
      shortcut: ['⌘', 'I'],
      onSelect: () => setCurrentTab('insights'),
      category: 'navigation' as const,
    },
    {
      id: 'nav-users',
      label: 'Go to Users',
      description: 'Manage users and permissions',
      icon: UsersIcon,
      shortcut: ['⌘', 'U'],
      onSelect: () => {
        setCurrentTab('settings')
        setSettingsSubTab('users')
      },
      category: 'navigation' as const,
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'App and device settings',
      icon: SettingsIcon,
      shortcut: ['⌘', ','],
      onSelect: () => {
        setCurrentTab('settings')
        setSettingsSubTab('settings')
      },
      category: 'navigation' as const,
    },
  ]

  // Register keyboard shortcuts
  useKeyboardShortcut('d', () => setCurrentTab('home'), { meta: true })
  useKeyboardShortcut(
    'r',
    () => {
      setCurrentTab('devices')
      setDevicesSubTab('rooms')
    },
    { meta: true }
  )
  useKeyboardShortcut(
    'm',
    () => {
      setCurrentTab('devices')
      setDevicesSubTab('monitor')
    },
    { meta: true }
  )
  useKeyboardShortcut(
    's',
    () => {
      setCurrentTab('control')
      setControlSubTab('scenes')
    },
    { meta: true }
  )
  useKeyboardShortcut(
    'a',
    () => {
      setCurrentTab('control')
      setControlSubTab('automations')
    },
    { meta: true }
  )
  useKeyboardShortcut('e', () => setCurrentTab('security'), { meta: true })
  useKeyboardShortcut('i', () => setCurrentTab('insights'), { meta: true })
  useKeyboardShortcut(
    'u',
    () => {
      setCurrentTab('settings')
      setSettingsSubTab('users')
    },
    { meta: true }
  )
  useKeyboardShortcut(
    ',',
    () => {
      setCurrentTab('settings')
      setSettingsSubTab('settings')
    },
    { meta: true }
  )

  return (
    <div className="from-background via-background to-muted/30 relative min-h-screen bg-gradient-to-br">
      {/* Command Palette - Add to top level */}
      <div className="fixed top-4 right-4 z-50">
        <CommandPalette actions={commandActions} />
      </div>

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
              <div className="border-border bg-card/90 flex items-center justify-between border-b shadow-sm backdrop-blur-sm">
                <TabsList className="h-12 justify-start rounded-none bg-transparent px-6">
                  <TabsTrigger value="rooms" className="data-[state=active]:bg-primary/15">
                    Rooms
                  </TabsTrigger>
                  <TabsTrigger value="monitor" className="data-[state=active]:bg-primary/15">
                    Monitor
                  </TabsTrigger>
                  <TabsTrigger value="energy" className="data-[state=active]:bg-primary/15">
                    Energy
                  </TabsTrigger>
                </TabsList>
                <div className="px-4">
                  <ThemeToggle />
                </div>
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
              <div className="border-border bg-card/90 flex items-center justify-between border-b shadow-sm backdrop-blur-sm">
                <TabsList className="h-12 justify-start rounded-none bg-transparent px-6">
                  <TabsTrigger value="scenes" className="data-[state=active]:bg-primary/15">
                    Scenes
                  </TabsTrigger>
                  <TabsTrigger value="automations" className="data-[state=active]:bg-primary/15">
                    Automations
                  </TabsTrigger>
                </TabsList>
                <div className="px-4">
                  <ThemeToggle />
                </div>
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
              <div className="border-border bg-card/90 flex items-center justify-between border-b shadow-sm backdrop-blur-sm">
                <TabsList className="h-12 justify-start rounded-none bg-transparent px-6">
                  <TabsTrigger value="settings" className="data-[state=active]:bg-primary/15">
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-primary/15">
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="backup" className="data-[state=active]:bg-primary/15">
                    Backup
                  </TabsTrigger>
                  <TabsTrigger value="test" className="data-[state=active]:bg-primary/15">
                    Test Controls
                  </TabsTrigger>
                  <TabsTrigger value="geofence-test" className="data-[state=active]:bg-primary/15">
                    Geofence Test
                  </TabsTrigger>
                  <TabsTrigger value="developer" className="data-[state=active]:bg-primary/15">
                    Developer
                  </TabsTrigger>
                </TabsList>
                <div className="px-4">
                  <ThemeToggle />
                </div>
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
                <TabsContent value="test" className="m-0 h-full overflow-y-auto p-0">
                  <TestAdvancedControls />
                </TabsContent>
                <TabsContent value="geofence-test" className="m-0 h-full overflow-y-auto p-0">
                  <GeofenceTest />
                </TabsContent>
                <TabsContent value="developer" className="m-0 h-full p-0">
                  <LoadingStatesDemo />
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>
        </div>

        <TabsList className="border-border bg-card/95 grid h-16 w-full grid-cols-6 rounded-none border-t p-1 shadow-lg backdrop-blur-xl sm:h-20 sm:p-2">
          <TabsTrigger
            value="home"
            className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary flex min-h-[44px] flex-col gap-0.5 p-1 sm:gap-1 sm:p-2"
          >
            <HouseIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] font-medium sm:text-xs">Home</span>
          </TabsTrigger>

          <TabsTrigger
            value="devices"
            className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary flex min-h-[44px] flex-col gap-0.5 p-1 sm:gap-1 sm:p-2"
          >
            <CogIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] font-medium sm:text-xs">Devices</span>
          </TabsTrigger>

          <TabsTrigger
            value="control"
            className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary flex min-h-[44px] flex-col gap-0.5 p-1 sm:gap-1 sm:p-2"
          >
            <ZapIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] font-medium sm:text-xs">Control</span>
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary flex min-h-[44px] flex-col gap-0.5 p-1 sm:gap-1 sm:p-2"
          >
            <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] font-medium sm:text-xs">Security</span>
          </TabsTrigger>

          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary flex min-h-[44px] flex-col gap-0.5 p-1 sm:gap-1 sm:p-2"
          >
            <LineChartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] font-medium sm:text-xs">Insights</span>
          </TabsTrigger>

          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary flex min-h-[44px] flex-col gap-0.5 p-1 sm:gap-1 sm:p-2"
          >
            <SlidersIconAlt className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] font-medium sm:text-xs">Settings</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Toaster />
    </div>
  )
}

export default App
