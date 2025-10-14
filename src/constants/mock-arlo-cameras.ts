/**
 * Mock Arlo Camera Data
 *
 * Based on real device capabilities extracted from my.arlo.com localStorage.
 * Includes 5 cameras: 1 doorbell + 2 Pro 4 + 2 Essential
 *
 * Device capabilities sourced from:
 * - AVD1001B_i009: Video Doorbell
 * - VMC4041PB_i006: Pro 4 (2K, spotlight, 2-way audio)
 * - VMC5040_i012: Pro 5 (4K, color night vision, auto-tracking)
 * - VMC2040B_i008: Essential Indoor (wired, privacy shutter)
 * - VMC2040B_i009: Essential Outdoor (wired, activity zones)
 */

import type { Camera } from '@/types/security.types'

export const MOCK_ARLO_CAMERAS: Camera[] = [
  {
    id: 'arlo-doorbell-001',
    name: 'Front Door',
    type: 'doorbell',
    location: 'Front Entrance',
    status: 'recording',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '1536x1536',
    manufacturer: 'Arlo',
    model: 'AVD1001B',
    firmwareVersion: '1.2.19',
    lastMotion: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    batteryLevel: 87,
    signalStrength: 92,
    capabilities: {
      ptz: false,
      nightVision: true,
      twoWayAudio: true,
      spotlight: false,
      recording: true,
      snapshot: true,
      motionDetection: true,
      audioDetection: true,
      doorbellPress: true,
    },
    settings: {
      motionSensitivity: 80,
      audioSensitivity: 3,
      recordingDuration: 10,
      nightVisionMode: 'auto',
      spotlightMode: 'off',
    },
    streamUrl: 'https://example.com/stream/doorbell',
    thumbnailUrl: 'https://via.placeholder.com/320x320/4a90e2/ffffff?text=Front+Door',
  },
  {
    id: 'arlo-pro4-backyard',
    name: 'Backyard Camera',
    type: 'outdoor',
    location: 'Backyard',
    status: 'recording',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '2560x1440',
    manufacturer: 'Arlo',
    model: 'VMC4041PB',
    firmwareVersion: '1.3.5',
    lastMotion: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    batteryLevel: 65,
    signalStrength: 78,
    capabilities: {
      ptz: false,
      nightVision: true,
      twoWayAudio: true,
      spotlight: true,
      recording: true,
      snapshot: true,
      motionDetection: true,
      audioDetection: true,
      colorNightVision: false,
    },
    settings: {
      motionSensitivity: 75,
      audioSensitivity: 3,
      recordingDuration: 20,
      nightVisionMode: 'auto',
      spotlightMode: 'auto',
      spotlightBrightness: 69,
      videoMode: 'wide', // 160° FOV
    },
    streamUrl: 'https://example.com/stream/backyard',
    thumbnailUrl: 'https://via.placeholder.com/640x360/34a853/ffffff?text=Backyard',
  },
  {
    id: 'arlo-pro4-driveway',
    name: 'Driveway Camera',
    type: 'outdoor',
    location: 'Driveway',
    status: 'idle',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '2560x1440',
    manufacturer: 'Arlo',
    model: 'VMC4041PB',
    firmwareVersion: '1.3.5',
    lastMotion: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    batteryLevel: 42,
    signalStrength: 85,
    capabilities: {
      ptz: false,
      nightVision: true,
      twoWayAudio: true,
      spotlight: true,
      recording: true,
      snapshot: true,
      motionDetection: true,
      audioDetection: true,
      colorNightVision: false,
    },
    settings: {
      motionSensitivity: 85,
      audioSensitivity: 4,
      recordingDuration: 30,
      nightVisionMode: 'auto',
      spotlightMode: 'motion',
      spotlightBrightness: 100,
      videoMode: 'standard', // 125° FOV
    },
    streamUrl: 'https://example.com/stream/driveway',
    thumbnailUrl: 'https://via.placeholder.com/640x360/fbbc04/ffffff?text=Driveway',
  },
  {
    id: 'arlo-pro5-garage',
    name: 'Garage Camera',
    type: 'outdoor',
    location: 'Garage',
    status: 'idle',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '3840x2160',
    manufacturer: 'Arlo',
    model: 'VMC5040',
    firmwareVersion: '2.1.3',
    lastMotion: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    batteryLevel: 91,
    signalStrength: 95,
    capabilities: {
      ptz: false,
      nightVision: true,
      twoWayAudio: true,
      spotlight: true,
      recording: true,
      snapshot: true,
      motionDetection: true,
      audioDetection: true,
      colorNightVision: true,
      smartTracking: true,
      autoZoom: true,
    },
    settings: {
      motionSensitivity: 80,
      audioSensitivity: 3,
      recordingDuration: 15,
      nightVisionMode: 'color',
      spotlightMode: 'auto',
      spotlightBrightness: 69,
      videoMode: 'wide', // 155° FOV
      smartTracking: true,
    },
    streamUrl: 'https://example.com/stream/garage',
    thumbnailUrl: 'https://via.placeholder.com/640x360/ea4335/ffffff?text=Garage+4K',
  },
  {
    id: 'arlo-essential-indoor',
    name: 'Living Room Camera',
    type: 'indoor',
    location: 'Living Room',
    status: 'idle',
    recordingEnabled: true,
    motionDetection: true,
    nightVision: true,
    resolution: '1920x1080',
    manufacturer: 'Arlo',
    model: 'VMC2040B',
    firmwareVersion: '1.5.2',
    lastMotion: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    batteryLevel: undefined, // Wired power
    signalStrength: 100,
    capabilities: {
      ptz: false,
      nightVision: true,
      twoWayAudio: true,
      spotlight: false,
      recording: true,
      snapshot: true,
      motionDetection: true,
      audioDetection: true,
      privacyShutter: true,
    },
    settings: {
      motionSensitivity: 50,
      audioSensitivity: 3,
      recordingDuration: 10,
      nightVisionMode: 'auto',
      privacyShutterEnabled: false,
    },
    streamUrl: 'https://example.com/stream/living-room',
    thumbnailUrl: 'https://via.placeholder.com/640x360/9c27b0/ffffff?text=Living+Room',
  },
]

