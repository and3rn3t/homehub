# Hardware Acquisition Plan - October 2025

**Date**: October 10, 2025
**Status**: 🛒 Devices Ordered
**Owner**: and3rn3t

---

## 🎯 Ordered Hardware

### **1. Shelly Plus 1PM** ✅ Ordered

**Purpose**: First physical device for testing Milestone 2.2.4

**Specifications**:

- Protocol: HTTP (Shelly Gen2 RPC API)
- Features: Relay switch + power monitoring
- Control: WiFi-based, direct HTTP commands
- Compatibility: 100% with existing `ShellyAdapter.ts`

**Testing Plan**:

- ✅ Discovery via HTTPScanner
- ✅ Room assignment
- ✅ ON/OFF control via Dashboard
- ✅ State persistence validation
- ✅ Power monitoring data display
- ✅ Response time measurement
- ✅ Error handling (disconnect test)

**Expected Delivery**: TBD
**Next Steps When Arrived**:

1. Connect to WiFi network
2. Note IP address
3. Test discovery: `127.0.0.1/32` → change to actual IP
4. Follow test plan in `scripts/test-device-control.js`
5. Document results in `MILESTONE_2.2.4_TEST_RESULTS.md`

---

### **2. Aeotec Z-Stick 10 Pro (Z-Wave + Zigbee Combo)** 🆕 Pre-ordered

**BREAKING NEWS**: First-ever dual-protocol stick from Aeotec!

**Model**: Aeotec Z-Stick 10 Pro
**Purpose**: Single USB dongle for both Zigbee and Z-Wave protocols

**Confirmed Specifications**:

- **Z-Wave Radio**: Silicon Labs **EFR32ZG23** (Z-Wave 800 series)
  - Latest generation Z-Wave Long Range
  - Up to **1 mile (1.6 km)** range outdoors
  - 40% longer range than 700 series
  - 250 kbps data rate
  - SmartStart support (easy device inclusion)
  - S2 Security framework

- **Zigbee Radio**: Silicon Labs **EFR32MG21** (Zigbee 3.0)
  - State-of-the-art Zigbee chip
  - 2.4 GHz frequency band
  - 100+ device support
  - Green Power proxy support
  - Full Zigbee 3.0 specification

- **Form Factor**: Single USB-A dongle
- **Power**: USB-powered (5V, ~150mA typical)
- **Dual Radios**: Independent Z-Wave + Zigbee controllers
- **Antennas**: Dual optimized antennas (one per protocol)

**Why This Is Game-Changing**:

- ✅ **One USB port** instead of two - Critical for Pi 5 users
- ✅ **1 MILE range** - Covers entire property, detached buildings
- ✅ **Latest chips** - EFR32 series (2023+ generation)
- ✅ **Optimized dual antennas** - Minimal interference between protocols
- ✅ **Professional hardware** - Aeotec quality and support
- ✅ **Future-proof** - Z-Wave LR + Zigbee 3.0 ready

**Release Date**: Late October 2025
**Expected Price**: $60-80 (estimated, TBD)
**Status**: ⏳ Pre-ordered, awaiting shipment

**Integration Plan**:

1. Install on Raspberry Pi 5 (USB 3.0 port)
2. Configure Home Assistant or zigbee2mqtt/zwavejs
3. Test Zigbee device pairing
4. Test Z-Wave device pairing
5. Integrate with HomeHub via MQTT
6. Document dual-protocol setup

---

## 🖥️ Existing Hardware

### **Raspberry Pi 5** ✅ In Hand

**Specifications**:

- CPU: Quad-core Arm Cortex-A76 @ 2.4GHz
- RAM: 4GB or 8GB (confirm which model)
- USB: 2x USB 3.0 + 2x USB 2.0
- Network: WiFi 6 + Gigabit Ethernet
- Bluetooth: 5.0 BLE (built-in)

**Current Use**: TBD (development machine or dedicated hub?)

