/**
 * Mock Data for Development
 *
 * Seed data for testing and UI development.
 * Replace with real device data in Phase 2.
 */

import type { Automation, Camera, Device, Room, Scene, SecurityEvent, User } from '@/types'

/**
 * Mock Devices
 *
 * Comprehensive device collection covering all types and states.
 * Updated: October 9, 2025
 */
export const MOCK_DEVICES: Device[] = [
  // ===== LIGHTS =====
  {
    id: 'living-room-light',
    name: 'Living Room Ceiling Light',
    type: 'light',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 75,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 95,
    capabilities: ['dimming', 'color-temp'],
  },
  {
    id: 'living-room-lamp',
    name: 'Living Room Floor Lamp',
    type: 'light',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'http',
    value: 60,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 88,
    capabilities: ['dimming'],
  },
  {
    id: 'bedroom-light',
    name: 'Bedroom Light',
    type: 'light',
    room: 'Bedroom',
    status: 'online',
    enabled: false,
    protocol: 'mqtt',
    value: 0,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 82,
    capabilities: ['dimming', 'color-temp'],
  },
  {
    id: 'bedroom-lamp',
    name: 'Bedroom Nightstand Lamp',
    type: 'light',
    room: 'Bedroom',
    status: 'online',
    enabled: false,
    protocol: 'http',
    value: 0,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 79,
    capabilities: ['dimming'],
  },
  {
    id: 'kitchen-light',
    name: 'Kitchen Overhead Light',
    type: 'light',
    room: 'Kitchen',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 100,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 91,
    capabilities: ['dimming'],
  },
  {
    id: 'bathroom-light',
    name: 'Bathroom Vanity Light',
    type: 'light',
    room: 'Bathroom',
    status: 'online',
    enabled: false,
    protocol: 'http',
    value: 0,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 76,
    capabilities: ['dimming', 'color-temp'],
  },
  {
    id: 'office-light',
    name: 'Office Desk Light',
    type: 'light',
    room: 'Office',
    status: 'warning',
    enabled: true,
    protocol: 'mqtt',
    value: 85,
    unit: '%',
    lastSeen: new Date(Date.now() - 180000),
    signalStrength: 58,
    capabilities: ['dimming'],
  },
  {
    id: 'hue-39',
    name: "Matt's Table 2",
    type: 'light',
    room: 'Office',
    status: 'online',
    enabled: true,
    protocol: 'hue',
    value: 50,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 100,
    capabilities: ['dimming', 'color', 'color-temp'],
  },

  // ===== THERMOSTATS =====
  {
    id: 'thermostat-main',
    name: 'Main Thermostat',
    type: 'thermostat',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 72,
    unit: '°F',
    lastSeen: new Date(),
    batteryLevel: 85,
    signalStrength: 88,
    capabilities: ['heating', 'cooling', 'auto'],
  },
  {
    id: 'thermostat-bedroom',
    name: 'Bedroom Thermostat',
    type: 'thermostat',
    room: 'Bedroom',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 68,
    unit: '°F',
    lastSeen: new Date(),
    signalStrength: 81,
    capabilities: ['heating', 'cooling'],
  },

  // ===== SECURITY DEVICES =====
  {
    id: 'front-door-lock',
    name: 'Front Door Smart Lock',
    type: 'security',
    room: 'Entryway',
    status: 'warning',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(Date.now() - 300000),
    batteryLevel: 15,
    signalStrength: 92,
    capabilities: ['lock', 'unlock', 'auto-lock'],
  },
  {
    id: 'back-door-lock',
    name: 'Back Door Lock',
    type: 'security',
    room: 'Kitchen',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(),
    batteryLevel: 78,
    signalStrength: 85,
    capabilities: ['lock', 'unlock'],
  },
  {
    id: 'garage-door',
    name: 'Garage Door Controller',
    type: 'security',
    room: 'Garage',
    status: 'offline',
    enabled: false,
    protocol: 'mqtt',
    lastSeen: new Date(Date.now() - 900000),
    batteryLevel: 45,
    signalStrength: 0,
    capabilities: ['open', 'close', 'stop'],
  },
  {
    id: 'window-sensor-living',
    name: 'Living Room Window Sensor',
    type: 'security',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(),
    batteryLevel: 92,
    signalStrength: 89,
    capabilities: ['contact-sensor'],
  },
  {
    id: 'window-sensor-bedroom',
    name: 'Bedroom Window Sensor',
    type: 'security',
    room: 'Bedroom',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(),
    batteryLevel: 88,
    signalStrength: 80,
    capabilities: ['contact-sensor'],
  },

  // ===== SENSORS =====
  {
    id: 'motion-sensor-living',
    name: 'Living Room Motion Sensor',
    type: 'sensor',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(),
    batteryLevel: 90,
    signalStrength: 87,
    capabilities: ['motion-detection'],
  },
  {
    id: 'motion-sensor-hallway',
    name: 'Hallway Motion Sensor',
    type: 'sensor',
    room: 'Entryway',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(),
    batteryLevel: 82,
    signalStrength: 91,
    capabilities: ['motion-detection'],
  },
  {
    id: 'temp-sensor-bedroom',
    name: 'Bedroom Temperature Sensor',
    type: 'sensor',
    room: 'Bedroom',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 68,
    unit: '°F',
    lastSeen: new Date(),
    batteryLevel: 95,
    signalStrength: 83,
    capabilities: ['temperature', 'humidity'],
  },
  {
    id: 'smoke-detector-kitchen',
    name: 'Kitchen Smoke Detector',
    type: 'sensor',
    room: 'Kitchen',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(),
    batteryLevel: 100,
    signalStrength: 90,
    capabilities: ['smoke-detection', 'co-detection'],
  },
  {
    id: 'water-leak-bathroom',
    name: 'Bathroom Water Leak Sensor',
    type: 'sensor',
    room: 'Bathroom',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(),
    batteryLevel: 87,
    signalStrength: 74,
    capabilities: ['leak-detection'],
  },
  {
    id: 'humidity-sensor-bathroom',
    name: 'Bathroom Humidity Sensor',
    type: 'sensor',
    room: 'Bathroom',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 65,
    unit: '%',
    lastSeen: new Date(),
    batteryLevel: 91,
    signalStrength: 77,
    capabilities: ['humidity', 'temperature'],
  },
  {
    id: 'motion-sensor-garage',
    name: 'Garage Motion Sensor',
    type: 'sensor',
    room: 'Garage',
    status: 'error',
    enabled: false,
    protocol: 'mqtt',
    lastSeen: new Date(Date.now() - 1800000),
    batteryLevel: 5,
    signalStrength: 0,
    capabilities: ['motion-detection'],
  },

  // ===== ADDITIONAL SMART DEVICES =====
  {
    id: 'smart-plug-tv',
    name: 'TV Smart Plug',
    type: 'light', // Using 'light' type for smart plugs (on/off devices)
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'http',
    value: 100,
    unit: 'W',
    lastSeen: new Date(),
    signalStrength: 93,
    capabilities: ['power-monitoring', 'scheduling'],
  },
  {
    id: 'smart-plug-coffee',
    name: 'Coffee Maker Smart Plug',
    type: 'light',
    room: 'Kitchen',
    status: 'online',
    enabled: false,
    protocol: 'mqtt',
    value: 0,
    unit: 'W',
    lastSeen: new Date(),
    signalStrength: 88,
    capabilities: ['power-monitoring', 'scheduling'],
  },
  {
    id: 'air-quality-living',
    name: 'Living Room Air Quality Monitor',
    type: 'sensor',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 85,
    unit: 'AQI',
    lastSeen: new Date(),
    batteryLevel: 75,
    signalStrength: 89,
    capabilities: ['air-quality', 'voc-detection'],
  },
  {
    id: 'doorbell-front',
    name: 'Smart Doorbell',
    type: 'security',
    room: 'Entryway',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    lastSeen: new Date(),
    batteryLevel: 68,
    signalStrength: 94,
    capabilities: ['camera', 'motion-detection', 'two-way-audio'],
  },
  {
    id: 'blind-living-room',
    name: 'Living Room Smart Blinds',
    type: 'light',
    room: 'Living Room',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 60,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 86,
    capabilities: ['open', 'close', 'tilt'],
  },
  {
    id: 'blind-bedroom',
    name: 'Bedroom Smart Blinds',
    type: 'light',
    room: 'Bedroom',
    status: 'online',
    enabled: true,
    protocol: 'mqtt',
    value: 0,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 81,
    capabilities: ['open', 'close', 'tilt'],
  },
]

