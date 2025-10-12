# Phase 5: Security & Surveillance - Master Implementation Plan

**Created**: October 12, 2025
**Status**: 🚀 Planning Phase
**Estimated Duration**: 4-6 weeks (40-60 hours total)
**Complexity**: HIGH - Hardware integration, video processing, ML/AI
**Priority**: HIGH - Core home security functionality

---

## 🎯 Phase Objectives

Transform HomeHub from a smart home controller into a **comprehensive security system** with professional-grade surveillance, access control, and emergency response capabilities.

**Success Criteria**:

- 4+ IP cameras streaming reliably (99%+ uptime)
- <2 second notification latency for security events
- 95%+ person detection accuracy
- 7-day video retention with motion events
- Zero false alarms over 30-day test period
- Smart lock integration with access logs

---

## 📊 Milestone Overview

| Milestone                     | Duration  | Complexity | Hardware Required       | Status     |
| ----------------------------- | --------- | ---------- | ----------------------- | ---------- |
| **5.1 - Camera Integration**  | 2-3 weeks | HIGH       | IP cameras (4x $40-100) | 📋 Planned |
| **5.2 - Video Storage**       | 1-2 weeks | MEDIUM     | NAS/Storage (1TB+)      | 📋 Planned |
| **5.3 - Smart Notifications** | 1-2 weeks | HIGH       | None (software only)    | 📋 Planned |
| **5.4 - Access Control**      | 1-2 weeks | MEDIUM     | Smart locks, sensors    | 📋 Planned |
| **5.5 - Emergency Response**  | 1 week    | LOW        | None (software only)    | 📋 Planned |

**Total Estimated Time**: 6-10 weeks
**Total Estimated Cost**: $300-500 (hardware)

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Camera Layer"
        A[IP Camera 1<br/>RTSP Stream]
        B[IP Camera 2<br/>RTSP Stream]
        C[IP Camera 3<br/>RTSP Stream]
        D[IP Camera 4<br/>RTSP Stream]
    end

    subgraph "Video Processing"
        E[RTSP Client Service]
        F[Motion Detection]
        G[Person Detection<br/>AI/ML Model]
        H[Frame Capture]
    end

    subgraph "Storage Layer"
        I[Local NVR<br/>Video Recorder]
        J[Thumbnail Generator]
        K[7-Day Rolling Buffer]
        L[Cloud Backup<br/>Optional]
    end

    subgraph "Notification Layer"
        M[Event Queue]
        N[Smart Filter<br/>Rules Engine]
        O[Push Notifications]
        P[Email Alerts]
    end

    subgraph "Access Control"
        Q[Smart Locks<br/>Z-Wave/Zigbee]
        R[Door/Window Sensors]
        S[Access Logs]
        T[Guest Codes]
    end

    subgraph "HomeHub UI"
        U[Live Camera View]
        V[Event Timeline]
        W[Security Dashboard]
        X[Access Control Panel]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    E --> F
    E --> H
    F --> G
    F --> M

    H --> I
    I --> J
    I --> K
    K --> L

    M --> N
    N --> O
    N --> P

    Q --> S
    R --> M
    T --> Q

    E --> U
    M --> V
    I --> V
    F --> W
    Q --> X

    style A fill:#ec4899,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style I fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style M fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
    style W fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