**Planned Use**:

- MQTT Broker (Mosquitto)
- zigbee2mqtt (for Zigbee devices via Aeotec dongle)
- zwavejs2mqtt (for Z-Wave devices via Aeotec dongle)
- Home Assistant (optional, for advanced automation)
- BLE Gateway (using built-in Bluetooth)

**OS**: Raspberry Pi OS Lite (64-bit) recommended

---

## 📋 Complete System Architecture (Post-Setup)

### **Network Topology**

```mermaid
graph TB
    subgraph "Your Network"
        R[WiFi Router<br/>192.168.1.1]
    end

    subgraph "Development PC"
        H[HomeHub UI<br/>localhost:5173]
    end

    subgraph "Raspberry Pi 5<br/>192.168.1.X"
        M[MQTT Broker<br/>Mosquitto:1883]
        Z[zigbee2mqtt<br/>Port 8080]
        W[zwavejs2mqtt<br/>Port 8091]
        B[BLE Gateway<br/>Built-in Radio]

        A[Aeotec Combo<br/>USB Dongle]
        A --> Z
        A --> W
    end

    subgraph "Devices"
        S[Shelly Plus 1PM<br/>HTTP/WiFi]
        ZD[Zigbee Devices<br/>Lights, Sensors]
        ZW[Z-Wave Devices<br/>Switches, Locks]
        BL[BLE Devices<br/>Temp Sensors]
    end

    H -->|HTTP| R
    R -->|HTTP| S

    H -->|MQTT| M
    M --> Z
    M --> W
    M --> B

    Z -->|Zigbee| ZD
    W -->|Z-Wave| ZW
    B -->|Bluetooth| BL

    style H fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style M fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style S fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style A fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
```

---

## 🎯 Phased Rollout Plan

### **Phase 1: Shelly Device Testing** (Week 1)

**Hardware**: Shelly Plus 1PM only
**Protocols**: HTTP/WiFi
**Goal**: Validate Milestone 2.2.4 implementation

**Tasks**:

- [ ] Receive Shelly device
- [ ] Connect to WiFi network
- [ ] Discover device via HomeHub
- [ ] Test ON/OFF control
- [ ] Verify state persistence
- [ ] Test power monitoring display
- [ ] Measure response times
- [ ] Test error scenarios (unplug, timeout)
- [ ] Document all findings

**Success Criteria**:

- ✅ Device discovered automatically
- ✅ Control works <1 second
- ✅ State persists after refresh
- ✅ Power data displays correctly
- ✅ Error handling works gracefully

**Deliverable**: `docs/development/MILESTONE_2.2.4_TEST_RESULTS.md`

---

### **Phase 2: Raspberry Pi Setup** (Week 2-3)

**Hardware**: Raspberry Pi 5
**Goal**: Prepare hub for Aeotec dongle arrival

**Tasks**:

- [ ] Install Raspberry Pi OS (64-bit)
- [ ] Configure network settings (static IP recommended)
- [ ] Install Docker + Docker Compose
- [ ] Install Mosquitto MQTT broker
- [ ] Configure MQTT for remote access
- [ ] Install zigbee2mqtt (ready for dongle)
- [ ] Install zwavejs2mqtt (ready for dongle)
- [ ] Set up BLE gateway
- [ ] Update HomeHub to connect to Pi's MQTT broker
- [ ] Test MQTT connectivity from PC to Pi

**Configuration Files Needed**:

