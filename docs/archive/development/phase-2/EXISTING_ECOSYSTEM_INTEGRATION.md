# Existing Ecosystem Integration Plan

**Date**: October 10, 2025
**Status**: 🔍 Discovery & Integration Planning
**Owner**: and3rn3t

---

## 📊 Current Smart Home Inventory

### **Summary**

- **Total Devices**: ~43-51 devices
- **Current Hub**: Apple Home
- **Protocols in Use**: Zigbee (Hue), WiFi, Bluetooth, HomeKit
- **Major Investments**: Philips Hue ecosystem, security cameras

### **Device Breakdown**

| Category                 | Brand       | Count     | Protocol       | Integration Path               |
| ------------------------ | ----------- | --------- | -------------- | ------------------------------ |
| **Lighting**             | Philips Hue | 26        | Zigbee 3.0     | Hue Bridge → HomeHub           |
| **Lighting/Strips**      | Govee       | 5-10      | WiFi/BLE       | HTTP API + Bluetooth           |
| **Smart Plugs/Switches** | Aeotec      | 5-10      | Z-Wave         | Direct Z-Wave (Z-Stick 10 Pro) |
| **Smart Plugs/Switches** | Vocolink    | 3-7       | WiFi           | HTTP API discovery             |
| **Security Cameras**     | Arlo        | 5         | WiFi/Cloud     | RTSP or Cloud API              |
| **Security Cameras**     | Eufy        | 2         | WiFi           | RTSP or Cloud API              |
| **TOTAL**                | Mixed       | **46-60** | Multi-protocol | Phased integration             |

---

## 🎯 Integration Strategy

### **Phase 1: Keep Apple Home Running (Weeks 1-4)**

**Goal**: Test HomeHub in parallel without disrupting existing setup

**Approach**:

- Keep all devices paired to Apple Home
- Add secondary control via HomeHub for testing
- No device removal/re-pairing required initially
- Validate HomeHub stability before migration

**Why This Works**:

- ✅ **Zero downtime** - Family can still use Apple Home
- ✅ **Risk-free testing** - Easy to revert if issues arise
- ✅ **Gradual learning curve** - Master one protocol at a time
- ✅ **Dual control** - Compare HomeHub vs Apple Home UX

---

## 💡 Philips Hue Integration (26 Devices)

### **Current Setup**

- **Hub**: Philips Hue Bridge (connected to router)
- **Protocol**: Zigbee Light Link (ZLL) / Zigbee 3.0
- **Connection**: Hue Bridge → Router → Apple Home
- **Devices**: Mix of bulbs, light strips, motion sensors, switches

### **Integration Options**

#### **Option A: Keep Hue Bridge + Add MQTT Control** ⭐ RECOMMENDED

**How it works**:

```
Philips Hue Bridge (existing)
  ↓ HTTP API
HomeHub HTTPAdapter
  ↓ Device state
KV Store
  ↓ MQTT publish
Apple Home (continues working)
```

**Implementation**:

```typescript
// src/services/devices/HueBridgeAdapter.ts
export class HueBridgeAdapter implements DeviceAdapter {
  constructor(
    private bridgeIp: string,
    private apiKey: string // Get from Hue Bridge
  ) {}

  async turnOn(deviceId: string): Promise<DeviceCommandResult> {
    // PUT http://{bridgeIp}/api/{apiKey}/lights/{deviceId}/state
    // Body: {"on": true}
  }

  async setBrightness(deviceId: string, brightness: number) {
    // Body: {"on": true, "bri": Math.round(brightness * 254 / 100)}
  }

  async setColor(deviceId: string, hue: number, saturation: number) {
    // Body: {"on": true, "hue": hue, "sat": sat}
  }
}
```

**Advantages**:

- ✅ **Zero disruption** - Hue Bridge stays, Apple Home keeps working
- ✅ **Fast implementation** - HTTP API well-documented
- ✅ **Reliable** - Hue Bridge is rock-solid hardware
- ✅ **Feature-complete** - Scenes, groups, schedules, animations
- ✅ **No re-pairing** - All 26 devices stay connected

