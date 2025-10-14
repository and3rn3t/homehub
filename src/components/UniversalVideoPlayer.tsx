import Hls from 'hls.js'
import { useEffect, useRef, useState } from 'react'
// @ts-expect-error - dashjs doesn't have TypeScript definitions
import { MaximizeIcon, PauseIcon, PlayIcon, VolumeIcon, VolumeOffIcon } from '@/lib/icons'
import dashjs from 'dashjs'

interface UniversalVideoPlayerProps {
  readonly streamUrl: string
  readonly snapshotUrl?: string
  readonly cameraName?: string
}

/**
 * Universal Video Player Component
 *
 * Supports both HLS (.m3u8) and MPEG-DASH (.mpd) streaming formats.
 * Automatically detects stream type and initializes the appropriate player.
 *
 * Features:
 * - HLS.js for HLS streams (with Safari native support fallback)
 * - DASH.js for MPEG-DASH streams
 * - Automatic format detection based on URL extension
 * - Error recovery and retry logic
 * - Video controls (play/pause, mute, fullscreen)
 * - Loading and error states
 *
 * @param streamUrl - Stream URL (HLS or DASH manifest)
 * @param snapshotUrl - Optional snapshot fallback image
 * @param cameraName - Optional camera name for display
 */
export function UniversalVideoPlayer({
  streamUrl,
  snapshotUrl,
  cameraName = 'Camera',
}: UniversalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const dashRef = useRef<any>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true) // Start muted for autoplay
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamType, setStreamType] = useState<'hls' | 'dash' | 'native' | null>(null)

  // Detect stream type from URL
  useEffect(() => {
    if (streamUrl.includes('.m3u8')) {
      setStreamType('hls')
    } else if (streamUrl.includes('.mpd')) {
      setStreamType('dash')
    } else {
      console.warn('[UniversalVideoPlayer] Unknown stream format, defaulting to HLS')
      setStreamType('hls')
    }
  }, [streamUrl])

  // Initialize video player based on stream type
  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamType) return

    console.log(
      `[UniversalVideoPlayer] Initializing ${streamType.toUpperCase()} player for ${cameraName}`
    )
    console.log('[UniversalVideoPlayer] Stream URL:', streamUrl)

    // Cleanup function
    const cleanup = () => {
      if (hlsRef.current) {
        console.log('[UniversalVideoPlayer] Destroying HLS instance')
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (dashRef.current) {
        console.log('[UniversalVideoPlayer] Destroying DASH instance')
        dashRef.current.reset()
        dashRef.current = null
      }
    }

    // HLS Stream
    if (streamType === 'hls') {
      // Check for native HLS support (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('[UniversalVideoPlayer] Using native HLS support')
        video.src = streamUrl
        setStreamType('native')
        setIsLoading(false)

        video.addEventListener('loadeddata', () => {
          console.log('[UniversalVideoPlayer] Native HLS loaded')
          video.play().catch(err => {
            console.warn('[UniversalVideoPlayer] Autoplay failed:', err)
          })
        })
      }
      // Use HLS.js for browsers without native support
      else if (Hls.isSupported()) {
        console.log('[UniversalVideoPlayer] Using HLS.js')

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
        })

        hlsRef.current = hls

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log('[UniversalVideoPlayer] HLS media attached')
          hls.loadSource(streamUrl)
        })

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('[UniversalVideoPlayer] HLS manifest parsed')
          setIsLoading(false)
          video.play().catch(err => {
            console.warn('[UniversalVideoPlayer] Autoplay failed:', err)
            setError('Click play to start stream')
          })
        })

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('[UniversalVideoPlayer] HLS error:', data)

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('[UniversalVideoPlayer] Fatal network error, attempting recovery...')
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('[UniversalVideoPlayer] Fatal media error, attempting recovery...')
                hls.recoverMediaError()
                break
              default:
                console.error('[UniversalVideoPlayer] Fatal error, cannot recover')
                setError('Stream playback failed. Please try again.')
                hls.destroy()
                break
            }
          }
        })

        hls.attachMedia(video)
      } else {
        console.error('[UniversalVideoPlayer] HLS not supported in this browser')
        setError('Video streaming not supported in this browser')
        setIsLoading(false)
      }
    }

    // DASH Stream
    if (streamType === 'dash') {
      console.log('[UniversalVideoPlayer] Using DASH.js')

      const player = dashjs.MediaPlayer().create()
      dashRef.current = player

      player.initialize(video, streamUrl, true) // autoPlay = true

      player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
        console.log('[UniversalVideoPlayer] DASH stream initialized')
        setIsLoading(false)
      })

      player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => {
        console.log('[UniversalVideoPlayer] DASH playback started')
        setIsPlaying(true)
      })

      player.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, () => {
        console.log('[UniversalVideoPlayer] DASH playback paused')
        setIsPlaying(false)
      })

      player.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
        console.error('[UniversalVideoPlayer] DASH error:', e)
        setError('Stream playback failed. Please try again.')
        setIsLoading(false)
      })

      // Configure DASH settings for low latency
      player.updateSettings({
        streaming: {
          lowLatencyEnabled: true,
          liveDelay: 3, // 3 seconds delay for live streams
          delay: {
            liveDelay: 3,
          },
        },
      })
    }

    return cleanup
  }, [streamUrl, streamType, cameraName])

  // Handle play/pause
  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true)
          setError(null)
        })
        .catch(err => {
          console.error('[UniversalVideoPlayer] Play failed:', err)
          setError('Failed to play stream')
        })
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  // Handle mute/unmute
  const handleMuteToggle = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  // Handle fullscreen
  const handleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(err => {
        console.error('[UniversalVideoPlayer] Fullscreen failed:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // Show snapshot fallback if error and snapshot available
  if (error && snapshotUrl) {
    return (
      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg">
        <img src={snapshotUrl} alt={cameraName} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setIsLoading(true)
              }}
              className="bg-primary hover:bg-primary/90 mt-2 rounded px-4 py-2 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        muted={isMuted}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <track kind="captions" />
      </video>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75">
          <div className="text-center text-white">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-sm">Loading stream...</p>
            <p className="mt-1 text-xs text-white/70">{streamType?.toUpperCase()} Player</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !snapshotUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75">
          <div className="text-center text-white">
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Video Controls */}
      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/30"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="h-5 w-5 text-white" />
              ) : (
                <PlayIcon className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={handleMuteToggle}
              className="rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/30"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeOffIcon className="h-5 w-5 text-white" />
              ) : (
                <VolumeIcon className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Stream Type Indicator */}
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white uppercase backdrop-blur-sm">
              {streamType === 'native' ? 'HLS' : streamType}
            </span>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/30"
              aria-label="Fullscreen"
            >
              <MaximizeIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
