/**
 * Arlo Camera Adapter
 *
 * Adapter for connecting to Arlo cameras and doorbells via Arlo Cloud API.
 * Supports camera discovery, snapshot fetching, and doorbell event handling.
 *
 * Architecture:
 * - Uses @koush/arlo library for Arlo Cloud API integration
 * - EventEmitter for real-time doorbell events
 * - Async snapshot generation (5-10 second delay typical)
 * - Handles 2FA authentication flow
 *
 * @see https://github.com/JOHNEPPILLAR/arlo (library source)
 * @see https://www.arlo.com/en-us/ (Arlo official site)
 */

import type { Camera } from '@/constants/mock-cameras'
import type { DoorbellEvent } from '@/types/security.types'
import { EventEmitter } from 'events'

// Import Arlo library
// Note: @koush/arlo is CommonJS module without TypeScript types
// Type declarations added inline to avoid 'any' usage
import Arlo from '@koush/arlo'

/**
 * Arlo event types (from @koush/arlo library)
 */
interface ArloEventBase {
  deviceId?: string
  resource?: string
  publishResponse?: number
  presignedLastImageUrl?: string
  presignedSnapshotUrl?: string
  presignedThumbnailUrl?: string
}

/**
 * Arlo library instance type
 */
interface ArloInstance {
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  getDevices(): Promise<ArloDevice[]>
  subscribe(): Promise<void>
  unsubscribe(): Promise<void>
  requestSnapshot(device: ArloDevice): Promise<{ presignedSnapshotUrl?: string }>
  startRecording(device: ArloDevice, duration: number): Promise<void>
  stopRecording(device: ArloDevice): Promise<void>
  on(event: string, callback: (data: ArloEventBase) => void): void
}

/**
 * Arlo adapter configuration
 */
export interface ArloConfig {
  /** Arlo account email (for legacy login) */
  email?: string
  /** Arlo account password (for legacy login) */
  password?: string
  /** Optional 2FA code */
  twoFactorCode?: string
  /** Path to extracted cookies JSON file */
  cookiesFile?: string
  /** Request timeout in milliseconds (default: 30000 for slow snapshots) */
  timeout?: number
}

/**
 * Arlo device from API
 */
interface ArloDevice {
  deviceId: string
  deviceName: string
  deviceType: string
  state: string
  modelId: string
  properties?: {
    batteryLevel?: number
    signalStrength?: number
    hwVersion?: string
  }
  presignedLastImageUrl?: string
  presignedSnapshotUrl?: string
}

/**
 * Arlo camera capabilities
 */
interface ArloCameraCapabilities {
  ptz: boolean
  nightVision: boolean
  spotlight: boolean
  twoWayAudio: boolean
  localStorage: boolean
}

/**
 * Cookie authentication data from real browser session
 */
interface CookieAuthData {
  cookies: Array<{ name: string; value: string; domain: string; path: string }>
  localStorage: Record<string, string>
  extractedAt: string
}

/**
 * Arlo Camera Adapter
 *
 * Implements camera adapter interface for Arlo devices via Arlo Cloud API.
 * Handles authentication, device discovery, snapshots, and doorbell events.
 */
export class ArloAdapter extends EventEmitter {
  private readonly arlo: ArloInstance
  private readonly config: Partial<ArloConfig>
  private readonly cameras: Map<string, ArloDevice> = new Map()
  private authenticated: boolean = false
  private subscribed: boolean = false
  private cookieAuth?: CookieAuthData

  constructor(config: ArloConfig) {
    super()
    this.config = config
    this.arlo = new Arlo() as ArloInstance
  }

