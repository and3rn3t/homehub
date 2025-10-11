/**
 * Geofence Dialog Component
 *
 * Production UI for creating and editing geofences.
 * Features:
 * - Form validation for all fields
 * - Coordinate input with "Use Current Location" option
 * - Radius slider with visual feedback
 * - Enable/disable toggle
 * - Save/cancel actions
 */

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useGeofence } from '@/hooks/use-geofence'
import { MapPinIcon, NavigationIcon } from '@/lib/icons'
import type { Geofence } from '@/services/automation/types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface GeofenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  geofence?: Geofence // If provided, edit mode. Otherwise, create mode
}

export function GeofenceDialog({ open, onOpenChange, geofence }: GeofenceDialogProps) {
  const { createGeofence, updateGeofence, currentLocation } = useGeofence()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState<number>(0)
  const [longitude, setLongitude] = useState<number>(0)
  const [radius, setRadius] = useState<number>(100)
  const [enabled, setEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form when dialog opens or geofence changes
  useEffect(() => {
    if (open) {
      if (geofence) {
        // Edit mode - populate with existing data
        setName(geofence.name)
        setDescription(geofence.description || '')
        setLatitude(geofence.center.lat)
        setLongitude(geofence.center.lng)
        setRadius(geofence.radius)
        setEnabled(geofence.enabled)
      } else {
        // Create mode - reset to defaults
        setName('')
        setDescription('')
        setLatitude(currentLocation?.lat || 0)
        setLongitude(currentLocation?.lng || 0)
        setRadius(100)
        setEnabled(true)
      }
    }
  }, [open, geofence, currentLocation])

  // Use current location
  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setLatitude(currentLocation.lat)
      setLongitude(currentLocation.lng)
      toast.success('Location set to current position')
    } else {
      toast.error('Current location not available. Start monitoring first.')
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!name.trim()) {
      toast.error('Please enter a geofence name')
      return false
    }

    if (latitude < -90 || latitude > 90) {
      toast.error('Latitude must be between -90 and 90')
      return false
    }

    if (longitude < -180 || longitude > 180) {
      toast.error('Longitude must be between -180 and 180')
      return false
    }

    if (radius < 10 || radius > 10000) {
      toast.error('Radius must be between 10m and 10,000m')
      return false
    }

    return true
  }

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const geofenceData = {
        name: name.trim(),
        description: description.trim() || undefined,
        center: { lat: latitude, lng: longitude },
        radius,
        enabled,
      }

      if (geofence) {
        // Edit mode
        await updateGeofence(geofence.id, geofenceData)
        toast.success('Geofence updated successfully')
      } else {
        // Create mode
        await createGeofence(geofenceData)
        toast.success('Geofence created successfully')
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving geofence:', error)
      toast.error('Failed to save geofence')
    } finally {
      setIsLoading(false)
    }
  }

  // Format coordinate for display
  const formatCoordinate = (value: number, decimals = 6): string => {
    return value.toFixed(decimals)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{geofence ? 'Edit Geofence' : 'Create Geofence'}</DialogTitle>
          <DialogDescription>
            {geofence
              ? 'Update geofence settings and location.'
              : 'Define a geographic area to trigger automations.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Home, Work, Gym"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add notes about this location..."
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Current Location Helper */}
          <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <NavigationIcon className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {currentLocation
                  ? `Current: ${formatCoordinate(currentLocation.lat, 4)}, ${formatCoordinate(currentLocation.lng, 4)}`
                  : 'Location not available'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={!currentLocation}
            >
              Use Current
            </Button>
          </div>

          {/* Latitude */}
          <div className="grid gap-2">
            <Label htmlFor="latitude">Latitude *</Label>
            <Input
              id="latitude"
              type="number"
              value={latitude}
              onChange={e => setLatitude(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 37.7749"
              step="0.000001"
              min="-90"
              max="90"
            />
            <p className="text-muted-foreground text-xs">Range: -90 to 90</p>
          </div>

          {/* Longitude */}
          <div className="grid gap-2">
            <Label htmlFor="longitude">Longitude *</Label>
            <Input
              id="longitude"
              type="number"
              value={longitude}
              onChange={e => setLongitude(parseFloat(e.target.value) || 0)}
              placeholder="e.g., -122.4194"
              step="0.000001"
              min="-180"
              max="180"
            />
            <p className="text-muted-foreground text-xs">Range: -180 to 180</p>
          </div>

          {/* Radius */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="radius">Radius</Label>
              <span className="text-muted-foreground text-sm font-medium">
                {radius.toLocaleString()}m
              </span>
            </div>
            <Slider
              id="radius"
              value={[radius]}
              onValueChange={([value]) => setRadius(value ?? 100)}
              min={10}
              max={10000}
              step={10}
              className="py-4"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>10m</span>
              <span>1km</span>
              <span>10km</span>
            </div>
          </div>

          {/* Visual Representation */}
          <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
            <MapPinIcon className="text-primary h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                {formatCoordinate(latitude, 6)}, {formatCoordinate(longitude, 6)}
              </p>
              <p className="text-muted-foreground text-xs">
                ~{radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`} radius
              </p>
            </div>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Active</Label>
              <p className="text-muted-foreground text-sm">
                Enable this geofence for automation triggers
              </p>
            </div>
            <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : geofence ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
