# Phase 5: Your Custom Hardware Setup

**Created**: October 12, 2025
**Your Equipment**: 5 cameras (2 Eufy PTZ + 3 Arlo)
**Budget Impact**: $0 (hardware already owned!)
**Time to First Stream**: 1-2 days

---

## 🎥 Your Camera Inventory

### Eufy Cameras (2x PTZ)

**Manufacturer**: Anker (Eufy Security)
**Type**: Pan-Tilt-Zoom (PTZ) - mechanically controlled
**Likely Models**:

- Eufy Indoor Cam 2K Pan & Tilt
- Eufy Indoor Cam E220 (Pan & Tilt)
- Eufy SoloCam S340 (Outdoor PTZ)

**Features**:

- ✅ 2K resolution (2304x1296) or 1080p
- ✅ Pan: 360° horizontal, Tilt: 96° vertical
- ✅ Night vision (infrared)
- ✅ Two-way audio
- ✅ Motion detection (built-in)
- ✅ Local storage (microSD card)
- ⚠️ **RTSP Support**: Most Eufy cameras do NOT support RTSP natively

**Critical Discovery Needed**:

```bash
# Check if your Eufy cameras support RTSP
# Usually requires:
# 1. Eufy app → Camera Settings → Advanced Settings → RTSP
# 2. Enable RTSP streaming (if available)
# 3. Get RTSP URL: rtsp://username:password@192.168.1.X:8554/live0
```

**Eufy RTSP Status by Model**:

- ❌ Indoor Cam 2K Pan & Tilt: No native RTSP (requires workaround)
- ✅ Indoor Cam E220: RTSP available via firmware update
- ✅ SoloCam S340: RTSP supported (newer models)

**If RTSP Not Available**:

- Option A: Use Eufy API via `eufy-security-ws` (Node.js library)
- Option B: Use RTMP streaming (if camera supports)
- Option C: Screen capture from Eufy app (not recommended)

---

### Arlo Cameras (3x)

**Manufacturer**: Arlo (Owned by Verisure)
**Type**: Wireless security cameras
**Likely Models**:

- Arlo Pro 3/4
- Arlo Essential
- Arlo Ultra

**Features**:

- ✅ 1080p or 2K/4K resolution
- ✅ Wire-free (battery powered)
- ✅ Weather resistant (outdoor rated)
- ✅ Color night vision
- ✅ Motion detection + AI zones
- ✅ Cloud storage (subscription-based)
- ⚠️ **RTSP Support**: Arlo removed RTSP support in 2023!

**Critical Issue: Arlo RTSP Removal**

- ❌ Arlo officially discontinued RTSP support (2023)
- ❌ Cannot stream directly via RTSP protocol
- ✅ Can use Arlo API via unofficial libraries

**Arlo Integration Options**:

1. **Arlo Web API** (Official but limited):
   - Get recordings via REST API
   - Start/stop recording
   - Get snapshots/thumbnails
   - No live streaming!

2. **arlo-go Library** (Community):
   - Node.js library for Arlo API
   - Can retrieve recordings
   - Can trigger recording
   - Limited live stream support

3. **pyaarlo** (Python Community):
   - More complete Arlo integration
   - Live streaming via reverse-engineering
   - May break with Arlo updates

4. **Home Assistant Integration** (Proven):
   - Use HA's Arlo integration
   - Bridge to HomeHub via MQTT
   - Most stable long-term option

---

## 🚨 Hardware Reality Check

### The Bad News

**Neither Eufy nor Arlo support standard RTSP streaming reliably**. This is a major challenge because:

1. **Eufy**: Inconsistent RTSP support across models
   - Some models have hidden RTSP (need firmware hacks)
   - Others require reverse-engineered protocols
   - PTZ controls may not work via RTSP

2. **Arlo**: Officially removed RTSP support
   - Cloud-first architecture (requires subscription)
   - No local streaming without workarounds
   - API is rate-limited and restrictive

### The Good News

**We can still make this work!** Options in order of reliability:

#### Option 1: Home Assistant Bridge (Recommended) ⭐

**Why This Works**:

- Home Assistant already solved Eufy/Arlo integration
- Mature, tested integrations with thousands of users
- Can expose camera streams via WebRTC/HLS
- HomeHub consumes streams from HA

**Setup**:

1. Install Home Assistant (Docker or VM)
2. Add Eufy Security integration (via HACS)
3. Add Arlo integration (built-in)
4. Configure camera_proxy for streaming
5. HomeHub connects to HA's stream URLs

**Time Investment**: 2-4 hours setup
**Reliability**: ⭐⭐⭐⭐⭐ (best option)
**Maintenance**: Low (HA updates handle changes)

**Architecture**:

```mermaid
graph LR
    A[Eufy Cameras] --> B[Home Assistant]
    C[Arlo Cameras] --> B
    B --> D[WebRTC/HLS Proxy]
    D --> E[HomeHub UI]

    style B fill:#41BDF5,stroke:#333,color:#fff
    style E fill:#10b981,stroke:#333,color:#fff
```

#### Option 2: Direct API Integration (Advanced) 🔧

**Why This Is Harder**:

- Need to implement custom protocols for each brand
- May break with firmware/API updates
- Limited community support
- More maintenance overhead

**Eufy Direct**:

```bash
npm install eufy-security-ws
# Provides:
# - Live streaming via custom protocol
# - PTZ controls
# - Motion event webhooks
```

**Arlo Direct**:

```bash
npm install arlo-go
# Provides:
# - API access to recordings
# - Limited live stream support
# - Event notifications
```

**Time Investment**: 10-20 hours (custom code)
**Reliability**: ⭐⭐⭐ (moderate, depends on libraries)
**Maintenance**: High (frequent updates needed)

#### Option 3: Replace with RTSP Cameras (Nuclear Option) 💣

**If you decide the workarounds aren't worth it**:

- Sell Eufy/Arlo cameras (~$200-300 value)
- Buy 5x Reolink RLC-410 (~$225 total)
- Get native RTSP support
- Simpler implementation

**Not Recommended Because**:

- You already own perfectly good cameras
- Eufy PTZ is valuable (remote control)
- Arlo has good AI features
- Environmental waste

---

## 🎯 Recommended Implementation Path

### Phase 5.1: Milestone Adaptation

**Original Plan**: Direct RTSP integration
**Your Reality**: Home Assistant bridge

**Revised Milestone 5.1 Tasks**:

1. **Week 1: Home Assistant Setup** (4-6 hours)
   - [ ] Install Home Assistant OS (Docker recommended)
   - [ ] Configure network access (port 8123)
   - [ ] Set up basic HA dashboard
   - [ ] Install HACS (Home Assistant Community Store)

2. **Week 1-2: Eufy Integration** (3-5 hours)
   - [ ] Install `eufy-security-ws` integration via HACS
   - [ ] Pair 2x Eufy PTZ cameras
   - [ ] Test live streaming in HA
   - [ ] Configure PTZ controls
   - [ ] Enable motion detection webhooks

3. **Week 2: Arlo Integration** (2-4 hours)
   - [ ] Add Arlo integration (built-in to HA)
   - [ ] Authenticate with Arlo account
   - [ ] Link 3x Arlo cameras
   - [ ] Test recording playback
   - [ ] Set up event notifications

4. **Week 2-3: Stream Proxy** (6-8 hours)
   - [ ] Configure `camera_proxy` component
   - [ ] Set up WebRTC or HLS streaming
   - [ ] Test latency (<3 seconds target)
   - [ ] Implement fallback to snapshots

5. **Week 3: HomeHub Integration** (8-12 hours)
   - [ ] Create `HACamera` service in HomeHub
   - [ ] Connect to HA WebSocket API
   - [ ] Build live view UI component
   - [ ] Add PTZ controls for Eufy cameras
   - [ ] Test 5-camera grid view

**Revised Timeline**: 3-4 weeks (vs 2-3 weeks for native RTSP)
**Added Complexity**: Medium (HA learning curve)
**Long-term Benefit**: Much more stable and maintainable

---

## 🛠️ Technical Specifications

### Home Assistant Requirements

**Hardware** (Pick One):

**Option A: Docker Container** (Recommended)

```bash
# Windows with Docker Desktop
docker run -d \
  --name homeassistant \
  --restart=unless-stopped \
  -e TZ=America/New_York \
  -v c:/docker/homeassistant:/config \
  --network=host \
  ghcr.io/home-assistant/home-assistant:stable
```

**Option B: VM (VirtualBox/Hyper-V)**

- Download HA OS image (OVA format)
- Allocate 2GB RAM, 32GB disk
- Bridge network adapter

**Option C: Dedicated Hardware**

- Raspberry Pi 4 (4GB RAM minimum)
- Intel NUC (more powerful)
- Old laptop/desktop

**Network Requirements**:

- Port 8123 (HA Web UI)
- Port 1935 (RTMP streaming)
- Port 8554 (RTSP proxy, optional)
- Same subnet as cameras

---

## 📋 Updated Shopping List

**Good News: No camera purchases needed!**

### Must Have (Storage Only)

- [ ] 1-2TB External SSD ($60-100)
  - For 7-day video retention
  - Calculate: 5 cameras × 1080p × 24h × 7 days ≈ 500GB-1TB
  - Recommended: Samsung T7 (fast, reliable)

### Optional Hardware

- [ ] Dedicated HA machine ($50-200)
  - Raspberry Pi 4 (4GB) + case + SD card = $75
  - Intel NUC (used on eBay) = $100-150
  - Not required if using Docker on main PC