```yaml
# docker-compose.yml
version: '3.8'
services:
  mosquitto:
    image: eclipse-mosquitto:latest
    ports:
      - '1883:1883'
      - '9001:9001'
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
    restart: unless-stopped

  zigbee2mqtt:
    image: koenkk/zigbee2mqtt:latest
    ports:
      - '8080:8080'
    volumes:
      - ./zigbee2mqtt/data:/app/data
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0 # Adjust when Aeotec arrives
    environment:
      - TZ=America/New_York # Adjust to your timezone
    restart: unless-stopped
    depends_on:
      - mosquitto

  zwavejs2mqtt:
    image: zwavejs/zwavejs2mqtt:latest
    ports:
      - '8091:8091'
      - '3000:3000'
    volumes:
      - ./zwavejs2mqtt/data:/usr/src/app/store
    devices:
      - /dev/ttyUSB1:/dev/ttyUSB1 # Adjust when Aeotec arrives
    restart: unless-stopped
    depends_on:
      - mosquitto
```

**Success Criteria**:

- ✅ Pi accessible via SSH
- ✅ MQTT broker running and accessible
- ✅ zigbee2mqtt/zwavejs2mqtt ready (waiting for USB device)
- ✅ HomeHub connects to Pi's MQTT broker
- ✅ All services auto-start on boot

---

### **Phase 3: Aeotec Dongle Integration** (Late October)

**Hardware**: Aeotec Z-Wave + Zigbee Combo Dongle
**Goal**: Enable multi-protocol device support

**Tasks When Arrived**:

- [ ] Plug into Pi 5 USB 3.0 port
- [ ] Identify device paths (`lsusb`, `ls /dev/tty*`)
- [ ] Update zigbee2mqtt config with correct serial port
- [ ] Update zwavejs2mqtt config with correct serial port
- [ ] Test Zigbee pairing (use cheap sensor first)
- [ ] Test Z-Wave pairing (if you have Z-Wave devices)
- [ ] Verify both protocols work simultaneously
- [ ] Check for interference between protocols
- [ ] Document device path configuration
- [ ] Update HomeHub to support Zigbee/Z-Wave devices

**Expected Device Paths**:

```bash
# Example (actual paths will vary)
Zigbee: /dev/serial/by-id/usb-Aeotec_Zigbee_...-if00-port0
Z-Wave: /dev/serial/by-id/usb-Aeotec_ZWave_...-if01-port0

# Or possibly:
/dev/ttyUSB0  # Zigbee
/dev/ttyUSB1  # Z-Wave
```

**Success Criteria**:

- ✅ Both protocols detected by software
- ✅ Can pair Zigbee device
- ✅ Can pair Z-Wave device (if available)
- ✅ Both work simultaneously without interference
- ✅ Devices controllable via HomeHub

**Deliverable**: `docs/development/AEOTEC_COMBO_SETUP_GUIDE.md`

---

### **Phase 4: First Zigbee/Z-Wave Devices** (November)

**Goal**: Expand device ecosystem beyond WiFi

**Recommended First Devices**:

**Zigbee**:

- IKEA Trådfri bulb ($8) - Cheapest test device
- Aqara temp/humidity sensor ($12) - Useful data
- Sonoff motion sensor ($10) - Automation trigger

**Z-Wave** (optional if you want to test):

- Zooz ZEN71 switch ($30) - Basic on/off
- Aeotec MultiSensor 6 ($45) - Multiple sensors in one

**Testing Focus**:

- Device discovery via zigbee2mqtt UI
- MQTT topic mapping
- HomeHub device display
- Cross-protocol automation (Zigbee sensor → WiFi light)

---

## � Aeotec Z-Stick 10 Pro - Technical Deep Dive

### **Hardware Architecture**

**Dual-Radio Design**:

```text
┌─────────────────────────────────────────┐
│     Aeotec Z-Stick 10 Pro USB-A         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  EFR32ZG23 (Z-Wave 800)          │  │
│  │  • 908.4 MHz (US)                │  │
│  │  • 1 mile outdoor range          │  │
│  │  • Up to 232 nodes               │  │
│  │  • SmartStart & S2 Security      │  │
│  └──────────────────────────────────┘  │
│             ↕ Independent                │
│  ┌──────────────────────────────────┐  │
│  │  EFR32MG21 (Zigbee 3.0)          │  │
│  │  • 2.4 GHz                       │  │
│  │  • 100+ device mesh              │  │
│  │  • Channel 11/15/20/25           │  │
│  │  • Green Power support           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [USB-A Connector] → Pi 5 USB 3.0      │
└─────────────────────────────────────────┘
```

