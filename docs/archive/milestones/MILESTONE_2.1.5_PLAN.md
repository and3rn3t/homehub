# Milestone 2.1.5: Physical Device Integration - Implementation Plan

**Phase**: 2.1 - MQTT Broker Setup
**Status**: 📋 Planning
**Estimated Duration**: 5-8 hours (implementation) + 7 days (stability monitoring)

---

## 🎯 Objective

Connect the first physical smart device to HomeHub and validate end-to-end hardware integration, proving the MQTT architecture works with real-world IoT devices.

---

## 📦 Deliverables

### 1. Physical Device Connection

- ✅ One smart light connected to local MQTT broker
- ✅ Device configured with HomeHub topics
- ✅ Device controllable from Dashboard UI
- ✅ Real-time state synchronization

### 2. Protocol Adapter Enhancement

- ✅ Device-specific topic mapping (if needed)
- ✅ Message format translation (if needed)
- ✅ Extended device capabilities support

### 3. Documentation

- ✅ Device setup guide (step-by-step)
- ✅ Configuration examples
- ✅ Troubleshooting guide
- ✅ 7-day stability report

---

## 🔌 Supported Device Options

### Option 1: Tasmota-Flashed Device ⭐ RECOMMENDED

**Why Tasmota**:

- Native MQTT support (built-in)
- Easy configuration via web UI
- Well-documented protocol
- Large community support
- Works with ESP8266/ESP32 devices

**Compatible Hardware**:

- Sonoff Basic R2/R3 (~$5-8)
- Shelly 1/1PM (~$10-15)
- ESP8266/ESP32 with relay module (DIY)

**Configuration Difficulty**: ⭐⭐☆☆☆ (Easy)

**Setup Time**: 15-30 minutes

**Example Device**: Sonoff Basic flashed with Tasmota

```json
{
  "name": "Living Room Light",
  "type": "light",
  "protocol": "tasmota",
  "mqttTopics": {
    "command": "cmnd/sonoff-living-room/POWER",
    "state": "stat/sonoff-living-room/POWER",
    "telemetry": "tele/sonoff-living-room/STATE"
  }
}
```

---

### Option 2: ESPHome Device

**Why ESPHome**:

- YAML-based configuration
- Tight Home Assistant integration
- Custom firmware per device
- Native MQTT support

**Compatible Hardware**:

- ESP8266/ESP32 dev boards
- NodeMCU boards
- Shelly devices (can run ESPHome)

**Configuration Difficulty**: ⭐⭐⭐☆☆ (Moderate)

**Setup Time**: 30-60 minutes

**Example Configuration**:

```yaml
esphome:
  name: living-room-light

mqtt:
  broker: 192.168.1.100
  port: 1883
  topic_prefix: homehub/devices/living-room-light

light:
  - platform: binary
    name: 'Living Room Light'
    output: relay_output
```

---

### Option 3: Shelly Device (Stock Firmware)

**Why Shelly**:

- Works out-of-the-box (no flashing)
- MQTT support in stock firmware
- Professional build quality
- Easy web configuration

**Compatible Models**:

- Shelly 1 (relay switch)
- Shelly 1PM (with power monitoring)
- Shelly Dimmer (with dimming)

**Configuration Difficulty**: ⭐⭐☆☆☆ (Easy)

**Setup Time**: 10-20 minutes

**MQTT Configuration**:

```json
{
  "mqtt": {
    "enable": true,
    "server": "192.168.1.100:1883",
    "id": "shelly-living-room",
    "reconnect_timeout_max": 60,
    "reconnect_timeout_min": 2,
    "clean_session": true,
    "keep_alive": 60
  }
}
```

---

## 🛠️ Implementation Tasks

### Phase 1: Device Selection & Acquisition (Day 1)

**Task 1.1: Choose Device Type**

- [ ] Review device options above
- [ ] Check what hardware is available
- [ ] Consider budget ($5-15)
- [ ] Verify MQTT compatibility

**Task 1.2: Acquire Hardware** (if needed)

- [ ] Order device online (Amazon/AliExpress)
- [ ] Wait for delivery (2-5 days)
- [ ] OR use existing ESP8266/ESP32 board

**Deliverable**: Physical device ready to configure

---

### Phase 2: Device Setup & Configuration (Day 2)

**Task 2.1: Flash Firmware** (if using Tasmota/ESPHome)

**Tasmota Flashing** (Sonoff/ESP8266):

