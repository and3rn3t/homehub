/**
 * Arlo Token Manager
 * Handles token storage, expiration tracking, and refresh lifecycle
 *
 * Token Lifespan: 24-48 hours (default: 36 hours)
 * Storage: localStorage for persistence across sessions
 *
 * Created: October 13, 2025
 */

export interface ArloToken {
  /** Bearer token (starts with "2_") */
  authorization: string

  /** Auth version (always "2") */
  authVersion: string

  /** X-Cloud-ID for user session */
  xcloudid: string

  /** Timestamp when token was captured (ISO string) */
  capturedAt: string

  /** Timestamp when token expires (ISO string) */
  expiresAt: string

  /** Optional user note about token source */
  source?: string
}

/**
 * Token Manager Class
 * Singleton pattern for managing Arlo authentication tokens
 */
export class ArloTokenManager {
  private static instance: ArloTokenManager
  private readonly storageKey = 'arlo-auth-token'
  private readonly defaultTokenLifespan = 36 * 60 * 60 * 1000 // 36 hours in ms

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ArloTokenManager {
    if (!ArloTokenManager.instance) {
      ArloTokenManager.instance = new ArloTokenManager()
    }
    return ArloTokenManager.instance
  }

  /**
   * Get current token from storage
   * Returns null if no token exists or token is expired
   */
  getToken(): ArloToken | null {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return null

      const token: ArloToken = JSON.parse(stored)

      // Check if token is expired
      const now = Date.now()
      const expiresAt = new Date(token.expiresAt).getTime()

      if (now >= expiresAt) {
        console.warn('[ArloTokenManager] Token expired:', new Date(token.expiresAt))
        this.clearToken()
        return null
      }

      return token
    } catch (error) {
      console.error('[ArloTokenManager] Failed to get token:', error)
      return null
    }
  }

  /**
   * Save new token to storage
   * Automatically calculates expiration time
   *
   * @param authorization - Bearer token from Arlo API
   * @param xcloudid - X-Cloud-ID from Arlo API
   * @param authVersion - Auth version (default: "2")
   * @param customLifespan - Custom token lifespan in milliseconds (optional)
   */
  saveToken(
    authorization: string,
    xcloudid: string,
    authVersion: string = '2',
    customLifespan?: number
  ): ArloToken {
    const now = new Date()
    const lifespan = customLifespan || this.defaultTokenLifespan
    const expiresAt = new Date(now.getTime() + lifespan)

    const token: ArloToken = {
      authorization,
      authVersion,
      xcloudid,
      capturedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      source: 'manual', // Default source
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(token))
      console.log('[ArloTokenManager] Token saved, expires at:', expiresAt)
      return token
    } catch (error) {
      console.error('[ArloTokenManager] Failed to save token:', error)
      throw error
    }
  }

  /**
   * Update existing token with new values
   * Preserves capturedAt but updates expiresAt
   */
  updateToken(updates: Partial<ArloToken>): ArloToken | null {
    const currentToken = this.getToken()
    if (!currentToken) {
      console.warn('[ArloTokenManager] No token to update')
      return null
    }

    const updatedToken: ArloToken = {
      ...currentToken,
      ...updates,
    }

    // Recalculate expiration if authorization changed
    if (updates.authorization && updates.authorization !== currentToken.authorization) {
      const now = new Date()
      updatedToken.capturedAt = now.toISOString()
      updatedToken.expiresAt = new Date(now.getTime() + this.defaultTokenLifespan).toISOString()
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updatedToken))
      console.log('[ArloTokenManager] Token updated')
      return updatedToken
    } catch (error) {
      console.error('[ArloTokenManager] Failed to update token:', error)
      return null
    }
  }

  /**
   * Clear token from storage
   */
  clearToken(): void {
    localStorage.removeItem(this.storageKey)
    console.log('[ArloTokenManager] Token cleared')
  }

  /**
   * Check if token is valid (exists and not expired)
   */
  isTokenValid(): boolean {
    const token = this.getToken()
    return token !== null
  }

  /**
   * Check if token is expiring soon
   * Returns true if token expires within the given threshold
   *
   * @param thresholdMs - Milliseconds before expiration (default: 2 hours)
   */
  isTokenExpiringSoon(thresholdMs: number = 2 * 60 * 60 * 1000): boolean {
    const token = this.getToken()
    if (!token) return false

    const now = Date.now()
    const expiresAt = new Date(token.expiresAt).getTime()
    const timeUntilExpiry = expiresAt - now

    return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMs
  }

  /**
   * Get time until token expiration
   * Returns milliseconds until expiration, or null if no token
   */
  getTimeUntilExpiration(): number | null {
    const token = this.getToken()
    if (!token) return null

    const now = Date.now()
    const expiresAt = new Date(token.expiresAt).getTime()
    const timeUntilExpiry = expiresAt - now

    return timeUntilExpiry > 0 ? timeUntilExpiry : 0
  }

  /**
   * Get human-readable time until expiration
   * Example: "2 hours 15 minutes"
   */
  getFormattedTimeUntilExpiration(): string | null {
    const ms = this.getTimeUntilExpiration()
    if (ms === null) return null
    if (ms === 0) return 'Expired'

    const hours = Math.floor(ms / (60 * 60 * 1000))
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))

    if (hours > 0 && minutes > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    } else {
      return 'Less than 1 minute'
    }
  }

  /**
   * Validate token format
   * Checks if authorization token starts with "2_" and has minimum length
   */
  validateTokenFormat(authorization: string, xcloudid: string): boolean {
    const isAuthValid = authorization.startsWith('2_') && authorization.length > 100
    const isCloudIdValid = xcloudid.length > 10

    return isAuthValid && isCloudIdValid
  }

  /**
   * Import token from extracted headers object
   * Useful when pasting from Chrome DevTools
   */
  importFromHeaders(headers: {
    authorization?: string
    'auth-version'?: string
    xcloudid?: string
  }): ArloToken | null {
    const { authorization, 'auth-version': authVersion, xcloudid } = headers

    if (!authorization || !xcloudid) {
      console.error('[ArloTokenManager] Missing required headers')
      return null
    }

    if (!this.validateTokenFormat(authorization, xcloudid)) {
      console.error('[ArloTokenManager] Invalid token format')
      return null
    }

    return this.saveToken(authorization, xcloudid, authVersion || '2')
  }

  /**
   * Export token as headers object
   * Useful for API requests
   */
  exportAsHeaders(): Record<string, string> | null {
    const token = this.getToken()
    if (!token) return null

    return {
      accept: 'application/json',
      'accept-language': 'en-US,en;q=0.9',
      'auth-version': token.authVersion,
      authorization: token.authorization,
      'content-type': 'application/json; charset=utf-8',
      origin: 'https://my.arlo.com',
      referer: 'https://my.arlo.com/',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      xcloudid: token.xcloudid,
    }
  }

  /**
   * Get token metadata
   * Returns info about token without exposing the actual token
   */
  getTokenMetadata(): {
    exists: boolean
    isValid: boolean
    isExpiringSoon: boolean
    capturedAt: string | null
    expiresAt: string | null
    timeUntilExpiration: string | null
  } {
    const token = this.getToken()

    return {
      exists: token !== null,
      isValid: this.isTokenValid(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      capturedAt: token?.capturedAt || null,
      expiresAt: token?.expiresAt || null,
      timeUntilExpiration: this.getFormattedTimeUntilExpiration(),
    }
  }
}

/**
 * Singleton instance export for convenience
 */
export const arloTokenManager = ArloTokenManager.getInstance()
