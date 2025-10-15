/**
 * DoorbellHistory Component
 *
 * Timeline view of all doorbell events with filtering and stats.
 *
 * Features:
 * - Event timeline with thumbnails
 * - Filter by date range and status
 * - Visitor statistics
 * - Event details modal
 * - iOS-styled animations
 */

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MOCK_DOORBELL_EVENTS } from '@/constants/mock-doorbell-events'
import {
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  FilterIcon,
  MessageIcon,
  PackageIcon,
  PhoneIcon,
  UserIcon,
  XIcon,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { DoorbellEvent } from '@/types/security.types'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'

interface DoorbellHistoryProps {
  /** Custom events (defaults to mock data) */
  events?: DoorbellEvent[]
}

export const DoorbellHistory = memo(function DoorbellHistory({
  events = MOCK_DOORBELL_EVENTS,
}: DoorbellHistoryProps) {
  const [selectedEvent, setSelectedEvent] = useState<DoorbellEvent | null>(null)
  const [filter, setFilter] = useState<'all' | 'answered' | 'missed' | 'ignored'>('all')

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    if (filter === 'answered') return event.responseStatus === 'answered'
    if (filter === 'missed') return event.responseStatus === 'missed'
    if (filter === 'ignored')
      return event.responseStatus === 'ignored' || event.responseStatus === 'quick_reply'
    return true
  })

  // Statistics
  const stats = {
    total: events.length,
    answered: events.filter(e => e.responseStatus === 'answered').length,
    missed: events.filter(e => e.responseStatus === 'missed').length,
    ignored: events.filter(
      e => e.responseStatus === 'ignored' || e.responseStatus === 'quick_reply'
    ).length,
  }

  // Format date for grouping
  const formatEventDate = (timestamp: Date | string) => {
    const date = new Date(timestamp)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  // Group events by date
  const groupedEvents = filteredEvents.reduce(
    (acc, event) => {
      const dateKey = formatEventDate(event.timestamp)
      const existing = acc[dateKey]
      if (existing) {
        existing.push(event)
      } else {
        acc[dateKey] = [event]
      }
      return acc
    },
    {} as Record<string, DoorbellEvent[]>
  )

  // Get status badge style
  const getStatusStyle = (status: DoorbellEvent['responseStatus']) => {
    switch (status) {
      case 'answered':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      case 'missed':
        return 'bg-red-500/10 text-red-600 dark:text-red-400'
      case 'ignored':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
      case 'quick_reply':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    }
  }

  // Get status icon
  const getStatusIcon = (status: DoorbellEvent['responseStatus']) => {
    switch (status) {
      case 'answered':
        return <PhoneIcon className="h-3 w-3" />
      case 'missed':
        return <XIcon className="h-3 w-3" />
      case 'ignored':
        return <XIcon className="h-3 w-3" />
      case 'quick_reply':
        return <MessageIcon className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-card/50 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <BellIcon className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-muted-foreground text-xs">Total Events</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-card/50 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.answered}</p>
                <p className="text-muted-foreground text-xs">Answered</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <XIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.missed}</p>
                <p className="text-muted-foreground text-xs">Missed</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card/50 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/10">
                <MessageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ignored}</p>
                <p className="text-muted-foreground text-xs">Quick Reply</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="gap-2"
        >
          <FilterIcon className="h-4 w-4" />
          All ({stats.total})
        </Button>
        <Button
          variant={filter === 'answered' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('answered')}
        >
          Answered ({stats.answered})
        </Button>
        <Button
          variant={filter === 'missed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('missed')}
        >
          Missed ({stats.missed})
        </Button>
        <Button
          variant={filter === 'ignored' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('ignored')}
        >
          Ignored ({stats.ignored})
        </Button>
      </div>

      {/* Event Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="text-muted-foreground h-4 w-4" />
              <h3 className="text-muted-foreground text-sm font-medium">{date}</h3>
            </div>

            {/* Events for this date */}
            <div className="space-y-2">
              {dateEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      'bg-card/50 group hover:bg-card/80 cursor-pointer overflow-hidden backdrop-blur-xl transition-all',
                      !event.viewed && 'border-primary/50'
                    )}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex gap-4 p-4">
                      {/* Thumbnail */}
                      {event.snapshotUrl && (
                        <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-black">
                          <img
                            src={event.snapshotUrl}
                            alt="Doorbell snapshot"
                            className="h-full w-full object-cover"
                          />
                          {!event.viewed && (
                            <div className="bg-primary/20 absolute inset-0 backdrop-blur-[1px]" />
                          )}
                        </div>
                      )}

                      {/* Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {event.visitorInfo?.deliveryService ? (
                                <PackageIcon className="text-muted-foreground h-4 w-4" />
                              ) : (
                                <UserIcon className="text-muted-foreground h-4 w-4" />
                              )}
                              <span className="font-medium">
                                {event.visitorInfo?.name ||
                                  event.visitorInfo?.deliveryService ||
                                  'Unknown Visitor'}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={cn(
                                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                getStatusStyle(event.responseStatus)
                              )}
                            >
                              {getStatusIcon(event.responseStatus)}
                              {event.responseStatus === 'quick_reply'
                                ? 'Quick Reply'
                                : event.responseStatus}
                            </span>
                          </div>

                          {event.quickReplyMessage && (
                            <p className="text-muted-foreground mt-1 text-sm italic">
                              "{event.quickReplyMessage}"
                            </p>
                          )}
                        </div>

                        {/* Time and wait duration */}
                        <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </span>
                          {event.waitDuration && <span>Waited {event.waitDuration}s</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <Card className="bg-card/50 p-12 text-center backdrop-blur-xl">
            <BellIcon className="text-muted-foreground mx-auto h-12 w-12 opacity-50" />
            <p className="text-muted-foreground mt-4">No doorbell events found</p>
            <p className="text-muted-foreground text-sm">
              Events will appear here when someone rings your doorbell
            </p>
          </Card>
        )}
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 z-50 m-auto flex h-fit max-h-[90vh] w-full max-w-2xl flex-col items-center justify-center md:inset-0"
            >
              <Card className="bg-card/95 w-full overflow-hidden shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="border-border flex items-center justify-between border-b p-4">
                  <h2 className="text-lg font-bold">Event Details</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>

                {/* Snapshot */}
                {selectedEvent.snapshotUrl && (
                  <div className="aspect-video w-full overflow-hidden bg-black">
                    <img
                      src={selectedEvent.snapshotUrl}
                      alt="Doorbell snapshot"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-4 p-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Visitor</p>
                    <p className="font-medium">
                      {selectedEvent.visitorInfo?.name ||
                        selectedEvent.visitorInfo?.deliveryService ||
                        'Unknown Visitor'}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-sm">Time</p>
                    <p className="font-medium">
                      {format(new Date(selectedEvent.timestamp), 'PPpp')}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-sm">Status</p>
                    <span
                      className={cn(
                        'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                        getStatusStyle(selectedEvent.responseStatus)
                      )}
                    >
                      {getStatusIcon(selectedEvent.responseStatus)}
                      {selectedEvent.responseStatus === 'quick_reply'
                        ? 'Quick Reply'
                        : selectedEvent.responseStatus}
                    </span>
                  </div>

                  {selectedEvent.quickReplyMessage && (
                    <div>
                      <p className="text-muted-foreground text-sm">Quick Reply Message</p>
                      <p className="font-medium italic">"{selectedEvent.quickReplyMessage}"</p>
                    </div>
                  )}

                  {selectedEvent.waitDuration && (
                    <div>
                      <p className="text-muted-foreground text-sm">Wait Time</p>
                      <p className="font-medium">{selectedEvent.waitDuration} seconds</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
})
