/**
 * HLS Video Player
 *
 * Advanced video player with HLS.js support for live streaming.
 * Falls back to snapshot display if streaming is unavailable.
 * Part of Phase 6 Milestone 6.1.3.
 */

import { Button } from '@/components/ui/button'
import type { Camera } from '@/constants/mock-cameras'
import {
  MaximizeIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon as Volume2Icon,
  VolumeOffIcon as VolumeXIcon,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import Hls from 'hls.js'
import { useEffect, useRef, useState } from 'react'

interface HLSVideoPlayerProps {
  camera: Camera
  streamUrl?: string | null
  autoplay?: boolean
  muted?: boolean
  className?: string
  onStreamEnd?: () => void
}

export function HLSVideoPlayer({
  camera,
  streamUrl,
  autoplay = true,
  muted = true,
  className,
  onStreamEnd,
}: Readonly<HLSVideoPlayerProps>) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useSnapshot, setUseSnapshot] = useState(!streamUrl)

  // Initialize HLS player
  useEffect(() => {
    if (!videoRef.current || !streamUrl || useSnapshot) return

    const video = videoRef.current

    // Check if HLS is supported
    if (Hls.isSupported()) {
      console.log('[HLSVideoPlayer] Initializing HLS.js for', camera.name)

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      })

      hlsRef.current = hls

      // Bind video element
      hls.attachMedia(video)

      // Handle media attached
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('[HLSVideoPlayer] Media attached, loading manifest...')
        hls.loadSource(streamUrl)
      })

      // Handle manifest parsed
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[HLSVideoPlayer] Manifest loaded, starting playback')
        setIsLoading(false)
        setError(null)
        if (autoplay) {
          video.play().catch(err => {
            console.warn('[HLSVideoPlayer] Autoplay blocked:', err)
            setIsPlaying(false)
          })
        }
      })

      // Handle errors
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('[HLSVideoPlayer] HLS error:', data)

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('[HLSVideoPlayer] Fatal network error, trying to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('[HLSVideoPlayer] Fatal media error, trying to recover...')
              hls.recoverMediaError()
              break
            default:
              console.error('[HLSVideoPlayer] Unrecoverable error, falling back to snapshot')
              setError('Stream unavailable')
              setUseSnapshot(true)
              hls.destroy()
              break
          }
        }
      })

      return () => {
        console.log('[HLSVideoPlayer] Cleaning up HLS instance')
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      console.log('[HLSVideoPlayer] Using native HLS support')
      video.src = streamUrl

      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false)
        if (autoplay) {
          video.play().catch(err => {
            console.warn('[HLSVideoPlayer] Autoplay blocked:', err)
            setIsPlaying(false)
          })
        }
      })

      video.addEventListener('error', () => {
        console.error('[HLSVideoPlayer] Native playback error')
        setError('Stream unavailable')
        setUseSnapshot(true)
      })

      return () => {
        video.removeEventListener('loadedmetadata', () => {})
        video.removeEventListener('error', () => {})
      }
    } else {
      // HLS not supported, fallback to snapshot
      console.warn('[HLSVideoPlayer] HLS not supported, using snapshot')
      setUseSnapshot(true)
      setIsLoading(false)
      return () => {} // No cleanup needed
    }
  }, [streamUrl, camera.name, autoplay, useSnapshot])

  // Handle play/pause
  const handlePlayPause = async () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await videoRef.current.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('[HLSVideoPlayer] Play failed:', err)
      }
    }
  }

  // Handle mute/unmute
  const handleMuteToggle = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // Handle fullscreen
  const handleFullscreen = async () => {
    if (!videoRef.current) return

    try {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          await videoRef.current.requestFullscreen()
        }
        setIsFullscreen(true)
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('[HLSVideoPlayer] Fullscreen failed:', err)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Fallback to snapshot if no stream URL or error
  if (useSnapshot || !streamUrl) {
    return (
      <div className={cn('bg-muted relative', className)}>
        <img
          src={camera.snapshotUrl}
          alt={camera.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-sm text-white">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('group relative bg-black', className)}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="h-full w-full"
        muted={isMuted}
        playsInline
        onEnded={() => {
          setIsPlaying(false)
          onStreamEnd?.()
        }}
      >
        {/* Empty track for accessibility */}
        <track kind="captions" />
      </video>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-sm text-white">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-2">
              {/* Mute/Unmute */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMuteToggle}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeXIcon className="h-5 w-5" />
                ) : (
                  <Volume2Icon className="h-5 w-5" />
                )}
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <MaximizeIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center text-white">
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-sm text-white/70">Showing snapshot instead</p>
          </div>
        </div>
      )}
    </div>
  )
}
