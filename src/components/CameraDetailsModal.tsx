/**
 * Camera Details Modal
 *
 * Full-screen modal showing camera details with live streaming,
 * camera controls, and stats. Part of Phase 6 Milestone 6.1.3.
 */

import { UniversalVideoPlayer } from '@/components/UniversalVideoPlayer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Camera } from '@/constants/mock-cameras'
import {
  BatteryChargingIcon,
  CameraIcon,
  DownloadIcon,
  MaximizeIcon,
  SettingsIcon,
  SignalIcon,
  VideoIcon,
  XIcon,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Proxy Arlo URLs through our worker to bypass CORS
 */
function getProxiedUrl(arloUrl: string | undefined): string {
  if (!arloUrl) return ''

  // If already proxied, return as-is
  if (arloUrl.includes('localhost:8787') || arloUrl.includes('arlo-proxy')) {
    return arloUrl
  }

  // Return original URL for non-Arlo domains (proxy logic removed for now)
  return arloUrl
}

interface CameraDetailsModalProps {
  camera: Camera | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CameraDetailsModal({
  camera,
  open,
  onOpenChange,
}: Readonly<CameraDetailsModalProps>) {
  const [snapshotUrl, setSnapshotUrl] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Auto-refresh snapshot every 10 seconds (when not streaming)
  useEffect(() => {
    if (!camera || !open) return

    const refreshSnapshot = () => {
      // Proxy the snapshot URL through our worker to bypass CORS
      setSnapshotUrl(getProxiedUrl(camera.snapshotUrl))
    }

    refreshSnapshot() // Initial load
    const interval = setInterval(refreshSnapshot, 10000) // 10s refresh

    return () => clearInterval(interval)
  }, [camera, open])

  if (!camera) return null

  const handleRefreshSnapshot = async () => {
    setIsRefreshing(true)
    // Simulate snapshot refresh delay and proxy the URL
    setTimeout(() => {
      const proxiedUrl = getProxiedUrl(camera.snapshotUrl)
      setSnapshotUrl(`${proxiedUrl}${proxiedUrl.includes('?') ? '&' : '?'}t=${Date.now()}`)
      setIsRefreshing(false)
    }, 500)
  }

  const handleStartLiveStream = async () => {
    if (!camera) return

    try {
      setIsRefreshing(true)
      console.log('[CameraDetailsModal] Starting stream for camera:', camera.name)

      // Import ArloAdapter and arloTokenManager
      const { ArloAdapter } = await import('@/services/devices/ArloAdapter')
      const { arloTokenManager } = await import('@/services/auth/ArloTokenManager')

      // Check if we have a valid token
      const token = arloTokenManager.getToken()
      if (!token) {
        console.error('[CameraDetailsModal] No authentication token available')
        alert('Authentication required. Please refresh your Arlo token in the Security tab.')
        return
      }

      console.log('[CameraDetailsModal] Token found, initializing adapter...')

      // Create and initialize adapter
      const adapter = new ArloAdapter({})
      await adapter.initialize()

      console.log('[CameraDetailsModal] Adapter initialized, starting stream...')

      // Start streaming
      const streamUrl = await adapter.startStream(camera.id)

      console.log('[CameraDetailsModal] Stream URL result:', streamUrl)

      if (!streamUrl) {
        console.log('[CameraDetailsModal] ⚠️ No stream URL returned from Arlo API')
        alert(
          'Live streaming is currently unavailable for this camera.\n\n' +
            'This could be due to:\n' +
            '• Camera requires an active Arlo Smart subscription\n' +
            '• Camera base station is offline\n' +
            '• Camera model does not support cloud streaming\n' +
            '• API rate limiting or temporary service issue\n\n' +
            'Please check the console for detailed error information.'
        )
        setIsRefreshing(false)
        return
      }

      console.log('[CameraDetailsModal] ✅ Stream URL received:', streamUrl)
      setStreamUrl(streamUrl)
      setIsStreaming(true)
    } catch (error) {
      console.error('[CameraDetailsModal] ❌ Failed to start stream:', error)
      alert(`Failed to start stream: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleStopLiveStream = async () => {
    if (!camera) return

    try {
      console.log('[CameraDetailsModal] Stopping stream for camera:', camera.name)

      // Import ArloAdapter
      const { ArloAdapter } = await import('@/services/devices/ArloAdapter')
      const adapter = new ArloAdapter({})
      await adapter.initialize()

      // Stop streaming
      await adapter.stopStream(camera.id)

      console.log('[CameraDetailsModal] ✅ Stream stopped')
      setStreamUrl(null)
      setIsStreaming(false)
    } catch (error) {
      console.error('[CameraDetailsModal] Failed to stop stream:', error)
      // Still clear the stream state even if API call fails
      setStreamUrl(null)
      setIsStreaming(false)
    }
  }

  const handleDownloadSnapshot = async () => {
    if (!camera?.snapshotUrl) return

    try {
      // Fetch the snapshot image through our proxy
      const proxiedUrl = getProxiedUrl(camera.snapshotUrl)
      const response = await fetch(proxiedUrl)
      const blob = await response.blob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${camera.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[CameraDetailsModal] Failed to download snapshot:', error)
      alert('Failed to download snapshot')
    }
  }

  const handleStartRecording = async () => {
    if (!camera) return

    try {
      console.log('[CameraDetailsModal] Starting recording for camera:', camera.name)
      alert('Recording feature will be implemented in Milestone 6.1.4')
      // TODO: Implement recording via Arlo API POST /hmsweb/users/devices/startRecord
    } catch (error) {
      console.error('[CameraDetailsModal] Failed to start recording:', error)
      alert('Failed to start recording')
    }
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Toggle modal size
  }

  const handleSettings = () => {
    alert(
      `Camera Settings for ${camera?.name}\n\nSettings panel will be implemented in a future update.`
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 p-0',
          isFullscreen ? 'h-screen w-full max-w-full' : 'h-[90vh] max-w-5xl'
        )}
        // Disable default close button since we have our own
        onPointerDownOutside={e => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold">{camera.name}</DialogTitle>
              <p className="text-muted-foreground mt-1 text-sm">{camera.location}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 shrink-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                camera.status === 'online' && 'bg-green-500/10 text-green-600 dark:text-green-400',
                camera.status === 'recording' &&
                  'bg-green-500/10 text-green-600 dark:text-green-400',
                camera.status === 'offline' && 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}
            >
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  camera.status === 'online' && 'bg-green-500',
                  camera.status === 'recording' && 'animate-pulse bg-green-500',
                  camera.status === 'offline' && 'bg-red-500'
                )}
              />
              {camera.status === 'recording' ? 'Recording' : camera.status}
            </div>

            {/* Resolution */}
            <div className="bg-muted rounded-full px-3 py-1.5 text-xs font-medium">
              {camera.resolution}
            </div>

            {/* Brand & Model */}
            <div className="bg-muted rounded-full px-3 py-1.5 text-xs font-medium">
              {camera.brand} {camera.model}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: Video/Snapshot View (2 columns on desktop) */}
            <div className="space-y-4 lg:col-span-2">
              {/* Video Player with HLS/DASH Support */}
              <div className="bg-muted relative aspect-video overflow-hidden rounded-lg">
                {camera.status === 'offline' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <CameraIcon className="text-muted-foreground h-16 w-16" />
                    <p className="text-muted-foreground font-medium">Camera Offline</p>
                  </div>
                ) : isStreaming && streamUrl ? (
                  <UniversalVideoPlayer
                    streamUrl={streamUrl}
                    snapshotUrl={camera.snapshotUrl}
                    cameraName={camera.name}
                  />
                ) : (
                  <>
                    <img
                      src={snapshotUrl || camera.snapshotUrl}
                      alt={camera.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {isRefreshing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {/* Live Stream Toggle */}
                {!isStreaming ? (
                  <Button
                    onClick={handleStartLiveStream}
                    disabled={camera.status === 'offline' || isRefreshing}
                    variant="default"
                    className="col-span-2 sm:min-w-[140px] sm:flex-1"
                  >
                    <VideoIcon className="mr-2 h-4 w-4" />
                    Start Live Stream
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopLiveStream}
                    variant="destructive"
                    className="col-span-2 sm:min-w-[140px] sm:flex-1"
                  >
                    <VideoIcon className="mr-2 h-4 w-4" />
                    Stop Stream
                  </Button>
                )}

                <Button
                  onClick={handleRefreshSnapshot}
                  disabled={camera.status === 'offline' || isRefreshing || isStreaming}
                  variant="secondary"
                  className="sm:min-w-[120px]"
                >
                  <CameraIcon className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  onClick={handleStartRecording}
                  disabled={camera.status === 'offline'}
                  variant="secondary"
                  className="sm:min-w-[120px]"
                >
                  <VideoIcon className="mr-2 h-4 w-4" />
                  Record
                </Button>
                <Button
                  onClick={handleDownloadSnapshot}
                  disabled={camera.status === 'offline'}
                  variant="outline"
                  className="sm:min-w-[120px]"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={handleFullscreen} variant="outline" className="sm:min-w-[120px]">
                  <MaximizeIcon className="mr-2 h-4 w-4" />
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
              </div>

              {/* Capabilities */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  {camera.capabilities.ptz && (
                    <div className="bg-primary/10 text-primary rounded-md px-3 py-2 text-sm font-medium">
                      Pan/Tilt/Zoom
                    </div>
                  )}
                  {camera.capabilities.nightVision && (
                    <div className="rounded-md bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      Night Vision
                    </div>
                  )}
                  {camera.capabilities.spotlight && (
                    <div className="rounded-md bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      Spotlight
                    </div>
                  )}
                  {camera.capabilities.twoWayAudio && (
                    <div className="rounded-md bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                      2-Way Audio
                    </div>
                  )}
                  {camera.capabilities.localStorage && (
                    <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                      Local Storage
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Stats & Info (1 column on desktop) */}
            <div className="space-y-4">
              {/* Camera Stats */}
              <div className="bg-card/50 space-y-4 rounded-lg border p-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold">Camera Stats</h3>

                {/* Battery */}
                {camera.battery !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <BatteryChargingIcon className="h-4 w-4" />
                      <span>Battery</span>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        camera.battery > 50 && 'text-green-600 dark:text-green-400',
                        camera.battery <= 50 &&
                          camera.battery > 20 &&
                          'text-yellow-600 dark:text-yellow-400',
                        camera.battery <= 20 && 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {camera.battery}%
                    </span>
                  </div>
                )}

                {/* Signal Strength */}
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <SignalIcon className="h-4 w-4" />
                    <span>Signal</span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      camera.signalStrength > 70 && 'text-green-600 dark:text-green-400',
                      camera.signalStrength <= 70 &&
                        camera.signalStrength > 30 &&
                        'text-yellow-600 dark:text-yellow-400',
                      camera.signalStrength <= 30 && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {camera.signalStrength}%
                  </span>
                </div>

                {/* Last Motion */}
                {camera.lastMotion && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Last Motion</span>
                    <span className="text-sm font-medium">
                      {getRelativeTime(camera.lastMotion)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-card/50 space-y-3 rounded-lg border p-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold">Quick Actions</h3>

                <Button variant="outline" className="w-full justify-start" onClick={handleSettings}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Camera Settings
                </Button>
              </div>

              {/* Recent Activity */}
              {camera.lastMotion && (
                <div className="bg-card/50 space-y-3 rounded-lg border p-4 backdrop-blur-xl">
                  <h3 className="text-sm font-semibold">Recent Activity</h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-muted-foreground text-sm"
                  >
                    <p>Motion detected {getRelativeTime(camera.lastMotion)}</p>
                    <p className="mt-1 text-xs">
                      {camera.lastMotion.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Helper to format relative time
 */
function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
