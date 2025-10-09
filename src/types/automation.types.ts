/**
 * Automation & Flow Type Definitions
 * 
 * Time/condition-based rules and visual automation flows.
 */

export type AutomationType = 'schedule' | 'geofence' | 'condition' | 'device-state'
export type TriggerType = 'time' | 'condition' | 'geofence' | 'device-state'
export type ComparisonOperator = '<' | '>' | '==' | '!='

export interface AutomationTrigger {
  /** Trigger category */
  type: TriggerType
  
  /** Trigger-specific value/config */
  value?: string
  
  // Time-based triggers
  /** Time in HH:MM format */
  time?: string
  
  /** Days of week for schedule */
  days?: string[]
  
  // Condition-based triggers
  /** Device to monitor */
  deviceId?: string
  
  /** Comparison operation */
  operator?: ComparisonOperator
  
  /** Threshold value for comparison */
  threshold?: number
  
  // Geofence triggers
  /** Geographic location */
  location?: {
    lat: number
    lng: number
    radius: number
  }
}

export interface AutomationAction {
  /** Target device ID (optional for non-device actions) */
  deviceId?: string
  
  /** Action to perform */
  action: string
  
  /** Action-specific value */
  value?: any
  
  /** Desired power state */
  enabled?: boolean
}

export interface Automation {
  /** Unique identifier */
  id: string
  
  /** Display name */
  name: string
  
  /** Optional description */
  description?: string
  
  /** Automation category */
  type: AutomationType
  
  /** Master enable/disable switch */
  enabled: boolean
  
  /** Trigger conditions */
  triggers: AutomationTrigger[]
  
  /** Actions to execute when triggered */
  actions: AutomationAction[]
  
  /** Timestamp of last execution */
  lastRun?: string
  
  /** Predicted next execution time */
  nextRun?: string
}

/**
 * Visual Flow Designer Types
 */
export type FlowNodeType = 'trigger' | 'condition' | 'action' | 'delay'

export interface FlowNode {
  /** Unique node identifier */
  id: string
  
  /** Node category */
  type: FlowNodeType
  
  /** Specific node variant */
  subtype: string
  
  /** Display label in designer */
  label: string
  
  /** Phosphor icon component */
  icon: any
  
  /** Canvas coordinates */
  position: {
    x: number
    y: number
  }
  
  /** Node-specific configuration data */
  data: any
  
  /** Connected node IDs (outgoing connections) */
  connections: string[]
}

export interface Flow {
  /** Unique identifier */
  id: string
  
  /** Display name */
  name: string
  
  /** Optional description */
  description?: string
  
  /** All nodes in the flow */
  nodes: FlowNode[]
  
  /** Flow execution toggle */
  enabled: boolean
  
  /** Creation timestamp (ISO string) */
  created: string
}

/**
 * Schedule Builder Types
 */
export interface ScheduleTrigger {
  type: 'time' | 'sunrise' | 'sunset'
  time?: string
  offset?: number
  days: string[]
}

export interface ScheduleAction {
  deviceId: string
  action: 'turn-on' | 'turn-off' | 'set-value'
  value?: number
}

export interface ScheduleRule {
  id: string
  name: string
  enabled: boolean
  trigger: ScheduleTrigger
  actions: ScheduleAction[]
  lastRun?: string
}

/**
 * Geofence Builder Types
 */
export type GeofenceType = 'home' | 'work' | 'custom' | 'store'
export type GeofenceTriggerMode = 'enter' | 'exit' | 'both'

export interface Geofence {
  id: string
  name: string
  type: GeofenceType
  enabled: boolean
  location: {
    lat: number
    lng: number
    radius: number
  }
  triggerMode: GeofenceTriggerMode
  actions: ScheduleAction[]
  lastTriggered?: string
}
