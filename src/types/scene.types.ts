/**
 * Scene Type Definitions
 *
 * Predefined device state combinations for one-touch control.
 */

export interface SceneDeviceState {
  /** Target device ID */
  deviceId: string

  /** Desired power state */
  enabled: boolean

  /** Desired value (brightness, temperature, etc.) */
  value?: number
}

export interface Scene {
  /** Unique identifier */
  id: string

  /** Display name (e.g., "Movie Time", "Good Morning") */
  name: string

  /** Phosphor icon name for UI */
  icon: string

  /** Optional user-facing description */
  description?: string

  /** Target states for each device in scene */
  deviceStates: SceneDeviceState[]

  /** Whether scene is available for activation */
  enabled: boolean

  /** Timestamp of last scene activation */
  lastActivated?: Date
}