1. Install Tasmotizer tool: <https://github.com/tasmota/tasmotizer>
2. Connect device via USB-to-Serial adapter
3. Put device in flash mode (GPIO0 to GND on boot)
4. Flash Tasmota firmware (v13.x latest)
5. Connect to Tasmota WiFi AP
6. Configure home WiFi credentials

**ESPHome Flashing**:

1. Install ESPHome CLI: `pip install esphome`
2. Create YAML configuration file
3. Connect device via USB
4. Run: `esphome run living-room-light.yaml`
5. Device will reboot with new firmware

**Shelly** (Stock Firmware):

- No flashing required, skip to Task 2.2

---

**Task 2.2: Configure MQTT Settings**

**Tasmota Configuration**:

```
Web UI → Configuration → Configure MQTT

MQTT Host: 192.168.1.100 (your local IP)
MQTT Port: 1883
Client: sonoff-living-room
Topic: cmnd/sonoff-living-room
```

**ESPHome Configuration**:

```yaml
# living-room-light.yaml
mqtt:
  broker: !secret mqtt_broker
  port: 1883
  username: !secret mqtt_user # if using auth
  password: !secret mqtt_pass
  topic_prefix: homehub/devices/living-room-light
```

**Shelly Configuration**:

```
Web UI → Internet & Security → Advanced - Developer Settings → Enable MQTT

MQTT Server: 192.168.1.100:1883
Custom MQTT Prefix: homehub/devices/shelly-living-room
```

**Verification**:

```bash
# Monitor all MQTT traffic
mosquitto_sub -t '#' -v

# Should see device announce itself
# Tasmota: tele/sonoff-living-room/LWT = Online
# ESPHome: homehub/devices/living-room-light/status = online
# Shelly: homehub/devices/shelly-living-room/online = true
```

**Deliverable**: Device connected to MQTT broker and publishing messages

---

**Task 2.3: Test Basic MQTT Commands**

**Tasmota**:

```bash
# Turn ON
mosquitto_pub -t "cmnd/sonoff-living-room/POWER" -m "ON"

# Turn OFF
mosquitto_pub -t "cmnd/sonoff-living-room/POWER" -m "OFF"

# Toggle
mosquitto_pub -t "cmnd/sonoff-living-room/POWER" -m "TOGGLE"

# Monitor state updates
mosquitto_sub -t "stat/sonoff-living-room/POWER"
```

**ESPHome**:

```bash
# Turn ON
mosquitto_pub -t "homehub/devices/living-room-light/switch/command" -m "ON"

# Turn OFF
mosquitto_pub -t "homehub/devices/living-room-light/switch/command" -m "OFF"

# Monitor state
mosquitto_sub -t "homehub/devices/living-room-light/switch/state"
```

**Shelly**:

```bash
# Turn ON
mosquitto_pub -t "homehub/devices/shelly-living-room/relay/0/command" -m "on"

# Turn OFF
mosquitto_pub -t "homehub/devices/shelly-living-room/relay/0/command" -m "off"

# Monitor state
mosquitto_sub -t "homehub/devices/shelly-living-room/relay/0"
```

**Success Criteria**:

- ✅ Device responds to MQTT commands
- ✅ Physical relay clicks on/off
- ✅ State updates published to MQTT
- ✅ <1 second response time

**Deliverable**: Device controllable via MQTT commands

---

### Phase 3: Service Layer Integration (Day 3)

**Task 3.1: Create Device-Specific Adapter**

**File**: `src/services/mqtt/adapters/tasmota-adapter.ts`

