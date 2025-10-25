/**
 * Automation Service Types
 *
 * Internal types for the automation execution engine.
 */

/**
 * Scheduled task timer reference
 */
export interface ScheduledTask {
  /** Automation ID */
  id: string
  /** Timer handle */
  timer: NodeJS.Timeout
  /** Next scheduled execution time */
  nextRun: Date
  /** Recurring or one-time */
  recurring: boolean
}

/**
 * Execution result for a single automation run
 */
export interface ExecutionResult {
  /** Automation ID */
  automationId: string
  /** Execution started at */
  timestamp: Date
  /** Actions that were executed */
  actions: ActionResult[]
  /** Overall success status */
  success: boolean
  /** Total execution time in milliseconds */
  duration: number
  /** Error message if failed */
  error?: string
}

/**
 * Result of a single action execution
 */
export interface ActionResult {
  /** Device ID that was controlled */
  deviceId: string
  /** Action that was performed */
  action: string
  /** Whether the action succeeded */
  success: boolean
  /** Time taken in milliseconds */
  duration: number
  /** Error message if failed */
  error?: string
  /** Number of retry attempts */
  retries: number
}

/**
 * Execution history log entry
 */
export interface ExecutionLog {
  /** Unique log entry ID */
  id: string
  /** Automation that was executed */
  automationId: string
  /** Automation name (for display) */
  automationName: string
  /** When it was executed */
  timestamp: string
  /** Trigger that caused execution */
  trigger: {
    type: string
    value?: any
  }
  /** Results of each action */
  actions: ActionResult[]
  /** Total duration in ms */
  totalDuration: number
  /** Overall success status */
  success: boolean
}

/**
 * Scheduler configuration options
 */
export interface SchedulerOptions {
  /** Enable debug logging */
  debug?: boolean
  /** Maximum concurrent executions */
  maxConcurrent?: number
  /** Execution timeout in milliseconds */
  executionTimeout?: number
  /** Auto-retry failed actions */
  autoRetry?: boolean
  /** Maximum retry attempts */
  maxRetries?: number
}

/**
 * Time schedule configuration
 */
export interface TimeSchedule {
  /** Time in HH:MM format (24-hour) */
  time: string
  /** Days of week (0-6, where 0 is Sunday) */
  days?: number[]
  /** Timezone (IANA format, e.g., "America/New_York") */
  timezone?: string
}

/**
 * Sunrise/sunset calculation options
 */
export interface SolarOptions {
  /** Latitude */
  lat: number
  /** Longitude */
  lng: number
  /** Date to calculate for (defaults to today) */
  date?: Date
}

/**
 * Solar time result
 */
export interface SolarTime {
  /** Sunrise time */
  sunrise: Date
  /** Sunset time */
  sunset: Date
  /** Solar noon */
  solarNoon: Date
}

/**
 * Flow Interpreter Types
 */

/**
 * Execution context for flow interpreter
 */
export interface ExecutionContext {
  /** Flow ID being executed */
  flowId: string
  /** Unique execution ID */
  executionId: string
  /** Execution timestamp */
  timestamp: string

  /** Variable storage for data flow between nodes */
  variables: Record<string, any>

  /** Current node being executed */
  currentNodeId: string | null
  /** Nodes that have been visited (prevents infinite loops) */
  visitedNodes: Set<string>
  /** Execution call stack */
  executionStack: string[]

  /** Branch condition results (node ID → boolean) */
  branchConditions: Record<string, boolean>

  /** Loop counters (loop node ID → current iteration) */
  loopCounters: Record<string, number>
  /** Loop max iterations (loop node ID → max) */
  loopMaxIterations: Record<string, number>

  /** Debug mode enabled */
  debugMode: boolean
  /** Breakpoint node IDs */
  breakpoints: Set<string>
  /** Step-through mode (pause after each node) */
  stepMode: boolean

  /** Performance tracking (node ID → execution time in ms) */
  nodeExecutionTimes: Record<string, number>
  /** Total flow execution time */
  totalExecutionTime: number
}

/**
 * Flow execution result
 */
export interface FlowResult {
  /** Whether flow completed successfully */
  success: boolean
  /** Flow ID */
  flowId: string
  /** Execution ID */
  executionId: string
  /** Node IDs that were executed */
  executedNodes: string[]
  /** Node IDs that failed */
  failedNodes: string[]
  /** Final variable state */
  variables: Record<string, any>
  /** Total execution time in ms */
  executionTime: number
  /** Error message if failed */
  error?: string
}

/**
 * Node execution result
 */
export interface NodeResult {
  /** Whether node executed successfully */
  success: boolean
  /** Node ID */
  nodeId: string
  /** Node output value */
  output: any
  /** Node execution time in ms */
  executionTime: number
  /** Error message if failed */
  error?: string
}

/**
 * Flow validation result
 */
export interface ValidationResult {
  /** Whether flow is valid */
  valid: boolean
  /** Validation errors (prevent execution) */
  errors: string[]
  /** Validation warnings (don't prevent execution) */
  warnings: string[]
}

/**
 * Parsed flow execution graph
 */
export interface ExecutionGraph {
  /** Original flow definition */
  flow: import('@/types').Flow
  /** Root nodes (entry points) */
  rootNodes: import('@/types').FlowNode[]
  /** Node lookup map (node ID → node) */
  nodeMap: Map<string, import('@/types').FlowNode>
  /** Adjacency list (node ID → connected node IDs) */
  adjacencyList: Map<string, string[]>
  /** Topological sort execution order */
  executionOrder: import('@/types').FlowNode[]
}

// ============================================================================
// Geofencing Types (Milestone 3.5)
// ============================================================================

/**
 * Geofence definition - circular boundary for location-based triggers
 */
export interface Geofence {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Optional description */
  description?: string
  /** Center point coordinates */
  center: {
    /** Latitude (-90 to 90) */
    lat: number
    /** Longitude (-180 to 180) */
    lng: number
  }
  /** Radius in meters */
  radius: number
  /** Whether geofence is active */
  enabled: boolean
  /** Creation timestamp (ISO 8601) */
  created: string
}

/**
 * Geographic location point
 */
export interface Location {
  /** Latitude (-90 to 90) */
  lat: number
  /** Longitude (-180 to 180) */
  lng: number
  /** GPS accuracy in meters (optional) */
  accuracy?: number
  /** Location timestamp (ISO 8601) */
  timestamp: string
}

/**
 * Geofence event (enter or leave)
 */
export interface GeofenceEvent {
  /** Unique event ID */
  id: string
  /** Geofence that triggered event */
  geofenceId: string
  /** Event type */
  eventType: 'enter' | 'leave'
  /** Location when event occurred */
  location: Location
  /** Event timestamp (ISO 8601) */
  timestamp: string
  /** Automation IDs that were triggered */
  triggeredAutomations: string[]
}

/**
 * Geofence state tracking (inside/outside)
 */
export interface GeofenceState {
  /** Geofence ID */
  geofenceId: string
  /** Whether currently inside geofence */
  isInside: boolean
  /** Last state update timestamp */
  lastUpdate: string
  /** When entered geofence (if inside) */
  enteredAt?: string
  /** When left geofence (if outside) */
  leftAt?: string
}
