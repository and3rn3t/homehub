/**
 * Security & Surveillance Type Definitions
 *
 * Camera management and security event tracking.
 */

export type CameraStatus = 'recording' | 'idle' | 'offline' | 'online'
export type SecurityEventType =
  | 'motion'
  | 'door'
  | 'window'
  | 'alarm'
  | 'camera_offline'
  | 'door-open'
  | 'camera-offline'
export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Camera {
  /** Unique identifier */
  id: string

  /** Display name */
  name: string

  /** Physical location */
  location: string

  /** Current operational status */
  status: CameraStatus

  /** Power/enabled state */
  enabled?: boolean

  /** Whether recording is active */
  recordingEnabled: boolean

  /** Motion detection feature toggle */
  motionDetection: boolean

  /** Night vision feature toggle */
  nightVision: boolean

  /** Timestamp of last motion event */
  lastMotion?: Date | string

  /** Battery level percentage (0-100) */
  batteryLevel?: number

  /** Live stream URL (future use) */
  streamUrl?: string

  /** Camera feed resolution */
  resolution?: string

  /** Field of view in degrees */
  fov?: number
}

export interface SecurityEvent {
  /** Unique identifier */
  id: string

  /** Event category */
  type: SecurityEventType

  /** Priority level */
  severity: SecurityEventSeverity

  /** Human-readable event description */
  message: string

  /** Physical location of event */
  location?: string

  /** When the event occurred */
  timestamp: Date | string

  /** Whether user has reviewed the event */
  acknowledged: boolean

  /** Optional reference to associated camera */
  cameraId?: string

  /** Optional snapshot/thumbnail URL */
  thumbnailUrl?: string
}

/**
 * Doorbell-specific event types
 */
export type DoorbellActionType = 'button_press' | 'motion_detected' | 'package_detected'
export type DoorbellResponseStatus = 'answered' | 'ignored' | 'missed' | 'quick_reply'

export interface DoorbellEvent {
  /** Unique identifier */
  id: string

  /** Doorbell camera ID */
  cameraId: string

  /** Type of doorbell event */
  actionType: DoorbellActionType

  /** When the event occurred */
  timestamp: Date | string

  /** Snapshot URL from doorbell camera */
  snapshotUrl?: string

  /** Video clip URL (if available) */
  videoUrl?: string

  /** How the event was handled */
  responseStatus: DoorbellResponseStatus

  /** When the event was responded to */
  respondedAt?: Date | string

  /** Optional visitor identification */
  visitorInfo?: {
    /** Known visitor name (from face recognition, future) */
    name?: string
    /** Delivery service detected (Amazon, FedEx, etc.) */
    deliveryService?: string
    /** Whether this is a repeat visitor */
    isRepeatVisitor?: boolean
  }

  /** Quick reply message sent (if applicable) */
  quickReplyMessage?: string

  /** Duration visitor waited (in seconds) */
  waitDuration?: number

  /** Whether user was notified */
  notificationSent: boolean

  /** Whether user has viewed this event */
  viewed: boolean
}

/**
 * Doorbell settings and preferences
 */
export interface DoorbellSettings {
  /** Enable/disable doorbell chime sound */
  chimeEnabled: boolean

  /** Chime volume (0-100) */
  chimeVolume: number

  /** Enable push notifications */
  notificationsEnabled: boolean

  /** Enable motion detection alerts */
  motionAlertsEnabled: boolean

  /** Motion detection sensitivity (0-100) */
  motionSensitivity: number

  /** Quick reply messages */
  quickReplyMessages: string[]

  /** Auto-respond with quick reply after X seconds */
  autoReplyAfter?: number

  /** Do not disturb schedule */
  doNotDisturb?: {
    enabled: boolean
    startTime: string // "HH:MM"
    endTime: string // "HH:MM"
  }
}