```typescript
import type { DeviceCommand, DeviceStateUpdate } from '@/types'
import { MQTTDeviceAdapter } from '../device-adapter'

export class TasmotaDeviceAdapter extends MQTTDeviceAdapter {
  /**
   * Tasmota-specific topic structure
   * cmnd/{topic}/COMMAND - commands
   * stat/{topic}/RESULT - responses
   * tele/{topic}/STATE - telemetry
   */

  protected getCommandTopic(deviceId: string): string {
    return `cmnd/${deviceId}/POWER`
  }

  protected getStateTopic(deviceId: string): string {
    return `stat/${deviceId}/POWER`
  }

  protected getTelemetryTopic(deviceId: string): string {
    return `tele/${deviceId}/STATE`
  }

  protected translateCommand(command: DeviceCommand): string {
    switch (command.command) {
      case 'toggle':
        return 'TOGGLE'
      case 'set':
        return command.enabled ? 'ON' : 'OFF'
      default:
        return 'TOGGLE'
    }
  }

  protected parseStateUpdate(topic: string, message: string): DeviceStateUpdate | null {
    const deviceId = this.extractDeviceId(topic)

    if (topic.includes('/POWER')) {
      // Simple ON/OFF message
      return {
        deviceId,
        enabled: message === 'ON',
        timestamp: new Date(),
      }
    }

    if (topic.includes('/STATE')) {
      // Telemetry JSON message
      try {
        const data = JSON.parse(message)
        return {
          deviceId,
          enabled: data.POWER === 'ON',
          value: data.Dimmer, // If dimmer supported
          timestamp: new Date(data.Time),
        }
      } catch (err) {
        console.error('Failed to parse Tasmota telemetry:', err)
        return null
      }
    }

    return null
  }

  private extractDeviceId(topic: string): string {
    // Extract device ID from topic
    // "stat/sonoff-living-room/POWER" -> "sonoff-living-room"
    const parts = topic.split('/')
    return parts[1] || 'unknown'
  }
}
```

**Deliverable**: Tasmota adapter with protocol translation

---

**Task 3.2: Register Physical Device**

**File**: `src/constants/mock-data.ts` (add physical device)

```typescript
export const PHYSICAL_DEVICES: Device[] = [
  {
    id: 'sonoff-living-room', // Must match MQTT topic
    name: 'Living Room Light (Physical)',
    type: 'light',
    room: 'Living Room',
    status: 'online',
    enabled: false,
    value: 100, // Full brightness
    icon: 'Lightbulb',
    protocol: 'tasmota', // Flag for adapter selection
    capabilities: ['toggle', 'brightness'], // Device features
    hardware: {
      model: 'Sonoff Basic R3',
      firmware: 'Tasmota 13.2.0',
      ip: '192.168.1.150',
    },
  },
]

// Merge with virtual devices for testing
export const ALL_DEVICES = [...MOCK_DEVICES, ...PHYSICAL_DEVICES]
```

---

**Task 3.3: Update DeviceRegistry for Physical Devices**

**File**: `src/services/mqtt/device-registry.ts`

```typescript
// Add method to register physical devices
public registerPhysicalDevice(device: Device): void {
  this.devices.set(device.id, device)

  // Subscribe to device state updates
  const adapter = this.selectAdapter(device.protocol)
  const stateTopic = adapter.getStateTopic(device.id)

  adapter.subscribe(stateTopic, (topic, message) => {
    const update = adapter.parseStateUpdate(topic, message)
    if (update) {
      this.updateDeviceState(device.id, update)
    }
  })

  console.log(`✅ Physical device registered: ${device.name}`)
}

// Adapter selection based on protocol
private selectAdapter(protocol?: string): MQTTDeviceAdapter {
  switch (protocol) {
    case 'tasmota':
      return new TasmotaDeviceAdapter(this.client)
    case 'esphome':
      return new ESPHomeDeviceAdapter(this.client)
    case 'shelly':
      return new ShellyDeviceAdapter(this.client)
    default:
      return this.adapter // Default adapter
  }
}
```

---

**Task 3.4: Initialize Physical Device on App Load**

**File**: `src/hooks/use-mqtt-devices.ts`

```typescript
useEffect(() => {
  const initializePhysicalDevices = async () => {
    // Import physical devices from constants
    const { PHYSICAL_DEVICES } = await import('@/constants/mock-data')

    // Register each physical device
    PHYSICAL_DEVICES.forEach(device => {
      deviceRegistry.registerPhysicalDevice(device)
    })

    console.log(`📡 Registered ${PHYSICAL_DEVICES.length} physical device(s)`)
  }

  if (deviceRegistry) {
    initializePhysicalDevices()
  }
}, [deviceRegistry])
```

**Deliverable**: Physical device appears in Dashboard device list

---

### Phase 4: Dashboard Testing (Day 4)

**Task 4.1: Verify Device Discovery**

**Steps**:

1. Open Dashboard: <http://localhost:5173>
2. Verify physical device appears in device list
3. Check connection status (should be "online")
4. Verify device details (name, type, room)

**Expected Result**:

- ✅ Device card shows "Living Room Light (Physical)"
- ✅ Status badge is green "online"
- ✅ Toggle switch is interactive

---

**Task 4.2: Test Device Control**

**Steps**:

