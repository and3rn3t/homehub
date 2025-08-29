import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Settings, Zap, Calendar, BarChart3 } from "@phosphor-icons/react"
import { Toaster } from "@/components/ui/sonner"
import { Dashboard } from './components/Dashboard'
import { Rooms } from './components/Rooms'
import { Automations } from './components/Automations'
import { Scenes } from './components/Scenes'
import { Energy } from './components/Energy'
import { DeviceSettings } from './components/DeviceSettings'

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
          
          <TabsContent value="settings" className="h-full m-0 p-0">
            <DeviceSettings />
          </TabsContent>
        </div>

        <TabsList className="grid w-full grid-cols-6 h-20 bg-card/80 backdrop-blur-xl border-t border-border rounded-none p-2">
          <TabsTrigger 
            value="dashboard" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Home size={24} weight="regular" />
            <span className="text-xs font-medium">Home</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="rooms" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
              <div className="bg-current opacity-60 rounded-sm"></div>
              <div className="bg-current opacity-60 rounded-sm"></div>
              <div className="bg-current opacity-60 rounded-sm"></div>
              <div className="bg-current opacity-60 rounded-sm"></div>
            </div>
            <span className="text-xs font-medium">Rooms</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="automations" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Settings size={24} weight="regular" />
            <span className="text-xs font-medium">Auto</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="scenes" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Zap size={24} weight="regular" />
            <span className="text-xs font-medium">Scenes</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="energy" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <BarChart3 size={24} weight="regular" />
            <span className="text-xs font-medium">Energy</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="settings" 
            className="flex flex-col gap-1 p-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Calendar size={24} weight="regular" />
            <span className="text-xs font-medium">Settings</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Toaster />
    </div>
  )
}

export default App