### **Silicon Labs EFR32 Chip Family**

**EFR32ZG23 (Z-Wave Controller)**:

- **Generation**: Series 2 Platform (2023)
- **Architecture**: Arm Cortex-M33 @ 76.8 MHz
- **Flash**: 512 KB
- **RAM**: 64 KB
- **Frequency**:
  - US: 908.4 MHz
  - EU: 868.4 MHz
  - ANZ: 921.4 MHz
- **TX Power**: +20 dBm (100mW)
- **RX Sensitivity**: -106 dBm
- **Range**: Up to 1 mile (1.6 km) line-of-sight
- **Features**:
  - Z-Wave Long Range (LR) support
  - SmartStart (QR code inclusion)
  - S2 Security Framework
  - Over-the-air (OTA) firmware updates
  - Low power modes (battery devices)

**EFR32MG21 (Zigbee Controller)**:

- **Generation**: Series 2 Platform (2020)
- **Architecture**: Arm Cortex-M33 @ 80 MHz
- **Flash**: 1024 KB
- **RAM**: 96 KB
- **Frequency**: 2400-2483.5 MHz (2.4 GHz ISM band)
- **TX Power**: +20 dBm (100mW)
- **RX Sensitivity**: -100 dBm
- **Range**: 100-150m typical indoor
- **Features**:
  - Zigbee 3.0 compliant
  - Green Power proxy (battery-free devices)
  - Mesh networking (self-healing)
  - OTA firmware updates
  - Touchlink commissioning

### **Why These Chips Matter**

**EFR32ZG23 Advantages**:

- ✅ **Z-Wave 800 series** = 40% better range than 700 series
- ✅ **1 mile range** = Entire property + detached garage/shed
- ✅ **Lower power** = Better battery device support
- ✅ **SmartStart** = Scan QR code to add device (no manual mode)
- ✅ **S2 Security** = Military-grade encryption (AES-128)

**EFR32MG21 Advantages**:

- ✅ **1MB Flash** = More Zigbee devices supported
- ✅ **Green Power** = Support battery-free switches (EnOcean)
- ✅ **Zigbee 3.0** = Universal standard (all Zigbee brands work)
- ✅ **Multiple channels** = Avoid WiFi interference

### **Serial Port Configuration**

**Expected Device Enumeration**:

```bash
# When plugged into Pi 5, expect TWO serial devices:

/dev/serial/by-id/usb-Aeotec_Z-Stick_10_Pro_ZWave-if00-port0
/dev/serial/by-id/usb-Aeotec_Z-Stick_10_Pro_Zigbee-if01-port0

# Or possibly:
/dev/ttyUSB0  → Z-Wave (EFR32ZG23)
/dev/ttyUSB1  → Zigbee (EFR32MG21)

# Check with:
ls -l /dev/serial/by-id/
dmesg | grep ttyUSB
```

**Configuration Files**:

**zigbee2mqtt** (`data/configuration.yaml`):

```yaml
serial:
  port: /dev/serial/by-id/usb-Aeotec_Z-Stick_10_Pro_Zigbee-if01-port0
  adapter: ember # EFR32MG21 uses EmberZNet stack
  baudrate: 115200

advanced:
  channel: 15 # Avoid WiFi channel 1 (overlaps Zigbee 11)
  pan_id: GENERATE
  network_key: GENERATE
  homeassistant: false # We're using MQTT direct
```

**zwavejs2mqtt** (`store/settings.json`):

