# 🚀 Your 7-Camera Setup - Quick Start Checklist

**Total Cameras**: 7 (2 Eufy + 5 Arlo)
**Total Value**: ~$820 (already owned!)
**Additional Cost**: $60-100 (storage only)
**Timeline**: 3-4 weeks (26-36 hours)

---

## ✅ Week 1: Home Assistant Setup

### Day 1-2: Docker & HA Installation (4-6 hours)

- [ ] **Install Docker Desktop** (30 min)
  - Download: <https://www.docker.com/products/docker-desktop>
  - Install (requires Windows restart)
  - Enable WSL 2 backend (Windows Settings)
  - Verify: `docker --version` in PowerShell

- [ ] **Create HA Directory** (1 min)

  ```powershell
  mkdir c:\docker\homeassistant
  ```

- [ ] **Run Home Assistant Container** (5 min)

  ```powershell
  docker run -d `
    --name homeassistant `
    --restart=unless-stopped `
    -e TZ=America/New_York `
    -v c:/docker/homeassistant:/config `
    -p 8123:8123 `
    ghcr.io/home-assistant/home-assistant:stable
  ```

- [ ] **Wait for Startup** (3-5 min)
  - First start takes longer (downloading dependencies)
  - Check logs: `docker logs -f homeassistant`
  - Look for: "Home Assistant initialized"

- [ ] **Complete Onboarding** (30 min)
  - Open: <http://localhost:8123>
  - Create admin account (SAVE CREDENTIALS!)
  - Set location (for timezone/weather)
  - Skip device discovery
  - Complete wizard

### Day 3: HACS Installation (1-2 hours)

- [ ] **Install HACS via Docker** (15 min)

  ```powershell
  docker exec -it homeassistant bash
  cd /config
  wget -O - https://get.hacs.xyz | bash -
  exit
  ```

- [ ] **Restart Home Assistant** (2 min)

  ```powershell
  docker restart homeassistant
  ```

- [ ] **Add HACS Integration** (10 min)
  - HA UI → Settings → Devices & Services
  - Add Integration → Search "HACS"
  - Click "HACS"
  - Follow GitHub OAuth flow
  - Authorize access

- [ ] **Verify HACS Working** (5 min)
  - Sidebar should show "HACS" menu item
  - Click HACS → Integrations
  - Should see "Explore & Download Repositories"

### Day 4-5: Eufy E30 Integration (3-5 hours)

- [ ] **Install Eufy Security WS** (15 min)
  - HACS → Integrations
  - Click "Explore & Download Repositories"
  - Search: "Eufy Security"
  - Select "Eufy Security WS" by bropat
  - Click Download → Download
  - Wait for download to complete

- [ ] **Restart HA** (2 min)

  ```powershell
  docker restart homeassistant
  ```

- [ ] **Add Eufy Integration** (10 min)
  - Settings → Devices & Services
  - Add Integration → Search "Eufy Security"
  - Enter Eufy account email
  - Enter Eufy account password
  - Wait for device discovery

- [ ] **Verify 2x Eufy E30 Cameras Added** (5 min)
  - Should see: "2 devices added"
  - Check device names match your cameras
  - Both should show as "Available"

- [ ] **Test Live Streaming - Camera #1** (15 min)
  - Dashboard → Add Card → Picture Entity
  - Select: camera.eufy_e30_1 (or similar name)
  - Click camera card
  - Wait 5-10 seconds
  - Should see LIVE VIDEO (not snapshot!)
  - Note latency (should be <3s)

- [ ] **Test Live Streaming - Camera #2** (15 min)
  - Repeat above for second E30 camera
  - Verify both can stream simultaneously

- [ ] **Test PTZ Controls** (20 min)
  - Developer Tools → Services
  - Service: `eufy_security.ptz_left`
  - Entity: camera.eufy_e30_1
  - Call Service → Camera should pan left
  - Test all directions:
    - [ ] Pan Left
    - [ ] Pan Right
    - [ ] Tilt Up
    - [ ] Tilt Down
    - [ ] Rotate 360° (full pan)

- [ ] **Enable Auto-Tracking** (10 min)
  - Developer Tools → Services
  - Service: `eufy_security.set_motion_detection`
  - Entity: camera.eufy_e30_1
  - Data: `{"motion_detection": true}`
  - Repeat for camera #2
  - Wave in front of camera → should follow you!

**Week 1 Complete!** ✅ You should have:

- ✅ Home Assistant running
- ✅ HACS installed
- ✅ 2x Eufy E30 cameras streaming live
- ✅ PTZ controls working

---

## ✅ Week 2: Arlo Integration

### Day 8-9: Add All Arlo Cameras (3-4 hours)

- [ ] **Add Arlo Integration** (15 min)
  - Settings → Devices & Services
  - Add Integration → Search "Arlo"
  - Note: Built-in, no HACS needed!
  - Enter Arlo account email
  - Enter Arlo account password
  - Complete 2FA if prompted

