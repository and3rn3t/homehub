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
  AlertSeverity,
  AlertType,
  Device,
  DeviceAlert,
  DeviceProtocol,
  DeviceStatus,
  DeviceType,
} from './device.types'

// Room types
export type { Room } from './room.types'

// Scene types
export type { Scene, SceneDeviceState } from './scene.types'

// Automation types
export type {
  Automation,
  AutomationAction,
  AutomationTrigger,
  AutomationType,
  ComparisonOperator,
  Flow,
  FlowNode,
  FlowNodeType,
  Geofence,
  GeofenceTriggerMode,
  GeofenceType,
  ScheduleAction,
  ScheduleRule,
  ScheduleTrigger,
  TriggerType,
} from './automation.types'

// User types
export type { User, UserPermissions, UserRole } from './user.types'

// Security types
export type {
  Camera,
  CameraStatus,
  SecurityEvent,
  SecurityEventSeverity,
  SecurityEventType,
} from './security.types'

// Energy types
export type { DeviceEnergyData, EnergyInsight, EnergyReading, EnergySettings } from './energy.types'

// Backup types
export type { Backup, BackupFrequency, BackupSettings, BackupStatus } from './backup.types'

// Feature types
export type {
  ActiveCall,
  AdaptiveLightingSettings,
  Integration,
  IntercomDevice,
  IntercomDeviceStatus,
  IntercomDeviceType,
  MonitoringMetric,
  MonitoringSettings,
  SystemSetting,
} from './features.types'