```

---

## 📋 Milestone 5.1: Camera Integration

**Goal**: Stream video from IP cameras and integrate with HomeHub

**Duration**: 2-3 weeks (20-30 hours)
**Complexity**: HIGH
**Hardware**: 4x IP cameras (Reolink, Amcrest, etc.)

### Features

1. **RTSP Stream Support**
   - Connect to cameras via RTSP protocol (rtsp://...)
   - H.264/H.265 video codec support
   - Multiple stream profiles (main/sub)
   - Adaptive bitrate streaming
   - Error handling and reconnection

2. **ONVIF Protocol Integration**
   - Camera discovery (ONVIF WS-Discovery)
   - PTZ (Pan-Tilt-Zoom) control
   - Camera configuration (resolution, FPS, bitrate)
   - Event subscriptions (motion detection)
   - Time synchronization

3. **Motion Detection**
   - Server-side motion analysis
   - Configurable sensitivity (1-100%)
   - Motion zones (include/exclude areas)
   - Motion event webhooks
   - Cooldown period (prevent spam)

4. **Live View**
   - Real-time video streaming in browser
   - HLS (HTTP Live Streaming) conversion
   - Low-latency mode (<2 seconds)
   - Multi-camera grid view (1/4/9/16 cameras)
   - Full-screen mode

### Implementation Tasks

#### Task 1.1: RTSP Client Service (8-12 hours)

**File**: `src/services/security/rtsp-client.service.ts`

**Dependencies**:

```bash
npm install ffmpeg-static node-rtsp-stream @onvif/node-onvif ws
```

**Key Classes**:

```typescript
export class RTSPClientService {
  private streams: Map<string, RTSPStream> = new Map()
  private ffmpegPath: string

  /**
   * Connect to camera RTSP stream
   */
  async connectStream(camera: Camera): Promise<RTSPStream>

  /**
   * Disconnect from stream
   */
  async disconnectStream(cameraId: string): Promise<void>

  /**
   * Get current frame as JPEG
   */
  async captureFrame(cameraId: string): Promise<Buffer>

  /**
   * Start recording stream to file
   */
  async startRecording(cameraId: string, outputPath: string): Promise<void>

  /**
   * Stop recording
   */
  async stopRecording(cameraId: string): Promise<void>
}
```

**RTSP Stream Example**:

```typescript
interface RTSPStream {
  id: string
  cameraId: string
  url: string // rtsp://username:password@192.168.1.100:554/stream
  status: 'connected' | 'disconnected' | 'error'
  codec: 'h264' | 'h265'
  resolution: { width: number; height: number }
  fps: number
  bitrate: number
  hlsUrl?: string // http://localhost:8080/camera-1/index.m3u8
  lastFrame?: Date
  errors: string[]
}
```

#### Task 1.2: ONVIF Service (6-10 hours)

**File**: `src/services/security/onvif.service.ts`

**Features**:

```typescript
export class ONVIFService {
  /**
   * Discover ONVIF cameras on network
   */
  async discoverCameras(timeout: number = 5000): Promise<ONVIFCamera[]>

  /**
   * Connect to camera and get capabilities
   */
  async connectCamera(ip: string, username: string, password: string): Promise<ONVIFCamera>

  /**
   * Get camera profiles (main stream, sub stream)
   */
  async getProfiles(camera: ONVIFCamera): Promise<ONVIFProfile[]>

  /**
   * Subscribe to camera events (motion, tampering, etc.)
   */
  async subscribeEvents(camera: ONVIFCamera): Promise<void>

  /**
   * Control PTZ (Pan-Tilt-Zoom)
   */
  async ptzControl(camera: ONVIFCamera, command: PTZCommand): Promise<void>
}
```

**ONVIF Camera Discovery**:

```typescript
interface ONVIFCamera {
  id: string
  name: string
  manufacturer: string
  model: string
  firmwareVersion: string
  ip: string
  port: number
  username: string
  password: string
  capabilities: {
    ptz: boolean
    videoAnalytics: boolean
    imaging: boolean
    events: boolean
  }
  profiles: ONVIFProfile[]
}

interface ONVIFProfile {
  token: string
  name: string
  videoEncoderConfig: {
    codec: 'H264' | 'H265' | 'MJPEG'
    resolution: { width: number; height: number }
    fps: number
    bitrate: number
  }
  rtspUrl: string
}
```

#### Task 1.3: Motion Detection Service (6-8 hours)

**File**: `src/services/security/motion-detection.service.ts`

**Algorithm**: Frame Difference Analysis

```typescript
export class MotionDetectionService {
  private previousFrames: Map<string, Buffer> = new Map()
  private motionZones: Map<string, MotionZone[]> = new Map()