- [ ] **Select All 5 Arlo Cameras** (5 min)
  - Should auto-discover:
    - [ ] Arlo Essential Doorbell
    - [ ] Arlo Pro 4 #1
    - [ ] Arlo Pro 4 #2
    - [ ] Arlo Essential Indoor #1
    - [ ] Arlo Essential Indoor #2
  - Check all boxes → Submit

- [ ] **Verify All Cameras Added** (10 min)
  - Devices & Services → Arlo
  - Should show "5 devices"
  - All should be "Available" status

- [ ] **Test Doorbell Snapshot** (10 min)
  - Dashboard → Add Card → Picture Entity
  - Select: camera.arlo_doorbell
  - Should show snapshot (updates every 5-10s)
  - Press physical doorbell button
  - Snapshot should update within 1-2 seconds

- [ ] **Test Pro 4 Cameras** (15 min each)
  - Add both Pro 4 cameras to dashboard
  - Verify snapshots updating
  - Walk in front of camera
  - Check motion detection event in logbook

- [ ] **Test Essential Indoor Cameras** (15 min each)
  - Add both Essential cameras to dashboard
  - Verify snapshots
  - Test privacy shield:
    - Developer Tools → Services
    - Service: `arlo.set_privacy_mode`
    - Entity: camera.arlo_essential_1
    - Data: `{"privacy_mode": true}`
    - Physical shield should close!

### Day 10-11: Arlo Advanced Features (3-4 hours)

- [ ] **Test Doorbell Button Events** (30 min)
  - Create automation:

  ```yaml
  automation:
    - alias: 'Doorbell Pressed'
      trigger:
        - platform: state
          entity_id: binary_sensor.arlo_doorbell_ding
          to: 'on'
      action:
        - service: notify.persistent_notification
          data:
            title: 'Doorbell'
            message: 'Someone at the door!'
  ```

  - Press doorbell → notification should appear

- [ ] **Try Live Streaming (Experimental)** (30 min)
  - Developer Tools → Services
  - Service: `camera.play_stream`
  - Entity: camera.arlo_pro_4_1
  - May or may not work (Arlo limitation)
  - If works: Note latency
  - If doesn't: Snapshots are fine for now

- [ ] **Configure Motion Zones** (20 min per camera)
  - Arlo app → Camera Settings → Motion Detection
  - Draw zones (ignore street, focus on property)
  - Saves battery + reduces false alarms

- [ ] **Test Spotlight Control** (15 min)
  - Developer Tools → Services
  - Service: `light.turn_on`
  - Entity: light.arlo_pro_4_1_spotlight
  - Spotlight should turn on!
  - Test duration: 15s, 30s, 1min

**Week 2 Complete!** ✅ You should have:

- ✅ All 7 cameras visible in HA
- ✅ Doorbell button events working
- ✅ Snapshots updating for all Arlo cameras
- ✅ Spotlight and privacy controls functional

---

## ✅ Week 3: HomeHub Integration

### Milestone: Connect HomeHub to Home Assistant

- [ ] **Generate Long-Lived Access Token** (5 min)
  - HA Profile → Security
  - Scroll to "Long-Lived Access Tokens"
  - Click "Create Token"
  - Name: "HomeHub Integration"
  - Copy token (SAVE SECURELY!)

- [ ] **Create HA Camera Service** (4-6 hours)
  - See `PHASE_5_YOUR_EXACT_SETUP.md` for full code
  - File: `src/services/security/ha-camera.service.ts`
  - Implement WebSocket connection
  - Implement camera discovery
  - Implement snapshot fetching
  - Implement PTZ control methods

- [ ] **Create Security Cameras UI** (4-6 hours)
  - File: `src/components/SecurityCameras.tsx`
  - 7-camera grid layout (2x4 or 3x3)
  - Real-time snapshot updates
  - Click to enlarge
  - PTZ controls for Eufy cameras
  - Doorbell button indicator

- [ ] **Add to Main Navigation** (15 min)
  - Update `src/App.tsx`
  - Add "Security" tab
  - Icon: `ShieldIcon` from Lucide
  - Route to SecurityCameras component

- [ ] **Test Integration** (1-2 hours)
  - Open HomeHub → Security tab
  - Should see all 7 cameras
  - Snapshots should update automatically
  - PTZ controls should work for Eufy
  - Click camera → full-screen view

**Week 3 Complete!** ✅ You should have:

- ✅ 7-camera grid in HomeHub
- ✅ Live updates from HA
- ✅ PTZ controls in UI
- ✅ Full-screen camera views

---

## ✅ Week 4: Testing & Production

### 24-Hour Stability Test

- [ ] **Start Monitoring** (5 min)
  - Note start time
  - Document current state (all cameras online)
  - Check initial resource usage

- [ ] **Check After 4 Hours** (10 min)
  - All cameras still online?
  - HA still responsive?
  - HomeHub still showing cameras?
  - Any errors in HA logs?

