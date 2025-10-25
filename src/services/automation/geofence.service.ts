/**
 * Geofence Service
 *
 * Manages GPS-based geofencing for location-aware automations.
 * Supports circular geofences with enter/leave event detection.
 *
 * Features:
 * - Create/update/delete geofences
 * - Track device location via Geolocation API
 * - Detect enter/leave events using Haversine formula
 * - Event callbacks for automation triggers
 * - Persistent storage of geofences
 *
 * @example
 * const service = GeofenceService.getInstance()
 * const homeGeofence = service.createGeofence({
 *   name: 'Home',
 *   center: { lat: 37.7749, lng: -122.4194 },
 *   radius: 100,
 *   enabled: true
 * })
 * await service.startMonitoring()
 */

import type { Geofence, GeofenceEvent, GeofenceState, Location } from './types'

export class GeofenceService {
  private static instance: GeofenceService
  private geofences: Geofence[] = []
  private geofenceStates: Map<string, GeofenceState> = new Map()
  private currentLocation: Location | null = null
  private watchId: number | null = null
  private isMonitoring: boolean = false
  private eventCallbacks: ((event: GeofenceEvent) => void)[] = []
  private locationUpdateInterval: number | null = null

  // Constants
  private readonly STORAGE_KEY = 'homehub-geofences'
  private readonly STATE_STORAGE_KEY = 'homehub-geofence-states'
  private readonly LOCATION_UPDATE_INTERVAL = 30000 // 30 seconds
  private readonly MIN_ACCURACY = 100 // meters - ignore low-accuracy readings

