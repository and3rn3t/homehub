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

export {
  AutomationCardSkeleton,
  DeviceCardSkeleton,
  RoomCardSkeleton,
  SceneCardSkeleton,
  Skeleton,
  StatusCardSkeleton,
  UserCardSkeleton,
}