  /**
   * Analyze frame for motion
   */
  async detectMotion(
    cameraId: string,
    currentFrame: Buffer,
    sensitivity: number = 50
  ): Promise<MotionEvent | null>

  /**
   * Configure motion zones
   */
  setMotionZones(cameraId: string, zones: MotionZone[]): void

  /**
   * Calculate difference between frames
   */
  private calculateFrameDifference(frame1: Buffer, frame2: Buffer): number

  /**
   * Apply motion zones mask
   */
  private applyMotionZones(frame: Buffer, zones: MotionZone[]): Buffer
}
```

**Motion Detection Types**:

```typescript
interface MotionZone {
  id: string
  name: string
  coordinates: { x: number; y: number }[] // Polygon points
  enabled: boolean
  sensitivity: number // 0-100
}

interface MotionEvent {
  id: string
  cameraId: string
  timestamp: string
  confidence: number // 0-100
  zones: string[] // Which zones triggered
  frameUrl?: string // Snapshot URL
  duration?: number // ms since motion started
}
```

#### Task 1.4: Live View UI Component (6-8 hours)

**File**: `src/components/LiveView.tsx`

**Features**:

- Real-time HLS video playback
- Multi-camera grid (1/4/9/16 layouts)
- PTZ controls (if supported)
- Full-screen mode
- Motion overlay (highlight motion zones)
- Camera info overlay (name, FPS, bitrate)

**Component Structure**:

```tsx
export function LiveView() {
  const [cameras] = useKV<Camera[]>('security-cameras', [])
  const [layout, setLayout] = useState<'1' | '4' | '9' | '16'>('4')
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null)

  return (
    <div className="live-view-grid">
      {cameras.map(camera => (
        <CameraStream
          key={camera.id}
          camera={camera}
          onFullscreen={() => setFullscreenCamera(camera.id)}
        />
      ))}
    </div>
  )
}
```

**Video Player** (using HLS.js):

```tsx
function CameraStream({ camera }: { camera: Camera }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    if (videoRef.current && camera.hlsUrl) {
      const hls = new Hls()
      hls.loadSource(camera.hlsUrl)
      hls.attachMedia(videoRef.current)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play()
        setIsPlaying(true)
      })
    }
  }, [camera.hlsUrl])

  return (
    <Card className="relative overflow-hidden">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1">
        <span className="text-xs text-white">{camera.name}</span>
        {isPlaying && <span className="ml-2 text-xs text-green-400">{fps} FPS</span>}
      </div>
    </Card>
  )
}
```

### Hardware Requirements

**Recommended IP Cameras** (Budget-Friendly):

1. **Reolink RLC-410** (~$40-50)
   - 4MP resolution (2560x1440)
   - H.264 encoding
   - ONVIF support
   - Night vision (IR LEDs)
   - POE (Power over Ethernet)

2. **Amcrest UltraHD** (~$60-80)
   - 4MP/5MP resolution
   - H.265 encoding (better compression)
   - ONVIF Profile S
   - PTZ support (some models)
   - Two-way audio

3. **Hikvision DS-2CD2xxx** (~$80-120)
   - 4MP/8MP resolution
   - H.265+ encoding
   - ONVIF Profile S/G
   - WDR (Wide Dynamic Range)
   - Smart detection features

**Minimum Requirements**:

- Resolution: 1080p (1920x1080) or higher
- ONVIF support (Profile S minimum)
- RTSP stream access
- Network connection (WiFi or Ethernet)
- Power (POE or DC adapter)

### Testing Plan

**Test 1: Single Camera Connection**

- Connect to 1 camera via RTSP
- Verify video stream in browser
- Measure latency (<2 seconds)
- Test reconnection on network loss

**Test 2: Multi-Camera Grid**

- Connect 4 cameras simultaneously
- Verify all streams play in grid view
- Check CPU/memory usage (<50% CPU)
- Test layout switching (1/4/9 cameras)

**Test 3: Motion Detection**

- Walk in front of camera
- Verify motion event triggered
- Check event appears in timeline
- Test motion zones (include/exclude)

**Test 4: ONVIF Discovery**

- Scan network for cameras
- Verify all cameras discovered
- Test PTZ control (if available)
- Check event subscriptions

**Success Criteria**:

- ✅ 4 cameras streaming at 20+ FPS
- ✅ <2 second latency (live to display)
- ✅ Motion detection <500ms delay
- ✅ 99%+ stream uptime over 24 hours
- ✅ <50% CPU usage (quad-core minimum)

---

## 📋 Milestone 5.2: Video Storage (NVR)

**Goal**: Record video streams with motion-triggered clips

**Duration**: 1-2 weeks (12-20 hours)
**Complexity**: MEDIUM
**Hardware**: 1TB+ storage (NAS or local disk)

### Features

1. **Local NVR (Network Video Recorder)**
   - Continuous recording or event-based
   - 7-day rolling buffer (auto-delete old files)
   - Segmented recordings (1-hour chunks)
   - H.264/H.265 support (no re-encoding)

2. **Motion-Triggered Clips**
   - Pre-buffer (10 seconds before motion)
   - Post-buffer (30 seconds after motion)
   - Thumbnail generation (every 5 seconds)
   - Metadata tagging (motion confidence, zones)

3. **Video Playback**
   - Seek/scrub through recordings
   - Speed controls (0.5x, 1x, 2x, 4x)
   - Frame-by-frame step
   - Export clip (MP4 download)

4. **Storage Management**
   - Disk usage monitoring
   - Automatic cleanup (oldest first)
   - Per-camera storage quotas
   - Cloud backup (optional)

### Implementation Tasks

#### Task 2.1: NVR Service (8-12 hours)

**File**: `src/services/security/nvr.service.ts`

```typescript
export class NVRService {
  private recordings: Map<string, Recording> = new Map()
  private storageBasePath: string = '/var/homehub/recordings'