1. Click toggle switch on physical device card
2. Observe physical light turns on/off
3. Check response time (<500ms)
4. Verify toast notification appears
5. Confirm UI state matches physical state

**Expected Result**:

- ✅ Physical light responds to toggle
- ✅ UI updates immediately (optimistic)
- ✅ State confirms after <500ms
- ✅ No lag or delay in user experience

---

**Task 4.3: Test External Control**

**Steps**:

1. Use physical button/switch to toggle light
2. Observe Dashboard UI updates automatically
3. Use mosquitto_pub to send command
4. Verify Dashboard reflects external changes

**Command**:

```bash
# Turn light ON via MQTT
mosquitto_pub -t "cmnd/sonoff-living-room/POWER" -m "ON"

# Dashboard should update within 1 second
```

**Expected Result**:

- ✅ Dashboard updates when light changed externally
- ✅ Update latency <1 second
- ✅ No manual refresh required

---

**Task 4.4: Test Error Scenarios**

**Scenario 1: Device Offline**

1. Unplug physical device
2. Wait 30 seconds
3. Observe Dashboard shows "offline" status
4. Try to toggle device
5. Verify user gets appropriate error message

**Scenario 2: MQTT Broker Down**

1. Stop MQTT broker: `docker stop homehub-mosquitto`
2. Try to toggle device
3. Verify fallback to offline mode
4. Restart broker: `docker start homehub-mosquitto`
5. Verify reconnection and sync

**Scenario 3: Network Latency**

1. Introduce artificial delay (if possible)
2. Toggle device rapidly 5 times
3. Verify UI remains responsive
4. Confirm final state is correct

**Deliverable**: All test scenarios pass with expected behavior

---

### Phase 5: Documentation (Day 5)

**Task 5.1: Create Device Setup Guide**

**File**: `docs/PHYSICAL_DEVICE_SETUP.md`

**Sections**:

1. Hardware requirements
2. Firmware flashing guide (Tasmota)
3. MQTT configuration steps
4. Troubleshooting common issues
5. Multiple device setup
6. Advanced configurations

---

**Task 5.2: Document Protocol Adapter**

**File**: `docs/DEVICE_ADAPTERS.md`

**Sections**:

1. Adapter architecture overview
2. TasmotaAdapter implementation
3. Creating custom adapters
4. Protocol translation examples
5. Testing adapter code

---

**Task 5.3: Create Stability Test Plan**

**File**: `docs/STABILITY_TEST_PLAN.md`

**Monitoring Checklist** (7 days):

- Daily device control test (morning/evening)
- Response time measurements
- Uptime tracking
- Error log review
- Network interruption recovery
- Power cycle testing

---

### Phase 6: Stability Monitoring (Days 6-12)

**Task 6.1: Daily Health Checks**

**Morning Routine**:

```bash
# Check MQTT broker status
docker ps --filter "name=mosquitto"

# Check device online status
mosquitto_sub -t "tele/sonoff-living-room/LWT" -C 1

# Test device control
node scripts/test-physical-device.js
```

**Evening Routine**:

- Toggle device 10 times via Dashboard
- Record response times
- Note any errors or delays
- Check MQTT broker logs

---

**Task 6.2: Log Metrics**

**Metrics to Track**:

| Metric          | Target | Day 1  | Day 2  | Day 3  | Day 4  | Day 5  | Day 6  | Day 7  |
| --------------- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| Response Time   | <500ms | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ |
| Uptime %        | >99.5% | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ |
| Failed Commands | 0      | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ |
| Reconnects      | <3     | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ | \_\_\_ |

---

**Task 6.3: Stress Testing**

**Rapid Command Test**:

```bash
# Send 100 toggle commands
for i in {1..100}; do
  mosquitto_pub -t "cmnd/sonoff-living-room/POWER" -m "TOGGLE"
  sleep 0.1
done

# Verify device still responsive
# Check for any errors in logs
```

**Long-Running Test**:

```bash
# Toggle every 5 minutes for 24 hours
node scripts/endurance-test.js --device sonoff-living-room --duration 24h
```

---

**Task 6.4: Create Stability Report**

**File**: `docs/MILESTONE_2.1.5_STABILITY_REPORT.md`

**Sections**:

1. Test setup and hardware
2. 7-day metrics summary
3. Issues encountered and resolutions
4. Performance analysis
5. Recommendations for improvements
6. Production readiness assessment

---

## ✅ Success Criteria

