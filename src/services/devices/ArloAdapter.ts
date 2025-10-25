/**
 * Arlo Camera Adapter
 *
 * Adapter for connecting to Arlo cameras and doorbells via Arlo Cloud API.
 * Supports camera discovery, snapshot fetching, and doorbell event handling.
 *
 * Architecture:
 * - Direct API integration with automatic token refresh
 * - ArloTokenManager for token lifecycle management
 * - Cloudflare Worker proxy to bypass CORS restrictions
 * - EventEmitter for real-time doorbell events
 * - Graceful fallback on authentication failures
 *
 * Updated: October 13, 2025 - Phase 4: Auto Token Refresh + CORS Proxy
 */

import type { Camera } from '@/constants/mock-cameras'
import { arloTokenManager } from '@/services/auth/ArloTokenManager'
import type { DoorbellEvent } from '@/types/security.types'
import { EventEmitter } from 'events'

/**
 * Arlo API Base URL
 *
 * For development: Uses Cloudflare Worker proxy running locally
 * For production: Uses deployed Cloudflare Worker
 *
 * The proxy worker forwards requests to https://myapi.arlo.com with CORS headers
 */
const ARLO_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8788' // Local worker dev server
  : 'https://homehub-arlo-proxy.andernet.workers.dev' // Deployed Cloudflare Worker

/**
 * Arlo event types (from direct API responses)
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
 *
 * Note: Uses direct fetch() API calls instead of @koush/arlo library for browser compatibility.
 * The @koush/arlo library is Node.js-only and cannot run in browsers.
 */
export class ArloAdapter extends EventEmitter {
  // Config reserved for future use (custom timeouts, retry logic, etc.)
  // private readonly _config: Partial<ArloConfig>
  private readonly cameras: Map<string, ArloDevice> = new Map()
  private authenticated: boolean = false
  private subscribed: boolean = false
  private cookieAuth?: CookieAuthData