  /**
   * Start recording from camera
   */
  async startRecording(camera: Camera, mode: 'continuous' | 'motion'): Promise<Recording>

  /**
   * Stop recording
   */
  async stopRecording(cameraId: string): Promise<void>

  /**
   * Create motion-triggered clip
   */
  async createMotionClip(
    cameraId: string,
    motionEvent: MotionEvent,
    preBuffer: number = 10000, // ms
    postBuffer: number = 30000 // ms
  ): Promise<VideoClip>

  /**
   * Get recordings for date range
   */
  async getRecordings(cameraId: string, startDate: Date, endDate: Date): Promise<Recording[]>

  /**
   * Delete old recordings (rolling buffer)
   */
  async cleanupOldRecordings(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void>

  /**
   * Get storage usage stats
   */
  async getStorageStats(): Promise<StorageStats>
}
```

**Recording Types**:

```typescript
interface Recording {
  id: string
  cameraId: string
  startTime: string
  endTime?: string
  duration?: number // seconds
  filePath: string
  fileSize: number // bytes
  format: 'mp4' | 'mkv'
  codec: 'h264' | 'h265'
  resolution: { width: number; height: number }
  fps: number
  thumbnails: string[] // URLs to thumbnail images
  motionEvents: MotionEvent[]
}

interface VideoClip {
  id: string
  recordingId: string
  cameraId: string
  timestamp: string
  duration: number // seconds
  filePath: string
  thumbnailUrl: string
  motionEvent: MotionEvent
  exportUrl?: string // Download link
}
```

#### Task 2.2: Thumbnail Generator (4-6 hours)

**File**: `src/services/security/thumbnail-generator.service.ts`

```typescript
export class ThumbnailGeneratorService {
  /**
   * Generate thumbnails from video file
   */
  async generateThumbnails(
    videoPath: string,
    interval: number = 5000, // ms
    outputDir: string
  ): Promise<string[]>