- [ ] POE Injector for Eufy (if wired)
  - Only if converting Eufy to wired power
  - ~$15 each × 2 = $30

- [ ] Smart Lock (Phase 5.4)
  - August WiFi Smart Lock (~$150)
  - Yale Assure Lock 2 (~$200)
  - **Wait until Milestone 5.4**

**Total Additional Cost**: $60-100 (storage only)
**Savings vs Original Plan**: $200-300 (no camera purchase!)

---

## 🧪 Week 1 Action Plan

### Day 1: Camera Inventory & Testing (2-3 hours)

**Morning**:

1. Identify exact Eufy model numbers
   - Check camera housing labels
   - Or: Eufy app → Device Info → Model
   - Google: "Eufy [model] RTSP support"

2. Identify Arlo model numbers
   - Arlo app → Settings → My Devices
   - Note: All Arlo models have same limitation (no RTSP)

3. Test current setup
   - Verify all 5 cameras work in native apps
   - Check network connectivity (WiFi signal strength)
   - Note camera IP addresses (if possible)

**Afternoon**:

1. Research your specific models:
   - Eufy: Check if RTSP available (community forums)
   - Arlo: Confirm API access still works
   - Document any known issues

2. Make decision:
   - ✅ Home Assistant bridge (recommended)
   - 🔧 Direct API integration (advanced)
   - 💣 Replace cameras (last resort)

### Day 2: Home Assistant Setup (3-4 hours)

**Option A: Docker (Recommended)**

```powershell
# Install Docker Desktop (if not installed)
# https://www.docker.com/products/docker-desktop

# Pull Home Assistant image
docker pull ghcr.io/home-assistant/home-assistant:stable

# Create config directory
mkdir c:\docker\homeassistant

# Run Home Assistant
docker run -d `
  --name homeassistant `
  --restart=unless-stopped `
  -e TZ=America/New_York `
  -v c:/docker/homeassistant:/config `
  -p 8123:8123 `
  ghcr.io/home-assistant/home-assistant:stable

# Wait 2-3 minutes for startup
# Open browser: http://localhost:8123
```

**Option B: VM**

1. Download HA OS: <https://www.home-assistant.io/installation/windows>
2. Import into VirtualBox/Hyper-V
3. Start VM and wait for boot
4. Open browser: <http://homeassistant.local:8123>

**Initial Setup**:

1. Create admin account
2. Set location (for timezone)
3. Skip device discovery (for now)
4. Complete onboarding

### Day 3: HACS Installation (1-2 hours)

```bash
# Option 1: Via HA Terminal (Add-on)
# Settings → Add-ons → Terminal & SSH → Install
# Open terminal and run:
wget -O - https://get.hacs.xyz | bash -

# Option 2: Manual (Docker)
docker exec -it homeassistant bash
cd /config
wget -O - https://get.hacs.xyz | bash -
exit

# Restart Home Assistant
# Settings → System → Restart

# Add HACS integration
# Settings → Integrations → Add Integration → HACS
# Follow GitHub OAuth setup
```

### Day 4-5: Camera Integrations (4-6 hours)

**Eufy Setup**:

```bash
# In HACS:
# HACS → Integrations → Search "Eufy Security"
# Install "Eufy Security WS" by bropat

# Restart HA

# Add Integration:
# Settings → Integrations → Add → Eufy Security
# Enter Eufy account credentials
# Wait for device discovery (1-2 minutes)
# Configure 2x PTZ cameras
# Test live view in HA dashboard
```

**Arlo Setup**:

```bash
# Built-in to HA, no HACS needed

# Add Integration:
# Settings → Integrations → Add → Arlo
# Enter Arlo account credentials
# Complete 2FA if prompted
# Select 3x Arlo cameras to add
# Test recordings/snapshots
```

### Day 6-7: Stream Testing (3-4 hours)

**Test Eufy Streaming**:

1. HA Dashboard → Add Camera Card
2. Select Eufy camera
3. Test live view (may take 5-10s to load)
4. Note: First load is slow, subsequent loads faster
5. Test PTZ controls (if available in HA)

**Test Arlo Streaming**:

1. Add Arlo camera to dashboard
2. Note: May only show snapshots (5s refresh)
3. Try triggering recording manually
4. Check if recordings appear

**Measure Performance**:

- Latency: Time from motion to video update
- Reliability: Does stream stay connected?
- Quality: Resolution and framerate
- PTZ Response: Delay for pan/tilt commands

---

## 📊 Success Metrics (Revised)

### Milestone 5.1 Complete When

- ✅ Home Assistant running and accessible
- ✅ 2x Eufy cameras streaming in HA
- ✅ 3x Arlo cameras showing snapshots/recordings
- ✅ <5 second latency for Eufy live streams
- ✅ <10 second latency for Arlo snapshots
- ✅ PTZ controls working for Eufy cameras
- ✅ HomeHub can connect to HA API
- ✅ 5-camera grid view in HomeHub UI
- ✅ 24-hour stability test passed

