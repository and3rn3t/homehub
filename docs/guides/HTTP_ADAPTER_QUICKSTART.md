# HTTP Adapter Quick Start Guide

**Phase**: 2.2 - Device Abstraction Layer
**Date**: October 10, 2025

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```powershell
npm install
```

Dependencies installed: `express`, `cors`, `@types/express`, `@types/cors`

### Step 2: Start Virtual HTTP Device

```powershell
npm run http-device -- --port 8001 --preset shelly
```

You should see:

```
✅ Virtual HTTP Device Started
   Name: Virtual Device
   Type: light
   Preset: shelly
   URL: http://localhost:8001
```

### Step 3: Test the Device

**Get Device Info**:

```powershell
curl http://localhost:8001/shelly
```

**Toggle Device**:

```powershell
curl -X POST http://localhost:8001/rpc/Switch.Toggle?id=0
```

**Check Status**:

```powershell
curl http://localhost:8001/rpc/Switch.GetStatus?id=0
```

### Step 4: Start Multiple Devices

```powershell
npm run http-devices
```

Launches 5 devices on ports 8001-8005 (Shelly, TPLink, Hue, Generic mix)

### Step 5: Run Integration Tests

```powershell
# Start MQTT broker first
docker-compose up -d

# Run tests
npm run test:multi-protocol
```

Expected: ✅ 9/9 tests passing

---

## 📝 Usage Examples

### Use HTTP Adapter in Code

```typescript
import { HTTPDeviceAdapter } from '@/services/device'

// Create adapter
const adapter = new HTTPDeviceAdapter({
  baseUrl: 'http://localhost:8001',
  authType: 'none',
  pollingInterval: 5000,
  preset: 'shelly',
})

// Connect
await adapter.connect()

// Send command
await adapter.sendCommand({
  deviceId: '0',
  command: 'toggle',
})

// Subscribe to state updates
const unsubscribe = adapter.onStateUpdate('0', state => {
  console.log('Device state:', state.enabled)
})

// Disconnect
await adapter.disconnect()
```

### Use with Device Registry

```typescript
import { DeviceRegistry, HTTPDeviceAdapter } from '@/services/device'

const registry = DeviceRegistry.getInstance()

// Register HTTP adapter
const adapter = new HTTPDeviceAdapter({
  baseUrl: 'http://localhost:8001',
  authType: 'none',
  preset: 'shelly',
})
registry.registerAdapter(adapter)

// Map device to protocol
registry.mapDeviceToProtocol('shelly-1', 'http')

// Send command (auto-routes to HTTP adapter)
await registry.sendCommand({
  deviceId: 'shelly-1',
  command: 'toggle',
})
```

---

## 🎯 Device Presets

### Shelly Gen2 (Recommended)

```typescript
const adapter = new HTTPDeviceAdapter({
  baseUrl: 'http://192.168.1.100',
  authType: 'none',
  preset: 'shelly',
})
```

**Endpoints**:

- `GET /shelly` - Device info
- `GET /rpc/Switch.GetStatus?id=0` - Get status
- `POST /rpc/Switch.Set?id=0&on=true` - Set ON/OFF
- `POST /rpc/Switch.Toggle?id=0` - Toggle

### TPLink Kasa

```typescript
const adapter = new HTTPDeviceAdapter({
  baseUrl: 'http://192.168.1.101',
  authType: 'none',
  preset: 'tplink',
})
```

**Endpoints**:

- `GET /api/system/get_sysinfo` - System info
- `POST /api/system/set_relay_state` - Set relay (body: `{"state": 1}`)

### Philips Hue

```typescript
const adapter = new HTTPDeviceAdapter({
  baseUrl: 'http://192.168.1.102',
  authType: 'apikey',
  credentials: { apiKey: 'your-hue-api-key' },
  preset: 'hue',
})
```

**Endpoints**:

- `GET /api/lights/{id}` - Get light info
- `PUT /api/lights/{id}/state` - Set state (body: `{"on": true, "bri": 254}`)

### Generic REST

```typescript
const adapter = new HTTPDeviceAdapter({
  baseUrl: 'http://192.168.1.103',
  authType: 'basic',
  credentials: { username: 'admin', password: 'secret' },
  preset: 'generic',
})
```

**Endpoints**:

- `GET /api/devices` - List devices
- `GET /api/devices/{id}/status` - Get status
- `POST /api/devices/{id}/command` - Send command

---

## 🧪 Testing Commands

### Manual Testing

**Start Devices**:

```powershell
# Terminal 1: Single Shelly device
npm run http-device -- --port 8001 --preset shelly

# Terminal 2: Multiple devices
npm run http-devices
```

**Test with cURL**:

```powershell
# Shelly
curl http://localhost:8001/shelly
curl -X POST http://localhost:8001/rpc/Switch.Toggle?id=0
curl http://localhost:8001/rpc/Switch.GetStatus?id=0

# TPLink
curl http://localhost:8002/api/system/get_sysinfo
```

**Test with PowerShell**:

```powershell
# Get device info
Invoke-RestMethod -Uri "http://localhost:8001/shelly"

# Toggle device
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.Toggle?id=0" -Method POST

# Get status
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.GetStatus?id=0"
```

### Automated Testing

```powershell
# Full integration test suite
npm run test:multi-protocol

# Expected output:
# ✅ Passed: 9
# ❌ Failed: 0
# 🎯 Success Rate: 100.0%
```

---

## 🐛 Troubleshooting

### Device Won't Start

**Error**: `EADDRINUSE: address already in use`

**Solution**: Port already in use, choose different port:

```powershell
npm run http-device -- --port 8002 --preset shelly
```

### Connection Timeout

**Error**: `Failed to connect to http://localhost:8001`

**Solution**: Ensure device is running:

```powershell
# Check if device is listening
curl http://localhost:8001/health
```

### Tests Failing

**Error**: `HTTP device not responding`

**Solution**: Start virtual device before running tests:

```powershell
# Terminal 1: Start device
npm run http-device -- --port 8001 --preset shelly

# Terminal 2: Run tests
npm run test:multi-protocol
```

### MQTT Tests Failing

**Error**: `MQTT connection timeout`

**Solution**: Start MQTT broker:

```powershell
docker-compose up -d
```

---

## 📚 Next Steps

1. **Try different presets**: `shelly`, `tplink`, `hue`, `generic`
2. **Launch multiple devices**: `npm run http-devices`
3. **Run integration tests**: `npm run test:multi-protocol`
4. **Integrate with Dashboard**: Coming in Milestone 2.2.2

---

## 🎓 Key Concepts

### Polling vs Push

- **MQTT**: Push-based (devices send updates immediately)
- **HTTP**: Polling-based (we request updates every 5s)
- **Both use same interface**: `onStateUpdate()` callback

### Device Discovery

- **MQTT**: Devices announce themselves on `homehub/device/announce`
- **HTTP**: We call discovery endpoint (e.g., `/shelly`, `/api/devices`)

### Command Flow

```
Dashboard → DeviceRegistry → HTTPAdapter → HTTP Device
                ↓
          Optimistic Update → UI responds instantly
                ↓
          Poll State → Verify command succeeded
```

---

## 📖 Reference

- **HTTP Adapter**: `src/services/device/HTTPDeviceAdapter.ts`
- **Virtual Device**: `scripts/http-virtual-device.js`
- **Launch Script**: `scripts/launch-http-devices.js`
- **Test Suite**: `scripts/test-multi-protocol.js`
- **Full Docs**: `docs/MILESTONE_2.2.1_COMPLETE.md`

---

**Questions?** Check the comprehensive docs or test scripts for examples! 🚀
