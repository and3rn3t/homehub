import { CommandPalette, useKeyboardShortcut } from '@/components/ui/command-palette'
import { IOS26TabBar } from '@/components/ui/ios26-tab-bar'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHaptic } from '@/hooks/use-haptic'
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
import { lazy, Suspense } from 'react'
import { Spinner } from './components/ui/spinner'

// Lazy load heavy components for better performance
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })))
const Rooms = lazy(() => import('./components/Rooms').then(m => ({ default: m.Rooms })))
const DeviceMonitor = lazy(() =>
  import('./components/DeviceMonitor').then(m => ({ default: m.DeviceMonitor }))
)
const Scenes = lazy(() => import('./components/Scenes').then(m => ({ default: m.Scenes })))
const Automations = lazy(() =>
  import('./components/Automations').then(m => ({ default: m.Automations }))
)
const Energy = lazy(() => import('./components/Energy').then(m => ({ default: m.Energy })))
const Security = lazy(() => import('./components/Security').then(m => ({ default: m.Security })))
const InsightsDashboard = lazy(() =>
  import('./components/InsightsDashboard').then(m => ({ default: m.InsightsDashboard }))
)
const UserManagement = lazy(() =>
  import('./components/UserManagement').then(m => ({ default: m.UserManagement }))
)
const BackupRecovery = lazy(() =>
  import('./components/BackupRecovery').then(m => ({ default: m.BackupRecovery }))
)
const DeviceSettings = lazy(() =>
  import('./components/DeviceSettings').then(m => ({ default: m.DeviceSettings }))
)
const MonitoringSettings = lazy(() =>
  import('./components/MonitoringSettings').then(m => ({ default: m.MonitoringSettings }))
)
const Intercom = lazy(() => import('./components/Intercom').then(m => ({ default: m.Intercom })))
const AutomationMonitor = lazy(() =>
  import('./components/AutomationMonitor').then(m => ({ default: m.AutomationMonitor }))
)

// Small components can be loaded normally
import { GeofenceTest } from './components/GeofenceTest'
import { LoadingStatesDemo } from './components/LoadingStatesDemo'
import { OfflineBanner } from './components/OfflineBanner'
import { TestAdvancedControls } from './components/TestAdvancedControls'
import { ThemeToggle } from './components/ThemeToggle'
import { UpdateBanner } from './components/UpdateBanner'

