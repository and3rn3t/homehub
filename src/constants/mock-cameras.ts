/**
 * Mock Camera Data
 *
 * Represents your 7 real cameras with realistic specifications
 * while we work on API integration solutions.
 *
 * Using test HLS streams temporarily for development.
 */

export interface Camera {
  id: string
  name: string
  type: 'ptz' | 'doorbell' | 'spotlight' | 'indoor'
  brand: 'Eufy' | 'Arlo'
  model: string
  status: 'online' | 'offline' | 'recording'
  location: string
  streamUrl?: string // HLS URL for live video
  snapshotUrl?: string // Static image URL
  capabilities: {
    ptz: boolean
    nightVision: boolean
    spotlight: boolean
    twoWayAudio: boolean
    localStorage: boolean
  }
  battery?: number // Percentage (0-100)
  signalStrength: number // Percentage (0-100)
  resolution: string
  lastMotion?: Date
}

/**
 * Test HLS streams for development
 * Replace with real camera streams once integration is ready
 */
export const TEST_STREAMS = {
  // Apple's Big Buck Bunny test stream (public, reliable)
  bigBuckBunny: 'http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8',

  // Mux test streams (various quality levels)
  muxTest: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',

  // For snapshot testing, use placeholder service
  placeholder: (text: string) =>
    `https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=${encodeURIComponent(text)}`,
}

/**
 * Your 7 cameras with realistic specs
 */
export const MOCK_CAMERAS: Camera[] = [
  // 1. Eufy Indoor Cam E30 - Living Room
  {
    id: 'eufy-e30-living',
    name: 'Living Room PTZ',
    type: 'ptz',
    brand: 'Eufy',
    model: 'Indoor Cam E30 (T8414)',
    status: 'online',
    location: 'Living Room',
    streamUrl: TEST_STREAMS.bigBuckBunny,
    snapshotUrl: TEST_STREAMS.placeholder('Living Room'),
    capabilities: {
      ptz: true, // 360° pan, 96° tilt
      nightVision: true,
      spotlight: false,
      twoWayAudio: true,
      localStorage: true, // 16GB onboard
    },
    signalStrength: 85,
    resolution: '2K (2304x1296)',
    lastMotion: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },

  // 2. Eufy Indoor Cam E30 - Kitchen
  {
    id: 'eufy-e30-kitchen',
    name: 'Kitchen PTZ',
    type: 'ptz',
    brand: 'Eufy',
    model: 'Indoor Cam E30 (T8414)',
    status: 'online',
    location: 'Kitchen',
    streamUrl: TEST_STREAMS.muxTest,
    snapshotUrl: TEST_STREAMS.placeholder('Kitchen'),
    capabilities: {
      ptz: true,
      nightVision: true,
      spotlight: false,
      twoWayAudio: true,
      localStorage: true,
    },
    signalStrength: 92,
    resolution: '2K (2304x1296)',
    lastMotion: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },

  // 3. Arlo Essential Wired Video Doorbell
  {
    id: 'arlo-doorbell-front',
    name: 'Front Door',
    type: 'doorbell',
    brand: 'Arlo',
    model: 'Essential Wired Doorbell (AVD2001)',
    status: 'online',
    location: 'Front Entrance',
    snapshotUrl: TEST_STREAMS.placeholder('Front Door'),
    capabilities: {
      ptz: false,
      nightVision: true,
      spotlight: false,
      twoWayAudio: true,
      localStorage: false, // Cloud only
    },
    signalStrength: 78,
    resolution: '1080p (1920x1080)',
    lastMotion: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
  },

  // 4. Arlo Pro 4 - Backyard
  {
    id: 'arlo-pro4-backyard',
    name: 'Backyard',
    type: 'spotlight',
    brand: 'Arlo',
    model: 'Pro 4 Spotlight (VMC4041P)',
    status: 'online',
    location: 'Backyard',
    snapshotUrl: TEST_STREAMS.placeholder('Backyard'),
    capabilities: {
      ptz: false,
      nightVision: true,
      spotlight: true, // Integrated LED spotlight
      twoWayAudio: true,
      localStorage: false,
    },
    battery: 67,
    signalStrength: 65,
    resolution: '2K HDR (2560x1440)',
    lastMotion: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },

  // 5. Arlo Pro 4 - Driveway
  {
    id: 'arlo-pro4-driveway',
    name: 'Driveway',
    type: 'spotlight',
    brand: 'Arlo',
    model: 'Pro 4 Spotlight (VMC4041P)',
    status: 'online',
    location: 'Driveway',
    snapshotUrl: TEST_STREAMS.placeholder('Driveway'),
    capabilities: {
      ptz: false,
      nightVision: true,
      spotlight: true,
      twoWayAudio: true,
      localStorage: false,
    },
    battery: 82,
    signalStrength: 88,
    resolution: '2K HDR (2560x1440)',
    lastMotion: new Date(Date.now() - 1000 * 60 * 8), // 8 minutes ago
  },

  // 6. Arlo Essential Indoor - Baby Room
  {
    id: 'arlo-essential-baby',
    name: 'Baby Room',
    type: 'indoor',
    brand: 'Arlo',
    model: 'Essential Indoor (VMC2040)',
    status: 'online',
    location: 'Baby Room',
    snapshotUrl: TEST_STREAMS.placeholder('Baby Room'),
    capabilities: {
      ptz: false,
      nightVision: true,
      spotlight: false,
      twoWayAudio: true,
      localStorage: false,
    },
    signalStrength: 95,
    resolution: '1080p (1920x1080)',
    lastMotion: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
  },

  // 7. Arlo Essential Indoor - Office
  {
    id: 'arlo-essential-office',
    name: 'Office',
    type: 'indoor',
    brand: 'Arlo',
    model: 'Essential Indoor (VMC2040)',
    status: 'offline', // One camera broken (as mentioned)
    location: 'Office',
    snapshotUrl: TEST_STREAMS.placeholder('Office - Offline'),
    capabilities: {
      ptz: false,
      nightVision: true,
      spotlight: false,
      twoWayAudio: true,
      localStorage: false,
    },
    signalStrength: 0,
    resolution: '1080p (1920x1080)',
    lastMotion: new Date(Date.now() - 1000 * 60 * 60 * 24), // 24 hours ago
  },
]

/**
 * Helper to get cameras by location/type
 */
export const getCamerasByType = (type: Camera['type']) =>
  MOCK_CAMERAS.filter(cam => cam.type === type)

export const getCamerasByBrand = (brand: Camera['brand']) =>
  MOCK_CAMERAS.filter(cam => cam.brand === brand)

export const getOnlineCameras = () => MOCK_CAMERAS.filter(cam => cam.status === 'online')

/**
 * Icons for camera types (Lucide React)
 */
export const CAMERA_TYPE_ICONS = {
  ptz: 'ScanIcon', // Or VideoIcon with motion indicator
  doorbell: 'BellIcon',
  spotlight: 'FlashlightIcon',
  indoor: 'VideoIcon',
} as const

/**
 * Brand colors for UI accents
 */
export const BRAND_COLORS = {
  Eufy: 'oklch(0.55 0.15 250)', // Blue
  Arlo: 'oklch(0.65 0.15 145)', // Green
} as const