### Must Pass ✅

- [ ] Physical device connects to MQTT broker
- [ ] Device responds to Dashboard controls
- [ ] Response time <500ms (UI to physical change)
- [ ] External changes sync to Dashboard <1s
- [ ] 99.5% uptime over 7 days
- [ ] Zero data loss during network interruptions
- [ ] Graceful recovery from power cycles
- [ ] Documentation complete and clear

### Nice to Have 🎨

- [ ] Support for multiple device protocols
- [ ] Automatic device discovery
- [ ] Firmware update detection
- [ ] Power monitoring (if device supports)
- [ ] Historical data logging

---

## 🐛 Potential Issues & Solutions

### Issue 1: Device Won't Connect to MQTT

**Symptoms**:

- Device online but not publishing messages
- Broker shows no connections from device

**Solutions**:

1. Check firewall allows port 1883
2. Verify MQTT broker IP is correct
3. Confirm device WiFi connection
4. Check MQTT credentials (if using auth)
5. Try `telnet <broker_ip> 1883` to test connectivity

---

### Issue 2: Commands Not Received by Device

**Symptoms**:

- Dashboard sends command but device doesn't respond
- No errors in console

**Solutions**:

1. Verify topic structure matches device config
2. Check QoS settings (try QoS 1 instead of 0)
3. Monitor with `mosquitto_sub -t '#' -v`
4. Verify adapter is translating commands correctly
5. Check device command format in documentation

---

### Issue 3: State Updates Not Reflected in Dashboard

**Symptoms**:

- Physical device changes but Dashboard doesn't update
- External MQTT commands don't sync

**Solutions**:

1. Verify wildcard subscription implemented
2. Check adapter parseStateUpdate() logic
3. Monitor state topic: `mosquitto_sub -t "stat/+/POWER"`
4. Verify DeviceRegistry callback is firing
5. Check React hook state update logic

---

### Issue 4: Poor Response Time

**Symptoms**:

- Toggle takes >1 second to respond
- Laggy user experience

**Solutions**:

1. Check WiFi signal strength
2. Reduce MQTT QoS to 0 for faster throughput
3. Verify broker not overloaded
4. Check for network congestion
5. Move device closer to router

---

## 📊 Phase 2.1 Completion Status

After Milestone 2.1.5:

| Milestone                   | Status       | Description            |
| --------------------------- | ------------ | ---------------------- |
| 2.1.1 Environment Setup     | ✅ 100%      | Docker + MQTT broker   |
| 2.1.2 Service Layer         | ✅ 100%      | Classes + types        |
| 2.1.3 Virtual Devices       | ✅ 100%      | Testing infrastructure |
| 2.1.4 Dashboard Integration | ✅ 100%      | React hooks + UI       |
| 2.1.5 Physical Device       | 🔄 0% → 100% | Hardware integration   |

**Phase 2.1 Status**: 80% → **100% COMPLETE**

---

## 🚀 Next Phase: 2.2 Device Abstraction Layer

After completing Phase 2.1, proceed with:

1. **Multiple Protocol Support**
   - Tasmota adapter (done in 2.1.5)
   - ESPHome adapter
   - Shelly adapter
   - Zigbee2MQTT adapter

2. **Plugin Architecture**
   - Dynamic adapter loading
   - Custom adapter creation guide
   - Adapter marketplace (future)

3. **Device Discovery**
   - Automatic protocol detection
   - mDNS/Bonjour scanning
   - UPnP discovery

---

## 📚 Resources

### Tasmota Documentation

- Official Docs: <https://tasmota.github.io/docs/>
- MQTT Commands: <https://tasmota.github.io/docs/Commands/#mqtt>
- Device Templates: <https://templates.blakadder.com/>

### ESPHome Documentation

- Official Docs: <https://esphome.io/>
- MQTT Component: <https://esphome.io/components/mqtt.html>
- Device Configs: <https://devices.esphome.io/>

### Shelly Documentation

- API Documentation: <https://shelly-api-docs.shelly.cloud/>
- MQTT Guide: <https://shelly-api-docs.shelly.cloud/gen1/#mqtt>

### MQTT Tools

- MQTT Explorer: <http://mqtt-explorer.com/>
- MQTTX: <https://mqttx.app/>
- Mosquitto CLI: <https://mosquitto.org/man/mosquitto_sub-1.html>

---

**Plan Version**: 1.0
**Created**: January 2025
**Status**: Ready for Implementation
