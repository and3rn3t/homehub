/**
 * Mock Doorbell Events
 *
 * Realistic doorbell event data for testing the Arlo doorbell integration
 */

import type { DoorbellEvent } from '@/types/security.types'

/**
 * Quick reply message templates
 */
export const DEFAULT_QUICK_REPLIES = [
  "I'll be right there!",
  'Please leave the package at the door.',
  'Not interested, thank you.',
  'Please come back later.',
  'One moment, please!',
]

/**
 * Recent doorbell events (last 7 days)
 */
export const MOCK_DOORBELL_EVENTS: DoorbellEvent[] = [
  // Today - Delivery
  {
    id: 'doorbell-event-1',
    cameraId: 'arlo-doorbell-front',
    actionType: 'button_press',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=Amazon+Delivery',
    responseStatus: 'answered',
    respondedAt: new Date(Date.now() - 1000 * 60 * 14),
    visitorInfo: {
      deliveryService: 'Amazon',
      isRepeatVisitor: true,
    },
    waitDuration: 12,
    notificationSent: true,
    viewed: true,
  },

  // Today - Motion (no button press)
  {
    id: 'doorbell-event-2',
    cameraId: 'arlo-doorbell-front',
    actionType: 'motion_detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=Motion+Detected',
    responseStatus: 'ignored',
    visitorInfo: {
      isRepeatVisitor: false,
    },
    notificationSent: true,
    viewed: true,
  },

  // Yesterday - Neighbor
  {
    id: 'doorbell-event-3',
    cameraId: 'arlo-doorbell-front',
    actionType: 'button_press',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20), // 20 hours ago
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=Neighbor+Visit',
    responseStatus: 'quick_reply',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 20 + 1000 * 8),
    quickReplyMessage: "I'll be right there!",
    visitorInfo: {
      name: 'John (Neighbor)',
      isRepeatVisitor: true,
    },
    waitDuration: 8,
    notificationSent: true,
    viewed: true,
  },

  // Yesterday - Missed delivery
  {
    id: 'doorbell-event-4',
    cameraId: 'arlo-doorbell-front',
    actionType: 'button_press',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26), // 26 hours ago
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=FedEx+Delivery',
    responseStatus: 'missed',
    visitorInfo: {
      deliveryService: 'FedEx',
      isRepeatVisitor: false,
    },
    waitDuration: 45,
    notificationSent: true,
    viewed: true,
  },

  // 2 days ago - Package delivery
  {
    id: 'doorbell-event-5',
    cameraId: 'arlo-doorbell-front',
    actionType: 'package_detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=Package+Delivered',
    responseStatus: 'ignored',
    visitorInfo: {
      deliveryService: 'USPS',
      isRepeatVisitor: true,
    },
    notificationSent: true,
    viewed: true,
  },

  // 3 days ago - Friend visit
  {
    id: 'doorbell-event-6',
    cameraId: 'arlo-doorbell-front',
    actionType: 'button_press',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=Friend+Visit',
    responseStatus: 'answered',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 72 + 1000 * 5),
    visitorInfo: {
      name: 'Sarah',
      isRepeatVisitor: true,
    },
    waitDuration: 5,
    notificationSent: true,
    viewed: true,
  },

  // 5 days ago - Solicitor
  {
    id: 'doorbell-event-7',
    cameraId: 'arlo-doorbell-front',
    actionType: 'button_press',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120), // 5 days ago
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=Unknown+Visitor',
    responseStatus: 'quick_reply',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 120 + 1000 * 3),
    quickReplyMessage: 'Not interested, thank you.',
    visitorInfo: {
      isRepeatVisitor: false,
    },
    waitDuration: 3,
    notificationSent: true,
    viewed: true,
  },

  // 7 days ago - Amazon delivery
  {
    id: 'doorbell-event-8',
    cameraId: 'arlo-doorbell-front',
    actionType: 'button_press',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 168), // 7 days ago
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=Amazon+Delivery',
    responseStatus: 'answered',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 168 + 1000 * 10),
    visitorInfo: {
      deliveryService: 'Amazon',
      isRepeatVisitor: true,
    },
    waitDuration: 10,
    notificationSent: true,
    viewed: true,
  },
]

/**
 * Default doorbell settings
 */
export const DEFAULT_DOORBELL_SETTINGS = {
  chimeEnabled: true,
  chimeVolume: 80,
  notificationsEnabled: true,
  motionAlertsEnabled: true,
  motionSensitivity: 70,
  quickReplyMessages: DEFAULT_QUICK_REPLIES,
  autoReplyAfter: undefined, // Disabled by default
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  },
}

/**
 * Utility to generate a new doorbell event (for testing)
 */
export function generateMockDoorbellEvent(override: Partial<DoorbellEvent> = {}): DoorbellEvent {
  const randomVisitors = [
    { deliveryService: 'Amazon' as const },
    { deliveryService: 'FedEx' as const },
    { deliveryService: 'UPS' as const },
    { name: 'Neighbor', isRepeatVisitor: true },
    { name: 'Friend', isRepeatVisitor: true },
    { isRepeatVisitor: false }, // Unknown
  ]

  const randomVisitor = randomVisitors[Math.floor(Math.random() * randomVisitors.length)]

  return {
    id: `doorbell-event-${Date.now()}`,
    cameraId: 'arlo-doorbell-front',
    actionType: 'button_press',
    timestamp: new Date(),
    snapshotUrl: 'https://placehold.co/1920x1080/2C3E50/FFFFFF/png?text=Visitor+at+Door',
    responseStatus: 'missed',
    visitorInfo: randomVisitor,
    notificationSent: true,
    viewed: false,
    ...override,
  }
}

/**
 * Helper to get events by status
 */
export const getDoorbellEventsByStatus = (
  status: DoorbellEvent['responseStatus']
): DoorbellEvent[] => MOCK_DOORBELL_EVENTS.filter(event => event.responseStatus === status)

/**
 * Helper to get unviewed events
 */
export const getUnviewedDoorbellEvents = (): DoorbellEvent[] =>
  MOCK_DOORBELL_EVENTS.filter(event => !event.viewed)

/**
 * Helper to get events from today
 */
export const getTodayDoorbellEvents = (): DoorbellEvent[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return MOCK_DOORBELL_EVENTS.filter(event => {
    const eventDate = new Date(event.timestamp)
    return eventDate >= today
  })
}
