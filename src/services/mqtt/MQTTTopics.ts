/**
 * MQTT Topic Naming Conventions
 *
 * Standardized topic structure for HomeHub MQTT communication.
 * Format: homehub/{category}/{deviceId}/{action}
 *
 * @example
 * ```typescript
 * import { MQTT_TOPICS, parseDeviceIdFromTopic } from '@/services/mqtt'
 *
 * // Get topic for device state
 * const stateTopic = MQTT_TOPICS.DEVICE_STATE('light1')
 * // => 'homehub/devices/light1/state'
 *
 * // Parse device ID from topic
 * const deviceId = parseDeviceIdFromTopic('homehub/devices/light1/state')
 * // => 'light1'
 * ```
 */

/**
 * MQTT Topic structure for HomeHub
 */
export const MQTT_TOPICS = {
  // Device state topics
  DEVICE_STATE: (deviceId: string) => `homehub/devices/${deviceId}/state`,
  DEVICE_SET: (deviceId: string) => `homehub/devices/${deviceId}/set`,
  DEVICE_GET: (deviceId: string) => `homehub/devices/${deviceId}/get`,

  // Discovery topics
  DEVICE_DISCOVERY: 'homehub/discovery/+',
  DEVICE_ANNOUNCE: 'homehub/discovery/announce',

  // System topics
  SYSTEM_STATUS: 'homehub/system/status',
  SYSTEM_LOG: 'homehub/system/log',
  SYSTEM_ERROR: 'homehub/system/error',

  // Scene topics
  SCENE_ACTIVATE: (sceneId: string) => `homehub/scenes/${sceneId}/activate`,
  SCENE_STATUS: (sceneId: string) => `homehub/scenes/${sceneId}/status`,

  // Automation topics
  AUTOMATION_TRIGGER: (automationId: string) => `homehub/automations/${automationId}/trigger`,
  AUTOMATION_STATUS: (automationId: string) => `homehub/automations/${automationId}/status`,

  // Wildcards for bulk subscriptions
  ALL_DEVICE_STATES: 'homehub/devices/+/state',
  ALL_DEVICE_COMMANDS: 'homehub/devices/+/set',
  ALL_DEVICES: 'homehub/devices/#',
  ALL_TOPICS: 'homehub/#',
} as const

/**
 * Parse device ID from MQTT topic
 *
 * @param topic MQTT topic string
 * @returns Device ID or null if not found
 *
 * @example
 * parseDeviceIdFromTopic('homehub/devices/light1/state') // => 'light1'
 * parseDeviceIdFromTopic('homehub/system/status') // => null
 */
export function parseDeviceIdFromTopic(topic: string): string | null {
  const match = topic.match(/^homehub\/devices\/([^/]+)\//)
  return match?.[1] ?? null
}

/**
 * Parse action from MQTT topic
 *
 * @param topic MQTT topic string
 * @returns Action name or null if not found
 *
 * @example
 * parseActionFromTopic('homehub/devices/light1/state') // => 'state'
 * parseActionFromTopic('homehub/devices/light1/set') // => 'set'
 */
export function parseActionFromTopic(topic: string): string | null {
  const match = topic.match(/\/([^/]+)$/)
  return match?.[1] ?? null
}

/**
 * Parse scene ID from MQTT topic
 *
 * @param topic MQTT topic string
 * @returns Scene ID or null if not found
 */
export function parseSceneIdFromTopic(topic: string): string | null {
  const match = topic.match(/^homehub\/scenes\/([^/]+)\//)
  return match?.[1] ?? null
}

/**
 * Parse automation ID from MQTT topic
 *
 * @param topic MQTT topic string
 * @returns Automation ID or null if not found
 */
export function parseAutomationIdFromTopic(topic: string): string | null {
  const match = topic.match(/^homehub\/automations\/([^/]+)\//)
  return match?.[1] ?? null
}

/**
 * Check if topic matches pattern with wildcards
 *
 * @param topic Topic to test
 * @param pattern Pattern with + (single level) or # (multi level) wildcards
 * @returns True if topic matches pattern
 *
 * @example
 * matchTopic('homehub/devices/light1/state', 'homehub/devices/+/state') // => true
 * matchTopic('homehub/devices/light1/state', 'homehub/devices/#') // => true
 * matchTopic('homehub/system/status', 'homehub/devices/#') // => false
 */
export function matchTopic(topic: string, pattern: string): boolean {
  const topicParts = topic.split('/')
  const patternParts = pattern.split('/')

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]

    if (patternPart === '#') {
      // # matches all remaining levels
      return true
    }

    if (patternPart === '+') {
      // + matches single level
      if (i >= topicParts.length) return false
      continue
    }

    if (patternPart !== topicParts[i]) {
      return false
    }
  }

  // Pattern must match full topic length (unless ended with #)
  return topicParts.length === patternParts.length
}

/**
 * Validate MQTT topic name
 *
 * @param topic Topic to validate
 * @returns True if topic is valid
 */
export function isValidTopic(topic: string): boolean {
  if (!topic || topic.length === 0) return false
  if (topic.length > 65535) return false // MQTT max topic length
  if (topic.includes('\0')) return false // Null character not allowed
  if (topic.includes('+') || topic.includes('#')) {
    // Wildcards only valid in subscriptions, not publish
    return false
  }
  return true
}

/**
 * Sanitize device ID for use in topic
 *
 * @param deviceId Device ID to sanitize
 * @returns Sanitized device ID safe for MQTT topics
 */
export function sanitizeDeviceId(deviceId: string): string {
  return deviceId
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace invalid chars with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .toLowerCase()
}