- [ ] **Check After 12 Hours** (10 min)
  - Repeat above checks
  - Check memory usage (should be stable)
  - Check CPU usage (should be <50%)

- [ ] **Check After 24 Hours** (30 min)
  - Final verification
  - Document any issues
  - Check resource usage trends
  - Review HA logs for errors

### Performance Benchmarks

- [ ] **Measure Eufy E30 Latency** (15 min)
  - Wave in front of camera
  - Time from motion to display update
  - Target: <3 seconds
  - Test both cameras

- [ ] **Measure Arlo Snapshot Refresh** (15 min)
  - Walk in front of Pro 4 camera
  - Time until snapshot updates
  - Target: <10 seconds
  - Test all 5 Arlo cameras

- [ ] **Measure PTZ Response** (15 min)
  - Click PTZ button in HomeHub
  - Time until camera moves
  - Target: <500ms
  - Test both Eufy cameras

- [ ] **Measure Doorbell Event** (10 min)
  - Press doorbell button
  - Time until HomeHub notification
  - Target: <1 second

### Production Checklist

- [ ] **Feature Verification**
  - [ ] All 7 cameras visible in grid
  - [ ] Eufy E30 live streaming working
  - [ ] Arlo snapshots refreshing
  - [ ] PTZ controls functional
  - [ ] Doorbell button events triggering
  - [ ] Privacy shield controls working
  - [ ] Spotlight controls working
  - [ ] Motion detection events logged

- [ ] **Error Handling**
  - [ ] Camera offline → shows placeholder
  - [ ] HA disconnected → shows error message
  - [ ] Network issue → automatic reconnect
  - [ ] PTZ command fails → error notification

- [ ] **Performance**
  - [ ] HA memory usage: <1GB
  - [ ] HA CPU usage: <50%
  - [ ] HomeHub responsive: <100ms UI
  - [ ] No camera lag after 24h

- [ ] **Documentation**
  - [ ] Camera locations documented
  - [ ] PTZ presets saved
  - [ ] Automation rules documented
  - [ ] Troubleshooting steps written

**Week 4 Complete!** ✅ Production ready!

---

## 🎯 Final Success Criteria

### Must Have (Required)

- [x] Home Assistant running 24/7
- [x] 7 cameras connected (2 Eufy + 5 Arlo)
- [x] Eufy E30 live streaming (<3s latency)
- [x] Arlo snapshots updating (<10s)
- [x] PTZ controls working
- [x] Doorbell events triggering
- [x] HomeHub 7-camera grid view
- [x] 24-hour stability test passed

### Nice to Have (Optional)

- [ ] Arlo live streaming (not just snapshots)
- [ ] <2s latency for all cameras
- [ ] Motion event automations
- [ ] Spotlight automation for Pro 4
- [ ] Privacy shield automation (home/away)
- [ ] Person detection filtering

---

## 💰 Final Cost Summary

**Hardware Owned**:

| Item                  | Qty           | Value     |
| --------------------- | ------------- | --------- |
| Eufy E30              | 2x            | $90       |
| Arlo Doorbell         | 1x            | $150      |
| Arlo Pro 4            | 2x            | $400      |
| Arlo Essential Indoor | 2x            | $180      |
| **Total**             | **7 cameras** | **~$820** |

**New Purchases**:

| Item                     | Cost        |
| ------------------------ | ----------- |
| External SSD (1-2TB)     | $60-100     |
| Optional: Raspberry Pi 4 | $75         |
| **Total**                | **$60-175** |

**Compare to Buying New Cameras**: $290-470 saved!

---

## 📞 Help & Support

**Common Issues**:

- Docker won't start → Enable virtualization in BIOS
- HA not loading → Wait 5 min on first start
- Eufy not connecting → Check credentials, verify model T8414
- Arlo auth fails → Try 2FA, may need app-specific password
- PTZ not working → Verify Eufy Security WS integration loaded

**Where to Get Help**:

- This project: Ask in your HomeHub repo
- Home Assistant: <https://community.home-assistant.io/>
- Eufy specific: r/EufyCam subreddit
- Arlo specific: r/arlo subreddit

---

## 🎉 You're Ready

**Total Time**: 26-36 hours over 4 weeks
**Your Equipment**: 7 cameras (~$820 value)
**Additional Cost**: $60-175 (storage + optional Pi)
**Result**: Professional security system in HomeHub!

**Start This Weekend**:

1. Install Docker Desktop (30 min)
2. Run Home Assistant (5 min)
3. Complete onboarding (30 min)
4. You'll be ready for camera integration next week!

**Good luck!** 🚀🎥🔐

---

_Checklist Version: 1.0_
_Created: October 12, 2025_
_Cameras: 2x Eufy E30, 1x Arlo Doorbell, 2x Arlo Pro 4, 2x Arlo Essential Indoor_
_Timeline: 4 weeks (26-36 hours)_