  private constructor() {
    this.loadGeofences()
    this.loadStates()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GeofenceService {
    if (!GeofenceService.instance) {
      GeofenceService.instance = new GeofenceService()
    }
    return GeofenceService.instance
  }

  // ============================================================================
  // Geofence Management
  // ============================================================================

  /**
   * Create a new geofence
   */
  public createGeofence(geofence: Omit<Geofence, 'id' | 'created'>): Geofence {
    const newGeofence: Geofence = {
      ...geofence,
      id: `geofence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      created: new Date().toISOString(),
    }

    this.geofences.push(newGeofence)
    this.saveGeofences()

    console.log('[GeofenceService] Created geofence:', newGeofence)
    return newGeofence
  }

  /**
   * Update existing geofence
   */
  public updateGeofence(id: string, updates: Partial<Omit<Geofence, 'id' | 'created'>>): void {
    const geofence = this.geofences.find(g => g.id === id)
    if (!geofence) {
      throw new Error(`Geofence not found: ${id}`)
    }

    // Update in place, preserving id and created
    Object.assign(geofence, updates)
    this.saveGeofences()

    console.log('[GeofenceService] Updated geofence:', geofence)
  }

  /**
   * Delete geofence
   */
  public deleteGeofence(id: string): void {
    const index = this.geofences.findIndex(g => g.id === id)
    if (index === -1) {
      throw new Error(`Geofence not found: ${id}`)
    }

    this.geofences.splice(index, 1)
    this.geofenceStates.delete(id)
    this.saveGeofences()
    this.saveStates()

    console.log('[GeofenceService] Deleted geofence:', id)
  }

  /**
   * Get geofence by ID
   */
  public getGeofence(id: string): Geofence | undefined {
    return this.geofences.find(g => g.id === id)
  }

  /**
   * Get all geofences
   */
  public getAllGeofences(): Geofence[] {
    return [...this.geofences]
  }

  // ============================================================================
  // Location Tracking
  // ============================================================================

  /**
   * Request location permission from browser
   */
  public async requestLocationPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      console.error('[GeofenceService] Geolocation not supported')
      return false
    }

    try {
      // Try to get current position to trigger permission prompt
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      console.log('[GeofenceService] Location permission granted')
      return true
    } catch (error) {
      console.error('[GeofenceService] Location permission denied:', error)
      return false
    }
  }

  /**
   * Start monitoring location changes
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('[GeofenceService] Already monitoring')
      return
    }

    if (!('geolocation' in navigator)) {
      throw new Error('Geolocation not supported in this browser')
    }

    // Request permission first
    const hasPermission = await this.requestLocationPermission()
    if (!hasPermission) {
      throw new Error('Location permission denied')
    }

    // Start continuous watching
    this.watchId = navigator.geolocation.watchPosition(
      position => {
        this.handleLocationUpdate(position)
      },
      error => {
        console.error('[GeofenceService] Location error:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // Accept 10-second-old positions
        timeout: 30000, // 30 second timeout
      }
    )

    // Also set up periodic updates as backup
    this.locationUpdateInterval = window.setInterval(() => {
      this.updateLocation()
    }, this.LOCATION_UPDATE_INTERVAL)

    this.isMonitoring = true
    console.log('[GeofenceService] Started monitoring')
  }

  /**
   * Stop monitoring location changes
   */
  public stopMonitoring(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    if (this.locationUpdateInterval !== null) {
      clearInterval(this.locationUpdateInterval)
      this.locationUpdateInterval = null
    }

    this.isMonitoring = false
    console.log('[GeofenceService] Stopped monitoring')
  }

  /**
   * Get current location
   */
  public getCurrentLocation(): Location | null {
    return this.currentLocation
  }

  /**
   * Manually update location (get fresh position)
   */
  public async updateLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          const location = this.handleLocationUpdate(position)
          resolve(location)
        },
        error => {
          console.error('[GeofenceService] Failed to get location:', error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // No cache
        }
      )
    })
  }

  /**
   * Handle location update from Geolocation API
   */
  private handleLocationUpdate(position: GeolocationPosition): Location {
    const location: Location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString(),
    }

    // Ignore low-accuracy readings
    if (location.accuracy && location.accuracy > this.MIN_ACCURACY) {
      console.warn(`[GeofenceService] Ignoring low-accuracy location: ${location.accuracy}m`)
      return location
    }

    this.currentLocation = location
    console.log('[GeofenceService] Location updated:', location)

    // Check all geofences for events
    const events = this.checkGeofences(location)
    for (const event of events) {
      this.triggerEvent(event)
    }

    return location
  }

  // ============================================================================
  // Geofence Detection
  // ============================================================================

  /**
   * Check all geofences for enter/leave events
   */
  public checkGeofences(location: Location): GeofenceEvent[] {
    const events: GeofenceEvent[] = []

    for (const geofence of this.geofences) {
      if (!geofence.enabled) continue

      const isInside = this.isInsideGeofence(location, geofence)
      const state = this.geofenceStates.get(geofence.id)

      // First check or state changed
      if (!state || state.isInside !== isInside) {
        const eventType = isInside ? 'enter' : 'leave'

        // Skip "leave" events if we never detected "enter" (initial outside state)
        if (!isInside && !state) {
          // Initialize as outside, no event
          this.geofenceStates.set(geofence.id, {
            geofenceId: geofence.id,
            isInside: false,
            lastUpdate: new Date().toISOString(),
          })
          continue
        }

        // Create event
        const event: GeofenceEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          geofenceId: geofence.id,
          eventType,
          location,
          timestamp: new Date().toISOString(),
          triggeredAutomations: [],
        }

        events.push(event)

        // Update state
        this.geofenceStates.set(geofence.id, {
          geofenceId: geofence.id,
          isInside,
          lastUpdate: new Date().toISOString(),
          enteredAt: isInside ? new Date().toISOString() : state?.enteredAt,
          leftAt: !isInside ? new Date().toISOString() : state?.leftAt,
        })

        console.log(`[GeofenceService] ${eventType} geofence:`, geofence.name)
      }
    }

    if (events.length > 0) {
      this.saveStates()
    }

    return events
  }

  /**
   * Check if location is inside geofence
   */
  private isInsideGeofence(location: Location, geofence: Geofence): boolean {
    const distance = this.calculateDistance(
      location.lat,
      location.lng,
      geofence.center.lat,
      geofence.center.lng
    )

    return distance <= geofence.radius
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   *
   * @see https://en.wikipedia.org/wiki/Haversine_formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Get current geofence state
   */
  public getGeofenceState(geofenceId: string): GeofenceState | undefined {
    return this.geofenceStates.get(geofenceId)
  }

  /**
   * Get all geofence states
   */
  public getAllGeofenceStates(): GeofenceState[] {
    return Array.from(this.geofenceStates.values())
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Register callback for geofence events
   */
  public onGeofenceEvent(callback: (event: GeofenceEvent) => void): void {
    this.eventCallbacks.push(callback)
  }

  /**
   * Trigger event to all registered callbacks
   */
  private triggerEvent(event: GeofenceEvent): void {
    console.log('[GeofenceService] Triggering event:', event)
    for (const callback of this.eventCallbacks) {
      try {
        callback(event)
      } catch (error) {
        console.error('[GeofenceService] Event callback error:', error)
      }
    }
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  /**
   * Save geofences to localStorage
   */
  private saveGeofences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.geofences))
    } catch (error) {
      console.error('[GeofenceService] Failed to save geofences:', error)
    }
  }

  /**
   * Load geofences from localStorage
   */
  private loadGeofences(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        this.geofences = JSON.parse(data)
        console.log('[GeofenceService] Loaded geofences:', this.geofences.length)
      }
    } catch (error) {
      console.error('[GeofenceService] Failed to load geofences:', error)
    }
  }

  /**
   * Save geofence states to localStorage
   */
  private saveStates(): void {
    try {
      const states = Array.from(this.geofenceStates.entries())
      localStorage.setItem(this.STATE_STORAGE_KEY, JSON.stringify(states))
    } catch (error) {
      console.error('[GeofenceService] Failed to save states:', error)
    }
  }

  /**
   * Load geofence states from localStorage
   */
  private loadStates(): void {
    try {
      const data = localStorage.getItem(this.STATE_STORAGE_KEY)
      if (data) {
        const states = JSON.parse(data) as [string, GeofenceState][]
        this.geofenceStates = new Map(states)
        console.log('[GeofenceService] Loaded states:', this.geofenceStates.size)
      }
    } catch (error) {
      console.error('[GeofenceService] Failed to load states:', error)
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  public clearAll(): void {
    this.geofences = []
    this.geofenceStates.clear()
    this.currentLocation = null
    this.stopMonitoring()
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.STATE_STORAGE_KEY)
    console.log('[GeofenceService] Cleared all data')
  }

  /**
   * Get monitoring status
   */
  public getIsMonitoring(): boolean {
    return this.isMonitoring
  }
}