  /**
   * Generate single thumbnail at timestamp
   */
  async generateThumbnailAtTime(
    videoPath: string,
    timestamp: number, // ms
    outputPath: string
  ): Promise<string>

  /**
   * Create motion thumbnail (highlight motion area)
   */
  async createMotionThumbnail(
    videoPath: string,
    timestamp: number,
    motionZones: MotionZone[]
  ): Promise<string>
}
```

### Storage Structure

```
/var/homehub/recordings/
├── camera-1/
│   ├── 2025-10-12/
│   │   ├── 00-00-00.mp4       # 1-hour segment
│   │   ├── 01-00-00.mp4
│   │   ├── ...
│   │   └── 23-00-00.mp4
│   ├── 2025-10-13/
│   └── motion-clips/
│       ├── 2025-10-12_14-35-22.mp4
│       └── 2025-10-12_18-42-10.mp4
├── camera-2/
├── camera-3/
└── camera-4/
```

---

## 📋 Milestone 5.3: Smart Notifications

**Goal**: Intelligent alerts with person detection

**Duration**: 1-2 weeks (15-25 hours)
**Complexity**: HIGH (AI/ML integration)
**Hardware**: None (software only)

### Features

1. **Push Notifications**
   - Web Push API (browser notifications)
   - PWA notification support
   - Email alerts (optional)
   - SMS alerts via Twilio (optional)

2. **Person Detection (AI/ML)**
   - TensorFlow.js or ONNX Runtime
   - MobileNet SSD or YOLO model
   - Real-time inference (<500ms)
   - Confidence threshold (>80%)

3. **Package Detection**
   - Detect boxes/packages left at door
   - Track package presence duration
   - Alert when package removed

4. **Customizable Rules**
   - Per-camera notification settings
   - Time-based rules (alerts only 9 AM - 5 PM)
   - Zone-based rules (only front door)
   - Cooldown periods (max 1 alert per 5 min)

### Implementation Overview

**Person Detection with TensorFlow.js**:

```typescript
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

export class PersonDetectionService {
  private model: cocoSsd.ObjectDetection

  async loadModel() {
    this.model = await cocoSsd.load()
  }

