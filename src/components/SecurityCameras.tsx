/**
 * Security Cameras Dashboard
 *
 * 7-camera grid with PTZ controls and doorbell notifications
 */

import { Card } from '@/components/ui/card'
import { VideoPlayer } from '@/components/VideoPlayer'
import { MOCK_CAMERAS } from '@/constants/mock-cameras'
import { BellIcon, ShieldIcon, VideoIcon, WifiOffIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { memo, useState } from 'react'

export const SecurityCameras = memo(function SecurityCameras() {
  const [expandedCamera, setExpandedCamera] = useState<string | null>(null)

  const onlineCameras = MOCK_CAMERAS.filter(c => c.status !== 'offline')
  const offlineCameras = MOCK_CAMERAS.filter(c => c.status === 'offline')

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
            <ShieldIcon className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Security Cameras</h1>
            <p className="text-muted-foreground text-sm">
              {onlineCameras.length} of {MOCK_CAMERAS.length} cameras online
            </p>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-muted-foreground text-sm">System Active</span>
        </div>
      </motion.div>

      {/* Camera Grid */}
      <div
        className={cn(
          'grid gap-4',
          expandedCamera
            ? 'grid-cols-1' // Fullscreen mode
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
        )}
      >
        {MOCK_CAMERAS.map((camera, index) => (
          <motion.div
            key={camera.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <Card
              className={cn(
                'bg-card/50 overflow-hidden border-0 backdrop-blur-xl',
                expandedCamera === camera.id && 'col-span-full'
              )}
            >
              {/* Video Player - Note: VideoPlayer contains interactive buttons, so we use a div wrapper */}
              <div className="relative">
                <VideoPlayer
                  camera={camera}
                  autoplay={camera.status === 'online'}
                  muted={true}
                  className="aspect-video"
                />
                {/* Expand/Collapse button overlay - positioned to not interfere with video controls */}
                <button
                  type="button"
                  onClick={() => {
                    if (expandedCamera === camera.id) {
                      setExpandedCamera(null)
                    } else {
                      setExpandedCamera(camera.id)
                    }
                  }}
                  className="absolute top-2 right-2 rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70"
                  aria-label={`${expandedCamera === camera.id ? 'Collapse' : 'Expand'} ${camera.name}`}
                  title={expandedCamera === camera.id ? 'Collapse' : 'Expand fullscreen'}
                >
                  {expandedCamera === camera.id ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h6v6" />
                      <path d="M9 21H3v-6" />
                      <path d="M21 3l-7 7" />
                      <path d="M3 21l7-7" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Camera Details */}
              <div className="space-y-3 p-4">
                {/* Name & Location */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{camera.name}</h3>
                    <p className="text-muted-foreground text-sm">{camera.location}</p>
                  </div>

                  {/* Type Badge */}
                  <div
                    className={cn(
                      'rounded-md px-2 py-1 text-xs font-medium',
                      camera.type === 'doorbell' && 'bg-primary/10 text-primary',
                      camera.type === 'ptz' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                      camera.type === 'spotlight' &&
                        'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
                      camera.type === 'indoor' &&
                        'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    )}
                  >
                    {camera.type === 'doorbell' && (
                      <BellIcon className="mr-1 inline-block h-3 w-3" />
                    )}
                    {camera.type === 'ptz' && <VideoIcon className="mr-1 inline-block h-3 w-3" />}
                    {camera.type}
                  </div>
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-2">
                  {camera.capabilities.ptz && (
                    <span className="bg-muted rounded-md px-2 py-1 text-xs">PTZ</span>
                  )}
                  {camera.capabilities.nightVision && (
                    <span className="bg-muted rounded-md px-2 py-1 text-xs">Night Vision</span>
                  )}
                  {camera.capabilities.spotlight && (
                    <span className="bg-muted rounded-md px-2 py-1 text-xs">Spotlight</span>
                  )}
                  {camera.capabilities.twoWayAudio && (
                    <span className="bg-muted rounded-md px-2 py-1 text-xs">2-Way Audio</span>
                  )}
                </div>

                {/* Stats */}
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    {/* Signal Strength */}
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={`signal-bar-${camera.id}-${i}`}
                            className={cn(
                              'h-3 w-1 rounded-sm',
                              camera.signalStrength > (i + 1) * 25 ? 'bg-green-500' : 'bg-muted'
                            )}
                          />
                        ))}
                      </div>
                      <span>{camera.signalStrength}%</span>
                    </div>

                    {/* Battery (if applicable) */}
                    {camera.battery !== undefined && (
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            camera.battery > 20
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          🔋 {camera.battery}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resolution */}
                  <span className="text-muted-foreground">{camera.resolution}</span>
                </div>

                {/* Last Motion */}
                {camera.lastMotion && camera.status === 'online' && (
                  <div className="text-muted-foreground text-xs">
                    Last motion: {getRelativeTime(camera.lastMotion)}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Offline Cameras Warning */}
      {offlineCameras.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="border-orange-500/20 bg-orange-500/5">
            <div className="flex items-start gap-3 p-4">
              <WifiOffIcon className="mt-0.5 h-5 w-5 text-orange-500" />
              <div>
                <h3 className="font-semibold text-orange-600 dark:text-orange-400">
                  {offlineCameras.length} Camera{offlineCameras.length > 1 ? 's' : ''} Offline
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {offlineCameras.map(c => c.name).join(', ')}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Development Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4"
      >
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <strong>Development Mode:</strong> Using test video streams. Real camera integration
          pending API solutions for Eufy E30 and Arlo cameras.
        </p>
      </motion.div>
    </div>
  )
})

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
