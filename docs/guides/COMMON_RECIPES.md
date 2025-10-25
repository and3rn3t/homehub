# Common Recipes Guide

**Purpose**: Step-by-step guides for common HomeHub development tasks.

**Last Updated**: October 16, 2025

---

## Table of Contents

- [Adding a New Device Type](#adding-a-new-device-type)
- [Adding a New Protocol Adapter](#adding-a-new-protocol-adapter)
- [Creating a New Automation Trigger](#creating-a-new-automation-trigger)
- [Adding a New Tab/Section](#adding-a-new-tabsection)
- [Creating a Custom Hook](#creating-a-custom-hook)
- [Adding a New UI Component](#adding-a-new-ui-component)
- [Implementing a New Service](#implementing-a-new-service)

---

## Adding a New Device Type

**Goal**: Add support for a new device category (e.g., "lock", "camera", "speaker")

### Step 1: Update Type Definition

**File**: `src/types/device.types.ts`

```typescript
// Add new type to union
export type DeviceType = 'light' | 'thermostat' | 'security' | 'sensor' | 'lock' // ← New type
```

### Step 2: Add Icon Mapping

**File**: `src/constants/device-icons.ts`

```typescript
import { LockIcon } from '@/lib/icons'

export const DEVICE_ICONS: Record<DeviceType, any> = {
  light: LightbulbIcon,
  thermostat: ThermometerIcon,
  security: ShieldIcon,
  sensor: SensorsIcon,
  lock: LockIcon, // ← New mapping
}
```

### Step 3: Add Mock Data (Optional)

**File**: `src/constants/mock-data.ts`

```typescript
{
  id: 'lock-1',
  name: 'Front Door Lock',
  type: 'lock',
  room: 'Entryway',
  status: 'online',
  enabled: true,
  protocol: 'zigbee',
},
```

### Step 4: Update UI Components

Components using device type filtering should automatically support the new type.

**Test**: Verify device shows in Dashboard and Rooms with correct icon.

---

## Adding a New Protocol Adapter

**Goal**: Add support for a new device protocol (e.g., Zigbee, Z-Wave, Thread)

### Step 1: Create Adapter File

**File**: `src/services/devices/ZigbeeAdapter.ts`

```typescript
import type { Device } from '@/types'

/**
 * Zigbee device control adapter.
 * Uses ConBee II USB coordinator for device communication.
 */
export class ZigbeeAdapter {
  private static coordinatorUrl = 'http://localhost:8080'

  /**
   * Initialize Zigbee adapter with coordinator URL
   */
  static initialize(coordinatorUrl: string): void {
    this.coordinatorUrl = coordinatorUrl
  }

  /**
   * Control Zigbee device state
   * @param deviceId - Zigbee device IEEE address
   * @param state - Desired state changes
   */
  static async control(
    deviceId: string,
    state: {
      on?: boolean
      brightness?: number
    }
  ): Promise<void> {
    const response = await fetch(`${this.coordinatorUrl}/api/lights/${deviceId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })

    if (!response.ok) {
      throw new Error(`Zigbee control failed: ${response.statusText}`)
    }
  }

  /**
   * Discover Zigbee devices on network
   */
  static async discover(): Promise<Device[]> {
    const response = await fetch(`${this.coordinatorUrl}/api/lights`)
    const data = await response.json()

    return Object.entries(data).map(([id, light]: [string, any]) => ({
      id: `zigbee-${id}`,
      name: light.name,
      type: 'light',
      room: 'Unknown',
      status: light.state.reachable ? 'online' : 'offline',
      enabled: light.state.on,
      protocol: 'zigbee',
      config: { deviceId: id },
    }))
  }
}
```

### Step 2: Update Device Type

**File**: `src/types/device.types.ts`

```typescript
export type DeviceProtocol = 'mqtt' | 'http' | 'hue' | 'zigbee' // ← New protocol
```

### Step 3: Add to Device Control Logic

**File**: `src/components/Dashboard.tsx` (or wherever device control lives)

```typescript
import { ZigbeeAdapter } from '@/services/devices/ZigbeeAdapter'

const controlDevice = async (device: Device, enabled: boolean) => {
  switch (device.protocol) {
    case 'hue':
      await HueBridgeAdapter.setLightState(/* ... */)
      break
    case 'http':
      await HTTPDeviceAdapter.control(/* ... */)
      break
    case 'zigbee': // ← New case
      await ZigbeeAdapter.control(device.config!.deviceId!, { on: enabled })
      break
    default:
      throw new Error(`Unsupported protocol: ${device.protocol}`)
  }
}
```

### Step 4: Add to Discovery Manager

**File**: `src/services/discovery/DiscoveryManager.ts`

```typescript
import { ZigbeeAdapter } from '@/services/devices/ZigbeeAdapter'

export interface DiscoveryOptions {
  // ... existing options
  zigbee?: {
    coordinatorUrl: string
  }
}

static async discoverAll(options: DiscoveryOptions): Promise<Device[]> {
  const promises: Promise<Device[]>[] = []

  // ... existing protocols

  if (options.zigbee) {
    ZigbeeAdapter.initialize(options.zigbee.coordinatorUrl)
    promises.push(ZigbeeAdapter.discover())
  }

  // ... rest of logic
}
```

### Step 5: Write Tests

**File**: `src/services/devices/ZigbeeAdapter.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { ZigbeeAdapter } from './ZigbeeAdapter'

global.fetch = vi.fn()

describe('ZigbeeAdapter', () => {
  it('should control device', async () => {
    ;(fetch as any).mockResolvedValueOnce({ ok: true })

    await expect(ZigbeeAdapter.control('device-1', { on: true })).resolves.not.toThrow()
  })
})
```

---

## Creating a New Automation Trigger

**Goal**: Add a new trigger type (e.g., "sunrise/sunset", "weather condition")

### Step 1: Update Type Definition

**File**: `src/types/automation.types.ts`

```typescript
export type TriggerType = 'time' | 'condition' | 'geofence' | 'device-state' | 'solar' // ← New trigger type

export interface AutomationTrigger {
  type: TriggerType
  // ... existing fields

  // Solar trigger fields
  event?: 'sunrise' | 'sunset'
  offset?: number // Minutes before/after event
}
```

### Step 2: Create Trigger Service

**File**: `src/services/automation/SolarTrigger.ts`

```typescript
import type { Automation } from '@/types'
import SunCalc from 'suncalc'

export class SolarTrigger {
  private static location = { lat: 37.7749, lng: -122.4194 } // Default: SF
  private static intervals = new Map<string, NodeJS.Timeout>()

  /**
   * Set user location for solar calculations
   */
  static setLocation(lat: number, lng: number): void {
    this.location = { lat, lng }
  }

  /**
   * Start solar trigger for automation
   */
  static start(automation: Automation, callback: () => void): void {
    if (!automation.trigger.event) {
      throw new Error('Solar trigger requires event (sunrise/sunset)')
    }

    const scheduleNext = () => {
      const now = new Date()
      const times = SunCalc.getTimes(now, this.location.lat, this.location.lng)

      let targetTime = automation.trigger.event === 'sunrise' ? times.sunrise : times.sunset

      // Apply offset (minutes)
      if (automation.trigger.offset) {
        targetTime = new Date(targetTime.getTime() + automation.trigger.offset * 60000)
      }

      // If time has passed today, schedule for tomorrow
      if (targetTime < now) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowTimes = SunCalc.getTimes(tomorrow, this.location.lat, this.location.lng)
        targetTime =
          automation.trigger.event === 'sunrise' ? tomorrowTimes.sunrise : tomorrowTimes.sunset
      }

      const delay = targetTime.getTime() - now.getTime()

      const timeoutId = setTimeout(() => {
        callback()
        scheduleNext() // Reschedule for next day
      }, delay)

      this.intervals.set(automation.id, timeoutId)
    }

    scheduleNext()
  }

  /**
   * Stop solar trigger
   */
  static stop(automationId: string): void {
    const timeoutId = this.intervals.get(automationId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.intervals.delete(automationId)
    }
  }
}
```

### Step 3: Integrate with Automation Engine

**File**: Where automations are started (e.g., `src/components/Automations.tsx`)

```typescript
import { SolarTrigger } from '@/services/automation/SolarTrigger'

const startAutomation = (automation: Automation) => {
  switch (automation.trigger.type) {
    case 'time':
      Scheduler.start(automation, () => executeAutomation(automation))
      break
    case 'solar': // ← New case
      SolarTrigger.start(automation, () => executeAutomation(automation))
      break
    // ... other cases
  }
}
```

### Step 4: Add UI for Configuration

**File**: `src/components/Automations.tsx`

```typescript
{automation.trigger.type === 'solar' && (
  <>
    <Select
      value={automation.trigger.event}
      onValueChange={(value) => updateTrigger({ event: value })}
    >
      <SelectItem value="sunrise">Sunrise</SelectItem>
      <SelectItem value="sunset">Sunset</SelectItem>
    </Select>

    <Input
      type="number"
      placeholder="Offset (minutes)"
      value={automation.trigger.offset || 0}
      onChange={(e) => updateTrigger({ offset: parseInt(e.target.value) })}
    />
  </>
)}
```

---

## Adding a New Tab/Section

**Goal**: Add a new main navigation tab (e.g., "Weather", "Music")

### Step 1: Create Component

**File**: `src/components/Weather.tsx`

```typescript
import { Card } from '@/components/ui/card'
import { CloudIcon } from '@/lib/icons'

export function Weather() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <CloudIcon className="h-6 w-6" />
        Weather
      </h1>

      <Card className="p-6">
        <p>Weather forecast goes here</p>
      </Card>
    </div>
  )
}
```

### Step 2: Add to App Navigation

**File**: `src/App.tsx`

```typescript
// Import new component
import { Weather } from '@/components/Weather'

// Add tab type
type Tab =
  | 'dashboard'
  | 'rooms'
  // ... existing tabs
  | 'weather'  // ← New tab

// Add to render logic
export function App() {
  const [currentTab, setCurrentTab] = useKV<Tab>('current-tab', 'dashboard')

  return (
    <>
      {currentTab === 'dashboard' && <Dashboard />}
      {currentTab === 'rooms' && <Rooms />}
      {/* ... other tabs ... */}
      {currentTab === 'weather' && <Weather />}  {/* ← New tab */}

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 ...">
        {/* ... existing tab buttons ... */}
        <button onClick={() => setCurrentTab('weather')}>
          <CloudIcon className="h-5 w-5" />
          <span>Weather</span>
        </button>
      </div>
    </>
  )
}
```

### Step 3: (Optional) Lazy Load Component

```typescript
// For better performance
const Weather = lazy(() => import('@/components/Weather'))

{currentTab === 'weather' && (
  <Suspense fallback={<LoadingSpinner />}>
    <Weather />
  </Suspense>
)}
```

---

## Creating a Custom Hook

**Goal**: Extract reusable logic into a custom hook

### Step 1: Create Hook File

**File**: `src/hooks/use-network-status.ts`

```typescript
import { useState, useEffect } from 'react'

/**
 * Monitor network online/offline status
 * @returns Current network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Step 2: Write Tests

**File**: `src/hooks/use-network-status.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from './use-network-status'

describe('useNetworkStatus', () => {
  it('should return current online status', () => {
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(navigator.onLine)
  })

  it('should update on offline event', () => {
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })
})
```

### Step 3: Use in Components

```typescript
import { useNetworkStatus } from '@/hooks/use-network-status'

export function Dashboard() {
  const isOnline = useNetworkStatus()

  return (
    <div>
      {!isOnline && (
        <div className="bg-red-500 text-white p-2 text-center">
          You are offline. Some features may not work.
        </div>
      )}
      {/* Rest of component */}
    </div>
  )
}
```

---

## Adding a New UI Component

**Goal**: Add a new shadcn/ui component to the project

### Step 1: Use shadcn CLI

```bash
npx shadcn@latest add <component-name>

