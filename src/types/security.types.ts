/**
 * Security & Surveillance Type Definitions
 * 
 * Camera management and security event tracking.
 */

export type CameraStatus = 'recording' | 'idle' | 'offline'
export type SecurityEventType = 'motion' | 'door-open' | 'alarm' | 'camera-offline'
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
  
  /** Whether recording is active */
  recordingEnabled: boolean
  
  /** Motion detection feature toggle */
  motionDetection: boolean
  
  /** Night vision feature toggle */
  nightVision: boolean
  
  /** Timestamp of last motion event */
  lastMotion?: Date
  
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
  
  /** When the event occurred */
  timestamp: Date
  
  /** Whether user has reviewed the event */
  acknowledged: boolean
  
  /** Optional reference to associated camera */
  cameraId?: string
  
  /** Optional snapshot/thumbnail URL */
  thumbnailUrl?: string
}
