/**
 * Mock Data for Development
 * 
 * Seed data for testing and UI development.
 * Replace with real device data in Phase 2.
 */

import type { Device, Room, Scene, Automation, User, Camera, SecurityEvent } from '@/types'

/**
 * Mock Devices
 */
export const MOCK_DEVICES: Device[] = [
  {
    id: 'living-room-light',
    name: 'Living Room Light',
    type: 'light',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    value: 75,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 95
  },
  {
    id: 'thermostat-main',
    name: 'Main Thermostat',
    type: 'thermostat',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    value: 72,
    unit: '°F',
    lastSeen: new Date(),
    batteryLevel: 85,
    signalStrength: 88
  },
  {
    id: 'front-door-lock',
    name: 'Front Door Lock',
    type: 'security',
    room: 'Entryway',
    status: 'warning',
    enabled: true,
    lastSeen: new Date(Date.now() - 300000),
    batteryLevel: 15,
    signalStrength: 92
  },
  {
    id: 'motion-sensor-living',
    name: 'Living Room Motion',
    type: 'sensor',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    lastSeen: new Date(),
    batteryLevel: 90,
    signalStrength: 87
  },
  {
    id: 'bedroom-light',
    name: 'Bedroom Light',
    type: 'light',
    room: 'Bedroom',
    status: 'online',
    enabled: false,
    value: 0,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 82
  },
  {
    id: 'kitchen-light',
    name: 'Kitchen Light',
    type: 'light',
    room: 'Kitchen',
    status: 'online',
    enabled: true,
    value: 100,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 91
  },
  {
    id: 'garage-door',
    name: 'Garage Door',
    type: 'security',
    room: 'Garage',
    status: 'offline',
    enabled: false,
    lastSeen: new Date(Date.now() - 900000),
    batteryLevel: 45,
    signalStrength: 0
  }
]

/**
 * Mock Rooms
 */
export const MOCK_ROOMS: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    icon: 'Couch',
    deviceIds: ['living-room-light', 'thermostat-main', 'motion-sensor-living'],
    temperature: 72,
    humidity: 45
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: 'Bed',
    deviceIds: ['bedroom-light'],
    temperature: 68,
    humidity: 50
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: 'ForkKnife',
    deviceIds: ['kitchen-light'],
    temperature: 70,
    humidity: 42
  },
  {
    id: 'entryway',
    name: 'Entryway',
    icon: 'Door',
    deviceIds: ['front-door-lock']
  },
  {
    id: 'garage',
    name: 'Garage',
    icon: 'GarageDoor',
    deviceIds: ['garage-door']
  }
]

/**
 * Mock Scenes
 */
export const MOCK_SCENES: Scene[] = [
  {
    id: 'good-morning',
    name: 'Good Morning',
    icon: 'Sun',
    description: 'Gradually turn on lights and adjust temperature',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: true, value: 50 },
      { deviceId: 'kitchen-light', enabled: true, value: 75 },
      { deviceId: 'thermostat-main', enabled: true, value: 70 }
    ]
  },
  {
    id: 'movie-time',
    name: 'Movie Time',
    icon: 'FilmSlate',
    description: 'Dim lights and set comfortable temperature',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: true, value: 20 },
      { deviceId: 'bedroom-light', enabled: false },
      { deviceId: 'thermostat-main', enabled: true, value: 68 }
    ]
  },
  {
    id: 'goodnight',
    name: 'Good Night',
    icon: 'Moon',
    description: 'Turn off all lights and lock doors',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: false },
      { deviceId: 'kitchen-light', enabled: false },
      { deviceId: 'bedroom-light', enabled: false },
      { deviceId: 'front-door-lock', enabled: true }
    ]
  },
  {
    id: 'away-mode',
    name: 'Away Mode',
    icon: 'House',
    description: 'Energy saving mode when nobody is home',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: false },
      { deviceId: 'kitchen-light', enabled: false },
      { deviceId: 'bedroom-light', enabled: false },
      { deviceId: 'thermostat-main', enabled: true, value: 65 },
      { deviceId: 'front-door-lock', enabled: true }
    ]
  }
]

/**
 * Mock Automations
 */
export const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Turn on lights at sunrise',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '07:00',
        time: '07:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    ],
    actions: [
      { deviceId: 'kitchen-light', action: 'turn-on', enabled: true, value: 75 },
      { deviceId: 'living-room-light', action: 'turn-on', enabled: true, value: 50 }
    ],
    nextRun: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: 'evening-lights',
    name: 'Evening Lights',
    description: 'Turn on lights at sunset',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '18:00',
        time: '18:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }
    ],
    actions: [
      { deviceId: 'living-room-light', action: 'turn-on', enabled: true, value: 80 }
    ],
    nextRun: new Date(Date.now() + 43200000).toISOString()
  }
]

/**
 * Mock Users
 */
export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    permissions: {
      canEditDevices: true,
      canCreateScenes: true,
      canManageUsers: true,
      canViewSecurity: true
    },
    lastActive: new Date()
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'member',
    permissions: {
      canEditDevices: true,
      canCreateScenes: true,
      canManageUsers: false,
      canViewSecurity: true
    },
    lastActive: new Date(Date.now() - 86400000)
  }
]

/**
 * Mock Cameras
 */
export const MOCK_CAMERAS: Camera[] = [
  {
    id: 'front-door-cam',
    name: 'Front Door Camera',
    location: 'Front Entrance',
    status: 'recording',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '1080p',
    fov: 130
  },
  {
    id: 'backyard-cam',
    name: 'Backyard Camera',
    location: 'Backyard',
    status: 'idle',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '1080p',
    fov: 110
  },
  {
    id: 'garage-cam',
    name: 'Garage Camera',
    location: 'Garage',
    status: 'offline',
    recordingEnabled: false,
    motionDetection: false,
    nightVision: false,
    resolution: '720p',
    fov: 90
  }
]

/**
 * Mock Security Events
 */
export const MOCK_SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'event-1',
    type: 'motion',
    severity: 'low',
    message: 'Motion detected at front door',
    timestamp: new Date(Date.now() - 3600000),
    acknowledged: false,
    cameraId: 'front-door-cam'
  },
  {
    id: 'event-2',
    type: 'camera-offline',
    severity: 'medium',
    message: 'Garage camera went offline',
    timestamp: new Date(Date.now() - 7200000),
    acknowledged: false,
    cameraId: 'garage-cam'
  }
]
