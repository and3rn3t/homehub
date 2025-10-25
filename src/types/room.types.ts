/**
 * Room Type Definitions
 *
 * Organizational unit for grouping devices by physical location.
 */

export interface Room {
  /** Unique identifier */
  id: string

  /** Display name (e.g., "Living Room", "Master Bedroom") */
  name: string

  /** Phosphor icon name for UI representation */
  icon?: string

  /** Device IDs associated with this room */
  deviceIds?: string[]

  /** Optional theme color for room cards */
  color?: string

  /** Current temperature reading (if sensor present) */
  temperature?: number

  /** Current humidity reading (if sensor present) */
  humidity?: number
}