# Example:
npx shadcn@latest add slider
npx shadcn@latest add tabs
npx shadcn@latest add popover
```

This automatically:

- Downloads component file to `src/components/ui/`
- Installs required dependencies
- Applies your theme configuration

### Step 2: Import and Use

```typescript
import { Slider } from '@/components/ui/slider'

export function BrightnessControl({ value, onChange }: Props) {
  return (
    <Slider
      value={[value]}
      onValueChange={([newValue]) => onChange(newValue)}
      min={0}
      max={100}
      step={1}
    />
  )
}
```

### Step 3: Customize (Optional)

**File**: `src/components/ui/slider.tsx`

Modify the generated component if needed, but avoid major changes that break updates.

---

## Implementing a New Service

**Goal**: Create a new service class for business logic

### Step 1: Create Service File

**File**: `src/services/weather/WeatherService.ts`

```typescript
/**
 * Weather data service using OpenWeatherMap API
 */
export class WeatherService {
  private static apiKey: string
  private static baseUrl = 'https://api.openweathermap.org/data/2.5'

  /**
   * Initialize service with API key
   */
  static initialize(apiKey: string): void {
    this.apiKey = apiKey
  }

  /**
   * Get current weather for location
   * @param lat - Latitude
   * @param lng - Longitude
   */
  static async getCurrentWeather(lat: number, lng: number) {
    const response = await fetch(
      `${this.baseUrl}/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch weather data')
    }

    return response.json()
  }
}
```

### Step 2: Export from Index

**File**: `src/services/index.ts`

```typescript
export { WeatherService } from './weather/WeatherService'
```

### Step 3: Use in Components

```typescript
import { WeatherService } from '@/services'

export function Weather() {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    WeatherService.initialize(import.meta.env.VITE_WEATHER_API_KEY)

    const loadWeather = async () => {
      const data = await WeatherService.getCurrentWeather(37.7749, -122.4194)
      setWeather(data)
    }

    loadWeather()
  }, [])

  // ... rest of component
}
```

---

## Quick Reference

| Task            | Primary Files                                 | Key Patterns                     |
| --------------- | --------------------------------------------- | -------------------------------- |
| New Device Type | `device.types.ts`, `device-icons.ts`          | Update union type, add icon      |
| New Protocol    | `services/devices/`, `DiscoveryManager.ts`    | Create adapter, add to switch    |
| New Trigger     | `automation.types.ts`, `services/automation/` | Update type, create service      |
| New Tab         | `App.tsx`, `components/`                      | Add component, update navigation |
| Custom Hook     | `hooks/use-*.ts`                              | useState + useEffect pattern     |
| UI Component    | CLI: `npx shadcn add`                         | Auto-generated in `ui/`          |
| New Service     | `services/*/ServiceName.ts`                   | Static class with methods        |

---

**Note**: Always run tests (`npm test`) and validation (`npm run validate`) after making changes!