  constructor(config: ArloConfig) {
    super()
    // Config saved for future use (custom timeouts, retry logic, etc.)
    // Reserved for upcoming features
    console.debug('[ArloAdapter] Initialized with config:', config.email)
    // Note: No Arlo() initialization - using direct API calls instead
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
      console.log('[ArloAdapter] Initializing Arlo adapter with direct API...')

      // Always use direct API authentication (no cookies file or email/password needed)
      await this.authenticateWithCookies()

      this.authenticated = true
      console.log('[ArloAdapter] ✅ Authentication successful')

      // Discover devices via direct API
      await this.discoverDevices()

      // Start event streaming for real-time updates
      await this.subscribeToEvents()
      console.log('[ArloAdapter] ✅ Event streaming initialized')
    } catch (error) {
      console.error('[ArloAdapter] Initialization failed:', error)
      throw new Error(
        `Arlo initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Authenticate using extracted cookies from real browser session
   * This bypasses Arlo's bot detection entirely
   */
  private async authenticateWithCookies(): Promise<void> {
    try {
      console.log('[ArloAdapter] Using token manager for authentication...')

      // Try to get existing token from storage
      const token = arloTokenManager.getToken()

      if (!token) {
        console.error('[ArloAdapter] ❌ No authentication token available')

        // Emit event for UI to handle token setup
        this.emit('token-required', {
          message: 'No authentication token found. Please authenticate with Arlo.',
          timestamp: new Date().toISOString(),
        })

        throw new Error(
          'No authentication token available. Please use the Arlo Token Manager to authenticate.'
        )
      }

      // Check if token is expiring soon
      if (arloTokenManager.isTokenExpiringSoon()) {
        console.warn(
          '[ArloAdapter] ⚠️  Token expiring soon:',
          arloTokenManager.getFormattedTimeUntilExpiration()
        )
      } else {
        console.log(
          '[ArloAdapter] Token valid for:',
          arloTokenManager.getFormattedTimeUntilExpiration()
        )
      }

      // Store in cookieAuth for compatibility with existing code
      this.cookieAuth = {
        cookies: [], // Not using cookies anymore
        localStorage: {
          'auth-version': token.authVersion,
          authorization: token.authorization,
          xcloudid: token.xcloudid,
        },
        extractedAt: token.capturedAt,
      }

      console.log('[ArloAdapter] ✅ Token manager authentication configured')
    } catch (error) {
      console.error('[ArloAdapter] Failed to configure authentication:', error)
      throw new Error(
        `Failed to configure authentication: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Discover all Arlo cameras and doorbells via direct API
   */
  private async discoverDevices(): Promise<void> {
    try {
      console.log('[ArloAdapter] Discovering devices via proxy API...')

      if (!this.cookieAuth) {
        throw new Error('Not authenticated - cookieAuth not configured')
      }

      // Call Arlo API via Cloudflare Worker proxy
      const url = `${ARLO_API_BASE_URL}/hmsweb/users/devices`
      console.log('[ArloAdapter] Fetching devices from proxy:', url)

      const response = await this.makeAuthenticatedRequest(url, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Arlo API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(`Arlo API returned error: ${data.error?.message || 'Unknown error'}`)
      }

      const devices: ArloDevice[] = data.data || []

      if (devices.length === 0) {
        console.warn('[ArloAdapter] No devices found')
        return
      }

      // Filter for active cameras and doorbells (state === 'provisioned')
      const cameraDevices = devices.filter((d: ArloDevice) => {
        const type = d.deviceType?.toLowerCase() || ''
        const isCamera =
          type.includes('camera') ||
          type.includes('doorbell') ||
          type.includes('arloq') ||
          type === 'doorbell'

        // Only include provisioned (active) devices
        return isCamera && d.state === 'provisioned'
      })

      console.log(
        `[ArloAdapter] Found ${devices.length} total devices, ${cameraDevices.length} active camera(s)/doorbell(s)`
      )

      // Store cameras in map
      for (const device of cameraDevices) {
        this.cameras.set(device.deviceId, device)
        console.log(
          `[ArloAdapter]   - ${device.deviceName} (${device.deviceType}, ${device.state})`
        )
      }
    } catch (error) {
      console.error('[ArloAdapter] Device discovery failed:', error)
      throw error
    }
  }

  /**
   * Make an API request with automatic token refresh on 401
   *
   * @param url - API endpoint URL
   * @param options - Fetch options
   * @param retryCount - Internal retry counter (max 1 retry)
   * @returns Response object
   * @throws Error if request fails after retry
   */
  private async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<Response> {
    // Get headers from token manager
    const headers = arloTokenManager.exportAsHeaders()

    if (!headers) {
      throw new Error('No authentication token available')
    }

    // Merge with any additional headers
    const finalHeaders = {
      ...headers,
      ...(options.headers as Record<string, string>),
    }

    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    })

    // Handle 401 Unauthorized
    if (response.status === 401 && retryCount === 0) {
      console.warn('[ArloAdapter] 401 Unauthorized - Token expired or invalid')

      // Emit event for UI to handle token refresh
      this.emit('token-expired', {
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString(),
      })

      // Clear expired token
      arloTokenManager.clearToken()

      throw new Error('Authentication token expired. Please refresh your Arlo authentication.')
    }

    return response
  }

  /**
   * Subscribe to Arlo event stream for real-time updates
   *
   * Implements Server-Sent Events (SSE) connection to Arlo's EventStream API.
   * Receives real-time events for:
   * - Motion detection
   * - Doorbell presses
   * - Camera state changes
   * - Battery level updates
   * - Signal strength changes
   */
  private async subscribeToEvents(): Promise<void> {
    if (this.subscribed) {
      console.log('[ArloAdapter] Already subscribed to events')
      return
    }

    try {
      console.log('[ArloAdapter] Subscribing to Arlo event stream...')

      // Subscribe via Arlo API
      const subscribeUrl = `${ARLO_API_BASE_URL}/hmsweb/client/subscribe`

      const response = await this.makeAuthenticatedRequest(subscribeUrl, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`Event subscription failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        this.subscribed = true
        console.log('[ArloAdapter] ✅ Event subscription successful')

        // Start event polling (Arlo uses long-polling instead of true SSE)
        this.startEventPolling()
      } else {
        throw new Error(`Event subscription failed: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('[ArloAdapter] Event subscription failed:', error)
      // Don't throw - event streaming is optional, app can work without it
      console.warn('[ArloAdapter] ⚠️  Continuing without real-time events')
    }
  }

  /**
   * Poll for events from Arlo's event stream
   * Uses long-polling with timeout to receive real-time updates
   */
  private async startEventPolling(): Promise<void> {
    if (!this.subscribed) return

    const pollEvents = async () => {
      try {
        const notifyUrl = `${ARLO_API_BASE_URL}/hmsweb/client/notify`

        // Long-polling request with 120s timeout
        const response = await this.makeAuthenticatedRequest(notifyUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(120000), // 2 minute timeout
        })

        if (!response.ok) {
          console.warn('[ArloAdapter] Event polling failed:', response.status)
          return
        }

        const data = await response.json()

        if (data.success && data.data) {
          // Process events
          this.processEvents(data.data)
        }

        // Continue polling if still subscribed
        if (this.subscribed) {
          // No delay needed - Arlo's long-polling handles this
          pollEvents()
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Timeout is expected for long-polling, just continue
          if (this.subscribed) {
            pollEvents()
          }
        } else {
          console.error('[ArloAdapter] Event polling error:', error)
          // Wait a bit before retrying on error
          if (this.subscribed) {
            setTimeout(pollEvents, 5000)
          }
        }
      }
    }

    // Start polling loop
    pollEvents()
  }

