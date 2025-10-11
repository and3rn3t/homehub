/**
 * useGeofence Hook
 *
 * React hook for GPS geofencing features.
 * Manages geofences, location tracking, and event handling.
 *
 * @example
 * const {
 *   geofences,
 *   currentLocation,
 *   isMonitoring,
 *   createGeofence,
 *   startMonitoring
 * } = useGeofence()
 */

import { GeofenceService } from '@/services/automation/geofence.service'
import type { Geofence, GeofenceEvent, Location } from '@/services/automation/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export function useGeofence() {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>(
    'prompt'
  )
  const [lastEvents, setLastEvents] = useState<GeofenceEvent[]>([])

  const service = useRef(GeofenceService.getInstance())

  // Initialize - load geofences from service
  useEffect(() => {
    setGeofences(service.current.getAllGeofences())
    setCurrentLocation(service.current.getCurrentLocation())
    setIsMonitoring(service.current.getIsMonitoring())
  }, [])

  // Register event listener
  useEffect(() => {
    const handleEvent = (event: GeofenceEvent) => {
      setLastEvents(prev => [event, ...prev.slice(0, 9)]) // Keep last 10 events

      const geofence = service.current.getGeofence(event.geofenceId)
      const geofenceName = geofence?.name || 'Unknown'
      const eventVerb = event.eventType === 'enter' ? 'Entering' : 'Leaving'

      toast.info(`${eventVerb} ${geofenceName}`, {
        description: `Location-based automation triggered`,
        duration: 5000,
      })
    }

    service.current.onGeofenceEvent(handleEvent)

    // No cleanup needed - service persists across component lifecycles
  }, [])

  /**
   * Create a new geofence
   */
  const createGeofence = useCallback((geofence: Omit<Geofence, 'id' | 'created'>) => {
    const newGeofence = service.current.createGeofence(geofence)
    setGeofences(service.current.getAllGeofences())
    toast.success(`Geofence "${newGeofence.name}" created`)
    return newGeofence
  }, [])

  /**
   * Update an existing geofence
   */
  const updateGeofence = useCallback(
    (id: string, updates: Partial<Omit<Geofence, 'id' | 'created'>>) => {
      service.current.updateGeofence(id, updates)
      setGeofences(service.current.getAllGeofences())
      toast.success('Geofence updated')
    },
    []
  )

  /**
   * Delete a geofence
   */
  const deleteGeofence = useCallback((id: string) => {
    try {
      service.current.deleteGeofence(id)
      setGeofences(service.current.getAllGeofences())
      toast.success('Geofence deleted')
    } catch (error) {
      toast.error('Failed to delete geofence')
      console.error(error)
    }
  }, [])

  /**
   * Request location permission
   */
  const requestPermission = useCallback(async () => {
    try {
      const granted = await service.current.requestLocationPermission()
      setPermissionStatus(granted ? 'granted' : 'denied')

      if (granted) {
        toast.success('Location permission granted')
      } else {
        toast.error('Location permission denied')
      }

      return granted
    } catch (error) {
      toast.error('Failed to request location permission')
      console.error(error)
      return false
    }
  }, [])

  /**
   * Start location monitoring
   */
  const startMonitoring = useCallback(async () => {
    try {
      await service.current.startMonitoring()
      setIsMonitoring(true)
      setPermissionStatus('granted')
      toast.success('Location monitoring started', {
        description: 'Geofence automation is now active',
      })
    } catch (error) {
      toast.error('Failed to start monitoring', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
      console.error(error)
      setPermissionStatus('denied')
    }
  }, [])

  /**
   * Stop location monitoring
   */
  const stopMonitoring = useCallback(() => {
    service.current.stopMonitoring()
    setIsMonitoring(false)
    toast.info('Location monitoring stopped')
  }, [])

  /**
   * Manually update current location
   */
  const updateLocation = useCallback(async () => {
    try {
      const location = await service.current.updateLocation()
      setCurrentLocation(location)
      toast.success('Location updated', {
        description: `${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°`,
      })
      return location
    } catch (error) {
      toast.error('Failed to get location', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
      console.error(error)
      throw error
    }
  }, [])

  /**
   * Get geofence by ID
   */
  const getGeofence = useCallback((id: string) => {
    return service.current.getGeofence(id)
  }, [])

  /**
   * Get geofence state (inside/outside)
   */
  const getGeofenceState = useCallback((id: string) => {
    return service.current.getGeofenceState(id)
  }, [])

  /**
   * Check if currently inside a geofence
   */
  const isInsideGeofence = useCallback((geofenceId: string) => {
    const state = service.current.getGeofenceState(geofenceId)
    return state?.isInside || false
  }, [])

  /**
   * Clear all geofences and data (for testing/reset)
   */
  const clearAll = useCallback(() => {
    service.current.clearAll()
    setGeofences([])
    setCurrentLocation(null)
    setIsMonitoring(false)
    setLastEvents([])
    toast.info('All geofence data cleared')
  }, [])

  return {
    // State
    geofences,
    currentLocation,
    isMonitoring,
    permissionStatus,
    lastEvents,

    // Geofence management
    createGeofence,
    updateGeofence,
    deleteGeofence,
    getGeofence,

    // Location tracking
    requestPermission,
    startMonitoring,
    stopMonitoring,
    updateLocation,

    // State queries
    getGeofenceState,
    isInsideGeofence,

    // Utilities
    clearAll,
  }
}