// Loading fallback component
function TabContentLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  const haptic = useHaptic()
  const [currentTab, setCurrentTab] = useKV('current-tab', 'home')
  const [devicesSubTab, setDevicesSubTab] = useKV('devices-subtab', 'rooms')
  const [controlSubTab, setControlSubTab] = useKV('control-subtab', 'scenes')
  const [settingsSubTab, setSettingsSubTab] = useKV('settings-subtab', 'settings')

  // Badge tracking for tab bar
  const [securityEvents] = useKV<Array<{ acknowledged: boolean }>>('security-events', [])
  const unreadSecurityEvents = securityEvents.filter(event => !event.acknowledged).length

  // Wrapped setters with haptic feedback
  const handleTabChange = (tab: string) => {
    haptic.light() // Light haptic on tab switch
    setCurrentTab(tab)
  }

  const handleDevicesSubTabChange = (tab: string) => {
    haptic.light()
    setDevicesSubTab(tab)
  }

  const handleControlSubTabChange = (tab: string) => {
    haptic.light()
    setControlSubTab(tab)
  }

  const handleSettingsSubTabChange = (tab: string) => {
    haptic.light()
    setSettingsSubTab(tab)
  }

  // Command palette actions
  const commandActions = [
    // Navigation - Main Tabs
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View home overview and quick controls',
      icon: HouseIcon,
      shortcut: ['⌘', 'D'],
      onSelect: () => {
        haptic.medium()
        setCurrentTab('home')
      },
      category: 'navigation' as const,
    },
    {
      id: 'nav-rooms',
      label: 'Go to Rooms',
      description: 'View and manage rooms',
      icon: HomeRoomIcon,
      shortcut: ['⌘', 'R'],
      onSelect: () => {
        haptic.medium()
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
        haptic.medium()
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
        haptic.medium()
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
        haptic.medium()
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
      onSelect: () => {
        haptic.medium()
        setCurrentTab('security')
      },
      category: 'navigation' as const,
    },
    {
      id: 'nav-insights',
      label: 'Go to Insights',
      description: 'View analytics and insights',
      icon: LineChartIcon,
      shortcut: ['⌘', 'I'],
      onSelect: () => {
        haptic.medium()
        setCurrentTab('insights')
      },
      category: 'navigation' as const,
    },
    {
      id: 'nav-users',
      label: 'Go to Users',
      description: 'Manage users and permissions',
      icon: UsersIcon,
      shortcut: ['⌘', 'U'],
      onSelect: () => {
        haptic.medium()
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
        haptic.medium()
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

  // Tab bar items configuration
  const mainTabItems = [
    { id: 'home', label: 'Home', icon: HouseIcon },
    { id: 'devices', label: 'Devices', icon: CogIcon },
    { id: 'control', label: 'Control', icon: ZapIcon },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldCheckIcon,
      badge: unreadSecurityEvents > 0 ? unreadSecurityEvents : undefined,
    },
    { id: 'insights', label: 'Insights', icon: LineChartIcon, badge: 'new' },
    { id: 'settings', label: 'Settings', icon: SlidersIconAlt },
  ]

  return (
    <div className="from-background via-background to-muted/30 fixed inset-0 bg-gradient-to-br">
      {/* WCAG 2.4.1 - Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground focus:ring-ring sr-only absolute top-4 left-4 z-[100] rounded-lg px-4 py-2 font-medium shadow-lg focus:not-sr-only focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Update notification banner */}
      <UpdateBanner />

      {/* Offline indicator banner */}
      <OfflineBanner />

      {/* Command Palette - Centered at top to avoid all overlaps, with safe-area padding */}
      <div className="safe-top fixed left-1/2 z-50 -translate-x-1/2 pt-2">
        <CommandPalette actions={commandActions} />
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="flex h-full flex-col">
        {/* Main content area with safe-area padding and mobile-optimized scrolling */}
        <div className="mobile-scroll safe-mb flex-1 overflow-hidden pb-20">
          {/* pb-20 for tab bar space */}
          <TabsContent value="home" className="m-0 h-full p-0" id="main-content">
            <Suspense fallback={<TabContentLoader />}>
              <Dashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="devices" className="m-0 h-full p-0">
            <Tabs
              value={devicesSubTab}
              onValueChange={handleDevicesSubTabChange}
              className="flex h-full flex-col"
            >
              <div className="border-border bg-card/90 safe-x flex items-center justify-between border-b shadow-sm backdrop-blur-sm">
                <TabsList className="h-12 justify-start rounded-none bg-transparent px-2 sm:px-6">
                  <TabsTrigger
                    value="rooms"
                    className="touch-target data-[state=active]:bg-primary/15 px-3 text-sm sm:px-4"
                  >
                    Rooms
                  </TabsTrigger>
                  <TabsTrigger
                    value="monitor"
                    className="touch-target data-[state=active]:bg-primary/15 px-3 text-sm sm:px-4"
                  >
                    Monitor
                  </TabsTrigger>
                  <TabsTrigger
                    value="energy"
                    className="touch-target data-[state=active]:bg-primary/15 px-3 text-sm sm:px-4"
                  >
                    Energy
                  </TabsTrigger>
                </TabsList>
                <div className="px-2 sm:px-4">
                  <ThemeToggle />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="rooms" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <Rooms />
                  </Suspense>
                </TabsContent>
                <TabsContent value="monitor" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <DeviceMonitor />
                  </Suspense>
                </TabsContent>
                <TabsContent value="energy" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <Energy />
                  </Suspense>
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>

          <TabsContent value="control" className="m-0 h-full p-0">
            <Tabs
              value={controlSubTab}
              onValueChange={handleControlSubTabChange}
              className="flex h-full flex-col"
            >
              <div className="border-border bg-card/90 safe-x flex items-center justify-between border-b shadow-sm backdrop-blur-sm">
                <TabsList className="h-12 justify-start rounded-none bg-transparent px-2 sm:px-6">
                  <TabsTrigger
                    value="scenes"
                    className="touch-target data-[state=active]:bg-primary/15 px-3 text-sm sm:px-4"
                  >
                    Scenes
                  </TabsTrigger>
                  <TabsTrigger
                    value="automations"
                    className="touch-target data-[state=active]:bg-primary/15 px-3 text-sm sm:px-4"
                  >
                    Automations
                  </TabsTrigger>
                  <TabsTrigger
                    value="monitor"
                    className="touch-target data-[state=active]:bg-primary/15 px-3 text-sm sm:px-4"
                  >
                    Monitor
                  </TabsTrigger>
                </TabsList>
                <div className="px-2 sm:px-4">
                  <ThemeToggle />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="scenes" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <Scenes />
                  </Suspense>
                </TabsContent>
                <TabsContent value="automations" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <Automations />
                  </Suspense>
                </TabsContent>
                <TabsContent value="monitor" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <AutomationMonitor />
                  </Suspense>
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>

          <TabsContent value="security" className="m-0 h-full p-0">
            <Suspense fallback={<TabContentLoader />}>
              <Security />
            </Suspense>
          </TabsContent>

          <TabsContent value="insights" className="m-0 h-full p-0">
            <Suspense fallback={<TabContentLoader />}>
              <InsightsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="m-0 h-full p-0">
            <Tabs
              value={settingsSubTab}
              onValueChange={handleSettingsSubTabChange}
              className="flex h-full flex-col"
            >
              <div className="border-border bg-card/90 safe-x border-b shadow-sm backdrop-blur-sm">
                <div className="scrollbar-hide flex items-center justify-between overflow-x-auto">
                  <TabsList className="scrollbar-hide h-12 flex-nowrap justify-start overflow-x-auto rounded-none bg-transparent px-2 sm:px-6">
                    <TabsTrigger
                      value="settings"
                      className="touch-target data-[state=active]:bg-primary/15 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
                    >
                      Settings
                    </TabsTrigger>
                    <TabsTrigger
                      value="users"
                      className="touch-target data-[state=active]:bg-primary/15 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
                    >
                      Users
                    </TabsTrigger>
                    <TabsTrigger
                      value="monitoring"
                      className="touch-target data-[state=active]:bg-primary/15 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
                    >
                      Monitoring
                    </TabsTrigger>
                    <TabsTrigger
                      value="intercom"
                      className="touch-target data-[state=active]:bg-primary/15 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
                    >
                      Intercom
                    </TabsTrigger>
                    <TabsTrigger
                      value="backup"
                      className="touch-target data-[state=active]:bg-primary/15 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
                    >
                      Backup
                    </TabsTrigger>
                    <TabsTrigger
                      value="test"
                      className="touch-target data-[state=active]:bg-primary/15 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
                    >
                      Test
                    </TabsTrigger>
                    <TabsTrigger
                      value="geofence-test"
                      className="touch-target data-[state=active]:bg-primary/15 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
                    >
                      Geofence
                    </TabsTrigger>
                    <TabsTrigger
                      value="developer"
                      className="touch-target data-[state=active]:bg-primary/15 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
                    >
                      Developer
                    </TabsTrigger>
                  </TabsList>
                  <div className="shrink-0 px-2 sm:px-4">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="settings" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <DeviceSettings />
                  </Suspense>
                </TabsContent>
                <TabsContent value="users" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <UserManagement />
                  </Suspense>
                </TabsContent>
                <TabsContent value="monitoring" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <MonitoringSettings />
                  </Suspense>
                </TabsContent>
                <TabsContent value="intercom" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <Intercom />
                  </Suspense>
                </TabsContent>
                <TabsContent value="backup" className="m-0 h-full p-0">
                  <Suspense fallback={<TabContentLoader />}>
                    <BackupRecovery />
                  </Suspense>
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
      </Tabs>

      {/* iOS 26 Dynamic Floating Tab Bar - Outside Tabs for proper z-index */}
      <IOS26TabBar items={mainTabItems} value={currentTab} onValueChange={setCurrentTab} />

      <Toaster />
    </div>
  )
}

export default App