/**
 * Mock Rooms
 *
 * Room definitions with device assignments and environment data.
 * Updated: October 9, 2025
 */
export const MOCK_ROOMS: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    icon: 'Couch',
    color: 'oklch(0.7 0.15 145)', // iOS Green accent
    deviceIds: [
      'living-room-light',
      'living-room-lamp',
      'thermostat-main',
      'motion-sensor-living',
      'window-sensor-living',
      'smart-plug-tv',
      'air-quality-living',
      'blind-living-room',
    ],
    temperature: 72,
    humidity: 45,
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: 'Bed',
    color: 'oklch(0.6 0.15 250)', // iOS Blue primary
    deviceIds: [
      'bedroom-light',
      'bedroom-lamp',
      'thermostat-bedroom',
      'temp-sensor-bedroom',
      'window-sensor-bedroom',
      'blind-bedroom',
    ],
    temperature: 68,
    humidity: 50,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: 'ForkKnife',
    color: 'oklch(0.75 0.18 50)', // Warm Orange
    deviceIds: ['kitchen-light', 'back-door-lock', 'smoke-detector-kitchen', 'smart-plug-coffee'],
    temperature: 70,
    humidity: 42,
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    icon: 'Shower',
    color: 'oklch(0.65 0.2 200)', // Aqua Blue
    deviceIds: ['bathroom-light', 'water-leak-bathroom', 'humidity-sensor-bathroom'],
    temperature: 71,
    humidity: 65,
  },
  {
    id: 'office',
    name: 'Office',
    icon: 'Desktop',
    color: 'oklch(0.55 0.15 280)', // Purple
    deviceIds: ['office-light'],
    temperature: 70,
    humidity: 48,
  },
  {
    id: 'entryway',
    name: 'Entryway',
    icon: 'Door',
    color: 'oklch(0.7 0.12 30)', // Warm Beige
    deviceIds: ['front-door-lock', 'motion-sensor-hallway', 'doorbell-front'],
    temperature: 69,
    humidity: 46,
  },
  {
    id: 'garage',
    name: 'Garage',
    icon: 'GarageDoor',
    color: 'oklch(0.5 0.08 0)', // Gray
    deviceIds: ['garage-door', 'motion-sensor-garage'],
    temperature: 58,
    humidity: 55,
  },
]