```json
{
  "zwave": {
    "port": "/dev/serial/by-id/usb-Aeotec_Z-Stick_10_Pro_ZWave-if00-port0",
    "commandsTimeout": 30,
    "networkKey": "GENERATE_ON_FIRST_START",
    "enableSmartStart": true,
    "enableSecurity": true,
    "securityKeys": {
      "S2_Unauthenticated": "GENERATE",
      "S2_Authenticated": "GENERATE",
      "S2_AccessControl": "GENERATE"
    }
  }
}
```

### **Range Comparison**

**Z-Wave 800 (EFR32ZG23) vs Previous Generations**:

| Generation     | Max Range | Chip          | Year     | Used By               |
| -------------- | --------- | ------------- | -------- | --------------------- |
| 500 series     | 100m      | ZM5101        | 2013     | Aeotec Z-Stick Gen5   |
| 700 series     | 200m      | ZGM130S       | 2018     | Aeotec Z-Stick 7      |
| **800 series** | **1600m** | **EFR32ZG23** | **2023** | **Z-Stick 10 Pro** ✅ |

**Real-World Range** (Z-Wave 800):

- Indoor (wood walls): 200-300m
- Through concrete: 50-100m
- Outdoor line-of-sight: **1600m (1 mile)**
- Typical suburban home: **100% coverage including yard**

**Zigbee 3.0 (EFR32MG21) Typical Range**:

- Indoor: 75-150m (depends on obstacles)
- Through walls: 10-30m per wall
- 2.4 GHz = Better penetration than 5 GHz WiFi
- **Mesh networking**: Each device extends range

### **Power Consumption**

| Component          | Active      | Sleep   | Notes              |
| ------------------ | ----------- | ------- | ------------------ |
| EFR32ZG23          | 45 mA       | 1.7 µA  | Z-Wave listening   |
| EFR32MG21          | 38 mA       | 1.3 µA  | Zigbee coordinator |
| **Total from USB** | **~150 mA** | **N/A** | Always powered     |

**Pi 5 USB Power Budget**:

- Each USB 3.0 port: 900 mA available
- Z-Stick 10 Pro: 150 mA typical
- **Remaining**: 750 mA per port (plenty!) ✅

### **Firmware Updates**

**Update Mechanism**:

- **Z-Wave**: OTA via zwavejs2mqtt web UI
- **Zigbee**: OTA via zigbee2mqtt web UI
- **Frequency**: Quarterly (Aeotec releases)
- **Downtime**: ~2 minutes per update
- **Rollback**: Supported (automatic on failure)

---

## �💰 Total Investment Breakdown

### **Confirmed Purchases**

| Item                | Cost        | Status         | Purpose             |
| ------------------- | ----------- | -------------- | ------------------- |
| Shelly Plus 1PM     | $10-15      | ✅ Ordered     | HTTP device testing |
| Aeotec Combo Dongle | ~$60-80     | ⏳ Pre-ordered | Zigbee + Z-Wave     |
| Raspberry Pi 5      | $0          | ✅ Owned       | Multi-protocol hub  |
| **Current Total**   | **~$75-95** |                |                     |

### **Future Additions** (Optional)

| Item                | Cost        | Timeline             | Purpose                |
| ------------------- | ----------- | -------------------- | ---------------------- |
| Pi 5 Accessories    | $35         | When using as hub    | Power, case, SD card   |
| IKEA Trådfri bulb   | $8          | After Aeotec arrives | Zigbee testing         |
| Aqara sensor        | $12         | Month 2              | Environment monitoring |
| More Shelly devices | $10-15 each | Ongoing              | Expand HTTP devices    |

### **Total Expected Investment** (6 months)

- Hardware: ~$150-180
- Software: $0 (all open source)
- **Very reasonable for complete smart home!** ✅

---

## 📚 Documentation To Create

### **When Shelly Arrives**

1. `docs/development/SHELLY_SETUP_GUIDE.md` - Initial setup steps
2. `docs/development/MILESTONE_2.2.4_TEST_RESULTS.md` - Test results
3. `docs/development/SHELLY_POWER_MONITORING.md` - Power data integration

### **When Pi Setup Complete**