/**
 * Mock Arlo recordings/events
 */
export const MOCK_ARLO_RECORDINGS = [
  {
    id: 'rec-001',
    cameraId: 'arlo-doorbell-001',
    type: 'doorbell',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    duration: 15,
    thumbnailUrl: 'https://via.placeholder.com/320x180/4a90e2/ffffff?text=Doorbell+Press',
    videoUrl: 'https://example.com/recording/rec-001.mp4',
  },
  {
    id: 'rec-002',
    cameraId: 'arlo-pro4-backyard',
    type: 'motion',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    duration: 20,
    thumbnailUrl: 'https://via.placeholder.com/320x180/34a853/ffffff?text=Motion',
    videoUrl: 'https://example.com/recording/rec-002.mp4',
  },
  {
    id: 'rec-003',
    cameraId: 'arlo-pro4-driveway',
    type: 'motion',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    duration: 30,
    thumbnailUrl: 'https://via.placeholder.com/320x180/fbbc04/ffffff?text=Car+Arrival',
    videoUrl: 'https://example.com/recording/rec-003.mp4',
  },
  {
    id: 'rec-004',
    cameraId: 'arlo-pro5-garage',
    type: 'audio',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    duration: 12,
    thumbnailUrl: 'https://via.placeholder.com/320x180/ea4335/ffffff?text=Audio+Detected',
    videoUrl: 'https://example.com/recording/rec-004.mp4',
  },
  {
    id: 'rec-005',
    cameraId: 'arlo-essential-indoor',
    type: 'motion',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    duration: 10,
    thumbnailUrl: 'https://via.placeholder.com/320x180/9c27b0/ffffff?text=Pet+Motion',
    videoUrl: 'https://example.com/recording/rec-005.mp4',
  },
]

/**
 * Base station information
 */
export const MOCK_ARLO_BASE_STATION = {
  id: 'vmb5000-001',
  name: 'Arlo Base Station',
  model: 'VMB5000',
  firmwareVersion: '1.15.2.1',
  status: 'online',
  connectedCameras: 4, // All except wired indoor
  signalStrength: 100,
  localStorage: true,
  storageUsed: 45, // GB
  storageTotal: 64, // GB
}
