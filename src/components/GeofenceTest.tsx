/**
 * Geofence Test Component
 *
 * Simple UI for testing geofencing core functionality:
 * - Permission requests
 * - Location updates
 * - Geofence creation
 * - Distance calculations
 * - Enter/leave event detection
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGeofence } from '@/hooks/use-geofence'
import { MapPinIcon, PlayIcon, PlusIcon, RefreshIcon, StopCircleIcon, TrashIcon } from '@/lib/icons'
import { motion } from 'framer-motion'
import { useState } from 'react'

export function GeofenceTest() {
  const {
    geofences,
    currentLocation,
    isMonitoring,
    permissionStatus,
    lastEvents,
    createGeofence,
    deleteGeofence,
    requestPermission,
    startMonitoring,
    stopMonitoring,
    updateLocation,
    isInsideGeofence,
    clearAll,
  } = useGeofence()

  const [newGeofence, setNewGeofence] = useState({
    name: 'Test Location',
    lat: 0,
    lng: 0,
    radius: 100,
  })

  // Handle create geofence
  const handleCreate = () => {
    if (!newGeofence.name || !newGeofence.lat || !newGeofence.lng) {
      alert('Please fill in all fields')
      return
    }

    createGeofence({
      name: newGeofence.name,
      description: 'Test geofence created via GeofenceTest component',
      center: {
        lat: newGeofence.lat,
        lng: newGeofence.lng,
      },
      radius: newGeofence.radius,
      enabled: true,
    })

    // Reset form
    setNewGeofence({
      name: 'Test Location',
      lat: 0,
      lng: 0,
      radius: 100,
    })
  }

  // Use current location for new geofence
  const useCurrentLocation = () => {
    if (currentLocation) {
      setNewGeofence(prev => ({
        ...prev,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      }))
    } else {
      alert('No current location available. Please update location first.')
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Geofence Testing</h1>
        <p className="text-muted-foreground text-sm">Test GPS geofencing functionality</p>
      </div>

      {/* Permission & Monitoring Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Permission:</span>
            <Badge
              variant={
                permissionStatus === 'granted'
                  ? 'default'
                  : permissionStatus === 'denied'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {permissionStatus}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Monitoring:</span>
            <Badge variant={isMonitoring ? 'default' : 'secondary'}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex gap-2">
            {permissionStatus !== 'granted' && (
              <Button onClick={requestPermission} size="sm">
                <MapPinIcon className="mr-2 h-4 w-4" />
                Request Permission
              </Button>
            )}

            {!isMonitoring ? (
              <Button onClick={startMonitoring} size="sm" variant="default">
                <PlayIcon className="mr-2 h-4 w-4" />
                Start Monitoring
              </Button>
            ) : (
              <Button onClick={stopMonitoring} size="sm" variant="destructive">
                <StopCircleIcon className="mr-2 h-4 w-4" />
                Stop Monitoring
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentLocation ? (
            <>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm">
                <div>Lat: {currentLocation.lat.toFixed(6)}°</div>
                <div>Lng: {currentLocation.lng.toFixed(6)}°</div>
                {currentLocation.accuracy && (
                  <div className="text-muted-foreground">
                    Accuracy: {currentLocation.accuracy.toFixed(0)}m
                  </div>
                )}
                <div className="text-muted-foreground text-xs">
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <Button onClick={updateLocation} size="sm" variant="outline">
                <RefreshIcon className="mr-2 h-4 w-4" />
                Update Location
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No location available. Start monitoring to get location.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create Geofence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Test Geofence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newGeofence.name}
              onChange={e => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Test Location"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="0.000001"
                value={newGeofence.lat}
                onChange={e =>
                  setNewGeofence(prev => ({
                    ...prev,
                    lat: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="37.7749"
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="0.000001"
                value={newGeofence.lng}
                onChange={e =>
                  setNewGeofence(prev => ({
                    ...prev,
                    lng: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="-122.4194"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="radius">Radius (meters): {newGeofence.radius}m</Label>
            <Input
              id="radius"
              type="range"
              min="10"
              max="1000"
              step="10"
              value={newGeofence.radius}
              onChange={e =>
                setNewGeofence(prev => ({
                  ...prev,
                  radius: parseInt(e.target.value),
                }))
              }
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={useCurrentLocation} variant="outline" size="sm">
              <MapPinIcon className="mr-2 h-4 w-4" />
              Use Current Location
            </Button>
            <Button onClick={handleCreate} size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Geofence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Geofences List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Geofences ({geofences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {geofences.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No geofences created yet. Create one above to test!
            </p>
          ) : (
            <div className="space-y-2">
              {geofences.map(geofence => {
                const isInside = isInsideGeofence(geofence.id)
                return (
                  <motion.div
                    key={geofence.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-border flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{geofence.name}</h4>
                        {isInside && (
                          <Badge variant="default" className="text-xs">
                            Inside
                          </Badge>
                        )}
                        {!geofence.enabled && (
                          <Badge variant="secondary" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {geofence.center.lat.toFixed(4)}°, {geofence.center.lng.toFixed(4)}° ·
                        Radius: {geofence.radius}m
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGeofence(geofence.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events ({lastEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {lastEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No events yet. Move in/out of a geofence to see events!
            </p>
          ) : (
            <div className="space-y-2">
              {lastEvents.map(event => {
                const geofence = geofences.find(g => g.id === event.geofenceId)
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-border rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge
                          variant={event.eventType === 'enter' ? 'default' : 'secondary'}
                          className="mb-1"
                        >
                          {event.eventType === 'enter' ? 'Entered' : 'Left'}
                        </Badge>
                        <p className="text-sm font-medium">
                          {geofence?.name || 'Unknown Geofence'}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {event.location.lat.toFixed(6)}°, {event.location.lng.toFixed(6)}°
                    </p>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Debug Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={clearAll} variant="destructive" size="sm" className="text-xs">
              <TrashIcon className="mr-2 h-3 w-3" />
              Clear All Data
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            This will delete all geofences, states, and stop monitoring
          </p>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Step 1:</strong> Click "Request Permission" to allow location access
          </p>
          <p>
            <strong>Step 2:</strong> Click "Start Monitoring" to begin tracking
          </p>
          <p>
            <strong>Step 3:</strong> Click "Update Location" to get your current position
          </p>
          <p>
            <strong>Step 4:</strong> Click "Use Current Location" then "Create Geofence"
          </p>
          <p>
            <strong>Step 5:</strong> Move around or manually change lat/lng to simulate movement
          </p>
          <p className="text-muted-foreground">
            <strong>Note:</strong> To test enter/leave events, create a geofence at a different
            location and then use "Use Current Location" to create one at your actual position.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