**Steps**:

1. Find Hue Bridge IP: `http://discovery.meethue.com/` or router DHCP
2. Create API user: Press bridge button + POST `/api` (one-time setup)
3. Test API: `curl http://{bridge-ip}/api/{username}/lights`
4. Implement `HueBridgeAdapter.ts` with HTTP client
5. Add to Dashboard with device type detection
6. Test color control, brightness, scenes

**Timeline**: 1-2 days for full Hue integration

---

#### **Option B: Migrate to Zigbee2MQTT (Future Phase)**

**When to consider**: After Aeotec Z-Stick 10 Pro arrives + stable HomeHub

**How it works**:

```
Zigbee2MQTT (on Pi 5 with Aeotec dongle)
  ↓ Direct Zigbee 3.0
Philips Hue devices (re-paired)
  ↓ MQTT
HomeHub MQTTAdapter
```

**Advantages**:

- ✅ **One less hub** - Eliminate Hue Bridge ($60 hardware)
- ✅ **Local control** - No cloud dependency
- ✅ **More features** - Custom OTA updates, advanced scenes
- ✅ **Open ecosystem** - Mix Hue with IKEA, Aqara, etc.

**Disadvantages**:

- ❌ **Requires re-pairing** - All 26 devices need reset + re-add (2-3 hours)
- ❌ **Downtime risk** - Family loses control during migration
- ❌ **Learning curve** - Zigbee2MQTT configuration complexity
- ❌ **Beta stability** - HomeHub needs battle-testing first

**Recommendation**: Wait until Phase 5-6 (Q2 2026) when HomeHub is production-stable

---

## 🌈 Govee Integration (5-10 Devices)

### **Current Setup**

- **Protocol**: WiFi + Bluetooth Low Energy (BLE)
- **Control**: Govee app + Apple Home (via WiFi)
- **Features**: RGB lighting, music sync, effects

### **Integration Path**

#### **WiFi Govee Devices** (Govee API)

**Implementation**:

```typescript
// src/services/devices/GoveeAdapter.ts
export class GoveeAdapter implements DeviceAdapter {
  constructor(private apiKey: string) {} // Get from Govee Developer Portal

  async turnOn(deviceId: string, model: string): Promise<DeviceCommandResult> {
    // POST https://developer-api.govee.com/v1/devices/control
    // Body: {"device": deviceId, "model": model, "cmd": {"name": "turn", "value": "on"}}
  }

  async setBrightness(deviceId: string, model: string, brightness: number) {
    // cmd: {"name": "brightness", "value": brightness}  // 0-100
  }

  async setColor(deviceId: string, model: string, r: number, g: number, b: number) {
    // cmd: {"name": "color", "value": {"r": r, "g": g, "b": b}}
  }
}
```

**API Setup**:

1. Register at: https://developer.govee.com/
2. Request API key (instant approval)
3. Get device list: `GET https://developer-api.govee.com/v1/devices`
4. Note device ID + model for each device

**Rate Limits**:

- 60 requests/minute per API key
- 10 requests/minute per device
- **Strategy**: Batch commands, cache state, debounce rapid toggles

---

#### **Bluetooth Govee Devices** (Govee LAN API)

**For devices without WiFi**:

**Implementation**:

```typescript
// Use Raspberry Pi 5 Bluetooth 5.0 radio
import noble from '@abandonware/noble'

export class GoveeBLEAdapter implements DeviceAdapter {
  async scan() {
    // Discover Govee BLE devices (UUID: 0xEC88, manufacturer data)
  }

  async turnOn(macAddress: string) {
    // Connect to characteristic + write control bytes
  }
}
```

**Complexity**: HIGH - Requires reverse-engineering Govee BLE protocol
**Recommendation**: Use WiFi API for now, add BLE in Phase 7 (Voice & AI)

---

## ⚡ Aeotec Devices (5-10 Devices) - Z-Wave