  async detectPerson(imageBuffer: Buffer): Promise<PersonDetection[]> {
    const tensor = tf.node.decodeImage(imageBuffer)
    const predictions = await this.model.detect(tensor)

    return predictions
      .filter(p => p.class === 'person' && p.score > 0.8)
      .map(p => ({
        confidence: p.score,
        bbox: p.bbox,
        timestamp: new Date().toISOString(),
      }))
  }
}
```

---

## 📋 Milestone 5.4: Access Control

**Goal**: Smart lock integration and access logging

**Duration**: 1-2 weeks (20-30 hours)
**Complexity**: MEDIUM
**Hardware**: Smart locks, door/window sensors

### Features

1. **Smart Lock Integration**
   - Z-Wave/Zigbee lock support
   - Lock/unlock commands
   - Battery status monitoring
   - Access code management

2. **Door/Window Sensors**
   - Open/closed state monitoring
   - Tamper detection
   - Low battery alerts
   - Integration with security mode

3. **Access Logs**
   - Who unlocked (access code tracking)
   - When (timestamp)
   - Method (code, key, app)
   - Failed attempt tracking

4. **Guest Access Codes**
   - Temporary codes with expiration
   - One-time use codes
   - Schedule-based codes
   - Guest tracking

---

## 📋 Milestone 5.5: Emergency Response

**Goal**: Panic button and emergency integrations

**Duration**: 1 week (10-15 hours)
**Complexity**: LOW
**Hardware**: None (software only)

### Features

1. **Panic Button**
   - One-click emergency alert
   - Trigger all cameras to record
   - Send alerts to emergency contacts
   - Activate security siren (if available)

2. **Emergency Contacts**
   - Contact list management
   - Multi-channel alerts (SMS, email, push)
   - Location sharing
   - Two-way communication

3. **Event Log Export**
   - PDF/CSV export for insurance
   - Video clip compilation
   - Timeline visualization
   - Chain of custody tracking

---

## 💰 Cost Estimate

| Item                             | Quantity | Unit Price | Total |
| -------------------------------- | -------- | ---------- | ----- |
| **IP Cameras** (Reolink RLC-410) | 4        | $45        | $180  |
| **POE Switch** (8-port)          | 1        | $50        | $50   |
| **Storage** (1TB SSD)            | 1        | $60        | $60   |
| **Smart Lock** (Z-Wave)          | 1        | $120       | $120  |
| **Door/Window Sensors**          | 4        | $15        | $60   |
| **Optional: NAS** (2-bay)        | 1        | $200       | $200  |

**Total (Minimum)**: $290
**Total (Recommended)**: $470

---

## 🎯 Success Metrics

| Metric                        | Target             | Measurement      |
| ----------------------------- | ------------------ | ---------------- |
| **Camera Uptime**             | 99%+               | 7-day monitoring |
| **Notification Latency**      | <2 seconds         | Motion to push   |
| **Person Detection Accuracy** | 95%+               | 100 test images  |
| **False Alarm Rate**          | <1%                | Per 1000 events  |
| **Video Storage Efficiency**  | 7 days @ 4 cameras | Disk usage check |
| **Lock Response Time**        | <500ms             | App to lock      |

---

## 🗓️ Implementation Timeline

### Week 1-2: Camera Integration

- Set up RTSP client service
- Implement ONVIF discovery
- Build live view UI
- Test with 1-2 cameras

### Week 3-4: Video Storage

- Build NVR service
- Implement motion-triggered recording
- Create thumbnail generator
- Test storage management

### Week 5-6: Smart Notifications

- Integrate person detection AI
- Build notification service
- Create customizable rules
- Test alert accuracy

### Week 7-8: Access Control

- Integrate smart locks
- Add door/window sensors
- Build access log UI
- Test guest access codes

### Week 9-10: Emergency Response & Polish

- Add panic button
- Build emergency contacts
- Create event log export
- Final testing and documentation

---

## 📚 Documentation Structure

1. **MILESTONE_5.1_CAMERA_INTEGRATION_COMPLETE.md**
2. **MILESTONE_5.2_VIDEO_STORAGE_COMPLETE.md**
3. **MILESTONE_5.3_SMART_NOTIFICATIONS_COMPLETE.md**
4. **MILESTONE_5.4_ACCESS_CONTROL_COMPLETE.md**
5. **MILESTONE_5.5_EMERGENCY_RESPONSE_COMPLETE.md**
6. **PHASE_5_COMPLETE.md** (Final summary)

---

## 🚀 Getting Started

### Immediate Next Steps

1. **Research & Hardware Selection** (This week)
   - Choose camera models
   - Order 2 cameras to start (test before buying more)
   - Select smart lock brand
   - Plan storage solution

2. **Development Environment Setup** (Week 1)
   - Install FFmpeg and dependencies
   - Set up test RTSP stream (can use VLC as RTSP server)
   - Configure development network

3. **Milestone 5.1 Start** (Week 1-2)
   - Begin RTSP client implementation
   - Test with simulated stream
   - Document API interfaces

---

**Ready to start Phase 5?** This is the most hardware-intensive phase but also one of the most rewarding! 🎥🔐

---

_Created: October 12, 2025_
_Author: GitHub Copilot + and3rn3t_
_Project: HomeHub - DIY Home Automation Framework_
_Phase: 5 - Security & Surveillance (Planning)_
_Estimated Completion: December 2025_
