# MQTT Integration Quick Reference

## 🎯 Quick Start

### Using MQTT Hooks in Components

```typescript
import { useMQTTDevices, useMQTTConnection } from '@/hooks'

// Full device management
function MyComponent() {
  const {
    devices,              // Device[] - Current device list
    isConnected,          // boolean - MQTT connected?
    sendCommand,          // Function to control devices
    discoverDevices,      // Function to find new devices
  } = useMQTTDevices()

  const handleToggle = async (deviceId: string) => {
    await sendCommand(deviceId, { command: 'toggle' })
  }

  return (
    <div>
      {devices.map(device => (
        <button key={device.id} onClick={() => handleToggle(device.id)}>
          {device.name}: {device.enabled ? 'ON' : 'OFF'}
        </button>
      ))}
    </div>
  )
}

// Lightweight connection status only
function StatusIndicator() {
  const { isConnected, connect, disconnect } = useMQTTConnection()

  return (
    <div>
      Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      <button onClick={isConnected ? disconnect : connect}>
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}
```

---

## 📚 Hook APIs

### `useMQTTDevices()`

**Purpose**: Full device management with MQTT integration

**Returns**:

```typescript
{
  devices: Device[]                        // Current device list
  isConnected: boolean                     // MQTT connection status
  connectionState: MQTTConnectionState     // Detailed state
  sendCommand: (deviceId, command) => Promise<void>
  discoverDevices: () => Promise<Device[]>
  connect: () => Promise<void>
  disconnect: () => void
  isLoading: boolean
  error: Error | null
}
```

**Features**:

- ✅ Automatic connection on mount
- ✅ Automatic cleanup on unmount
- ✅ Optimistic UI updates
- ✅ Device discovery
- ✅ Connection monitoring

**When to Use**:

- Components that need to display devices
- Components that control devices
- Components that need full MQTT features

---

### `useMQTTConnection()`

**Purpose**: Lightweight connection monitoring only

**Returns**:

```typescript
{
  isConnected: boolean                 // Simple boolean status
  connectionState: MQTTConnectionState // Detailed state
  connect: () => Promise<void>
  disconnect: () => void
  error: Error | null
}
```

**Features**:

- ✅ Minimal overhead (no device management)
- ✅ Connection/disconnect controls
- ✅ Real-time status updates

**When to Use**:

- Header/nav components showing connection status
- Settings page with connection controls
- Any component that doesn't need device data

---

## 🔄 Device Commands

### Toggle Device

```typescript
const { sendCommand } = useMQTTDevices()

await sendCommand(deviceId, { command: 'toggle' })
```

### Set Brightness (0-100)

```typescript
await sendCommand(deviceId, {
  command: 'set',
  value: 75, // 75% brightness
})
```

### Turn On

```typescript
await sendCommand(deviceId, {
  command: 'set',
  enabled: true,
})
```

### Turn Off

```typescript
await sendCommand(deviceId, {
  command: 'set',
  enabled: false,
})
```

### Set Thermostat Temperature

```typescript
await sendCommand(deviceId, {
  command: 'set',
  value: 72, // 72°F
})
```

---

## 🔍 Device Discovery

### Trigger Discovery

```typescript
const { discoverDevices } = useMQTTDevices()

const discovered = await discoverDevices()
console.log(`Found ${discovered.length} devices`)
```

### Discovery Flow

1. Publishes to `homehub/discovery/scan` topic
2. Devices respond with announcements
3. DeviceRegistry collects responses for 3 seconds
4. Returns array of discovered devices
5. Hook merges with existing devices (no duplicates)

---

## 🎨 Connection Status UI Patterns

### Badge Indicator (Recommended)

```typescript
const { isConnected, connectionState } = useMQTTConnection()

{isConnected ? (
  <Badge variant="default" className="gap-1.5 bg-green-500/10 text-green-600">
    <WifiHigh weight="bold" className="h-3.5 w-3.5" />
    MQTT Connected
  </Badge>
) : connectionState === 'reconnecting' ? (
  <Badge variant="secondary" className="gap-1.5 bg-yellow-500/10 text-yellow-600">
    <ArrowsClockwise weight="bold" className="h-3.5 w-3.5 animate-spin" />
    Reconnecting...
  </Badge>
) : (
  <Button size="sm" variant="destructive" onClick={connect}>
    <WifiSlash weight="bold" className="h-3.5 w-3.5" />
    Reconnect
  </Button>
)}
```

### Simple Text

```typescript
const { isConnected } = useMQTTConnection()

<p>Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
```

### Icon Only

```typescript
const { isConnected } = useMQTTConnection()

{isConnected ? (
  <WifiHigh className="text-green-600" />
) : (
  <WifiSlash className="text-red-600" />
)}
```

---

## 🔄 Hybrid Mode Pattern

### MQTT Primary, KV Fallback

