/**
 * Backup & Recovery Type Definitions
 *
 * System backup and disaster recovery.
 */

export type BackupStatus = 'completed' | 'in-progress' | 'failed'
export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual'

export interface Backup {
  /** Unique identifier */
  id: string

  /** Backup creation timestamp */
  timestamp: Date

  /** Backup file size in bytes */
  size: number

  /** Current backup status */
  status: BackupStatus

  /** Backup type/trigger */
  type: 'manual' | 'automatic' | 'scheduled'

  /** Optional error message if failed */
  error?: string

  /** Backup location/path */
  location?: string
}

export interface BackupSettings {
  /** Whether automatic backups are enabled */
  autoBackupEnabled: boolean

  /** Backup frequency schedule */
  frequency: BackupFrequency

  /** Backup location preference */
  location: 'local' | 'cloud' | 'both'

  /** Maximum number of backups to retain */
  retentionCount: number

  /** Whether to compress backups */
  compression: boolean

  /** Optional cloud provider config */
  cloudProvider?: string
}
