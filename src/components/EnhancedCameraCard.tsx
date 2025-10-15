/**
 * Enhanced Camera Card Component
 *
 * Beautiful iOS-inspired camera card with:
 * - Live snapshot thumbnails (auto-refresh)
 * - Status indicators (online/offline/warning)
 * - Battery level & signal strength
 * - Hover interactions
 * - Click to open details modal
 * - Long-press context menu
 *
 * Phase 6: Milestone 6.1.1
 */

import { Card } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { Camera } from '@/constants/mock-cameras'
import { useHaptic } from '@/hooks/use-haptic'
import { useLongPress } from '@/hooks/use-long-press'
import {
  BatteryChargingIcon,
  BellIcon,
  CameraIcon,
  PlayIcon,
  SettingsIcon,
  SignalIcon,
  TrashIcon,
  VideoIcon,
  WifiOffIcon,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { memo, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface EnhancedCameraCardProps {
  camera: Camera
  index: number
  onClick: () => void
}

export const EnhancedCameraCard = memo(function EnhancedCameraCard({
  camera,
  index,
  onClick,
}: EnhancedCameraCardProps) {
  const [snapshotKey, setSnapshotKey] = useState(0)
  const haptic = useHaptic()

  // Auto-refresh snapshot every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshotKey(prev => prev + 1)
    }, 30000) // 30s refresh

    return () => clearInterval(interval)
  }, [])

  // Context menu handlers
  const handleRecord = () => {
    haptic.medium()
    toast.success(`Recording started`, {
      description: camera.name,
    })
  }

  const handleSettings = () => {
    haptic.light()
    toast.info(`Camera settings`, {
      description: camera.name,
    })
  }

  const handleDelete = () => {
    haptic.heavy()
    toast.success(`Camera removed`, {
      description: camera.name,
    })
  }

  // Long-press handler for mobile
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      haptic.medium()
    },
    onPress: onClick,
  })

  // Determine status color
  const statusColor =
    {
      online: 'bg-green-500',
      offline: 'bg-red-500',
      recording: 'bg-green-500',
    }[camera.status] || 'bg-gray-500'

  const cardContent = (
    <Card
      className={cn(
        'group bg-card/50 relative cursor-pointer overflow-hidden border-0 backdrop-blur-xl',
        'hover:bg-card/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg'
      )}
    >
      {/* Snapshot Thumbnail */}
      <div className="bg-muted relative aspect-video overflow-hidden">
        {camera.snapshotUrl ? (
          <img
            key={snapshotKey}
            src={`${camera.snapshotUrl}?t=${snapshotKey}`}
            alt={camera.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CameraIcon className="text-muted-foreground h-12 w-12 opacity-50" />
          </div>
        )}

        {/* Status Indicator Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
          <div className={cn('h-2 w-2 rounded-full', statusColor)} />
          <span className="font-medium capitalize">{camera.status}</span>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 right-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {camera.type === 'doorbell' && <BellIcon className="inline-block h-3 w-3" />}
          {camera.type === 'ptz' && <VideoIcon className="inline-block h-3 w-3" />}
          <span className="ml-1 capitalize">{camera.type}</span>
        </div>

        {/* Offline Overlay */}
        {camera.status === 'offline' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <WifiOffIcon className="mx-auto mb-2 h-8 w-8 text-white" />
              <p className="text-sm font-medium text-white">Camera Offline</p>
            </div>
          </div>
        )}

        {/* Hover Action Hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
          <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
            <VideoIcon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Camera Info */}
      <div className="space-y-3 p-4">
        {/* Name & Location */}
        <div>
          <h3 className="font-semibold">{camera.name}</h3>
          <p className="text-muted-foreground text-sm">{camera.location}</p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs">
          {/* Battery Level */}
          {camera.battery !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1',
                camera.battery > 50 && 'text-green-600 dark:text-green-400',
                camera.battery <= 50 &&
                  camera.battery > 20 &&
                  'text-yellow-600 dark:text-yellow-400',
                camera.battery <= 20 && 'text-red-600 dark:text-red-400'
              )}
            >
              <BatteryChargingIcon className="h-4 w-4" />
              <span className="font-medium">{camera.battery}%</span>
            </div>
          )}

          {/* Signal Strength */}
          {camera.signalStrength !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1',
                camera.signalStrength > 70 && 'text-green-600 dark:text-green-400',
                camera.signalStrength <= 70 &&
                  camera.signalStrength > 30 &&
                  'text-yellow-600 dark:text-yellow-400',
                camera.signalStrength <= 30 && 'text-red-600 dark:text-red-400'
              )}
            >
              <SignalIcon className="h-4 w-4" />
              <span className="font-medium">{camera.signalStrength}%</span>
            </div>
          )}

          {/* Recording Indicator */}
          {camera.status === 'online' && camera.capabilities?.localStorage && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="font-medium">REC</span>
            </div>
          )}
        </div>

        {/* Capabilities Pills */}
        {camera.capabilities && (
          <div className="flex flex-wrap gap-1.5">
            {camera.capabilities.ptz && (
              <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium">
                PTZ
              </span>
            )}
            {camera.capabilities.nightVision && (
              <span className="bg-muted rounded-md px-2 py-0.5 text-xs">Night Vision</span>
            )}
            {camera.capabilities.spotlight && (
              <span className="bg-muted rounded-md px-2 py-0.5 text-xs">Spotlight</span>
            )}
            {camera.capabilities.twoWayAudio && (
              <span className="bg-muted rounded-md px-2 py-0.5 text-xs">2-Way Audio</span>
            )}
          </div>
        )}
      </div>

      {/* Click Hint (Bottom Right) */}
      <div className="text-muted-foreground absolute right-2 bottom-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
        Click to view details
      </div>
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div {...longPressHandlers}>{cardContent}</div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleRecord} className="gap-2">
            <PlayIcon className="h-4 w-4" />
            Start Recording
          </ContextMenuItem>
          <ContextMenuItem onClick={handleSettings} className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Camera Settings
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleDelete} className="gap-2 text-red-600 dark:text-red-400">
            <TrashIcon className="h-4 w-4" />
            Remove Camera
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  )
})