```typescript
import { useKV, useMQTTDevices } from '@/hooks'

const [kvDevices, setKvDevices] = useKV<Device[]>('devices', [])
const { devices: mqttDevices, isConnected: mqttConnected, sendCommand } = useMQTTDevices()

// Use MQTT devices if connected, else KV store
const devices = mqttConnected && mqttDevices.length > 0 ? mqttDevices : kvDevices

// Smart toggle function
const toggleDevice = async (deviceId: string) => {
  if (mqttConnected) {
    await sendCommand(deviceId, { command: 'toggle' })
    toast.success('Device toggled')
  } else {
    setKvDevices(prev => prev.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d)))
    toast.success('Device toggled (offline mode)')
  }
}
```

**Benefits**:

- App works even when MQTT unavailable
- Seamless switching between modes
- User feedback indicates mode

---

## 🐛 Troubleshooting

### Hook Not Connecting

**Symptoms**: `isConnected` always false

**Solutions**:

1. Check MQTT broker is running:

   ```bash
   docker ps --filter "name=mosquitto"
   ```

2. Verify environment variable:

   ```bash
   echo $env:VITE_MQTT_BROKER_URL
   # Should be: ws://localhost:9001
   ```

3. Check browser console for connection errors
4. Try manual connect:

   ```typescript
   const { connect } = useMQTTConnection()
   connect() // Force connection attempt
   ```

---

### Devices Not Discovered

**Symptoms**: `discoverDevices()` returns empty array

**Solutions**:

1. Verify virtual devices are running
2. Check devices announced on discovery topic:

   ```bash
   mosquitto_sub -t "homehub/discovery/#"
   ```

3. Ensure MQTT connected before discovery
4. Check browser console for discovery errors

---

### Device Commands Not Working

**Symptoms**: `sendCommand()` doesn't control device

**Solutions**:

1. Verify `isConnected` is true
2. Check device ID matches exactly
3. Monitor MQTT traffic:

   ```bash
   mosquitto_sub -t "homehub/devices/+/set"
   ```

4. Test with manual publish:

   ```bash
   mosquitto_pub -t "homehub/devices/living-room-light/set" -m '{"command":"toggle"}'
   ```

---

### State Updates Not Received

**Symptoms**: Device state doesn't update when changed externally

**Known Limitation**: Wildcard subscriptions not yet implemented

**Workaround**: Click "Discover" button to refresh states

**Fix Coming**: See `MILESTONE_2.1.4_COMPLETE.md` Known Issues

---

## 📊 Performance Tips

### Minimize Re-renders

**Use `useMQTTConnection()` for status only**:

```typescript
// ❌ Causes re-render on every device state change
const { isConnected } = useMQTTDevices()

// ✅ Only re-renders on connection state changes
const { isConnected } = useMQTTConnection()
```

---

### Debounce Rapid Commands

```typescript
import { debounce } from 'lodash-es'

const { sendCommand } = useMQTTDevices()

const debouncedCommand = debounce((deviceId, command) => {
  sendCommand(deviceId, command)
}, 300)

// Slider that updates frequently
<Slider
  onValueChange={(value) => {
    debouncedCommand(deviceId, { command: 'set', value: value[0] })
  }}
/>
```

---

### Batch Discovery

```typescript
// ❌ Multiple discovery calls
await discoverDevices()
await discoverDevices()
await discoverDevices()

// ✅ Single call discovers all devices
const devices = await discoverDevices()
```

---

## 🧪 Testing Helpers

### Check Connection Status

```typescript
const { connectionState, error } = useMQTTConnection()

console.log('State:', connectionState)
console.log('Error:', error)
```

**States**:

- `'connected'` - Connected to broker
- `'connecting'` - Initial connection attempt
- `'reconnecting'` - Retrying after disconnect
- `'disconnected'` - Not connected
- `'error'` - Connection error
- `'offline'` - Network offline

---

### Debug Device List

```typescript
const { devices } = useMQTTDevices()

console.table(
  devices.map(d => ({
    id: d.id,
    name: d.name,
    type: d.type,
    enabled: d.enabled,
    status: d.status,
  }))
)
```

---

### Monitor MQTT Events

```typescript
useEffect(() => {
  const client = MQTTClientService.getInstance()

  const handleMessage = (topic: string, message: string) => {
    console.log('📨 MQTT Message:', { topic, message })
  }

  client.on('message', handleMessage)
  return () => client.off('message', handleMessage)
}, [])
```

---

## 📖 Related Documentation

- **Full Documentation**: `docs/MILESTONE_2.1.4_COMPLETE.md`
- **Testing Guide**: `docs/DASHBOARD_INTEGRATION_TEST.md`
- **Service Layer**: `docs/MILESTONE_2.1.2_COMPLETE.md`
- **Virtual Devices**: `docs/MILESTONE_2.1.3_COMPLETE.md`

---

## 🚀 Next Steps

After mastering these hooks, explore:

1. **Phase 2.1.5**: Connect physical smart devices
2. **Phase 3**: Build automation rules using device state
3. **Custom Hooks**: Create specialized hooks for specific device types

---

**Last Updated**: January 2025
**Version**: 1.0