/**
 * Mock Scenes
 *
 * Predefined device state combinations for one-touch control.
 * Updated: October 9, 2025
 */
export const MOCK_SCENES: Scene[] = [
  {
    id: 'good-morning',
    name: 'Good Morning',
    icon: 'Sun',
    description: 'Gradually turn on lights and adjust temperature for a fresh start',
    enabled: true,
    deviceStates: [
      { deviceId: 'bedroom-light', enabled: true, value: 30 },
      { deviceId: 'bedroom-lamp', enabled: true, value: 50 },
      { deviceId: 'bathroom-light', enabled: true, value: 80 },
      { deviceId: 'kitchen-light', enabled: true, value: 75 },
      { deviceId: 'thermostat-main', enabled: true, value: 72 },
      { deviceId: 'thermostat-bedroom', enabled: true, value: 70 },
    ],
    lastActivated: new Date(Date.now() - 86400000), // Yesterday
  },
  {
    id: 'good-night',
    name: 'Good Night',
    icon: 'Moon',
    description: 'Turn off all lights, lock doors, and set comfortable sleep temperature',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: false },
      { deviceId: 'living-room-lamp', enabled: false },
      { deviceId: 'kitchen-light', enabled: false },
      { deviceId: 'bathroom-light', enabled: false },
      { deviceId: 'office-light', enabled: false },
      { deviceId: 'bedroom-light', enabled: false },
      { deviceId: 'bedroom-lamp', enabled: true, value: 10 },
      { deviceId: 'front-door-lock', enabled: true },
      { deviceId: 'back-door-lock', enabled: true },
      { deviceId: 'thermostat-main', enabled: true, value: 68 },
      { deviceId: 'thermostat-bedroom', enabled: true, value: 66 },
    ],
    lastActivated: new Date(Date.now() - 43200000), // 12 hours ago
  },
  {
    id: 'movie-time',
    name: 'Movie Time',
    icon: 'FilmSlate',
    description: 'Dim lights for the perfect viewing experience',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: true, value: 15 },
      { deviceId: 'living-room-lamp', enabled: false },
      { deviceId: 'kitchen-light', enabled: false },
      { deviceId: 'bedroom-light', enabled: false },
      { deviceId: 'thermostat-main', enabled: true, value: 70 },
    ],
    lastActivated: new Date(Date.now() - 172800000), // 2 days ago
  },
  {
    id: 'away-mode',
    name: 'Away Mode',
    icon: 'House',
    description: 'Energy saving mode and security when nobody is home',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: false },
      { deviceId: 'living-room-lamp', enabled: false },
      { deviceId: 'kitchen-light', enabled: false },
      { deviceId: 'bedroom-light', enabled: false },
      { deviceId: 'bedroom-lamp', enabled: false },
      { deviceId: 'bathroom-light', enabled: false },
      { deviceId: 'office-light', enabled: false },
      { deviceId: 'thermostat-main', enabled: true, value: 62 },
      { deviceId: 'thermostat-bedroom', enabled: true, value: 62 },
      { deviceId: 'front-door-lock', enabled: true },
      { deviceId: 'back-door-lock', enabled: true },
    ],
  },
  {
    id: 'dinner-time',
    name: 'Dinner Time',
    icon: 'ForkKnife',
    description: 'Warm lighting for a cozy dining atmosphere',
    enabled: true,
    deviceStates: [
      { deviceId: 'kitchen-light', enabled: true, value: 90 },
      { deviceId: 'living-room-light', enabled: true, value: 60 },
      { deviceId: 'living-room-lamp', enabled: true, value: 50 },
      { deviceId: 'thermostat-main', enabled: true, value: 71 },
    ],
  },
  {
    id: 'work-mode',
    name: 'Work Mode',
    icon: 'Desktop',
    description: 'Bright, focused lighting for productivity',
    enabled: true,
    deviceStates: [
      { deviceId: 'office-light', enabled: true, value: 100 },
      { deviceId: 'living-room-light', enabled: true, value: 70 },
      { deviceId: 'kitchen-light', enabled: true, value: 60 },
      { deviceId: 'thermostat-main', enabled: true, value: 70 },
    ],
    lastActivated: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 'relax-mode',
    name: 'Relax',
    icon: 'Armchair',
    description: 'Soft, warm lighting to unwind after a long day',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: true, value: 40 },
      { deviceId: 'living-room-lamp', enabled: true, value: 60 },
      { deviceId: 'bedroom-lamp', enabled: true, value: 30 },
      { deviceId: 'kitchen-light', enabled: false },
      { deviceId: 'thermostat-main', enabled: true, value: 72 },
    ],
  },
  {
    id: 'party-mode',
    name: 'Party',
    icon: 'Confetti',
    description: 'Bright, energetic lighting for entertaining guests',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: true, value: 100 },
      { deviceId: 'living-room-lamp', enabled: true, value: 100 },
      { deviceId: 'kitchen-light', enabled: true, value: 100 },
      { deviceId: 'bathroom-light', enabled: true, value: 80 },
      { deviceId: 'thermostat-main', enabled: true, value: 68 },
    ],
  },
  {
    id: 'reading-time',
    name: 'Reading Time',
    icon: 'Book',
    description: 'Comfortable lighting for reading',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-lamp', enabled: true, value: 80 },
      { deviceId: 'living-room-light', enabled: true, value: 50 },
      { deviceId: 'kitchen-light', enabled: false },
      { deviceId: 'bedroom-lamp', enabled: true, value: 75 },
      { deviceId: 'thermostat-main', enabled: true, value: 71 },
    ],
  },
  {
    id: 'wake-up',
    name: 'Wake Up',
    icon: 'SunHorizon',
    description: 'Gentle gradual lighting to wake up naturally',
    enabled: true,
    deviceStates: [
      { deviceId: 'bedroom-light', enabled: true, value: 20 },
      { deviceId: 'bedroom-lamp', enabled: true, value: 30 },
      { deviceId: 'bathroom-light', enabled: true, value: 60 },
      { deviceId: 'thermostat-bedroom', enabled: true, value: 70 },
    ],
  },
  {
    id: 'sleep-time',
    name: 'Sleep',
    icon: 'BedSimple',
    description: 'Minimal lighting and cool temperature for optimal sleep',
    enabled: true,
    deviceStates: [
      { deviceId: 'bedroom-light', enabled: false },
      { deviceId: 'bedroom-lamp', enabled: true, value: 5 },
      { deviceId: 'living-room-light', enabled: false },
      { deviceId: 'living-room-lamp', enabled: false },
      { deviceId: 'kitchen-light', enabled: false },
      { deviceId: 'bathroom-light', enabled: false },
      { deviceId: 'thermostat-bedroom', enabled: true, value: 66 },
    ],
  },
  {
    id: 'emergency',
    name: 'Emergency',
    icon: 'Warning',
    description: 'Full lighting, unlock doors for quick evacuation',
    enabled: true,
    deviceStates: [
      { deviceId: 'living-room-light', enabled: true, value: 100 },
      { deviceId: 'living-room-lamp', enabled: true, value: 100 },
      { deviceId: 'bedroom-light', enabled: true, value: 100 },
      { deviceId: 'bedroom-lamp', enabled: true, value: 100 },
      { deviceId: 'kitchen-light', enabled: true, value: 100 },
      { deviceId: 'bathroom-light', enabled: true, value: 100 },
      { deviceId: 'office-light', enabled: true, value: 100 },
      { deviceId: 'front-door-lock', enabled: false },
      { deviceId: 'back-door-lock', enabled: false },
    ],
  },
]

