# Milestone 2.2.4 - Real Device Control Commands

**Date**: October 10, 2025
**Status**: 🚧 In Progress
**Phase**: 2.2 - HTTP Device Integration
**Previous**: Milestone 2.2.3 - Multi-Protocol Device Discovery ✅
**Duration Estimate**: 1 week (5-8 hours implementation + testing)

---

## 🎯 Objective

Implement real HTTP command execution to control discovered smart home devices. Transform the UI from "display-only" to "fully functional" by sending actual control commands to devices and handling responses.

---

## 📋 Current State Analysis

### What We Have ✅

1. **Device Discovery** - HTTPScanner finds Shelly, TP-Link, Hue devices
2. **Device Storage** - Devices saved to KV store with full metadata
3. **Room Assignment** - Devices organized by room
4. **Enhanced UI** - Beautiful cards with toggle interactions
5. **Mock Control** - UI toggles work but don't actually control devices

### What's Missing ❌

1. **Real HTTP Commands** - No actual POST/PUT requests to devices
2. **Protocol-Specific Logic** - Each manufacturer has different APIs
3. **State Synchronization** - Device state changes not reflected in UI
4. **Error Handling** - Network failures, timeouts, unreachable devices
5. **Loading States** - No feedback during command execution
6. **Command Queue** - No retry logic or command persistence

---

## 🏗️ Architecture Design

### Device Adapter Pattern

```typescript
// Base adapter interface
interface DeviceAdapter {
  // Core capabilities
  turnOn(device: Device): Promise<DeviceCommandResult>
  turnOff(device: Device): Promise<DeviceCommandResult>
  getState(device: Device): Promise<DeviceState>

  // Extended capabilities (optional)
  setBrightness?(device: Device, value: number): Promise<DeviceCommandResult>
  setColor?(device: Device, color: string): Promise<DeviceCommandResult>

  // Metadata
  supportsCapability(capability: string): boolean
}

// Command result
interface DeviceCommandResult {
  success: boolean
  newState?: DeviceState
  error?: string
  duration?: number // Command execution time in ms
}

// Device state
interface DeviceState {
  enabled: boolean
  value?: number // brightness, temperature, etc.
  unit?: string
  online: boolean
  lastSeen: Date
}
```

### Adapter Implementations

#### 1. ShellyAdapter (Priority 1)

**Why Shelly First?**

- Simplest REST API (no authentication needed)
- JSON-based communication
- Clear documentation
- Most common in DIY smart home setups

**API Endpoints**:

```typescript
// Turn relay ON
POST http://{ip}/rpc/Switch.Set
Body: { "id": 0, "on": true }
Response: { "was_on": false }

// Turn relay OFF
POST http://{ip}/rpc/Switch.Set
Body: { "id": 0, "on": false }
Response: { "was_on": true }

// Get current state
POST http://{ip}/rpc/Switch.GetStatus
Body: { "id": 0 }
Response: { "id": 0, "output": true, "source": "UI" }

// For lights (Shelly Bulb, RGBW2)
POST http://{ip}/rpc/Light.Set
Body: { "id": 0, "on": true, "brightness": 75 }
Response: { "was_on": false }
```

**Implementation Plan**:

