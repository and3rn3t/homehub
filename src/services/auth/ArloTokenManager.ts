/**
 * Arlo Token Manager
 *
 * The Arlo session token is held server-side by the Arlo proxy worker (see
 * workers/arlo-proxy/index.ts). The browser uploads it once, then only ever sees metadata
 * (when it was captured and when it expires). It is never stored in localStorage or exposed to
 * page scripts, so an XSS bug cannot read it.
 *
 * Token lifespan: 36 hours (enforced by the proxy).
 */

import { ARLO_PROXY_BASE_URL } from '../arlo-proxy-url'

/** What the browser is allowed to know about the stored token. No secret material. */
export interface ArloSessionState {
  exists: boolean
  capturedAt: string | null
  expiresAt: string | null
  source: string | null
}

export interface ArloTokenMetadata {
  exists: boolean
  isValid: boolean
  isExpiringSoon: boolean
  capturedAt: string | null
  expiresAt: string | null
  timeUntilExpiration: string | null
}

const EMPTY_STATE: ArloSessionState = {
  exists: false,
  capturedAt: null,
  expiresAt: null,
  source: null,
}

/** Pre-migration location of the plaintext token. Read once, uploaded, then deleted. */
const LEGACY_STORAGE_KEY = 'arlo-auth-token'

interface LegacyToken {
  authorization: string
  authVersion?: string
  xcloudid: string
  expiresAt: string
}

export class ArloTokenManager {
  private static instance: ArloTokenManager
  private state: ArloSessionState = EMPTY_STATE
  private inflightRefresh: Promise<void> | null = null

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ArloTokenManager {
    if (!ArloTokenManager.instance) {
      ArloTokenManager.instance = new ArloTokenManager()
    }
    return ArloTokenManager.instance
  }

  private async sessionRequest(
    method: 'GET' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<Response> {
    return fetch(`${ARLO_PROXY_BASE_URL}/session`, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }

  /**
   * Sync local state with the server (and migrate any legacy localStorage token).
   * Call before checking validity; concurrent calls share one request.
   */
  refresh(): Promise<void> {
    this.inflightRefresh ??= this.doRefresh().finally(() => {
      this.inflightRefresh = null
    })
    return this.inflightRefresh
  }

  private async doRefresh(): Promise<void> {
    try {
      await this.migrateLegacyToken()
      const response = await this.sessionRequest('GET')
      if (!response.ok) throw new Error(`session status ${response.status}`)
      this.state = (await response.json()) as ArloSessionState
    } catch (error) {
      // Keep the last known state: a transient failure should not look like a logout.
      console.warn('[ArloTokenManager] Could not refresh session state:', error)
    }
  }

  /** Upload a token left in localStorage by an older version, then delete it. */
  private async migrateLegacyToken(): Promise<void> {
    let legacy: LegacyToken
    try {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (!stored) return
      legacy = JSON.parse(stored) as LegacyToken
    } catch {
      this.removeLegacyToken() // unreadable: nothing to salvage
      return
    }

    const stillValid = new Date(legacy.expiresAt).getTime() > Date.now()
    if (!stillValid || !legacy.authorization || !legacy.xcloudid) {
      this.removeLegacyToken()
      return
    }

    const response = await this.sessionRequest('PUT', {
      authorization: legacy.authorization,
      xcloudid: legacy.xcloudid,
      authVersion: legacy.authVersion ?? '2',
      expiresAt: legacy.expiresAt, // keep the real expiry, not a fresh 36h
      source: 'migrated',
    })
    // Delete only after the server accepted it; on failure retry on the next refresh.
    if (response.ok) {
      this.removeLegacyToken()
      console.info('[ArloTokenManager] Migrated legacy token to server-side storage')
    }
  }

  private removeLegacyToken(): void {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  /**
   * Upload a token to the proxy. `xcloudid` may be omitted on a refresh to reuse the stored one.
   * Throws with the server's reason when the token is rejected.
   */
  async saveToken(
    authorization: string,
    xcloudid?: string,
    authVersion: string = '2'
  ): Promise<ArloTokenMetadata> {
    const response = await this.sessionRequest('PUT', {
      authorization,
      xcloudid: xcloudid || undefined,
      authVersion,
      source: 'manual',
    })
    if (!response.ok) {
      const reason = await response
        .json()
        .then((body: { error?: string }) => body.error)
        .catch(() => undefined)
      throw new Error(reason ?? `Failed to save token (${response.status})`)
    }
    this.state = (await response.json()) as ArloSessionState
    return this.getTokenMetadata()
  }

  /** Remove the stored token on the server and forget it locally. */
  async clearToken(): Promise<void> {
    this.state = EMPTY_STATE
    try {
      await this.sessionRequest('DELETE')
    } catch (error) {
      console.warn('[ArloTokenManager] Failed to clear server-side token:', error)
    }
  }

  isTokenValid(): boolean {
    return this.state.exists && this.getTimeUntilExpiration() !== 0
  }

  /** True if the token expires within the threshold (default 2 hours). */
  isTokenExpiringSoon(thresholdMs: number = 2 * 60 * 60 * 1000): boolean {
    const remaining = this.getTimeUntilExpiration()
    return remaining !== null && remaining > 0 && remaining <= thresholdMs
  }

  /** Milliseconds until expiration, 0 if expired, null if there is no token. */
  getTimeUntilExpiration(): number | null {
    if (!this.state.exists || !this.state.expiresAt) return null
    return Math.max(0, new Date(this.state.expiresAt).getTime() - Date.now())
  }

  /** Human-readable time until expiration, e.g. "2 hours 15 minutes". */
  getFormattedTimeUntilExpiration(): string | null {
    const ms = this.getTimeUntilExpiration()
    if (ms === null) return null
    if (ms === 0) return 'Expired'

    const hours = Math.floor(ms / (60 * 60 * 1000))
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))

    if (hours > 0 && minutes > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`
    }
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
    return 'Less than 1 minute'
  }

  /** Checks the authorization token starts with "2_" and has the minimum length. */
  validateAuthorizationFormat(authorization: string): boolean {
    return authorization.startsWith('2_') && authorization.length > 100
  }

  validateTokenFormat(authorization: string, xcloudid: string): boolean {
    return this.validateAuthorizationFormat(authorization) && xcloudid.length > 10
  }

  /** Import a token from headers pasted out of Chrome DevTools. */
  async importFromHeaders(headers: {
    authorization?: string
    'auth-version'?: string
    xcloudid?: string
  }): Promise<ArloTokenMetadata | null> {
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
   * Non-secret request headers for calls through the proxy. The proxy adds the Arlo
   * credentials itself, so none are (or can be) included here. Null when not connected.
   */
  exportAsHeaders(): Record<string, string> | null {
    if (!this.isTokenValid()) return null
    return {
      accept: 'application/json',
      'content-type': 'application/json; charset=utf-8',
    }
  }

  /** Token metadata for the UI. Never includes the token itself. */
  getTokenMetadata(): ArloTokenMetadata {
    return {
      exists: this.state.exists,
      isValid: this.isTokenValid(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      capturedAt: this.state.capturedAt,
      expiresAt: this.state.expiresAt,
      timeUntilExpiration: this.getFormattedTimeUntilExpiration(),
    }
  }
}

export const arloTokenManager = ArloTokenManager.getInstance()