/**
 * Mock Automations
 *
 * Time/condition-based rules demonstrating all trigger types.
 * Updated: October 9, 2025
 */
export const MOCK_AUTOMATIONS: Automation[] = [
  // ===== TIME-BASED TRIGGERS =====
  {
    id: 'morning-routine',
    name: 'Weekday Morning Routine',
    description: 'Gradual lights and temperature increase at 7 AM on weekdays',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '07:00',
        time: '07:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      },
    ],
    actions: [
      { deviceId: 'bedroom-light', action: 'turn-on', enabled: true, value: 30 },
      { deviceId: 'kitchen-light', action: 'turn-on', enabled: true, value: 75 },
      { deviceId: 'thermostat-main', action: 'set-temperature', enabled: true, value: 72 },
    ],
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    nextRun: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: 'evening-lights',
    name: 'Evening Lights',
    description: 'Turn on lights at sunset every day',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '18:00',
        time: '18:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
    actions: [
      { deviceId: 'living-room-light', action: 'turn-on', enabled: true, value: 80 },
      { deviceId: 'living-room-lamp', action: 'turn-on', enabled: true, value: 60 },
    ],
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    nextRun: new Date(Date.now() + 43200000).toISOString(),
  },
  {
    id: 'bedtime-routine',
    name: 'Bedtime Routine',
    description: 'Dim lights and adjust temperature at 10 PM',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '22:00',
        time: '22:00',
        days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      },
    ],
    actions: [
      { deviceId: 'living-room-light', action: 'turn-off', enabled: false },
      { deviceId: 'bedroom-lamp', action: 'turn-on', enabled: true, value: 10 },
      { deviceId: 'thermostat-bedroom', action: 'set-temperature', enabled: true, value: 68 },
    ],
    nextRun: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    id: 'weekend-wakeup',
    name: 'Weekend Wake Up',
    description: 'Gentle lighting at 9 AM on weekends',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '09:00',
        time: '09:00',
        days: ['saturday', 'sunday'],
      },
    ],
    actions: [
      { deviceId: 'bedroom-light', action: 'turn-on', enabled: true, value: 20 },
      { deviceId: 'kitchen-light', action: 'turn-on', enabled: true, value: 50 },
    ],
    nextRun: new Date(Date.now() + 172800000).toISOString(),
  },

  // ===== CONDITION-BASED TRIGGERS =====
  {
    id: 'high-temp-alert',
    name: 'High Temperature Alert',
    description: 'Adjust thermostat when temperature exceeds 75°F',
    type: 'condition',
    enabled: true,
    triggers: [
      {
        type: 'condition',
        deviceId: 'temp-sensor-bedroom',
        operator: '>',
        threshold: 75,
        value: 'temperature',
      },
    ],
    actions: [
      { deviceId: 'thermostat-bedroom', action: 'set-temperature', enabled: true, value: 70 },
    ],
  },
  {
    id: 'low-temp-heating',
    name: 'Low Temperature Heating',
    description: 'Increase heat when temperature drops below 65°F',
    type: 'condition',
    enabled: true,
    triggers: [
      {
        type: 'condition',
        deviceId: 'thermostat-main',
        operator: '<',
        threshold: 65,
        value: 'temperature',
      },
    ],
    actions: [{ deviceId: 'thermostat-main', action: 'set-temperature', enabled: true, value: 72 }],
    lastRun: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'high-humidity-fan',
    name: 'High Humidity Response',
    description: 'Alert when bathroom humidity exceeds 70%',
    type: 'condition',
    enabled: true,
    triggers: [
      {
        type: 'condition',
        deviceId: 'humidity-sensor-bathroom',
        operator: '>',
        threshold: 70,
        value: 'humidity',
      },
    ],
    actions: [{ action: 'send-notification', value: 'High humidity detected in bathroom' }],
  },
  {
    id: 'low-battery-alert',
    name: 'Low Battery Alert',
    description: 'Notify when any device battery falls below 20%',
    type: 'condition',
    enabled: true,
    triggers: [
      {
        type: 'condition',
        deviceId: 'front-door-lock',
        operator: '<',
        threshold: 20,
        value: 'battery',
      },
    ],
    actions: [{ action: 'send-notification', value: 'Front door lock battery low - replace soon' }],
    lastRun: new Date(Date.now() - 3600000).toISOString(),
  },

  // ===== GEOFENCE TRIGGERS =====
  {
    id: 'arriving-home',
    name: 'Arriving Home',
    description: 'Turn on lights and adjust temperature when arriving home',
    type: 'geofence',
    enabled: true,
    triggers: [
      {
        type: 'geofence',
        value: 'entering',
        location: {
          lat: 37.7749,
          lng: -122.4194,
          radius: 100,
        },
      },
    ],
    actions: [
      { deviceId: 'living-room-light', action: 'turn-on', enabled: true, value: 70 },
      { deviceId: 'kitchen-light', action: 'turn-on', enabled: true, value: 60 },
      { deviceId: 'thermostat-main', action: 'set-temperature', enabled: true, value: 72 },
      { deviceId: 'front-door-lock', action: 'unlock', enabled: false },
    ],
    lastRun: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'leaving-home',
    name: 'Leaving Home',
    description: 'Activate away mode when leaving home area',
    type: 'geofence',
    enabled: true,
    triggers: [
      {
        type: 'geofence',
        value: 'exiting',
        location: {
          lat: 37.7749,
          lng: -122.4194,
          radius: 150,
        },
      },
    ],
    actions: [
      { deviceId: 'living-room-light', action: 'turn-off', enabled: false },
      { deviceId: 'bedroom-light', action: 'turn-off', enabled: false },
      { deviceId: 'kitchen-light', action: 'turn-off', enabled: false },
      { deviceId: 'thermostat-main', action: 'set-temperature', enabled: true, value: 62 },
      { deviceId: 'front-door-lock', action: 'lock', enabled: true },
      { deviceId: 'back-door-lock', action: 'lock', enabled: true },
    ],
    lastRun: new Date(Date.now() - 14400000).toISOString(),
  },

  // ===== DEVICE-STATE TRIGGERS =====
  {
    id: 'motion-hallway-light',
    name: 'Hallway Motion Light',
    description: 'Turn on hallway light when motion detected',
    type: 'device-state',
    enabled: true,
    triggers: [
      {
        type: 'device-state',
        deviceId: 'motion-sensor-hallway',
        value: 'motion-detected',
      },
    ],
    actions: [{ deviceId: 'living-room-light', action: 'turn-on', enabled: true, value: 50 }],
    lastRun: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'door-open-alert',
    name: 'Door Open Alert',
    description: 'Alert when doors opened while away',
    type: 'device-state',
    enabled: true,
    triggers: [
      {
        type: 'device-state',
        deviceId: 'front-door-lock',
        value: 'unlocked',
      },
    ],
    actions: [
      { action: 'send-notification', value: 'Front door opened - security alert' },
      { deviceId: 'living-room-light', action: 'turn-on', enabled: true, value: 100 },
    ],
  },
  {
    id: 'window-open-climate',
    name: 'Window Open Climate Adjust',
    description: 'Adjust thermostat when window is opened',
    type: 'device-state',
    enabled: true,
    triggers: [
      {
        type: 'device-state',
        deviceId: 'window-sensor-living',
        value: 'open',
      },
    ],
    actions: [{ deviceId: 'thermostat-main', action: 'set-temperature', enabled: true, value: 68 }],
  },
  {
    id: 'smoke-detector-emergency',
    name: 'Smoke Detector Emergency',
    description: 'Emergency response when smoke detected',
    type: 'device-state',
    enabled: true,
    triggers: [
      {
        type: 'device-state',
        deviceId: 'smoke-detector-kitchen',
        value: 'smoke-detected',
      },
    ],
    actions: [
      { deviceId: 'living-room-light', action: 'turn-on', enabled: true, value: 100 },
      { deviceId: 'bedroom-light', action: 'turn-on', enabled: true, value: 100 },
      { deviceId: 'kitchen-light', action: 'turn-on', enabled: true, value: 100 },
      { deviceId: 'front-door-lock', action: 'unlock', enabled: false },
      { deviceId: 'back-door-lock', action: 'unlock', enabled: false },
      { action: 'send-notification', value: 'SMOKE ALERT - Emergency evacuation!' },
    ],
  },
  {
    id: 'water-leak-shutoff',
    name: 'Water Leak Shutoff',
    description: 'Alert and potential shutoff when leak detected',
    type: 'device-state',
    enabled: true,
    triggers: [
      {
        type: 'device-state',
        deviceId: 'water-leak-bathroom',
        value: 'leak-detected',
      },
    ],
    actions: [
      { action: 'send-notification', value: 'Water leak detected in bathroom!' },
      { deviceId: 'bathroom-light', action: 'turn-on', enabled: true, value: 100 },
    ],
  },
  {
    id: 'nighttime-motion-path',
    name: 'Nighttime Motion Path',
    description: 'Gentle lighting path when motion detected at night',
    type: 'device-state',
    enabled: true,
    triggers: [
      {
        type: 'device-state',
        deviceId: 'motion-sensor-living',
        value: 'motion-detected',
      },
    ],
    actions: [
      { deviceId: 'living-room-lamp', action: 'turn-on', enabled: true, value: 20 },
      { deviceId: 'bathroom-light', action: 'turn-on', enabled: true, value: 30 },
    ],
    lastRun: new Date(Date.now() - 7200000).toISOString(),
  },

  // ===== ADDITIONAL SMART AUTOMATIONS =====
  {
    id: 'morning-coffee',
    name: 'Morning Coffee Maker',
    description: 'Turn on coffee maker at 6:30 AM on weekdays',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '06:30',
        time: '06:30',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      },
    ],
    actions: [{ deviceId: 'smart-plug-coffee', action: 'turn-on', enabled: true }],
    nextRun: new Date(Date.now() + 82800000).toISOString(),
  },
  {
    id: 'sunrise-blinds',
    name: 'Open Blinds at Sunrise',
    description: 'Gradually open blinds in the morning',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '07:30',
        time: '07:30',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
    actions: [
      { deviceId: 'blind-living-room', action: 'turn-on', enabled: true, value: 80 },
      { deviceId: 'blind-bedroom', action: 'turn-on', enabled: true, value: 60 },
    ],
    nextRun: new Date(Date.now() + 79200000).toISOString(),
  },
  {
    id: 'sunset-blinds',
    name: 'Close Blinds at Sunset',
    description: 'Automatically close blinds in the evening',
    type: 'schedule',
    enabled: true,
    triggers: [
      {
        type: 'time',
        value: '19:00',
        time: '19:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
    actions: [
      { deviceId: 'blind-living-room', action: 'turn-on', enabled: true, value: 20 },
      { deviceId: 'blind-bedroom', action: 'turn-on', enabled: true, value: 0 },
    ],
    nextRun: new Date(Date.now() + 39600000).toISOString(),
  },
  {
    id: 'poor-air-quality',
    name: 'Poor Air Quality Alert',
    description: 'Notify when air quality is poor',
    type: 'condition',
    enabled: true,
    triggers: [
      {
        type: 'condition',
        deviceId: 'air-quality-living',
        operator: '>',
        threshold: 100,
        value: 'air-quality',
      },
    ],
    actions: [
      { action: 'send-notification', value: 'Air quality is poor - consider opening windows' },
    ],
  },
  {
    id: 'doorbell-press',
    name: 'Doorbell Notification',
    description: 'Turn on lights and notify when doorbell pressed',
    type: 'device-state',
    enabled: true,
    triggers: [
      {
        type: 'device-state',
        deviceId: 'doorbell-front',
        value: 'button-pressed',
      },
    ],
    actions: [
      { deviceId: 'living-room-light', action: 'turn-on', enabled: true, value: 100 },
      { action: 'send-notification', value: 'Someone is at the front door' },
    ],
  },
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
      canViewSecurity: true,
    },
    avatar: 'https://i.pravatar.cc/150?u=john',
    lastActive: new Date(),
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
      canViewSecurity: true,
    },
    avatar: 'https://i.pravatar.cc/150?u=jane',
    lastActive: new Date(Date.now() - 86400000),
  },
  {
    id: 'user-3',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'member',
    permissions: {
      canEditDevices: true,
      canCreateScenes: true,
      canManageUsers: false,
      canViewSecurity: false,
    },
    avatar: 'https://i.pravatar.cc/150?u=alex',
    lastActive: new Date(Date.now() - 172800000), // 2 days ago
  },
  {
    id: 'user-4',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    role: 'guest',
    permissions: {
      canEditDevices: false,
      canCreateScenes: false,
      canManageUsers: false,
      canViewSecurity: false,
    },
    avatar: 'https://i.pravatar.cc/150?u=emma',
    lastActive: new Date(Date.now() - 604800000), // 7 days ago
  },
  {
    id: 'user-5',
    name: 'Michael Chen',
    email: 'michael@example.com',
    role: 'member',
    permissions: {
      canEditDevices: true,
      canCreateScenes: false,
      canManageUsers: false,
      canViewSecurity: true,
    },
    avatar: 'https://i.pravatar.cc/150?u=michael',
    lastActive: new Date(Date.now() - 3600000), // 1 hour ago
  },
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
    fov: 130,
    lastMotion: new Date(Date.now() - 3600000), // 1 hour ago
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
    fov: 110,
    lastMotion: new Date(Date.now() - 7200000), // 2 hours ago
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
    fov: 90,
  },
  {
    id: 'driveway-cam',
    name: 'Driveway Camera',
    location: 'Driveway',
    status: 'recording',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '1080p',
    fov: 120,
    lastMotion: new Date(Date.now() - 1800000), // 30 minutes ago
  },
  {
    id: 'side-yard-cam',
    name: 'Side Yard Camera',
    location: 'Side Yard',
    status: 'idle',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '720p',
    fov: 100,
    lastMotion: new Date(Date.now() - 86400000), // Yesterday
  },
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
    cameraId: 'front-door-cam',
  },
  {
    id: 'event-2',
    type: 'camera-offline',
    severity: 'medium',
    message: 'Garage camera went offline',
    timestamp: new Date(Date.now() - 7200000),
    acknowledged: false,
    cameraId: 'garage-cam',
  },
  {
    id: 'event-3',
    type: 'door-open',
    severity: 'medium',
    message: 'Front door opened while system armed',
    timestamp: new Date(Date.now() - 10800000), // 3 hours ago
    acknowledged: true,
  },
  {
    id: 'event-4',
    type: 'motion',
    severity: 'low',
    message: 'Motion detected in driveway',
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    acknowledged: false,
    cameraId: 'driveway-cam',
  },
  {
    id: 'event-5',
    type: 'alarm',
    severity: 'critical',
    message: 'Security alarm triggered - back door',
    timestamp: new Date(Date.now() - 14400000), // 4 hours ago
    acknowledged: true,
  },
  {
    id: 'event-6',
    type: 'motion',
    severity: 'low',
    message: 'Motion detected in backyard',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    acknowledged: true,
    cameraId: 'backyard-cam',
  },
  {
    id: 'event-7',
    type: 'door-open',
    severity: 'low',
    message: 'Back door opened',
    timestamp: new Date(Date.now() - 21600000), // 6 hours ago
    acknowledged: true,
  },
  {
    id: 'event-8',
    type: 'motion',
    severity: 'low',
    message: 'Motion detected in side yard',
    timestamp: new Date(Date.now() - 86400000), // Yesterday
    acknowledged: true,
    cameraId: 'side-yard-cam',
  },
  {
    id: 'event-9',
    type: 'alarm',
    severity: 'high',
    message: 'Window sensor triggered - living room',
    timestamp: new Date(Date.now() - 172800000), // 2 days ago
    acknowledged: true,
  },
  {
    id: 'event-10',
    type: 'camera-offline',
    severity: 'medium',
    message: 'Side yard camera connection lost',
    timestamp: new Date(Date.now() - 259200000), // 3 days ago
    acknowledged: true,
    cameraId: 'side-yard-cam',
  },
]
