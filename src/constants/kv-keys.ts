/**
 * KV Store Key Definitions
 * 
 * Centralized constants for Spark KV store keys.
 * Prevents typos and makes refactoring easier.
 * 
 * Usage:
 *   const [devices, setDevices] = useKV<Device[]>(KV_KEYS.DEVICES, [])
 */

export const KV_KEYS = {
  // Navigation
  CURRENT_TAB: 'current-tab',
  
  // Devices
  DEVICES: 'devices',
  
  // Rooms
  ROOMS: 'rooms',
  
  // Scenes
  SCENES: 'scenes',
  ACTIVE_SCENE: 'active-scene',
  
  // Automations
  AUTOMATIONS: 'automations',
  FLOWS: 'flows',
  SCHEDULE_RULES: 'schedule-rules',
  GEOFENCES: 'geofences',
  
  // Security
  SECURITY_CAMERAS: 'security-cameras',
  SECURITY_EVENTS: 'security-events',
  SECURITY_ARMED: 'security-armed',
  
  // Users
  HOME_USERS: 'home-users',
  CURRENT_USER: 'current-user',
  
  // Energy
  ENERGY_DATA: 'energy-data',
  ENERGY_SETTINGS: 'energy-settings',
  
  // Backups
  BACKUPS: 'backups',
  BACKUP_SETTINGS: 'backup-settings',
  
  // Settings
  SYSTEM_SETTINGS: 'system-settings',
  INTEGRATIONS: 'integrations',
  MONITORING_SETTINGS: 'monitoring-settings',
  ADAPTIVE_LIGHTING_SETTINGS: 'adaptive-lighting-settings',
  
  // Intercom
  INTERCOM_DEVICES: 'intercom-devices',
  ACTIVE_CALL: 'active-call',
} as const

// Type for autocomplete
export type KVKey = typeof KV_KEYS[keyof typeof KV_KEYS]
