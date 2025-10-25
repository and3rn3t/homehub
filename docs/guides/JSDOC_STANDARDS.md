# JSDoc Standards Guide

**Purpose**: Consistent documentation standards for functions, interfaces, components, and complex logic in HomeHub.

**Last Updated**: October 16, 2025

---

## Table of Contents

- [Why JSDoc](#why-jsdoc)
- [Required Tags](#required-tags)
- [Interface Documentation](#interface-documentation)
- [Function Documentation](#function-documentation)
- [Component Documentation](#component-documentation)
- [Type Documentation](#type-documentation)
- [Complex Logic Documentation](#complex-logic-documentation)
- [Examples](#examples)

---

## Why JSDoc

### Benefits

1. **IntelliSense**: Better autocomplete in VS Code and other IDEs
2. **Type Hints**: Hover tooltips show parameter descriptions
3. **Documentation Generation**: Can generate API docs automatically
4. **AI Context**: Copilot uses JSDoc for better suggestions
5. **Onboarding**: New developers understand code faster

### JSDoc vs TSDoc

We use **JSDoc** (not TSDoc) for maximum compatibility:

- Works with TypeScript and JavaScript
- Supported by all major IDEs
- Standard across the JavaScript ecosystem
- Compatible with Copilot and AI tools

---

## Required Tags

### Minimum Required Tags

For **all** public functions and methods:

- `@param` - Describe each parameter
- `@returns` - Describe return value
- `@throws` (if applicable) - Document errors thrown

For **interfaces** and **types**:

- Description comment above declaration
- Document each property with inline comment

For **components**:

- Description of component purpose
- `@param` for props (or document props interface)
- Usage example in `@example` tag

---

## Interface Documentation

### Pattern 1: Core Data Interfaces

```typescript
/**
 * Core device entity representing any smart home device.
 * Used by Dashboard, Rooms, DeviceMonitor, and Automations components.
 *
 * @example
 * const device: Device = {
 *   id: 'light-1',
 *   name: 'Living Room Light',
 *   type: 'light',
 *   room: 'Living Room',
 *   status: 'online',
 *   enabled: true,
 *   protocol: 'hue'
 * }
 */
export interface Device {
  /** Unique identifier (UUID format) */
  id: string

  /** Display name shown in UI */
  name: string

  /** Device category for UI grouping and icon selection */
  type: DeviceType

  /** Room association for organization */
  room: string

  /** Current connection status (determines badge color) */
  status: DeviceStatus

  /** Power state (on/off toggle) */
  enabled: boolean

  /** Communication protocol (determines which adapter to use) */
  protocol: DeviceProtocol

  /**
   * Current value for adjustable devices (brightness, temperature, etc.)
   * Range: 0-100 for percentages, device-specific for others
   */
  value?: number

  /** Unit of measurement for value (%, °F, W, etc.) */
  unit?: string

  /** Last successful communication timestamp */
  lastSeen?: Date

  /** Battery percentage (0-100) for battery-powered devices */
  batteryLevel?: number

  /** WiFi/connectivity strength (0-100, where 100 is excellent) */
  signalStrength?: number
}
```

### Pattern 2: Configuration Interfaces

```typescript
/**
 * Configuration for device discovery scan.
 * Passed to DiscoveryManager.discoverAll() method.
 *
 * @see DiscoveryManager
 */
export interface DiscoveryOptions {
  /**
   * HTTP scan configuration
   * If omitted, HTTP discovery is skipped
   */
  http?: {
    /** Starting IP address (e.g., "192.168.1.1") */
    startIp: string
    /** Ending IP address (e.g., "192.168.1.254") */
    endIp: string
    /** Request timeout in milliseconds (default: 2000) */
    timeout?: number
  }

  /**
   * MQTT broker configuration
   * If omitted, MQTT discovery is skipped
   */
  mqtt?: {
    /** MQTT broker URL (e.g., "mqtt://192.168.1.100:1883") */
    brokerUrl: string
  }
}
```

---

## Function Documentation

### Pattern 1: Service Methods

```typescript
/**
 * Scan IP range for HTTP-based smart devices (Shelly, TP-Link, Hue bridges).
 * Probes each IP with known device endpoints and parses responses.
 *
 * @param startIp - Starting IP address in range (e.g., "192.168.1.1")
 * @param endIp - Ending IP address in range (e.g., "192.168.1.254")
 * @param timeout - Request timeout in milliseconds (default: 2000)
 * @returns Array of discovered devices, empty if none found
 * @throws {Error} If IP range is invalid
 *
 * @example
 * const devices = await HTTPScanner.scan('192.168.1.1', '192.168.1.254', 3000)
 * console.log(`Found ${devices.length} devices`)
 */
static async scan(
  startIp: string,
  endIp: string,
  timeout: number = 2000
): Promise<Device[]> {
  // Implementation
}
```

### Pattern 2: Complex Utility Functions

```typescript
/**
 * Calculate next execution time for time-based automation.
 * Handles daily/weekly schedules and DST transitions.
 *
 * @param time - Time in HH:MM format (24-hour)
 * @param days - Optional array of day names (lowercase, e.g., ["monday", "friday"])
 *              If omitted, executes every day
 * @returns Next execution date/time
 * @throws {Error} If time format is invalid
 *
 * @example
 * // Run every day at 7:00 AM
 * const next = calculateNextRun('07:00')
 *
 * @example
 * // Run only on weekdays at 6:30 PM
 * const next = calculateNextRun('18:30', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
 */
function calculateNextRun(time: string, days?: string[]): Date {
  // Implementation
}
```

### Pattern 3: Event Handlers

```typescript
/**
 * Toggle device power state with optimistic UI update and rollback on failure.
 * Updates UI immediately, then syncs with actual device.
 *
 * @param deviceId - ID of device to toggle
 * @throws {Error} If device not found or control fails
 *
 * @remarks
 * This function uses optimistic updates for instant UI feedback.
 * If the device control fails, the UI state is rolled back and
 * an error toast is shown to the user.
 *
 * @example
 * await toggleDevice('light-1')
 */
const toggleDevice = useCallback(
  async (deviceId: string) => {
    // Implementation
  },
  [devices, setDevices]
)
```

---

## Component Documentation

### Pattern 1: Feature Components

```typescript
/**
 * Dashboard component showing overview of all devices, rooms, and quick actions.
 * Main landing page after app launch.
 *
 * Features:
 * - Favorite devices for quick access
 * - Room summaries with device counts
 * - Active scene indicator
 * - Quick toggle for all devices
 *
 * @component
 * @example
 * <Dashboard />
 */
export function Dashboard() {
  // Implementation
}
```

### Pattern 2: Reusable UI Components

```typescript
/**
 * Device control card with status indicator and toggle button.
 * Shows device name, room, current state, and connection status.
 *
 * @param props - Component props
 * @param props.device - Device to display and control
 * @param props.onToggle - Callback when toggle button is clicked
 * @param props.isLoading - Whether device operation is in progress
 *
 * @example
 * <DeviceControlCard
 *   device={device}
 *   onToggle={(id) => handleToggle(id)}
 *   isLoading={false}
 * />
 */
export function DeviceControlCard({ device, onToggle, isLoading = false }: DeviceControlCardProps) {
  // Implementation
}
```

### Pattern 3: Props Interface Documentation

```typescript
/**
 * Props for DeviceControlCard component.
 */
export interface DeviceControlCardProps {
  /** Device to display and control */
  device: Device

  /**
   * Callback fired when toggle button is clicked.
   * Receives device ID as parameter.
   */
  onToggle: (deviceId: string) => Promise<void>

  /** Whether a control operation is in progress (disables button) */
  isLoading?: boolean

  /** Optional CSS class name for custom styling */
  className?: string
}
```

---

## Type Documentation

### Pattern 1: Union Types

```typescript
/**
 * Device communication protocols.
 * Determines which adapter is used for device control.
 *
 * - `mqtt` - MQTT pub/sub (mosquitto broker)
 * - `http` - HTTP REST API (Shelly, TP-Link)
 * - `hue` - Philips Hue Bridge API
 */
export type DeviceProtocol = 'mqtt' | 'http' | 'hue'

/**
 * Device connection status.
 * Used for status badge color in UI.
 *
 * - `online` - Device responding (green badge)
 * - `offline` - Device not responding (gray badge)
 * - `warning` - Weak signal or low battery (yellow badge)
 * - `error` - Device error state (red badge)
 */
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error'
```

### Pattern 2: Complex Types

```typescript
/**
 * Automation trigger configuration.
 * Type determines which fields are required.
 *
 * For `type: 'time'`: Requires `time` and optionally `days`
 * For `type: 'condition'`: Requires `deviceId`, `operator`, `threshold`
 * For `type: 'geofence'`: Requires `location` with lat/lng/radius
 *
 * @see Automation
 */
export interface AutomationTrigger {
  /** Type of trigger to use */
  type: TriggerType

  // Time-based trigger fields
  /** Time in HH:MM format (24-hour) for time-based triggers */
  time?: string
  /** Days of week (lowercase) when time trigger should fire */
  days?: string[]

  // Condition trigger fields
  /** Device ID to monitor for condition triggers */
  deviceId?: string
  /** Comparison operator for condition evaluation */
  operator?: ComparisonOperator
  /** Threshold value for condition comparison */
  threshold?: number

  // Geofence trigger fields
  /** Geographic location for geofence triggers */
  location?: {
    /** Latitude in decimal degrees */
    lat: number
    /** Longitude in decimal degrees */
    lng: number
    /** Radius in meters */
    radius: number
  }
}
```

---

## Complex Logic Documentation

### Pattern 1: Algorithm Explanations

```typescript
/**
 * Calculate Haversine distance between two GPS coordinates.
 * Used for geofence trigger detection.
 *
 * Formula:
 * a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
 * c = 2 × atan2(√a, √(1−a))
 * distance = R × c (where R is Earth's radius)
 *
 * @param lat1 - First point latitude in decimal degrees
 * @param lon1 - First point longitude in decimal degrees
 * @param lat2 - Second point latitude in decimal degrees
 * @param lon2 - Second point longitude in decimal degrees
 * @returns Distance in meters
 *
 * @see https://en.wikipedia.org/wiki/Haversine_formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
```

### Pattern 2: State Machine Logic

```typescript
/**
 * Determine next state for automation execution.
 * Implements state machine: IDLE → EVALUATING → EXECUTING → COOLDOWN → IDLE
 *
 * State transitions:
 * - IDLE: Waiting for trigger condition
 * - EVALUATING: Checking if trigger condition is met
 * - EXECUTING: Running automation actions
 * - COOLDOWN: Preventing rapid re-triggering (60s minimum)
 * - ERROR: Terminal state, requires manual reset
 *
 * @param currentState - Current automation state
 * @param trigger - Trigger evaluation result
 * @param lastRun - Timestamp of last execution
 * @returns Next state to transition to
 *
 * @remarks
 * Cooldown period prevents "bouncing" where automation rapidly
 * triggers on/off due to sensor noise or device delays.
 */
function getNextState(
  currentState: AutomationState,
  trigger: boolean,
  lastRun?: Date
): AutomationState {
  // Implementation
}
```

---

## Examples

### Well-Documented Service

```typescript
/**
 * Philips Hue Bridge API adapter.
 * Handles authentication, device discovery, and control for Hue lights.
 *
 * @remarks
 * Requires bridge pairing before use. Call registerBridge() with
 * credentials obtained via pairing button + authentication flow.
 *
 * @see https://developers.meethue.com/develop/hue-api/
 */
export class HueBridgeAdapter {
  private static bridges = new Map<string, { baseUrl: string; username: string }>()

  /**
   * Register a Hue Bridge for device control.
   * Must be called before any control operations.
   *
   * @param bridgeId - Unique bridge identifier (from discovery)
   * @param baseUrl - Bridge IP address (e.g., "http://192.168.1.2")
   * @param username - API username (obtained via pairing)
   *
   * @example
   * HueBridgeAdapter.registerBridge(
   *   '001788FFFE123456',
   *   'http://192.168.1.2',
   *   'your-username-here'
   * )
   */
  static registerBridge(bridgeId: string, baseUrl: string, username: string): void {
    this.bridges.set(bridgeId, { baseUrl, username })
  }

  /**
   * Control Hue light state (on/off, brightness, color).
   *
   * @param bridgeId - Registered bridge identifier
   * @param lightId - Light number (1-based, from Hue app)
   * @param state - Desired state changes
   * @param state.on - Power state (on/off)
   * @param state.bri - Brightness (0-254, where 254 is max)
   * @param state.hue - Hue color value (0-65535)
   * @param state.sat - Saturation (0-254)
   * @param state.ct - Color temperature in mireds (153-500)
   *
   * @throws {Error} If bridge not registered
   * @throws {Error} If Hue API returns error
   *
   * @example
   * // Turn on light #1 at 50% brightness
   * await HueBridgeAdapter.setLightState('bridge-1', 1, {
   *   on: true,
   *   bri: 127
   * })
   *
   * @example
   * // Set light to warm white
   * await HueBridgeAdapter.setLightState('bridge-1', 1, {
   *   on: true,
   *   ct: 450
   * })
   */
  static async setLightState(
    bridgeId: string,
    lightId: number | string,
    state: {
      on?: boolean
      bri?: number
      hue?: number
      sat?: number
      ct?: number
    }
  ): Promise<void> {
    // Implementation
  }
}
```

---

## Best Practices

### ✅ DO

1. **Document Intent**: Explain _why_ code exists, not just _what_ it does
2. **Include Examples**: Provide usage examples for complex APIs
3. **Link Related Code**: Use `@see` to reference related functions/types
4. **Describe Edge Cases**: Document unusual inputs or error conditions
5. **Keep Updated**: Update docs when code changes

### ❌ DON'T

1. **State the Obvious**: Don't document self-explanatory code
2. **Copy-Paste Generic Comments**: Customize for each function
3. **Leave Outdated Docs**: Worse than no docs
4. **Over-Document**: Not every variable needs a comment
5. **Use Markdown in JSDoc**: Stick to JSDoc tags

---

## Quick Reference

### Common Tags

```typescript
/**
 * Brief description (one line)
 *
 * Longer description with more details.
 * Can span multiple paragraphs.
 *
 * @param paramName - Parameter description
 * @param {Type} paramName - With explicit type (if needed)
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * // Usage example
 * const result = myFunction('example')
 *
 * @see RelatedFunction
 * @see https://external-docs-url.com
 *
 * @remarks
 * Additional notes or implementation details.
 *
 * @deprecated Use NewFunction instead
 */
```

### Component Tags

```typescript
/**
 * @component
 * @param props - Component props
 * @example
 * <MyComponent prop="value" />
 */
```

---

## IDE Integration

### VS Code

JSDoc appears in:

- **Hover tooltips**: Hover over function/variable
- **Autocomplete**: Parameter hints during typing
- **Signature help**: Ctrl+Shift+Space in function calls
- **Quick info**: F12 (Go to Definition) shows docs

### Test Your JSDoc

Hover over your documented function/type in VS Code:

- Should show full description
- Parameter descriptions should appear
- Examples should be visible
- Links should be clickable

---

**Note**: For examples of well-documented code, see `src/services/` and `src/types/`.