### Stretch Goals

- ⭐ <3 second latency for all cameras
- ⭐ Arlo live streaming (not just snapshots)
- ⭐ Motion event webhooks working
- ⭐ Two-way audio for Eufy cameras

---

## 🔍 Camera Model Research

**Help us customize the guide further!**

Please identify your exact models:

### Eufy PTZ Cameras

```bash
# Check these locations:
# 1. Camera housing (bottom/back label)
# 2. Eufy app → Device → Device Info → Model
# 3. Original packaging/receipt

Possible models:
- T8410 (Indoor Cam 2K Pan & Tilt)
- T8424 (Indoor Cam E220)
- S340 (SoloCam PTZ)
- Other: _______________
```

### Arlo Cameras

```bash
# Check these locations:
# 1. Arlo app → Settings → My Devices → [Camera] → Device Info
# 2. Camera housing (inside battery compartment)

Possible models:
- VMC4040P (Pro 3)
- VMC4050P (Pro 4)
- VMC2030 (Essential)
- VMC5040 (Ultra)
- Other: _______________
```

**Once you identify models, I can provide**:

- Exact RTSP URLs (if supported)
- Specific firmware versions to use
- Known issues and workarounds
- Optimal settings for HomeHub integration

---

## 💡 Pro Tips for Your Setup

1. **Eufy PTZ Features**
   - Use PTZ presets (saves positions)
   - Enable privacy mode (covers lens when home)
   - Set detection zones (reduce false alerts)
   - Use 2-way audio for pet monitoring

2. **Arlo Battery Management**
   - Set video quality to "Optimized" (saves battery)
   - Reduce detection sensitivity (less recordings)
   - Consider solar panels for continuous power
   - Keep firmware updated for efficiency

3. **Network Optimization**
   - Put cameras on 2.4GHz WiFi (better range)
   - Reserve DHCP IPs for all cameras
   - Consider WiFi extender if signal weak
   - Separate IoT VLAN (security best practice)

4. **Home Assistant Tips**
   - Enable recorder component (stores events)
   - Set up automatic backups (weekly)
   - Use HA blueprints for automations
   - Join HA community forum (great support)

---

## 🎯 Updated Timeline

| Week | Focus               | Hours | Deliverables                   |
| ---- | ------------------- | ----- | ------------------------------ |
| 1    | HA Setup + Eufy     | 8-10h | HA running, 2 Eufy cameras     |
| 2    | Arlo + Stream Proxy | 6-8h  | 3 Arlo cameras, test streaming |
| 3    | HomeHub Integration | 8-12h | 5-camera view in HomeHub       |
| 4    | Polish + Testing    | 4-6h  | 24h stability, PTZ controls    |

**Total**: 26-36 hours (vs 20-30h for native RTSP)
**Trade-off**: +6h setup time for much better long-term reliability

---

## 📚 Useful Resources

### Home Assistant

- [Installation Guide](https://www.home-assistant.io/installation/)
- [Eufy Integration Docs](https://github.com/fuatakgun/eufy_security)
- [Arlo Integration Docs](https://www.home-assistant.io/integrations/arlo/)
- [Camera Setup Guide](https://www.home-assistant.io/integrations/camera/)

### Eufy Specific

- [Eufy RTSP Guide](https://support.eufylife.com/s/article/How-to-Use-RTSP) (official, limited)
- [r/EufyCam Subreddit](https://www.reddit.com/r/EufyCam/) (community)
- [Eufy API Reverse Engineering](https://github.com/bropat/eufy-security-ws) (advanced)

### Arlo Specific

- [Arlo API Docs](https://pypi.org/project/pyaarlo/) (unofficial)
- [r/arlo Subreddit](https://www.reddit.com/r/arlo/)
- [Arlo Developer Portal](https://developer.arlo.com/) (official but limited)

---

## 🚀 Ready to Start?

**Your advantage**: Hardware already owned ($0 cost!)
**Your challenge**: Non-standard streaming protocols
**Your solution**: Home Assistant bridge (proven, stable)

### This Week's Action Items

1. [ ] Identify exact camera models
2. [ ] Install Docker Desktop (if using Docker path)
3. [ ] Set up Home Assistant
4. [ ] Install HACS
5. [ ] Add Eufy integration
6. [ ] Test live streaming

**Next Week**: Arlo integration + HomeHub connection

**Questions to answer**:

- What are your exact Eufy model numbers?
- What are your exact Arlo model numbers?
- Do you prefer Docker or VM for Home Assistant?
- Do you have existing NAS for storage?

---

**Document Status**: ✅ Ready for your camera setup
**Last Updated**: October 12, 2025
**Next Update**: After you identify camera models
