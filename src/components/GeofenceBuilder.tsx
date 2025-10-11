/**
 * Geofence Builder Component
 *
 * Production UI for managing geofences in the Automations tab.
 * Integrates with the real useGeofence hook for GPS-based location triggers.
 *
 * Features:
 * - Create/edit/delete geofences
 * - Enable/disable toggles
 * - Real-time location monitoring status
 * - Recent events display
 * - Visual indicators for active geofences
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useGeofence } from '@/hooks/use-geofence'
import {
  AlertCircleIcon,
  EditIcon,
  MapPinIcon,
  NavigationIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from '@/lib/icons'
import type { Geofence } from '@/services/automation/types'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { GeofenceDialog } from './GeofenceDialog'

export function GeofenceBuilder() {
  const {
    geofences,
    currentLocation,
    isMonitoring,
    permissionStatus,
    lastEvents,
    deleteGeofence,
    requestPermission,
    startMonitoring,
    stopMonitoring,
    updateLocation,
    isInsideGeofence,
    updateGeofence,
  } = useGeofence()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGeofence, setEditingGeofence] = useState<Geofence | undefined>(undefined)

  // Open dialog for creating new geofence
  const handleCreate = () => {
    setEditingGeofence(undefined)
    setIsDialogOpen(true)
  }

  // Open dialog for editing existing geofence
  const handleEdit = (geofence: Geofence) => {
    setEditingGeofence(geofence)
    setIsDialogOpen(true)
  }

  // Delete geofence with confirmation
  const handleDelete = (geofence: Geofence) => {
    if (confirm(`Are you sure you want to delete "${geofence.name}"?`)) {
      deleteGeofence(geofence.id)
    }
  }

  // Toggle geofence enabled state
  const toggleGeofence = (geofence: Geofence) => {
    updateGeofence(geofence.id, { enabled: !geofence.enabled })
  }

  // Format coordinate for display
  const formatCoordinate = (value: number, decimals = 4): string => {
    return value.toFixed(decimals)
  }

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`
    }
    return `${meters}m`
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-bold">Geofence Management</h2>
            <p className="text-muted-foreground">Create location-based automation triggers</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Create Geofence
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-primary mb-1 text-2xl font-bold">{geofences.length}</div>
              <div className="text-muted-foreground text-xs">Total Geofences</div>
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="text-accent mb-1 text-2xl font-bold">
                {geofences.filter(g => g.enabled).length}
              </div>
              <div className="text-muted-foreground text-xs">Active</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/10">
            <CardContent className="p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-blue-500">
                {geofences.filter(g => g.enabled && isInsideGeofence(g.id)).length}
              </div>
              <div className="text-muted-foreground text-xs">Inside Now</div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/10">
            <CardContent className="p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-orange-500">{lastEvents.length}</div>
              <div className="text-muted-foreground text-xs">Recent Events</div>
            </CardContent>
          </Card>
        </div>

        {/* Location Status */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <NavigationIcon className="text-primary h-5 w-5" />
                <div>
                  <div className="text-foreground text-sm font-medium">Location Monitoring</div>
                  <div className="text-muted-foreground text-xs">
                    {permissionStatus === 'granted' ? (
                      currentLocation ? (
                        <>
                          {formatCoordinate(currentLocation.lat, 6)},{' '}
                          {formatCoordinate(currentLocation.lng, 6)}
                          {currentLocation.accuracy &&
                            ` (±${Math.round(currentLocation.accuracy)}m)`}
                        </>
                      ) : (
                        'Location available, start monitoring'
                      )
                    ) : permissionStatus === 'denied' ? (
                      'Location permission denied'
                    ) : (
                      'Location permission not granted'
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {permissionStatus !== 'granted' && (
                  <Button variant="outline" size="sm" onClick={requestPermission}>
                    Grant Permission
                  </Button>
                )}

                {permissionStatus === 'granted' && !isMonitoring && (
                  <Button variant="default" size="sm" onClick={startMonitoring} className="gap-2">
                    <PlayIcon className="h-3.5 w-3.5" />
                    Start Monitoring
                  </Button>
                )}

                {isMonitoring && (
                  <>
                    <Button variant="outline" size="sm" onClick={updateLocation}>
                      Update
                    </Button>
                    <Button variant="secondary" size="sm" onClick={stopMonitoring}>
                      Stop
                    </Button>
                  </>
                )}

                <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                  {isMonitoring ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geofences List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {geofences.length === 0 ? (
          <Card className="border-border/30 border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <MapPinIcon className="text-muted-foreground h-8 w-8" />
              </div>
              <h3 className="text-foreground mb-2 text-lg font-semibold">No geofences yet</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Create your first geofence to enable location-based automations.
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Create Geofence
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {geofences.map((geofence, index) => {
              const inside = isInsideGeofence(geofence.id)

              return (
                <motion.div
                  key={geofence.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={inside ? 'border-accent bg-accent/5' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              geofence.enabled ? 'bg-primary/15' : 'bg-muted'
                            }`}
                          >
                            <MapPinIcon
                              className={`h-5 w-5 ${geofence.enabled ? 'text-primary' : 'text-muted-foreground'}`}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="text-foreground font-semibold">{geofence.name}</h3>
                              {inside && (
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

                            {geofence.description && (
                              <p className="text-muted-foreground mb-2 text-sm">
                                {geofence.description}
                              </p>
                            )}

                            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                              <span>
                                📍 {formatCoordinate(geofence.center.lat)},{' '}
                                {formatCoordinate(geofence.center.lng)}
                              </span>
                              <span>📏 {formatDistance(geofence.radius)} radius</span>
                              {geofence.created && (
                                <span>
                                  🕒 Created {new Date(geofence.created).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(geofence)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            onClick={() => handleDelete(geofence)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>

                          <Switch
                            checked={geofence.enabled}
                            onCheckedChange={() => toggleGeofence(geofence)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Recent Events Section */}
        {lastEvents.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lastEvents.slice(0, 5).map((event, index) => {
                  const geofence = geofences.find(g => g.id === event.geofenceId)
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-border flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={event.eventType === 'enter' ? 'default' : 'secondary'}>
                          {event.eventType === 'enter' ? 'Entered' : 'Left'}
                        </Badge>
                        <div>
                          <div className="text-foreground text-sm font-medium">
                            {geofence?.name || 'Unknown'}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {formatCoordinate(event.location.lat, 4)},{' '}
                            {formatCoordinate(event.location.lng, 4)}
                          </div>
                        </div>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning if not monitoring */}
        {permissionStatus === 'granted' && !isMonitoring && geofences.length > 0 && (
          <Card className="mt-6 border-orange-500/50 bg-orange-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircleIcon className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <div className="text-foreground text-sm font-medium">Monitoring Inactive</div>
                  <div className="text-muted-foreground text-xs">
                    Start monitoring to enable geofence event detection
                  </div>
                </div>
                <Button variant="default" size="sm" onClick={startMonitoring} className="gap-2">
                  <PlayIcon className="h-3.5 w-3.5" />
                  Start Monitoring
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <GeofenceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        geofence={editingGeofence}
      />
    </div>
  )
}