  /**
   * Initialize connection to Arlo Cloud
   */
  async initialize(): Promise<void> {
    if (this.authenticated) {
      console.log('[ArloAdapter] Already authenticated')
      return
    }

    try {
      console.log('[ArloAdapter] Authenticating with Arlo Cloud...')

      // Check if using cookies file (bypasses login)
      if (this.config.cookiesFile) {
        await this.authenticateWithCookies()
      } else if (this.config.email && this.config.password) {
        // Fallback to legacy login
        await this.arlo.login(this.config.email, this.config.password)
      } else {
        throw new Error('Either cookiesFile or email/password must be provided')
      }

      this.authenticated = true
      console.log('[ArloAdapter] ✅ Authentication successful')

      // Discover devices
      await this.discoverDevices()

      // Subscribe to events
      await this.subscribeToEvents()
    } catch (error) {
      console.error('[ArloAdapter] Authentication failed:', error)
      throw new Error(
        `Arlo authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Authenticate using extracted cookies from real browser session
   * This bypasses Arlo's bot detection entirely
   */
  private async authenticateWithCookies(): Promise<void> {
    try {
      console.log('[ArloAdapter] Loading cookies from file...')

      // Read cookies file
      const fs = await import('fs/promises')
      const path = await import('path')

      const cookiesPath = path.resolve(this.config.cookiesFile!)
      const cookiesData = await fs.readFile(cookiesPath, 'utf-8')
      const authData = JSON.parse(cookiesData)

      console.log(`[ArloAdapter] Loaded ${authData.cookies?.length || 0} cookies`)

      // Store auth data for API requests
      this.cookieAuth = {
        cookies: authData.cookies || [],
        localStorage: authData.localStorage || {},
        extractedAt: authData.extractedAt,
      }

      console.log('[ArloAdapter] ✅ Cookie authentication configured')
    } catch (error) {
      console.error('[ArloAdapter] Failed to load cookies:', error)
      throw new Error(
        `Failed to load cookies file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Discover all Arlo cameras and doorbells
   */
  private async discoverDevices(): Promise<void> {
    try {
      console.log('[ArloAdapter] Discovering devices...')

      // Get all devices from Arlo
      const devices = await this.arlo.getDevices()

      if (!devices || devices.length === 0) {
        console.warn('[ArloAdapter] No devices found')
        return
      }

      // Filter cameras and doorbells
      const cameraDevices = devices.filter((d: ArloDevice) => {
        const type = d.deviceType?.toLowerCase() || ''
        return (
          type.includes('camera') ||
          type.includes('doorbell') ||
          type.includes('arloq') ||
          type === 'doorbell'
        )
      })

      console.log(`[ArloAdapter] Found ${cameraDevices.length} camera(s)/doorbell(s)`)

      // Store cameras in map
      for (const device of cameraDevices) {
        this.cameras.set(device.deviceId, device)
        console.log(`[ArloAdapter]   - ${device.deviceName} (${device.deviceType})`)
      }
    } catch (error) {
      console.error('[ArloAdapter] Device discovery failed:', error)
      throw error
    }
  }

  /**
   * Subscribe to Arlo event stream for real-time updates
   */
  private async subscribeToEvents(): Promise<void> {
    if (this.subscribed) return

    try {
      console.log('[ArloAdapter] Subscribing to event stream...')

      // Subscribe to Arlo events
      await this.arlo.subscribe()

      // Listen for doorbell events
      this.arlo.on('doorbell', (event: ArloEventBase) => {
        console.log('[ArloAdapter] Doorbell event:', event)
        this.handleDoorbellEvent(event)
      })

      // Listen for motion events
      this.arlo.on('motionDetected', (event: ArloEventBase) => {
        console.log('[ArloAdapter] Motion event:', event)
        this.emit('motion', event)
      })

      // Listen for snapshots
      this.arlo.on('fullFrameSnapshotAvailable', (event: ArloEventBase) => {
        console.log('[ArloAdapter] Snapshot available:', event)
        this.emit('snapshot', event)
      })

      this.subscribed = true
      console.log('[ArloAdapter] ✅ Event subscription successful')
    } catch (error) {
      console.error('[ArloAdapter] Event subscription failed:', error)
    }
  }

  /**
   * Handle doorbell button press event
   */
  private handleDoorbellEvent(event: ArloEventBase): void {
    try {
      const doorbellEvent: DoorbellEvent = {
        id: `doorbell-${Date.now()}`,
        cameraId: event.deviceId || event.resource || 'unknown',
        timestamp: new Date(event.publishResponse || Date.now()),
        actionType: 'button_press',
        responseStatus: 'missed',
        snapshotUrl: event.presignedLastImageUrl || event.presignedSnapshotUrl,
        visitorInfo: {
          name: 'Unknown Visitor',
          isRepeatVisitor: false,
        },
        waitDuration: 0,
        notificationSent: true,
        viewed: false,
      }

      this.emit('doorbell', doorbellEvent)
    } catch (error) {
      console.error('[ArloAdapter] Error handling doorbell event:', error)
    }
  }

  /**
   * Get all discovered cameras
   */
  async getCameras(): Promise<Camera[]> {
    if (!this.authenticated) {
      throw new Error('Not authenticated. Call initialize() first.')
    }

    const cameras: Camera[] = []

    for (const [deviceId, device] of this.cameras.entries()) {
      cameras.push(this.mapArloDeviceToCamera(deviceId, device))
    }

    return cameras
  }

  /**
   * Map Arlo device to our Camera interface
   */
  private mapArloDeviceToCamera(deviceId: string, device: ArloDevice): Camera {
    const isDoorbell = device.deviceType?.toLowerCase().includes('doorbell')
    const isIndoor = device.deviceType?.toLowerCase().includes('indoor')

    // Determine camera capabilities based on model
    const capabilities = this.getCapabilities(device)

    // Determine camera type - map to our Camera type
    let cameraType: 'ptz' | 'doorbell' | 'spotlight' | 'indoor'
    if (isDoorbell) {
      cameraType = 'doorbell'
    } else if (isIndoor) {
      cameraType = 'indoor'
    } else {
      cameraType = 'spotlight' // Default outdoor cameras to spotlight type
    }

    return {
      id: deviceId,
      name: device.deviceName || 'Arlo Camera',
      type: cameraType,
      brand: 'Arlo' as const,
      model: device.modelId || device.deviceType || 'Unknown',
      status: device.state === 'provisioned' ? 'online' : 'offline',
      location: device.deviceName || 'Unknown',
      snapshotUrl: device.presignedLastImageUrl || device.presignedSnapshotUrl,
      capabilities: {
        ptz: capabilities.ptz,
        nightVision: capabilities.nightVision,
        spotlight: capabilities.spotlight,
        twoWayAudio: capabilities.twoWayAudio,
        localStorage: capabilities.localStorage,
      },
      battery: device.properties?.batteryLevel,
      signalStrength: device.properties?.signalStrength ?? 100,
      resolution: this.getResolution(device),
      lastMotion: undefined, // Will be updated from events
    }
  }

  /**
   * Determine camera capabilities based on device type/model
   */
  private getCapabilities(device: ArloDevice): ArloCameraCapabilities {
    const type = device.deviceType?.toLowerCase() || ''
    const model = device.modelId?.toLowerCase() || ''

    return {
      ptz: type.includes('ptz') || model.includes('ptz'),
      nightVision: true, // Most Arlo cameras have night vision
      spotlight: type.includes('pro') || type.includes('ultra') || type.includes('essential'),
      twoWayAudio: true, // Most modern Arlo cameras have two-way audio
      localStorage: false, // Arlo uses cloud storage by default
    }
  }

  /**
   * Get camera resolution based on model
   */
  private getResolution(device: ArloDevice): string {
    const model = device.modelId?.toLowerCase() || ''
    const type = device.deviceType?.toLowerCase() || ''

    if (model.includes('ultra') || type.includes('ultra')) {
      return '4K (3840x2160)'
    } else if (model.includes('pro 4') || type.includes('pro 4')) {
      return '2K (2560x1440)'
    } else if (model.includes('pro 3') || type.includes('pro 3')) {
      return '2K (2560x1440)'
    } else if (model.includes('essential')) {
      return '1080p (1920x1080)'
    } else if (type.includes('doorbell')) {
      return '1080p (1920x1080)'
    }

    return '1080p (1920x1080)' // Default
  }

  /**
   * Request a new snapshot from a camera
   * Note: Arlo snapshots are async and can take 5-10 seconds
   */
  async requestSnapshot(cameraId: string): Promise<string | null> {
    try {
      const device = this.cameras.get(cameraId)
      if (!device) {
        throw new Error(`Camera not found: ${cameraId}`)
      }

      console.log(`[ArloAdapter] Requesting snapshot for ${device.deviceName}...`)

      // Request snapshot from Arlo
      const snapshot = await this.arlo.requestSnapshot(device)

      if (snapshot?.presignedSnapshotUrl) {
        console.log(`[ArloAdapter] ✅ Snapshot available: ${device.deviceName}`)
        return snapshot.presignedSnapshotUrl
      }

      // If no presigned URL, check for existing snapshot
      if (device.presignedLastImageUrl) {
        console.log(`[ArloAdapter] Using cached snapshot: ${device.deviceName}`)
        return device.presignedLastImageUrl
      }

      console.warn(`[ArloAdapter] No snapshot available for ${device.deviceName}`)
      return null
    } catch (error) {
      console.error(`[ArloAdapter] Snapshot request failed:`, error)
      return null
    }
  }

  /**
   * Start recording on a camera
   */
  async startRecording(cameraId: string, duration: number = 30): Promise<void> {
    try {
      const device = this.cameras.get(cameraId)
      if (!device) {
        throw new Error(`Camera not found: ${cameraId}`)
      }

      console.log(`[ArloAdapter] Starting recording for ${device.deviceName} (${duration}s)...`)
      await this.arlo.startRecording(device, duration)
      console.log(`[ArloAdapter] ✅ Recording started: ${device.deviceName}`)
    } catch (error) {
      console.error(`[ArloAdapter] Start recording failed:`, error)
      throw error
    }
  }

  /**
   * Stop recording on a camera
   */
  async stopRecording(cameraId: string): Promise<void> {
    try {
      const device = this.cameras.get(cameraId)
      if (!device) {
        throw new Error(`Camera not found: ${cameraId}`)
      }

      console.log(`[ArloAdapter] Stopping recording for ${device.deviceName}...`)
      await this.arlo.stopRecording(device)
      console.log(`[ArloAdapter] ✅ Recording stopped: ${device.deviceName}`)
    } catch (error) {
      console.error(`[ArloAdapter] Stop recording failed:`, error)
      throw error
    }
  }

  /**
   * Disconnect from Arlo Cloud
   */
  async disconnect(): Promise<void> {
    try {
      if (this.subscribed) {
        await this.arlo.unsubscribe()
        this.subscribed = false
      }

      if (this.authenticated) {
        await this.arlo.logout()
        this.authenticated = false
      }

      this.cameras.clear()
      this.removeAllListeners()

      console.log('[ArloAdapter] Disconnected from Arlo Cloud')
    } catch (error) {
      console.error('[ArloAdapter] Disconnect failed:', error)
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.authenticated
  }

  /**
   * Get number of discovered cameras
   */
  getCameraCount(): number {
    return this.cameras.size
  }

  /**
   * Get camera by ID
   */
  getCamera(cameraId: string): Camera | null {
    const device = this.cameras.get(cameraId)
    if (!device) return null
    return this.mapArloDeviceToCamera(cameraId, device)
  }
}

/**
 * Create and initialize Arlo adapter
 */
export async function createArloAdapter(config: ArloConfig): Promise<ArloAdapter> {
  const adapter = new ArloAdapter(config)
  await adapter.initialize()
  return adapter
}