1. `docs/deployment/RASPBERRY_PI_SETUP.md` - OS installation, configuration
2. `docs/deployment/MQTT_BROKER_SETUP.md` - Mosquitto configuration
3. `docs/guides/ZIGBEE2MQTT_QUICKSTART.md` - zigbee2mqtt setup
4. `docs/guides/ZWAVEJS2MQTT_QUICKSTART.md` - zwavejs2mqtt setup

### **When Aeotec Dongle Arrives**

1. `docs/development/AEOTEC_COMBO_SETUP_GUIDE.md` - Dongle installation
2. `docs/development/DUAL_PROTOCOL_CONFIGURATION.md` - Multi-protocol config
3. `docs/development/AEOTEC_DEVICE_PATHS.md` - Serial port mapping

---

## 🎯 Aeotec Combo Dongle - What We Know

**Product**: Aeotec Z-Wave + Zigbee USB Dongle
**Release**: Late October 2025
**Significance**: First mainstream combo dongle

**Why This Is Important**:

- ✅ **Industry first** - Aeotec is a major player (owned by Nortek/NuTone)
- ✅ **Single USB port** - Huge advantage for SBCs with limited ports
- ✅ **Official support** - Likely excellent Home Assistant integration
- ✅ **Latest chips** - Z-Wave 800 series + modern Zigbee controller
- ✅ **Reduced cost** - One device vs two ($60-80 vs $90+)

**Questions to Research When Released**:

- [ ] Exact chip specifications (Z-Wave 800 series? Which Zigbee chip?)
- [ ] Serial port configuration (one /dev/ttyUSB or two?)
- [ ] Antenna design (shared or separate?)
- [ ] Power consumption vs separate dongles
- [ ] Firmware update process
- [ ] Home Assistant compatibility
- [ ] zigbee2mqtt + zwavejs compatibility

**Pre-Release Preparations**:

- [ ] Monitor Aeotec announcements
- [ ] Join Home Assistant community forums for setup guides
- [ ] Prepare Pi 5 with latest software
- [ ] Have test devices ready (IKEA bulb for Zigbee)

---

## 🔄 Integration Milestones

### **Milestone 2.2.4: HTTP Device Control** (Current)

- ✅ ShellyAdapter implemented
- ✅ Dashboard integration complete
- ⏳ Waiting for physical device testing

### **Milestone 2.3.1: MQTT Device Integration** (December)

- Integrate Pi 5 MQTT broker with HomeHub
- Support Zigbee devices via zigbee2mqtt
- Support Z-Wave devices via zwavejs2mqtt

### **Milestone 2.3.2: Multi-Protocol Adapter** (January)

- Unified adapter interface for all protocols
- Automatic protocol detection
- Seamless device control across protocols

### **Milestone 2.3.3: Cross-Protocol Automation** (February)

- Zigbee sensor triggers HTTP device
- Z-Wave switch controls Zigbee bulb
- Multi-protocol scene execution

---

## 🎉 Exciting Times Ahead

**What You've Set Up**:

- ✅ Modern WiFi devices (Shelly) with instant HTTP control
- ✅ Future-proof hub (Pi 5 with latest hardware)
- ✅ Cutting-edge combo dongle (first of its kind!)
- ✅ Complete protocol coverage (WiFi + Zigbee + Z-Wave + BLE)

**Timeline**:

- **This Week**: Test virtual device, refine code
- **Week 2**: Shelly arrives → real device testing
- **Week 3-4**: Pi setup, MQTT configuration
- **Late October**: Aeotec dongle arrives → multi-protocol testing
- **November**: Expand device ecosystem

You're building a **production-ready smart home hub** with the latest technology! 🚀

---

**Next Immediate Action**: Test the virtual device to ensure everything works before Shelly arrives! Want to run through that now?

**Document Created**: October 10, 2025
**Status**: 📋 Planning Complete
**Owner**: and3rn3t
