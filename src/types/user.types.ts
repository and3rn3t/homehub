/**
 * User Management Type Definitions
 *
 * Multi-user access control and permissions.
 */

export type UserRole = 'owner' | 'admin' | 'member' | 'guest'

export interface UserPermissions {
  /** Can control and configure devices */
  canEditDevices: boolean

  /** Can create and modify scenes */
  canCreateScenes: boolean

  /** Can manage user accounts */
  canManageUsers: boolean

  /** Can view security cameras and events */
  canViewSecurity: boolean
}

export interface User {
  /** Unique identifier */
  id: string

  /** Full name */
  name: string

  /** Email address (used for login) */
  email: string

  /** User role determining base permissions */
  role: UserRole

  /** Fine-grained permission settings */
  permissions: UserPermissions

  /** Profile image URL (optional) */
  avatar?: string

  /** Last login/activity timestamp */
  lastActive?: Date
}
