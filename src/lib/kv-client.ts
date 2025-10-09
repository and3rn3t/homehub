/**
 * Cloudflare KV API Client
 * 
 * Client for communicating with Cloudflare Worker KV API.
 */

export interface KVClientConfig {
  /** Base URL of Cloudflare Worker API */
  baseUrl: string
  /** Optional authentication token */
  authToken?: string
  /** Request timeout in milliseconds */
  timeout?: number
}

export class KVClient {
  private config: Required<KVClientConfig>

  constructor(config: KVClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      authToken: config.authToken || '',
      timeout: config.timeout || 10000,
    }
  }

  /**
   * Get value from KV store
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(`${this.config.baseUrl}/kv/${key}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`KV GET failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value as T
    } catch (error) {
      console.error(`KV get error for key "${key}":`, error)
      throw error
    }
  }

  /**
   * Set value in KV store
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(`${this.config.baseUrl}/kv/${key}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ value }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`KV SET failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`KV set error for key "${key}":`, error)
      throw error
    }
  }

  /**
   * Delete key from KV store
   */
  async delete(key: string): Promise<void> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(`${this.config.baseUrl}/kv/${key}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`KV DELETE failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`KV delete error for key "${key}":`, error)
      throw error
    }
  }

  /**
   * List all keys (for debugging)
   */
  async listKeys(): Promise<string[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(`${this.config.baseUrl}/kv`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`KV LIST failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.keys || []
    } catch (error) {
      console.error('KV list keys error:', error)
      throw error
    }
  }

  /**
   * Get request headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`
    }

    return headers
  }
}

/**
 * Create singleton KV client instance
 */
let kvClientInstance: KVClient | null = null

export function getKVClient(): KVClient {
  if (!kvClientInstance) {
    const baseUrl = import.meta.env.VITE_KV_API_URL || 'http://localhost:8787'
    const authToken = import.meta.env.VITE_KV_AUTH_TOKEN

    kvClientInstance = new KVClient({
      baseUrl,
      authToken,
      timeout: 10000,
    })
  }

  return kvClientInstance
}

/**
 * Reset client instance (useful for testing)
 */
export function resetKVClient(): void {
  kvClientInstance = null
}
