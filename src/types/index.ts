/**
 * Central Type Export
 * 
 * Re-exports all type definitions for convenient importing.
 * 
 * Usage:
 *   import { Device, Room, Scene } from '@/types'
 */

// Device types
export type {
  Device,
  DeviceType,
  DeviceStatus,
  DeviceAlert,
  AlertType,
  AlertSeverity
} from './device.types'

// Room types
export type { Room } from './room.types'

// Scene types
export type {
  Scene,
  SceneDeviceState
} from './scene.types'

// Automation types
export type {
  Automation,
  AutomationType,
  AutomationTrigger,
  AutomationAction,
  TriggerType,
  ComparisonOperator,
  Flow,
  FlowNode,
  FlowNodeType,
  ScheduleTrigger,
  ScheduleAction,
  ScheduleRule,
  Geofence,
  GeofenceType,
  GeofenceTriggerMode
} from './automation.types'

// User types
export type {
  User,
  UserRole,
  UserPermissions
} from './user.types'

// Security types
export type {
  Camera,
  CameraStatus,
  SecurityEvent,
  SecurityEventType,
  SecurityEventSeverity
} from './security.types'

// Energy types
export type {
  EnergyReading,
  DeviceEnergyData,
  EnergySettings,
  EnergyInsight
} from './energy.types'

// Backup types
export type {
  Backup,
  BackupStatus,
  BackupFrequency,
  BackupSettings
} from './backup.types'

// Feature types
export type {
  IntercomDevice,
  IntercomDeviceType,
  IntercomDeviceStatus,
  ActiveCall,
  Integration,
  SystemSetting,
  MonitoringSettings,
  MonitoringMetric,
  AdaptiveLightingSettings
} from './features.types'