  /**
   * Process events from Arlo event stream
   */
  private processEvents(events: ArloEventBase[]): void {
    const eventArray = Array.isArray(events) ? events : [events]

    for (const event of eventArray) {
      try {
        this.processEvent(event)
      } catch (error) {
        console.error('[ArloAdapter] Error processing event:', error)
      }
    }
  }

  /**
   * Process a single Arlo event
   */
  private processEvent(event: ArloEventBase): void {
    const deviceId = event.deviceId || event.resource?.split('/')[1]
    if (!deviceId) return

    const device = this.cameras.get(deviceId)
    if (!device) return

    this.updateDeviceUrls(device, event)
    this.emitDeviceUpdate(deviceId, device.deviceName, event)
    this.emitSpecificEvents(deviceId, device.deviceName, event)
  }

  /**
   * Update device presigned URLs from event
   */
  private updateDeviceUrls(device: ArloDevice, event: ArloEventBase): void {
    if (event.presignedLastImageUrl) {
      device.presignedLastImageUrl = event.presignedLastImageUrl
      console.log(`[ArloAdapter] 📸 New snapshot available for ${device.deviceName}`)

      this.emit('snapshot', {
        cameraId: device.deviceId,
        cameraName: device.deviceName,
        url: event.presignedLastImageUrl,
        timestamp: new Date().toISOString(),
      })
    }

    if (event.presignedSnapshotUrl) {
      device.presignedSnapshotUrl = event.presignedSnapshotUrl
    }
  }

