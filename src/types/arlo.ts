/**
 * Arlo API Type Definitions
 * Based on reverse-engineered API responses
 * Last updated: October 13, 2025
 */

/**
 * Arlo Device from /hmsweb/users/devices API
 */
export interface ArloDevice {
  /** Unique device identifier */
  deviceId: string

  /** User-friendly device name */
  deviceName: string

  /** Device type (camera, doorbell, basestation, chime, etc.) */
  deviceType: 'camera' | 'doorbell' | 'basestation' | 'chime' | 'arloq' | 'arloqs' | 'lights'

  /** Device model identifier */
  modelId: string

  /** Device state (provisioned = active, removed = inactive) */
  state: 'provisioned' | 'removed'

  /** Unique identifier combining userId and deviceId */
  uniqueId: string

  /** User ID who owns this device */
  userId: string

  /** Parent device ID (for cameras connected to hub) */
  parentId?: string

  /** User role for this device */
  userRole?: string

  /** Last modified timestamp */
  lastModified?: number

  /** Device-specific properties */
  properties?: ArloDeviceProperties

  /** XMPP resource */
  xCloudId?: string

  /** Media object ID */
  mediaObjectId?: string

  /** Owner information */
  owner?: {
    firstName: string
    lastName: string
    ownerId: string
  }
}

/**
 * Device properties (varies by device type)
 */
export interface ArloDeviceProperties {
  /** Model ID */
  modelId?: string

  /** Hardware version */
  hwVersion?: string

  /** Firmware version */
  swVersion?: string

  /** Battery level (0-100) */
  batteryLevel?: number

  /** Signal strength (0-100) */
  signalStrength?: number

  /** Connection state */
  connectionState?: 'available' | 'unavailable'

  /** Battery tech type */
  batteryTech?: string

  /** Charging state */
  chargingState?: 'off' | 'on'

  /** Arlo Smart features */
  arloSmartFeatures?: string[]

  /** Capabilities */
  capabilities?: string[]

  /** Display order */
  displayOrder?: number

  /** Certifications */
  certifications?: {
    [key: string]: string
  }
}

/**
 * API Response wrapper
 */
export interface ArloApiResponse<T = unknown> {
  /** Success flag */
  success: boolean

  /** Response data */
  data: T

  /** Error information (if success = false) */
  error?: {
    code: string
    message: string
    reason?: string
    errors?: string[]
  }
}

/**
 * Device list response
 */
export type ArloDeviceListResponse = ArloApiResponse<ArloDevice[]>

/**
 * SIP Info for streaming (from /hmsweb/users/devices/sipInfo/v2)
 */
export interface ArloSipInfo {
  from: string
  to: string
  action: string
  resource: string
  transId: string
  sipCallInfo: {
    id: string
    calleeUri: string
    domain: string
    port: number
    conferenceId: string | null
    password: string
    deviceId: string
  }
  iceServers: {
    uSessionId: string
    data: ArloIceServer[]
  }
}

/**
 * ICE Server for WebRTC streaming
 */
export interface ArloIceServer {
  /** Server type (stun or turn) */
  type: 'stun' | 'turn'

  /** Server domain */
  domain: string

  /** Server port */
  port: string

  /** Transport protocol (for TURN servers) */
  transport?: 'tcp' | 'udp'

  /** Username (for TURN servers) */
  username?: string

  /** Credential (for TURN servers) */
  credential?: string
}

/**
 * Authentication headers for Arlo API
 */
export interface ArloAuthHeaders {
  /** Accept header */
  accept: string

  /** Accept-Language header */
  'accept-language': string

  /** Auth version (always "2") */
  'auth-version': string

  /** Authorization bearer token */
  authorization: string

  /** Content-Type header */
  'content-type': string

  /** Origin header */
  origin: string

  /** Referer header */
  referer: string

  /** User-Agent header */
  'user-agent': string

  /** X-Cloud-ID header */
  xcloudid: string

  /** Camera ID (for device-specific endpoints) */
  cameraid?: string
}

/**
 * Arlo API Configuration
 */
export interface ArloConfig {
  /** Base API URL */
  baseUrl: string

  /** Authentication headers */
  headers: ArloAuthHeaders

  /** Request timeout (ms) */
  timeout?: number
}

/**
 * Device type mapping from Arlo to HomeHub
 */
export const ARLO_DEVICE_TYPE_MAP: Record<string, 'security' | 'camera' | 'sensor'> = {
  camera: 'camera',
  doorbell: 'security',
  basestation: 'sensor', // Hub treated as sensor
  chime: 'sensor',
  arloq: 'camera',
  arloqs: 'camera',
  lights: 'sensor',
}

/**
 * Device state mapping from Arlo to HomeHub
 */
export const ARLO_STATE_MAP: Record<string, 'online' | 'offline' | 'warning' | 'error'> = {
  provisioned: 'online',
  removed: 'offline',
}
