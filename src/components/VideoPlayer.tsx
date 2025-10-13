/**
 * VideoPlayer Component
 *
 * Handles both HLS live streams (Eufy via FFmpeg) and
 * static snapshots (Arlo cloud API).
 *
 * Features:
 * - HLS.js integration for adaptive streaming
 * - Snapshot mode with auto-refresh
 * - Loading states and error handling
 * - Fullscreen support
 * - iOS-styled controls
 * - Auto-reconnect on disconnect
 */

import type { Camera } from '@/constants/mock-cameras'
import { MaximizeIcon, PauseIcon, PlayIcon, RefreshCwIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// Dynamic import for hls.js (only loaded when needed)
let HlsModule: typeof import('hls.js').default | null = null

async function loadHls() {
  if (!HlsModule) {
    const module = await import('hls.js')
    HlsModule = module.default
  }
  return HlsModule
}

interface VideoPlayerProps {
  camera: Camera
  autoplay?: boolean
  muted?: boolean
  className?: string
  onError?: (error: Error) => void
}

export const VideoPlayer = memo(function VideoPlayer({
  camera,
  autoplay = true,
  muted = true,
  className,
  onError,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null) // Using any for dynamic HLS instance
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshotRefreshKey, setSnapshotRefreshKey] = useState(0)

  // Determine if this is a stream or snapshot camera
  const isStreamCamera = !!camera.streamUrl
  const isSnapshotCamera = !isStreamCamera && !!camera.snapshotUrl

  // HLS stream setup (dynamic import)
  useEffect(() => {
    if (!isStreamCamera || !camera.streamUrl || !videoRef.current) return

    const video = videoRef.current
    let hls: any = null

    // Async function to load and initialize HLS
    const initHls = async () => {
      try {
        const Hls = await loadHls()

        // Check if HLS is supported
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          })

          hlsRef.current = hls

          hls.loadSource(camera.streamUrl!)
          hls.attachMedia(video)

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false)
            if (autoplay) {
              video.play().catch((err: Error) => {
                console.error('Autoplay failed:', err)
                setIsPlaying(false)
              })
            }
          })

          hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
            if (data.fatal) {
              const errorMsg = `Stream error: ${data.type}`
              setError(errorMsg)
              setIsLoading(false)
              onError?.(new Error(errorMsg))

              // Auto-reconnect attempt
              setTimeout(() => {
                if (camera.streamUrl && hls) {
                  setError(null)
                  setIsLoading(true)
                  hls.loadSource(camera.streamUrl)
                }
              }, 5000)
            }
          })
        }
        // Fallback for native HLS support (Safari)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = camera.streamUrl!
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false)
            if (autoplay) {
              video.play().catch((err: Error) => {
                console.error('Autoplay failed:', err)
                setIsPlaying(false)
              })
            }
          })
          video.addEventListener('error', () => {
            setError('Failed to load stream')
            setIsLoading(false)
          })
        } else {
          setError('HLS not supported in this browser')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to load HLS:', err)
        setError('Failed to load video library')
        setIsLoading(false)
      }
    }

    initHls()

    return () => {
      if (hls) {
        hls.destroy()
        hlsRef.current = null
      }
    }
  }, [camera.streamUrl, autoplay, isStreamCamera, onError])

  // Snapshot auto-refresh (every 10 seconds)
  useEffect(() => {
    if (!isSnapshotCamera) return

    setIsLoading(false) // Snapshots load immediately

    const interval = setInterval(() => {
      setSnapshotRefreshKey(prev => prev + 1)
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [isSnapshotCamera])

  // Handle play/pause
  const togglePlayPause = () => {
    if (!videoRef.current || !isStreamCamera) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().catch(err => {
        toast.error('Failed to play stream')
        console.error(err)
      })
      setIsPlaying(true)
    }
  }

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen().catch(err => {
        toast.error('Fullscreen failed')
        console.error(err)
      })
    }
  }

  // Manual snapshot refresh
  const refreshSnapshot = () => {
    setIsLoading(true)
    setSnapshotRefreshKey(prev => prev + 1)
    setTimeout(() => setIsLoading(false), 500)
    toast.success('Snapshot refreshed')
  }

  // Render offline state
  if (camera.status === 'offline') {
    return (
      <div
        className={cn(
          'relative aspect-video overflow-hidden rounded-xl bg-black',
          'flex items-center justify-center',
          className
        )}
      >
        <iOS26Error
          variant="offline"
          title="Camera Offline"
          message={`${camera.name} is currently unavailable`}
          action={{
            label: 'Refresh',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn('group relative aspect-video overflow-hidden rounded-xl bg-black', className)}
    >
      {/* iOS 26 Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/90"
          >
            <iOS26Spinner message="Loading Stream" submessage={camera.name} size="md" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS 26 Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/95 p-6"
          >
            <iOS26Reconnecting
              message={error}
              onRetry={() => {
                setError(null)
                setIsLoading(true)
                // Trigger reconnect
                if (camera.streamUrl && hlsRef.current) {
                  hlsRef.current.loadSource(camera.streamUrl)
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HLS Video Stream */}
      {isStreamCamera && (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted={muted}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Snapshot Image */}
      {isSnapshotCamera && camera.snapshotUrl && (
        <img
          key={snapshotRefreshKey}
          src={camera.snapshotUrl}
          alt={camera.name}
          className="h-full w-full object-cover"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('Failed to load snapshot')
            setIsLoading(false)
          }}
        />
      )}

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-2 left-2 z-30"
      >
        <div
          className={cn(
            'rounded-md px-2 py-1 text-xs font-medium backdrop-blur-xl',
            camera.status === 'recording' ? 'bg-red-500/80 text-white' : 'bg-black/50 text-white/90'
          )}
        >
          {camera.status === 'recording' && (
            <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          )}
          {camera.status === 'recording' ? 'Recording' : camera.brand}
        </div>
      </motion.div>

      {/* Controls Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 z-30 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        <div className="absolute right-2 bottom-2 left-2 flex items-center justify-between">
          {/* Camera Info */}
          <div className="text-white">
            <p className="text-sm font-medium">{camera.name}</p>
            <p className="text-xs text-white/70">{camera.location}</p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Play/Pause for streams only */}
            {isStreamCamera && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={togglePlayPause}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl transition-colors hover:bg-white/30"
              >
                {isPlaying ? (
                  <PauseIcon className="h-4 w-4 text-white" />
                ) : (
                  <PlayIcon className="h-4 w-4 text-white" />
                )}
              </motion.button>
            )}

            {/* Refresh for snapshots only */}
            {isSnapshotCamera && (
              <motion.button
                whileTap={{ scale: 0.9, rotate: 180 }}
                onClick={refreshSnapshot}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl transition-colors hover:bg-white/30"
              >
                <RefreshCwIcon className="h-4 w-4 text-white" />
              </motion.button>
            )}

            {/* Fullscreen */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl transition-colors hover:bg-white/30"
            >
              <MaximizeIcon className="h-4 w-4 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Recording Indicator */}
      {camera.status === 'recording' && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-2 right-2 z-30 h-3 w-3 rounded-full bg-red-500"
        />
      )}
    </div>
  )
})