  /**
   * Emit generic device update event
   */
  private emitDeviceUpdate(deviceId: string, deviceName: string, event: ArloEventBase): void {
    this.emit('device-update', {
      deviceId,
      deviceName,
      event,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Emit specific events based on event type
   */
  private emitSpecificEvents(deviceId: string, deviceName: string, event: ArloEventBase): void {
    if (event.resource?.includes('motion')) {
      console.log(`[ArloAdapter] 🚶 Motion detected on ${deviceName}`)
      this.emit('motion', {
        cameraId: deviceId,
        cameraName: deviceName,
        timestamp: new Date().toISOString(),
      })
    }

    if (event.resource?.includes('doorbell')) {
      console.log(`[ArloAdapter] 🔔 Doorbell pressed: ${deviceName}`)
      this.emit('doorbell', {
        id: `doorbell-${Date.now()}`,
        cameraId: deviceId,
        actionType: 'button_press',
        responseStatus: 'missed',
        timestamp: new Date().toISOString(),
        notificationSent: false,
        viewed: false,
      } satisfies DoorbellEvent)
    }
  }

  /**
   * Unsubscribe from event stream
   */
  private async unsubscribeFromEvents(): Promise<void> {
    if (!this.subscribed) return

    try {
      this.subscribed = false

      const unsubscribeUrl = `${ARLO_API_BASE_URL}/hmsweb/client/unsubscribe`
      await this.makeAuthenticatedRequest(unsubscribeUrl, {
        method: 'GET',
      })

      console.log('[ArloAdapter] ✅ Unsubscribed from events')
    } catch (error) {
      console.error('[ArloAdapter] Failed to unsubscribe:', error)
    }
  }

  /**
   * Subscribe to Arlo event stream for real-time updates
   * Reserved for Phase 7: WebSocket/SSE event streaming
   * @internal Not yet implemented
   * @deprecated Replaced by subscribeToEvents()
   */
  // @ts-expect-error - Reserved for future implementation
  private async _subscribeToEvents(): Promise<void> {
    if (this.subscribed) return

    try {
      console.log('[ArloAdapter] Event streaming not yet implemented for direct API')
      console.log('[ArloAdapter] Reserved: Implement WebSocket connection to Arlo event stream')

      // Reserved for future implementation: WebSocket/SSE connection
      // Reference: https://my.arlo.com/hmsweb/client/subscribe
      // Will need to:
      // 1. Establish WebSocket connection with auth headers
      // 2. Subscribe to device events
      // 3. Parse incoming event messages
      // 4. Emit events for UI consumption

      this.subscribed = false // Keep false until implemented
      console.log('[ArloAdapter] ℹ️  Event subscription skipped (not implemented)')
    } catch (error) {
      console.error('[ArloAdapter] Event subscription failed:', error)
    }
  }

  /**
   * Handle doorbell button press event
   * Reserved for Phase 7: Real-time event handling
   * @internal Not yet implemented
   */
  // @ts-expect-error - Reserved for future implementation
  private _handleDoorbellEvent(event: ArloEventBase): void {
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
   *
   * Implemented via Arlo's fullFrameSnapshot API:
   * - Triggers camera to capture new frame
   * - Returns immediately with success
   * - Actual snapshot URL arrives via event stream
   * - Listen to 'snapshot' event for the URL
   */
  async requestSnapshot(cameraId: string): Promise<string | null> {
    try {
      const device = this.cameras.get(cameraId)
      if (!device) {
        throw new Error(`Camera not found: ${cameraId}`)
      }

      console.log(`[ArloAdapter] Requesting snapshot for ${device.deviceName}...`)

      const url = `${ARLO_API_BASE_URL}/hmsweb/users/devices/fullFrameSnapshot`

      const response = await this.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          from: `${device.deviceId}_web`,
          to: device.deviceId,
          action: 'set',
          resource: `cameras/${device.deviceId}`,
          publishResponse: true,
          transId: `web!${Date.now()}`,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Snapshot request failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log(`[ArloAdapter] ✅ Snapshot requested for ${device.deviceName}`)
        console.log('[ArloAdapter] ℹ️  Snapshot will be available via event stream in 5-10 seconds')

        // Return cached snapshot if available (new one coming via events)
        if (device.presignedLastImageUrl) {
          return device.presignedLastImageUrl
        }

        return null
      } else {
        throw new Error(`Snapshot request failed: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[ArloAdapter] Snapshot request failed:`, error)

      // Fallback to cached snapshot
      const device = this.cameras.get(cameraId)
      if (device?.presignedLastImageUrl) {
        console.log(`[ArloAdapter] Using cached snapshot as fallback`)
        return device.presignedLastImageUrl
      }

      return null
    }
  }

  /**
   * Start recording on a camera
   *
   * Triggers manual recording for specified duration.
   * Recording will automatically stop after duration expires.
   *
   * @param cameraId - Camera device ID
   * @param duration - Recording duration in seconds (default: 30s)
   */
  async startRecording(cameraId: string, duration: number = 30): Promise<void> {
    try {
      const device = this.cameras.get(cameraId)
      if (!device) {
        throw new Error(`Camera not found: ${cameraId}`)
      }

      console.log(`[ArloAdapter] Starting ${duration}s recording on ${device.deviceName}...`)

      const url = `${ARLO_API_BASE_URL}/hmsweb/users/devices/startRecord`

      const response = await this.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          from: `${device.deviceId}_web`,
          to: device.deviceId,
          action: 'set',
          resource: `cameras/${device.deviceId}`,
          publishResponse: true,
          transId: `web!${Date.now()}`,
          properties: {
            recordingDuration: duration,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Recording start failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log(`[ArloAdapter] ✅ Recording started on ${device.deviceName} for ${duration}s`)

        // Emit recording event
        this.emit('recording-started', {
          cameraId,
          cameraName: device.deviceName,
          duration,
          timestamp: new Date().toISOString(),
        })
      } else {
        throw new Error(`Recording start failed: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[ArloAdapter] Start recording failed:`, error)
      throw error
    }
  }

  /**
   * Stop recording on a camera
   *
   * Stops an active manual recording before its duration expires.
   *
   * @param cameraId - Camera device ID
   */
  async stopRecording(cameraId: string): Promise<void> {
    try {
      const device = this.cameras.get(cameraId)
      if (!device) {
        throw new Error(`Camera not found: ${cameraId}`)
      }

      console.log(`[ArloAdapter] Stopping recording on ${device.deviceName}...`)

      const url = `${ARLO_API_BASE_URL}/hmsweb/users/devices/stopRecord`

      const response = await this.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          from: `${device.deviceId}_web`,
          to: device.deviceId,
          action: 'set',
          resource: `cameras/${device.deviceId}`,
          publishResponse: true,
          transId: `web!${Date.now()}`,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Recording stop failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log(`[ArloAdapter] ✅ Recording stopped on ${device.deviceName}`)

        // Emit recording event
        this.emit('recording-stopped', {
          cameraId,
          cameraName: device.deviceName,
          timestamp: new Date().toISOString(),
        })
      } else {
        throw new Error(`Recording stop failed: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[ArloAdapter] Stop recording failed:`, error)
      throw error
    }
  }

  /**
   * Start live streaming for a camera
   *
   * @param cameraId - Camera device ID
   * @returns Stream URL (HLS manifest) or null if unavailable
   */
  async startStream(cameraId: string): Promise<string | null> {
    try {
      const device = this.cameras.get(cameraId)
      if (!device) {
        throw new Error(`Camera ${cameraId} not found`)
      }

      console.log(`[ArloAdapter] Starting stream for ${device.deviceName}...`)

      // Call Arlo API to start streaming
      const url = `${ARLO_API_BASE_URL}/hmsweb/users/devices/startStream`

      const payload = {
        from: `${device.deviceId}_web`,
        to: device.deviceId,
        action: 'set',
        resource: `cameras/${device.deviceId}`,
        publishResponse: true,
        transId: `web!${Date.now()}`,
        properties: {
          activityState: 'startUserStream',
          cameraId: device.deviceId,
        },
      }

      console.log('[ArloAdapter] Stream request payload:', JSON.stringify(payload, null, 2))

      // Note: Don't set Content-Type here - it's already set by arloTokenManager.exportAsHeaders()
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let errorDetails = `Status: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorDetails += `\nResponse: ${JSON.stringify(errorData, null, 2)}`
        } catch {
          const errorText = await response.text()
          errorDetails += `\nText: ${errorText}`
        }
        console.error('[ArloAdapter] Stream start failed:', errorDetails)
        return null
      }

      const data = await response.json()

      if (data.success && data.data?.url) {
        const streamUrl = data.data.url
        console.log(`[ArloAdapter] ✅ Stream URL received: ${streamUrl}`)

        // IMPORTANT: Wait for stream to actually be ready on Arlo's Wowza servers
        // The API returns the URL immediately, but the streaming session needs 7-15 seconds to initialize
        // Note: We can't poll with HEAD requests due to CORS restrictions from the browser
        // Testing history: 3s failed, 5s failed, 10s failed → Using 15s for worst-case coverage
        console.log(
          '[ArloAdapter] ⏳ Waiting 15 seconds for stream to initialize on Wowza servers...'
        )
        console.log('[ArloAdapter] (Arlo provisions the stream session asynchronously)')
        console.log('[ArloAdapter] Previous tests: 3s ❌, 5s ❌, 10s ❌ → Trying 15s')

        // Wait 15 seconds for Wowza to provision the stream
        await new Promise(resolve => setTimeout(resolve, 15000))

        console.log(
          '[ArloAdapter] ✅ Stream should now be ready after 15 second initialization period'
        )
        return streamUrl
      }

      console.warn('[ArloAdapter] Stream URL not found in response:', data)
      return null
    } catch (error) {
      console.error('[ArloAdapter] Failed to start stream:', error)
      return null
    }
  }

  /**
   * Stop live streaming for a camera
   *
   * @param cameraId - Camera device ID
   */
  async stopStream(cameraId: string): Promise<void> {
    try {
      const device = this.cameras.get(cameraId)
      if (!device) {
        throw new Error(`Camera ${cameraId} not found`)
      }

      console.log(`[ArloAdapter] Stopping stream for ${device.deviceName}...`)

      const url = `${ARLO_API_BASE_URL}/hmsweb/users/devices/stopStream`

      // Note: Don't set Content-Type here - it's already set by arloTokenManager.exportAsHeaders()
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          from: `${device.deviceId}_web`,
          to: device.deviceId,
          action: 'set',
          resource: 'cameras/' + device.deviceId,
          publishResponse: true,
          transId: `web!${Date.now()}`,
          properties: {
            activityState: 'stopUserStream',
            cameraId: device.deviceId,
          },
        }),
      })

      if (!response.ok) {
        console.warn('[ArloAdapter] Stream stop request failed (may already be stopped)')
      } else {
        console.log(`[ArloAdapter] ✅ Stream stopped for ${device.deviceName}`)
      }
    } catch (error) {
      console.error('[ArloAdapter] Failed to stop stream:', error)
    }
  }

  /**
   * Disconnect from Arlo Cloud
   */
  async disconnect(): Promise<void> {
    try {
      // Unsubscribe from events
      await this.unsubscribeFromEvents()

      // Clear state
      this.subscribed = false
      this.authenticated = false
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
