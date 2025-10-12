# Phase 5: Getting Started - Quick Setup Guide

**Goal**: Get you started on Phase 5 Security & Surveillance with minimal friction

**Time to First Camera**: 1-2 days
**Recommended Start**: Milestone 5.1 with 1 test camera

---

## 🎯 Quick Decision Tree

**Do you already have IP cameras?**

- ✅ **YES** → Jump to [Milestone 5.1 Implementation](#milestone-51-start)
- ❌ **NO** → Start with [Hardware Selection](#hardware-selection)

**What's your budget?**

- 💰 **$100-200**: 2 cameras + basic setup
- 💰 **$300-400**: 4 cameras + POE switch + storage
- 💰 **$500+**: Full system + NAS + smart locks

**What's your technical comfort level?**

- 🟢 **High**: Jump straight to RTSP client implementation
- 🟡 **Medium**: Follow step-by-step guide below
- 🔴 **Low**: Start with hardware setup, test with manufacturer's app first

---

## 📦 Hardware Selection (Week 0)

### Option 1: Budget Build ($150-200)

**Cameras** (2x):

- Reolink RLC-410 (~$45 each) = $90
- Alternative: Wyze Cam V3 Pro (~$50 each) = $100

**Storage**:

- Use existing computer/NAS
- Or: 1TB USB external drive (~$40)

**Network**:

- Existing WiFi or router with Ethernet ports
- No POE switch needed (use WiFi or power adapters)

**Total**: ~$130-160

### Option 2: Recommended Build ($300-400)

**Cameras** (4x):

- Reolink RLC-410 or RLC-520A (~$45-60 each) = $180-240

**Network**:

- TP-Link 8-port POE switch (~$50-70)
- Cat6 Ethernet cables (~$20)

**Storage**:

- 1TB SSD for NVR (~$60)
- Or: Use existing NAS

**Total**: ~$310-390

### Option 3: Professional Build ($500-700)

**Cameras** (4-6x):

- Amcrest UltraHD 4K (~$70-100 each) = $280-600

**Network**:

- Managed POE switch with VLAN support (~$100-150)
- Professional cable installation

**Storage**:

- 2-bay NAS with 2x 2TB drives (~$400)
- Or: Dedicated NVR server

**Smart Locks**:

- August WiFi Smart Lock (~$150)
- Yale Assure Lock 2 with Z-Wave (~$200)

**Total**: ~$830-1200

---

## 🛒 Shopping List (Recommended Starter)

### For Milestone 5.1 (Camera Integration)

**Must Have**:

- [ ] 2x Reolink RLC-410 cameras ($90)
- [ ] 1x CAT6 Ethernet cables 50ft 2-pack ($15)
- [ ] Power adapters (included with cameras)

**Optional But Recommended**:

- [ ] 1x 8-port POE switch ($50) - Eliminates power adapters
- [ ] 1x Ethernet cable tester ($10) - Useful for troubleshooting
- [ ] Wall mounts/brackets (usually included)

**Total**: $105 (basic) or $175 (with POE)

### Where to Buy

**US**:

- Amazon (fast shipping, easy returns)
- B&H Photo (no tax in some states)
- Reolink official site (direct from manufacturer)

**Recommended Sellers**:

- Amazon (Prime eligible)
- Reolink Store (official warranty)
- Newegg (tech-focused, good return policy)

---

## 🚀 Milestone 5.1 Start (Week 1)

### Day 1: Hardware Setup

**Morning** (2-3 hours):

1. Unbox cameras and test with manufacturer's app
2. Set fixed IP addresses on your router
3. Enable RTSP stream in camera settings
4. Document camera credentials (username/password)

**RTSP URL Format**:

```
rtsp://username:password@192.168.1.100:554/h264Preview_01_main
```

**Afternoon** (2-3 hours):

1. Test RTSP stream with VLC Media Player:
   - Open VLC → Media → Open Network Stream
   - Paste RTSP URL
   - Verify video plays smoothly

2. Take notes:
   - Camera IP addresses
   - RTSP URLs (main and sub streams)
   - Resolution and FPS
   - Any connection issues

### Day 2: Development Environment

**Morning** (2-3 hours):

1. Install FFmpeg:

   ```bash
   # Windows (using Chocolatey)
   choco install ffmpeg

   # Or download from https://ffmpeg.org/download.html
   ```

2. Install Node.js dependencies:

   ```bash
   cd c:\git\homehub
   npm install ffmpeg-static node-rtsp-stream ws hls.js
   ```

3. Test FFmpeg installation:

   ```bash
   ffmpeg -version
   ```

**Afternoon** (2-3 hours):

1. Create service file: `src/services/security/rtsp-client.service.ts`
2. Implement basic RTSP connection
3. Test connection to 1 camera
4. Log frames received

### Day 3-4: RTSP Client Service

Follow the implementation plan in `PHASE_5_SECURITY_PLAN.md` → Milestone 5.1 → Task 1.1

**Key Deliverables**:

- [ ] RTSP stream connection working
- [ ] Frames being captured
- [ ] HLS conversion (optional for now)
- [ ] Basic error handling

### Day 5-7: Live View UI

**Goals**:

- [ ] Display camera stream in browser
- [ ] Basic controls (play/pause)
- [ ] Camera info overlay
- [ ] Multi-camera grid (stretch goal)

---

## 🧪 Testing Checklist

### Single Camera Test

- [ ] Camera powers on and connects to network
- [ ] RTSP stream accessible from VLC
- [ ] Stream resolution matches expected (1080p/4MP)
- [ ] FPS is stable (15-30 FPS)
- [ ] Stream doesn't drop after 1 hour
- [ ] Night vision works (cover camera lens)

### HomeHub Integration Test

- [ ] RTSP client connects to camera
- [ ] Video stream displays in browser
- [ ] Latency is acceptable (<3 seconds)
- [ ] No memory leaks after 4 hours
- [ ] Reconnects automatically after network loss
- [ ] Multiple tabs can view same stream

### Performance Test

- [ ] CPU usage <50% with 2 cameras
- [ ] Memory usage <500MB per camera
- [ ] Network bandwidth reasonable (<4 Mbps per camera)
- [ ] Browser doesn't slow down after 1 hour
- [ ] Can switch between cameras smoothly

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to RTSP stream"

**Causes**:

- Firewall blocking port 554
- Incorrect RTSP URL format
- Camera RTSP disabled in settings
- Network isolation (cameras on different VLAN)

**Solutions**:

1. Check firewall settings (allow port 554)
2. Verify RTSP URL with VLC first
3. Enable RTSP in camera web interface
4. Put cameras and HomeHub on same network

### Issue 2: "Video stutters or freezes"

**Causes**:

- Insufficient bandwidth
- WiFi interference
- CPU overload
- Video bitrate too high

**Solutions**:

1. Use Ethernet instead of WiFi (if possible)
2. Lower camera bitrate in settings
3. Use sub-stream (lower resolution)
4. Close other applications

### Issue 3: "High CPU usage"

**Causes**:

- Video transcoding (re-encoding)
- Multiple streams at full resolution
- No hardware acceleration

**Solutions**:

1. Use H.264 passthrough (no transcoding)
2. Enable hardware acceleration in FFmpeg
3. Use sub-streams for multi-camera view
4. Limit FPS to 15-20 for monitoring

### Issue 4: "FFmpeg not found"

**Causes**:

- FFmpeg not installed
- Not in system PATH
- Wrong version

**Solutions**:

1. Install FFmpeg via package manager
2. Add FFmpeg to PATH environment variable
3. Use `ffmpeg-static` npm package
4. Verify with `ffmpeg -version`

---

## 📊 Success Criteria for Milestone 5.1

**Minimum Viable Product (MVP)**:

- ✅ 1 camera streaming in browser
- ✅ <5 second latency
- ✅ Stable for 24 hours continuous
- ✅ Basic error handling
- ✅ Documented code

**Stretch Goals**:

- ⭐ 4 cameras streaming simultaneously
- ⭐ <2 second latency
- ⭐ Multi-camera grid view
- ⭐ ONVIF discovery working
- ⭐ Motion detection prototype

---

## 🗓️ Week-by-Week Timeline

### Week 1: Setup & Single Camera

- Day 1-2: Hardware setup and testing
- Day 3-4: RTSP client implementation
- Day 5-7: Live view UI

### Week 2: Multi-Camera & Polish

- Day 8-10: Multi-camera support
- Day 11-12: Grid view UI
- Day 13-14: Error handling and testing

### Week 3: ONVIF (Optional)

- Day 15-17: ONVIF discovery
- Day 18-19: PTZ controls
- Day 20-21: Event subscriptions

---

## 💡 Pro Tips

1. **Start Small**: Get 1 camera working perfectly before buying more
2. **Use Ethernet**: WiFi cameras have higher latency and can be unreliable
3. **Test with VLC**: Always verify RTSP stream works in VLC before coding
4. **Sub-streams**: Use lower resolution sub-streams for multi-camera views
5. **POE is Worth It**: Eliminates power adapters and simplifies installation
6. **Document Everything**: Save camera settings, IP addresses, RTSP URLs
7. **Network Segmentation**: Consider VLAN for security cameras (advanced)
8. **Backup Plan**: Keep manufacturer's app installed as fallback

---

## 📞 Getting Help

**Documentation**:

- Phase 5 Master Plan: `docs/development/PHASE_5_SECURITY_PLAN.md`
- Camera-specific docs: Check manufacturer's website

**Communities**:

- r/HomeAutomation (Reddit)
- r/homelab (Reddit)
- Home Assistant forums (even if not using HA)
- IP Camera Talk forums

**Support**:

- Reolink: Great customer support via email
- Camera manufacturers: Usually have online chat
- Stack Overflow: For coding questions

---

## 🎯 Ready to Start?

### Your Action Plan

**This Week**:

1. [ ] Review hardware options
2. [ ] Order 2 cameras (start small!)
3. [ ] Read Phase 5 Master Plan
4. [ ] Set up development environment

**Next Week**:

1. [ ] Receive cameras and test
2. [ ] Start RTSP client implementation
3. [ ] Build live view UI
4. [ ] Document progress

**Week After**:

1. [ ] Polish single camera integration
2. [ ] Add second camera
3. [ ] Test stability
4. [ ] Plan Milestone 5.2

---

**Let's build something amazing!** 🎥🔐

---

_Created: October 12, 2025_
_Author: GitHub Copilot_
_Project: HomeHub - Phase 5 Quick Start_
_Estimated Time to First Stream: 1-2 days_
