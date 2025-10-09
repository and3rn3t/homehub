import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKV } from '@/hooks/use-kv'
import { House, SquaresFour, Gear, Lightning, ChartBar, ShieldCheck, Sliders, Activity, Users, ChartLine, HardDrives } from "@phosphor-icons/react"
import { Toaster } from "@/components/ui/sonner"
import { Dashboard } from './components/Dashboard'
import { Rooms } from './components/Rooms'
import { Automations } from './components/Automations'
import { Scenes } from './components/Scenes'
import { Energy } from './components/Energy'
import { Security } from './components/Security'
import { DeviceSettings } from './components/DeviceSettings'
import { DeviceMonitor } from './components/DeviceMonitor'
import { UserManagement } from './components/UserManagement'
import { InsightsDashboard } from './components/InsightsDashboard'
import { BackupRecovery } from './components/BackupRecovery'

function App() {
  const [currentTab, setCurrentTab] = useKV("current-tab", "dashboard")

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-screen flex flex-col">
        <div className="flex-1 overflow-hidden">
          <TabsContent value="dashboard" className="h-full m-0 p-0">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="rooms" className="h-full m-0 p-0">
            <Rooms />
          </TabsContent>
          
          <TabsContent value="automations" className="h-full m-0 p-0">
            <Automations />
          </TabsContent>
          
          <TabsContent value="scenes" className="h-full m-0 p-0">
            <Scenes />
          </TabsContent>
          
          <TabsContent value="energy" className="h-full m-0 p-0">
            <Energy />
          </TabsContent>
          
          <TabsContent value="monitor" className="h-full m-0 p-0">
            <DeviceMonitor />
          </TabsContent>
          
          <TabsContent value="security" className="h-full m-0 p-0">
            <Security />
          </TabsContent>
          
          <TabsContent value="users" className="h-full m-0 p-0">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="insights" className="h-full m-0 p-0">
            <InsightsDashboard />
          </TabsContent>
          
          <TabsContent value="backup" className="h-full m-0 p-0">
            <BackupRecovery />
          </TabsContent>
          
          <TabsContent value="settings" className="h-full m-0 p-0">
            <DeviceSettings />
          </TabsContent>
        </div>

        <TabsList className="grid w-full grid-cols-11 h-20 bg-card/80 backdrop-blur-xl border-t border-border rounded-none p-2">
          <TabsTrigger 
            value="dashboard" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <House size={20} weight="regular" />
            <span className="text-xs font-medium">Home</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="rooms" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <SquaresFour size={20} weight="regular" />
            <span className="text-xs font-medium">Rooms</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="automations" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Gear size={20} weight="regular" />
            <span className="text-xs font-medium">Auto</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="scenes" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Lightning size={20} weight="regular" />
            <span className="text-xs font-medium">Scenes</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="energy" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <ChartBar size={20} weight="regular" />
            <span className="text-xs font-medium">Energy</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="monitor" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Activity size={20} weight="regular" />
            <span className="text-xs font-medium">Monitor</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="security" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <ShieldCheck size={20} weight="regular" />
            <span className="text-xs font-medium">Security</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="users" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Users size={20} weight="regular" />
            <span className="text-xs font-medium">Users</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="insights" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <ChartLine size={20} weight="regular" />
            <span className="text-xs font-medium">Insights</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="backup" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <HardDrives size={20} weight="regular" />
            <span className="text-xs font-medium">Backup</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="settings" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Sliders size={20} weight="regular" />
            <span className="text-xs font-medium">Settings</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Toaster />
    </div>
  )
}

export default App