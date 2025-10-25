import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

/**
 * Skeleton Loader Component
 *
 * A loading placeholder that mimics the shape of content while it's being loaded.
 * Uses a pulse animation for visual feedback with shimmer effect.
 */
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'bg-muted/50 animate-pulse rounded-md',
        'relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:-translate-x-full before:animate-[shimmer_2s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    />
  )
}

/**
 * Device Card Skeleton
 * Mimics the layout of a device card in Dashboard
 */
function DeviceCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Scene Card Skeleton
 * Mimics the layout of a scene card
 */
function SceneCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/**
 * Status Card Skeleton
 * Mimics the layout of status cards in Dashboard
 */
function StatusCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="flex flex-col items-center space-y-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-6 w-8" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

/**
 * Room Card Skeleton
 * Mimics the layout of room cards
 */
function RoomCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

/**
 * Automation Card Skeleton
 * Mimics the layout of automation cards
 */
function AutomationCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>
    </div>
  )
}

/**
 * User Card Skeleton
 * Mimics the layout of user cards
 */
function UserCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )
}

/**
 * Flow Designer Skeleton
 * Mimics the layout of the flow designer canvas
 */
function FlowDesignerSkeleton() {
  return (
    <div className="flex h-full">
      {/* Palette Skeleton */}
      <div className="bg-card border-border w-80 border-r p-4">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="mb-4 grid grid-cols-4 gap-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`tab-${i}`} className="h-8" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={`node-${i}`} className="h-14" />
          ))}
        </div>
      </div>

      {/* Canvas Skeleton */}
      <div className="bg-muted/20 flex flex-1 flex-col">
        <div className="border-border flex items-center justify-between border-b p-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="flex gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={`flow-node-${i}`} className="space-y-4">
                <Skeleton className="h-24 w-48 rounded-lg" />
                {i < 2 && <Skeleton className="mx-auto h-8 w-8 rounded-full" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Energy Chart Skeleton
 * Mimics the layout of energy consumption charts
 */
function EnergyChartSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={`stat-${i}`} className="bg-card rounded-lg border p-4">
            <Skeleton className="mx-auto mb-2 h-5 w-5 rounded-full" />
            <Skeleton className="mx-auto mb-1 h-6 w-16" />
            <Skeleton className="mx-auto h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="bg-card rounded-lg border p-6">
        <Skeleton className="mb-6 h-6 w-40" />
        <div className="flex h-64 items-end justify-between gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={`bar-${i}`} className="flex flex-1 flex-col items-center gap-2">
              <Skeleton className="w-full" style={{ height: `${40 + Math.random() * 60}%` }} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Device Usage */}
      <div className="bg-card rounded-lg border p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={`device-${i}`} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export {
  AutomationCardSkeleton,
  DeviceCardSkeleton,
  EnergyChartSkeleton,
  FlowDesignerSkeleton,
  RoomCardSkeleton,
  SceneCardSkeleton,
  Skeleton,
  StatusCardSkeleton,
  UserCardSkeleton,
}
