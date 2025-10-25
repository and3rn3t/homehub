/**
 * iOS-Style Bottom Sheet Component
 *
 * Mobile: Full-screen bottom sheet with drag handle
 * Desktop: Centered modal dialog
 *
 * Features:
 * - Swipe down to dismiss on mobile
 * - Drag handle indicator
 * - Safe-area aware
 * - Smooth spring animations
 */

import { XIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, PanInfo } from 'framer-motion'
import { ComponentProps, useRef, useState } from 'react'

function BottomSheet({ ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="bottom-sheet" {...props} />
}

function BottomSheetTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />
}

function BottomSheetPortal({ ...props }: ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="bottom-sheet-portal" {...props} />
}

function BottomSheetClose({ ...props }: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="bottom-sheet-close" {...props} />
}

function BottomSheetOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="bottom-sheet-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
        className
      )}
      {...props}
    />
  )
}

interface BottomSheetContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  /**
   * Whether to show the drag handle on mobile
   * @default true
   */
  showHandle?: boolean
  /**
   * Max height on mobile (% of viewport)
   * @default 90
   */
  maxHeightMobile?: number
  /**
   * Whether content is scrollable
   * @default true
   */
  scrollable?: boolean
}

function BottomSheetContent({
  className,
  children,
  showHandle = true,
  maxHeightMobile = 90,
  scrollable = true,
  ...props
}: BottomSheetContentProps) {
  const [dragY, setDragY] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // If dragged down more than 100px with downward velocity, close
    if (info.offset.y > 100 && info.velocity.y > 0) {
      // Trigger close via dialog primitive
      const closeButton = contentRef.current?.querySelector('[data-slot="bottom-sheet-close"]')
      if (closeButton instanceof HTMLElement) {
        closeButton.click()
      }
    }
    setDragY(0)
  }

  return (
    <BottomSheetPortal data-slot="bottom-sheet-portal">
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="bottom-sheet-content"
        className={cn(
          'fixed z-50 grid w-full gap-4 border shadow-lg duration-200',
          // Mobile: Bottom sheet style
          'safe-bottom inset-x-0 bottom-0 rounded-t-3xl pb-4',
          `max-h-[${maxHeightMobile}vh]`,
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full',
          // Desktop: Centered modal
          'sm:inset-x-auto sm:bottom-auto sm:left-[50%] sm:top-[50%]',
          'sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:rounded-lg sm:pb-6',
          'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
          'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
          // Styling
          'bg-background',
          className
        )}
        {...props}
      >
        {/* Drag handle (mobile only) */}
        {showHandle && (
          <motion.div
            className="bg-muted mx-auto mb-2 mt-3 h-1.5 w-12 cursor-grab rounded-full active:cursor-grabbing sm:hidden"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDrag={(_, info) => setDragY(info.offset.y)}
            onDragEnd={handleDragEnd}
            style={{ y: dragY }}
          />
        )}

        {/* Content wrapper with optional scroll */}
        <div
          className={cn(
            'flex flex-col gap-4 px-6',
            scrollable && 'mobile-scroll max-h-full overflow-y-auto'
          )}
        >
          {children}
        </div>

        {/* Close button (desktop) */}
        <DialogPrimitive.Close
          data-slot="bottom-sheet-close"
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground focus:outline-hidden absolute right-4 top-4 hidden rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none sm:inline-flex"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </BottomSheetPortal>
  )
}

function BottomSheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn('flex flex-col gap-1.5 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function BottomSheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="bottom-sheet-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function BottomSheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DialogPrimitive.Title
      data-slot="bottom-sheet-title"
      className={cn('text-foreground text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function BottomSheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <DialogPrimitive.Description
      data-slot="bottom-sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
}