```typescript
// src/services/devices/ShellyAdapter.ts
export class ShellyAdapter implements DeviceAdapter {
  private baseUrl: string
  private timeout = 5000 // 5 second timeout

  constructor(ip: string, port: number) {
    this.baseUrl = `http://${ip}:${port}`
  }

  async turnOn(device: Device): Promise<DeviceCommandResult> {
    const startTime = Date.now()
    try {
      const response = await fetch(`${this.baseUrl}/rpc/Switch.Set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 0, on: true }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      return {
        success: true,
        newState: { enabled: true, online: true, lastSeen: new Date() },
        duration,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }
    }
  }

  // turnOff, getState, etc. follow same pattern
}
```

#### 2. TPLinkAdapter (Priority 2)

**Complexity**: Medium - requires encryption

**Challenge**: TP-Link Kasa devices use proprietary encryption:

```typescript
// XOR cipher with autokey
function encrypt(input: string): Buffer {
  let key = 0xab
  const buffer = Buffer.alloc(input.length)

  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i)
    buffer[i] = charCode ^ key
    key = buffer[i]
  }

  return buffer
}

// Commands are JSON encrypted
const command = { system: { set_relay_state: { state: 1 } } }
const encrypted = encrypt(JSON.stringify(command))

// Send to port 9999 (not HTTP!)
const socket = net.connect(9999, ip)
socket.write(encrypted)
```

**Decision**: **Defer to Phase 2.3** - Too complex for initial implementation

#### 3. HueAdapter (Priority 3)

**Complexity**: Medium - requires authentication

**Challenge**: Hue bridge needs "link button" press for API key:

```typescript
// Step 1: Press link button on bridge
// Step 2: Request API key
POST http://{bridge-ip}/api
Body: { "devicetype": "homehub#user" }
Response: [{ "success": { "username": "abc123..." } }]

// Step 3: Use API key for commands
PUT http://{bridge-ip}/api/{username}/lights/1/state
Body: { "on": true, "bri": 254 }
```

**Decision**: **Defer to Phase 2.3** - Requires onboarding flow

---

## 🚀 Implementation Plan

### Phase 1: Adapter Architecture (Day 1 - 1 hour)

**Files to Create**:

1. `src/services/devices/types.ts` - Interfaces and types
2. `src/services/devices/BaseAdapter.ts` - Abstract base class
3. `src/services/devices/index.ts` - Barrel exports

**Type Definitions**:

```typescript
// src/services/devices/types.ts
export type DeviceCapability = 'turn_on' | 'turn_off' | 'brightness' | 'color' | 'temperature'

export interface DeviceAdapter {
  turnOn(device: Device): Promise<DeviceCommandResult>
  turnOff(device: Device): Promise<DeviceCommandResult>
  getState(device: Device): Promise<DeviceState>
  setBrightness?(device: Device, value: number): Promise<DeviceCommandResult>
  setColor?(device: Device, color: string): Promise<DeviceCommandResult>
  supportsCapability(capability: DeviceCapability): boolean
}

export interface DeviceCommandResult {
  success: boolean
  newState?: Partial<DeviceState>
  error?: string
  duration?: number
  timestamp: Date
}

export interface DeviceState {
  enabled: boolean
  value?: number
  unit?: string
  online: boolean
  lastSeen: Date
}

export class CommandError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'NETWORK' | 'DEVICE_ERROR' | 'UNKNOWN',
    public deviceId: string
  ) {
    super(message)
    this.name = 'CommandError'
  }
}
```

### Phase 2: Shelly Adapter Implementation (Day 1-2 - 2 hours)

**File**: `src/services/devices/ShellyAdapter.ts` (~200 lines)

**Features**:

- ✅ Switch control (on/off)
- ✅ Light control (brightness 0-100)
- ✅ State polling (getState)
- ✅ Timeout handling (5 second default)
- ✅ Error categorization (network vs device errors)
- ✅ Retry logic with exponential backoff

**Implementation**:

```typescript
export class ShellyAdapter implements DeviceAdapter {
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly maxRetries: number

  constructor(ip: string, port: number = 80, options?: { timeout?: number; maxRetries?: number }) {
    this.baseUrl = `http://${ip}:${port}`
    this.timeout = options?.timeout ?? 5000
    this.maxRetries = options?.maxRetries ?? 3
  }

  // Core methods with retry logic
  private async executeWithRetry<T>(fn: () => Promise<T>, deviceId: string): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new CommandError(
      `Failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      'NETWORK',
      deviceId
    )
  }

  // Implement interface methods...
}
```

### Phase 3: Dashboard Integration (Day 2-3 - 2 hours)

**Update**: `src/components/Dashboard.tsx`

**Changes**:

1. Import adapter and types
2. Add command execution state
3. Replace mock toggle with real command
4. Show loading state during command
5. Handle errors with toast notifications
6. Update device state on success

**Code Changes**:

```typescript
// Add imports
import { ShellyAdapter } from '@/services/devices/ShellyAdapter'
import type { DeviceCommandResult } from '@/services/devices/types'

// Add state for command execution
const [executingCommands, setExecutingCommands] = useState<Set<string>>(new Set())

// Replace mock toggle function
const toggleDevice = async (deviceId: string) => {
  const device = devices.find(d => d.id === deviceId)
  if (!device) return

  // Optimistic update
  setDevices(prev => prev.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d)))

  // Add to executing set
  setExecutingCommands(prev => new Set(prev).add(deviceId))

  try {
    // Create adapter based on device protocol
    const adapter = new ShellyAdapter(device.ip!, device.port!)

    // Execute command
    const result: DeviceCommandResult = device.enabled
      ? await adapter.turnOff(device)
      : await adapter.turnOn(device)

    if (result.success) {
      // Update with real state from device
      setDevices(prev =>
        prev.map(d => (d.id === deviceId ? { ...d, ...result.newState, lastSeen: new Date() } : d))
      )
      toast.success(`${device.name} turned ${result.newState?.enabled ? 'on' : 'off'}`)
    } else {
      // Rollback optimistic update
      setDevices(prev => prev.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d)))
      toast.error(`Failed to control ${device.name}: ${result.error}`)
    }
  } catch (error) {
    // Rollback on exception
    setDevices(prev => prev.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d)))
    toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    // Remove from executing set
    setExecutingCommands(prev => {
      const next = new Set(prev)
      next.delete(deviceId)
      return next
    })
  }
}
```

**UI Updates for Loading State**:

```tsx
<Button
  onClick={() => toggleDevice(device.id)}
  disabled={executingCommands.has(device.id)}
  className={cn(
    'relative transition-all',
    executingCommands.has(device.id) && 'cursor-wait opacity-50'
  )}
>
  {executingCommands.has(device.id) ? (
    <Spinner size="sm" />
  ) : (
    <Power weight={device.enabled ? 'fill' : 'regular'} />
  )}
</Button>
```

### Phase 4: Virtual Device Enhancement (Day 3 - 1 hour)

**Update**: `scripts/virtual-device.js`

**Current**: Only responds to GET /shelly (discovery)

**New**: Also respond to POST /rpc/Switch.Set (control)

```javascript
// Add state management
let deviceState = {
  relay: false,
  brightness: 100,
}

// Add POST endpoint handler
if (req.method === 'POST' && req.url === '/rpc/Switch.Set') {
  let body = ''
  req.on('data', chunk => {
    body += chunk
  })
  req.on('end', () => {
    try {
      const command = JSON.parse(body)
      const wasOn = deviceState.relay

      // Update state
      if (command.on !== undefined) {
        deviceState.relay = command.on
      }

      // Send response
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ was_on: wasOn }))

      console.log(`[${new Date().toISOString()}] Switch.Set: ${wasOn} → ${deviceState.relay}`)
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON' }))
    }
  })
  return
}

// Add POST /rpc/Switch.GetStatus
if (req.method === 'POST' && req.url === '/rpc/Switch.GetStatus') {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(
    JSON.stringify({
      id: 0,
      output: deviceState.relay,
      source: 'UI',
    })
  )
  return
}
```

### Phase 5: Testing & Validation (Day 4 - 2 hours)

**Test Scenarios**:

1. **Happy Path**
   - Discover device → Assign room → Toggle ON → Toggle OFF
   - Verify state persists after refresh
   - Check KV store has correct state

2. **Error Scenarios**
   - Device unreachable (stop virtual device mid-command)
   - Timeout (add artificial delay to virtual device)
   - Invalid response (send malformed JSON)
   - Network error (wrong IP address)

3. **Edge Cases**
   - Rapid toggling (click multiple times quickly)
   - Multiple devices simultaneously
   - Device state changes externally (manual button press)
   - Page refresh during command execution

**Test Script**: `scripts/test-device-control.js`

```javascript
// Comprehensive test suite
const tests = [
  'Device Discovery',
  'Room Assignment',
  'Turn Device ON',
  'Verify State Update',
  'Turn Device OFF',
  'Verify State Update',
  'Timeout Handling',
  'Error Recovery',
  'Rapid Toggle Protection',
  'State Persistence After Refresh',
]

// Run automated test suite
async function runTests() {
  for (const test of tests) {
    console.log(`Running: ${test}...`)
    // Implementation
  }
}
```

### Phase 6: Documentation (Day 4 - 1 hour)

**Create**: `docs/development/MILESTONE_2.2.4_COMPLETE.md`

**Sections**:

1. Overview & objectives
2. Architecture & design decisions
3. Implementation details (code samples)
4. API reference (adapter methods)
5. Testing results (pass/fail for each scenario)
6. Known limitations
7. Next steps (Milestone 2.2.5)

---

## 📊 Success Metrics

### Functional Requirements ✅

- [ ] Shelly devices can be turned ON via UI
- [ ] Shelly devices can be turned OFF via UI
- [ ] Device state updates reflected in real-time
- [ ] Failed commands show error toast
- [ ] Loading state displayed during command execution
- [ ] Commands timeout after 5 seconds
- [ ] Retry logic handles transient failures
- [ ] State persists after page refresh

### Performance Requirements ✅

- [ ] Command execution < 1 second (local network)
- [ ] Optimistic UI update < 100ms
- [ ] State synchronization < 2 seconds
- [ ] Retry delays use exponential backoff (1s, 2s, 4s)

### User Experience Requirements ✅

- [ ] Clear visual feedback (loading spinner)
- [ ] Error messages are user-friendly
- [ ] Success confirmation (toast notification)
- [ ] No UI freezing during commands
- [ ] Device state always accurate

---

## 🔮 Future Enhancements (Not in 2.2.4)

### Phase 2.3 - Multi-Protocol Support

- TP-Link adapter with encryption
- Hue adapter with authentication flow
- MQTT adapter (integrate with Phase 2.1 work)
- Zigbee adapter (via zigbee2mqtt)

### Phase 2.4 - Advanced Features

- Command queue with persistence
- Bulk operations (turn off all lights)
- Scene execution (multiple commands)
- Device groups (control multiple as one)

### Phase 2.5 - State Synchronization

- WebSocket for real-time updates
- Device polling fallback
- State reconciliation on reconnect
- Conflict resolution (UI vs device)

---

## 🚨 Known Limitations

### Current Scope (2.2.4)

1. **Shelly Only** - No TP-Link or Hue control yet
2. **Basic Commands** - Only on/off, no brightness/color
3. **No Queueing** - Commands executed immediately, no queue
4. **No Sync** - Device state not monitored, only updated on command
5. **Local Network Only** - Assumes devices on same network

### Technical Debt

1. **No Device Factory** - Manual adapter instantiation in Dashboard
2. **Hardcoded Protocols** - No dynamic protocol selection
3. **No Command History** - Can't see past commands or replay
4. **No Offline Queue** - Commands fail if device offline

---

## 📚 Reference Documentation

### Shelly API Documentation

- **Gen2 RPC API**: <https://shelly-api-docs.shelly.cloud/gen2/ComponentsAndServices/Switch>
- **HTTP Status Codes**: Standard REST semantics
- **Authentication**: None required for local network

### HomeHub Documentation

- **Discovery**: `docs/development/MILESTONE_2.2.3_DISCOVERY_COMPLETE.md`
- **Architecture**: `docs/guides/ARCHITECTURE.md`
- **Best Practices**: `docs/guides/BEST_PRACTICES.md`

---

## ✅ Deliverables Checklist

- [ ] **Architecture** - Adapter interface and types defined
- [ ] **Shelly Adapter** - Full implementation with error handling
- [ ] **Dashboard Integration** - Real commands replace mock toggles
- [ ] **Virtual Device** - Enhanced to respond to commands
- [ ] **Testing** - 10+ test scenarios passing
- [ ] **Documentation** - Complete milestone summary
- [ ] **Code Quality** - 0 TypeScript errors, 0 ESLint warnings
- [ ] **User Experience** - Loading states, error handling, toast notifications

---

## 🎯 Next Milestone Preview

### Milestone 2.2.5 - Device Settings & Management

**Features**:

- Edit device name/icon
- Remove devices (with confirmation)
- Configure device settings (IP, port, timeout)
- Device health monitoring (last seen, retry count)
- Manual state refresh button

**Duration**: 3-5 hours

---

**Document Created**: October 10, 2025
**Status**: 🚧 Implementation Starting
**Estimated Completion**: October 11-12, 2025
**Owner**: and3rn3t
