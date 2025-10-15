/**
 * DoorbellNotification Component
 *
 * iOS-styled fullscreen notification when someone rings the doorbell.
 * Shows live snapshot, visitor info, and quick action buttons.
 *
 * Features:
 * - Fullscreen modal with backdrop blur
 * - Live snapshot from doorbell camera
 * - Quick action buttons (Answer, Ignore, Quick Reply)
 * - Visitor identification
 * - Auto-dismiss timer
 * - Spring animations
 */

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BellIcon, MessageIcon, PackageIcon, PhoneIcon, UserIcon, XIcon } from '@/lib/icons'
import type { DoorbellEvent } from '@/types/security.types'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DoorbellNotificationProps {
  /** Doorbell event to display */
  event: DoorbellEvent

  /** Whether the notification is visible */
  isOpen: boolean

  /** Callback when notification is closed */
  onClose: () => void

  /** Callback when "Answer" is clicked */
  onAnswer?: (eventId: string) => void

  /** Callback when "Ignore" is clicked */
  onIgnore?: (eventId: string) => void

  /** Callback when "Quick Reply" is clicked */
  onQuickReply?: (eventId: string, message: string) => void

  /** Quick reply messages */
  quickReplyMessages?: string[]

  /** Auto-dismiss after X seconds (0 = no auto-dismiss) */
  autoDismissAfter?: number
}

export const DoorbellNotification = memo(function DoorbellNotification({
  event,
  isOpen,
  onClose,
  onAnswer,
  onIgnore,
  onQuickReply,
  quickReplyMessages = ["I'll be right there!", 'Please leave the package at the door.'],
  autoDismissAfter = 30,
}: DoorbellNotificationProps) {
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(autoDismissAfter)

  const handleAnswer = () => {
    onAnswer?.(event.id)
    toast.success('Answering doorbell...', {
      description: 'Opening two-way audio',
    })
    onClose()
  }

  const handleIgnore = () => {
    onIgnore?.(event.id)
    onClose()
  }

  const handleQuickReply = (message: string) => {
    onQuickReply?.(event.id, message)
    toast.success('Quick reply sent', {
      description: message,
    })
    onClose()
  }

  // Auto-dismiss timer
  useEffect(() => {
    if (!isOpen || autoDismissAfter === 0) return

    setTimeRemaining(autoDismissAfter)

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleIgnore()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoDismissAfter])

  // Visitor display info
  const visitorName =
    event.visitorInfo?.name ||
    event.visitorInfo?.deliveryService ||
    (event.actionType === 'motion_detected' ? 'Motion Detected' : 'Unknown Visitor')

  // Determine visitor icon
  let visitorIcon: React.ReactNode
  if (event.visitorInfo?.deliveryService) {
    visitorIcon = <PackageIcon className="h-6 w-6" />
  } else if (event.actionType === 'package_detected') {
    visitorIcon = <PackageIcon className="h-6 w-6" />
  } else {
    visitorIcon = <UserIcon className="h-6 w-6" />
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            onClick={handleIgnore}
          />

          {/* Notification Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            className="fixed inset-4 z-50 m-auto flex h-fit max-h-[90vh] w-full max-w-2xl flex-col items-center justify-center md:inset-0"
          >
            <Card className="bg-card/95 w-full overflow-hidden border-2 border-white/10 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="border-border flex items-center justify-between border-b bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full"
                  >
                    <BellIcon className="text-primary h-6 w-6" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold">Someone's at the door</h2>
                    <p className="text-muted-foreground text-sm">
                      {event.actionType === 'button_press' && 'Doorbell pressed'}
                      {event.actionType === 'motion_detected' && 'Motion detected'}
                      {event.actionType === 'package_detected' && 'Package detected'}
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleIgnore}
                  className="hover:bg-destructive/10"
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Snapshot */}
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                {event.snapshotUrl ? (
                  <img
                    src={event.snapshotUrl}
                    alt="Doorbell snapshot"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <p className="text-muted-foreground">No snapshot available</p>
                  </div>
                )}

                {/* Visitor info overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 backdrop-blur-sm"
                >
                  <div className="text-white">{visitorIcon}</div>
                  <span className="font-medium text-white">{visitorName}</span>
                  {event.visitorInfo?.isRepeatVisitor && (
                    <span className="bg-primary/20 rounded-full px-2 py-0.5 text-xs text-white">
                      Repeat Visitor
                    </span>
                  )}
                </motion.div>

                {/* Timer overlay */}
                {autoDismissAfter > 0 && timeRemaining > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 right-4 rounded-lg bg-black/70 px-3 py-1 backdrop-blur-sm"
                  >
                    <span className="text-sm font-medium text-white">{timeRemaining}s</span>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              {!showQuickReplies ? (
                <div className="grid grid-cols-3 gap-3 p-4">
                  {/* Answer */}
                  <Button
                    onClick={handleAnswer}
                    className="bg-primary hover:bg-primary/90 h-16 flex-col gap-1"
                    size="lg"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    <span className="text-xs">Answer</span>
                  </Button>

                  {/* Quick Reply */}
                  <Button
                    onClick={() => setShowQuickReplies(true)}
                    variant="secondary"
                    className="h-16 flex-col gap-1"
                    size="lg"
                  >
                    <MessageIcon className="h-5 w-5" />
                    <span className="text-xs">Quick Reply</span>
                  </Button>

                  {/* Ignore */}
                  <Button
                    onClick={handleIgnore}
                    variant="outline"
                    className="h-16 flex-col gap-1"
                    size="lg"
                  >
                    <XIcon className="h-5 w-5" />
                    <span className="text-xs">Ignore</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Quick Replies</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowQuickReplies(false)}>
                      Back
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {quickReplyMessages.map(message => (
                      <motion.div
                        key={message}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Button
                          onClick={() => handleQuickReply(message)}
                          variant="outline"
                          className="h-auto w-full justify-start p-3 text-left"
                        >
                          <MessageIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{message}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
