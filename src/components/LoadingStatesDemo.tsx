import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AutomationCardSkeleton,
  DeviceCardSkeleton,
  RoomCardSkeleton,
  SceneCardSkeleton,
  Skeleton,
  StatusCardSkeleton,
  UserCardSkeleton,
} from '@/components/ui/skeleton'
import {
  ButtonSpinner,
  DotsSpinner,
  InlineSpinner,
  LoadingOverlay,
  PulseSpinner,
  Spinner,
} from '@/components/ui/spinner'
import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Loading States Demo Component
 *
 * Showcases all loading states, spinners, and skeleton loaders.
 * Useful for testing and demonstrating loading UI patterns.
 */
export function LoadingStatesDemo() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)

  const handleButtonClick = () => {
    setButtonLoading(true)
    setTimeout(() => setButtonLoading(false), 2000)
  }

  const handleOverlayClick = () => {
    setShowOverlay(true)
    setTimeout(() => setShowOverlay(false), 3000)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-bold">Loading States</h1>
          <p className="text-muted-foreground">Spinners and skeleton loaders showcase</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-8">
          {/* Spinners Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Spinners</CardTitle>
                <CardDescription>Various spinner styles for different use cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Size Variants */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Size Variants</h3>
                  <div className="flex items-end gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size="sm" />
                      <span className="text-muted-foreground text-xs">Small</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size="md" />
                      <span className="text-muted-foreground text-xs">Medium</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size="lg" />
                      <span className="text-muted-foreground text-xs">Large</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size="xl" />
                      <span className="text-muted-foreground text-xs">Extra Large</span>
                    </div>
                  </div>
                </div>

                {/* Spinner Styles */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Spinner Styles</h3>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size="md" />
                      <span className="text-muted-foreground text-xs">Default</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <DotsSpinner />
                      <span className="text-muted-foreground text-xs">Dots</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <PulseSpinner />
                      <span className="text-muted-foreground text-xs">Pulse</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <InlineSpinner />
                      <span className="text-muted-foreground text-xs">Inline</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Examples */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Interactive Examples</h3>
                  <div className="flex gap-3">
                    <Button onClick={handleButtonClick} disabled={buttonLoading}>
                      {buttonLoading ? (
                        <>
                          <ButtonSpinner />
                          <span className="ml-2">Loading...</span>
                        </>
                      ) : (
                        'Load Data'
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleOverlayClick}>
                      Show Overlay
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skeleton Loaders Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loaders</CardTitle>
                <CardDescription>Content placeholders while data loads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Skeleton */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Basic Shapes</h3>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Skeletons */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Component Skeletons</h3>
                  <div className="grid gap-4">
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs">Status Card</p>
                      <StatusCardSkeleton />
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs">Device Card</p>
                      <DeviceCardSkeleton />
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs">Room Card</p>
                      <RoomCardSkeleton />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* More Skeleton Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Feature-Specific Skeletons</CardTitle>
                <CardDescription>Specialized loaders for different components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs">Scene Card</p>
                    <SceneCardSkeleton />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs">Scene Card</p>
                    <SceneCardSkeleton />
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-2 text-xs">Automation Card</p>
                    <AutomationCardSkeleton />
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-2 text-xs">User Card</p>
                    <UserCardSkeleton />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Loading Overlay */}
      {showOverlay && <LoadingOverlay message="Loading data..." />}
    </div>
  )
}