### **Current Setup**

- **Protocol**: Z-Wave (500/700/800 series - need to check)
- **Hub**: Likely Apple HomeKit via HomePod or Apple TV with Z-Wave adapter

### **Integration Path**

#### **Direct Z-Wave Control** ⭐ PERFECT FIT

**When**: After Aeotec Z-Stick 10 Pro arrives (late October)

**How it works**:

```
Aeotec Z-Stick 10 Pro (Z-Wave radio)
  ↓ Serial (/dev/ttyUSB0)
zwavejs2mqtt (Docker on Pi 5)
  ↓ MQTT (homeassistant/zwave/{device})
HomeHub MQTTAdapter
  ↓ Device control
Dashboard
```

**Setup**:

1. Install zwavejs2mqtt on Pi 5: `docker-compose up zwavejs`
2. Exclude devices from Apple Home (if needed)
3. Include devices on Z-Stick 10 Pro (press button 3x)
4. Configure MQTT topics in HomeHub
5. Test control from Dashboard

**Device Types** (typical Aeotec lineup):

- Smart Plugs (Z-Wave 500/700)
- In-wall switches/dimmers
- Motion sensors (MultiSensor 6/7)
- Door/window sensors
- Range extenders

**Timeline**: 2-3 days after Aeotec dongle arrives

---

## 🔌 Vocolink Devices (3-7 Devices)

### **Current Setup**

- **Protocol**: WiFi (2.4 GHz)
- **Control**: Smart Life / Tuya app + Apple Home

### **Integration Path**

#### **Tuya/Smart Life API**

**Most Vocolink devices use Tuya platform**:

**Implementation**:

```typescript
// src/services/devices/TuyaAdapter.ts
import TuyAPI from 'tuyapi'

export class TuyaAdapter implements DeviceAdapter {
  async turnOn(deviceId: string, localKey: string, ip: string) {
    const device = new TuyAPI({
      id: deviceId,
      key: localKey,
      ip: ip,
      version: '3.3',
    })
    await device.connect()
    await device.set({ dps: '1', set: true }) // DPS 1 = power
  }
}
```

**Setup**:

1. Extract device IDs + local keys from Tuya Cloud (https://iot.tuya.com/)
2. Use `tuya-cli` to discover devices on network
3. Map device IDs to IP addresses
4. Test control via `tuyapi` library

**Challenges**:

- Local keys expire if device firmware updates
- Tuya Cloud account required
- Some devices use encrypted protocols

**Alternative**: Smart Life Cloud API (requires developer account)

**Timeline**: 3-4 days (key extraction is tedious)

---

## 📹 Camera Integration

### **Arlo Cameras (5 Devices)**

**Current Setup**:

- Cloud-based (Arlo servers)
- Apple Home integration via HomeKit

**Integration Options**:

#### **Option A: Arlo Cloud API** (Limited)

- **Status**: Unofficial API (reverse-engineered)
- **Features**: Live stream URL, recording access, motion detection
- **Library**: `node-arlo` or `pyarlo`
- **Limitations**: No official API, may break with updates

#### **Option B: RTSP Streams** (If Available)

- **Check model**: Some Arlo Pro models support RTSP
- **Setup**: Enable RTSP in Arlo app settings
- **Integration**: Use VLC or FFmpeg to display streams

#### **Option C: Keep in Apple Home** ⭐ RECOMMENDED

- **Reality**: Camera integration is complex (Phase 5 feature)
- **Workaround**: Use HomeKit Secure Video for now
- **Future**: Add HomeHub camera view in Q4 2026

---

### **Eufy Cameras (2 Devices)**

**Current Setup**:

- Local storage (HomeBase or microSD)
- Apple Home integration via HomeKit

**Integration Options**:

#### **RTSP Streams** ⭐ EASIER THAN ARLO

- **Most Eufy cameras support RTSP**
- **Enable**: Eufy Security app → Camera Settings → RTSP
- **Stream URL**: `rtsp://{username}:{password}@{camera-ip}:8554/live0`

**Implementation**:

```typescript
// src/components/SecurityMonitor.tsx (future)
<video>
  <source src="rtsp://admin:password@192.168.1.100:8554/live0" type="application/x-rtsp" />
</video>
```

**Timeline**: Phase 5 (Q4 2026) - Security & Surveillance milestone

---

## 🗓️ Phased Integration Roadmap

### **Phase 1: WiFi Devices First** (Weeks 1-2) ⭐ START HERE

**Target Devices**: Shelly + Govee + Vocolink (15-20 devices)

**Why Start Here**:

- ✅ No hub required (direct HTTP)
- ✅ Fast implementation (HTTP adapters)
- ✅ Immediate value (control from HomeHub)
- ✅ Low risk (Apple Home stays active)

**Deliverables**:

- `HueBridgeAdapter.ts` (Hue HTTP API)
- `GoveeAdapter.ts` (Govee Cloud API)
- `TuyaAdapter.ts` (Smart Life devices)
- Dashboard updates with protocol detection
- 26+ Hue devices controllable from HomeHub

---

### **Phase 2: Z-Wave Devices** (Weeks 3-4)

**Target Devices**: Aeotec Z-Wave devices (5-10 devices)

**Trigger**: Aeotec Z-Stick 10 Pro arrives (late October)

**Deliverables**:

- zwavejs2mqtt setup on Pi 5
- MQTT integration for Z-Wave
- Device inclusion/exclusion procedures
- Dashboard Z-Wave device support

---

### **Phase 3: Zigbee Direct** (Weeks 5-8)

**Target Devices**: Optional non-Hue Zigbee devices

**If you acquire**: IKEA Tradfri, Aqara sensors, etc.

**Deliverables**:

- zigbee2mqtt setup on Pi 5
- Zigbee network configuration
- Test with 3-5 new Zigbee devices
- (Optional) Migrate Hue to zigbee2mqtt

---

### **Phase 4: Camera Integration** (Months 3-6)

**Target Devices**: Eufy cameras first (RTSP easier)

**Deliverables**:

- RTSP stream display in SecurityMonitor
- Motion detection webhooks
- Video storage management
- Later: Arlo cloud API integration

---

## 💰 Cost Analysis

### **New Hardware Needed**

| Item                  | Purpose         | Cost       | Status         |
| --------------------- | --------------- | ---------- | -------------- |
| Shelly Plus 1PM       | Testing         | $15        | ✅ Ordered     |
| Aeotec Z-Stick 10 Pro | Z-Wave + Zigbee | $60-80     | ⏳ Pre-ordered |
| **TOTAL NEW**         |                 | **$75-95** |                |

### **Existing Hardware Value**

| Category           | Count  | Est. Value       | Notes         |
| ------------------ | ------ | ---------------- | ------------- |
| Hue devices        | 26     | $1,300-2,600     | $50-100 each  |
| Hue Bridge         | 1      | $60              | Keep using    |
| Govee devices      | 10     | $200-500         | $20-50 each   |
| Aeotec Z-Wave      | 10     | $300-500         | $30-50 each   |
| Vocolink plugs     | 7      | $70-140          | $10-20 each   |
| Arlo cameras       | 5      | $500-1,000       | $100-200 each |
| Eufy cameras       | 2      | $100-200         | $50-100 each  |
| **TOTAL EXISTING** | **61** | **$2,530-4,940** |               |

### **Key Insights**

- 💡 **You have ~$3,000-5,000 invested in smart home already!**
- 💡 **HomeHub integration costs only $75-95 to unify everything**
- 💡 **No need to replace devices - just add unified control**
- 💡 **ROI**: Full control platform for <2% of device investment

---

## 🎯 Immediate Next Steps

### **Step 1: Test Virtual Device** (Today - 30 minutes)

Complete Milestone 2.2.4 validation:

```powershell
# Terminal 1
node scripts/http-virtual-device.js --port 8001 --name "Living Room Light" --type light --preset shelly

# Terminal 2
npm run dev

# Browser: http://localhost:5173
# Test discovery → room assignment → control → persistence
```

### **Step 2: Find Your Hue Bridge** (Today - 10 minutes)

```powershell
# Option A: Automatic discovery
curl https://discovery.meethue.com/

# Option B: Check router DHCP leases
# Look for device named "Philips-hue" or similar

# Option C: Use Hue app
# Settings → Hue Bridges → (i) icon → IP address
```

### **Step 3: Create Hue API User** (Today - 5 minutes)

```powershell
# 1. Press physical button on Hue Bridge
# 2. Within 30 seconds, run:
curl -X POST http://{BRIDGE_IP}/api -d '{"devicetype":"HomeHub#RaspberryPi"}'

# Response: {"success":{"username":"ABC123..."}}
# Save this username - it's your API key!
```

### **Step 4: List Your Hue Devices** (Today - 5 minutes)

```powershell
curl http://{BRIDGE_IP}/api/{USERNAME}/lights | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

This will show all 26 Hue devices with IDs, names, types, states.

### **Step 5: Test Hue Control** (Today - 5 minutes)

```powershell
# Turn on light #1
curl -X PUT http://{BRIDGE_IP}/api/{USERNAME}/lights/1/state -d '{"on":true}' -ContentType "application/json"

# Set brightness to 50%
curl -X PUT http://{BRIDGE_IP}/api/{USERNAME}/lights/1/state -d '{"bri":127}' -ContentType "application/json"
```

---

## 📊 Expected Timeline

| Week         | Focus                             | Devices Added      | Milestone                |
| ------------ | --------------------------------- | ------------------ | ------------------------ |
| **Week 1**   | Virtual testing + Hue integration | 26 Hue             | Milestone 2.2.4 complete |
| **Week 2**   | Govee + Shelly arrives            | 10 Govee, 1 Shelly | WiFi ecosystem           |
| **Week 3**   | Vocolink/Tuya                     | 7 Vocolink         | 44+ devices total        |
| **Week 4-5** | Aeotec Z-Wave setup               | 10 Aeotec          | Multi-protocol live      |
| **Week 6-8** | Polish + automation               | -                  | Phase 3 automations      |
| **Month 3+** | Cameras                           | 7 cameras          | Security monitoring      |

**Target**: 50+ devices under unified HomeHub control by mid-November 2025

---

## 🚀 Why This Integration Plan Rocks

1. **Zero Risk**: Apple Home stays running during entire migration
2. **Incremental Value**: Each phase adds working devices immediately
3. **Low Cost**: $75-95 to unify $3K+ device investment
4. **Future-Proof**: Aeotec combo dongle = latest protocols
5. **Family-Friendly**: No disruption to daily routines
6. **Scalable**: Room to add 50+ more devices easily

---

## 📖 Documentation to Create

As we integrate each protocol, we'll add:

- `docs/guides/HUE_INTEGRATION.md` - Complete Hue Bridge setup
- `docs/guides/GOVEE_INTEGRATION.md` - Govee API + BLE guide
- `docs/guides/TUYA_INTEGRATION.md` - Smart Life device extraction
- `docs/guides/ZWAVE_INTEGRATION.md` - zwavejs2mqtt configuration
- `docs/guides/CAMERA_INTEGRATION.md` - RTSP streams (Phase 5)

---

## 🎯 Recommendation: Start with Hue

**Why Philips Hue First**:

- ✅ **Biggest impact**: 26 devices = most of your ecosystem
- ✅ **Easiest API**: Well-documented HTTP interface
- ✅ **Fast win**: 2-3 hours to full integration
- ✅ **Zero risk**: Bridge stays in Apple Home
- ✅ **Feature-rich**: Color, brightness, scenes all work
- ✅ **Proven reliable**: Hue Bridge is rock-solid

**Implementation Time**: 1-2 days for complete Hue integration with full feature support

**Ready to start with Hue integration?** I can create the `HueBridgeAdapter.ts` right now! 🚀
