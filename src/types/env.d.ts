/**
 * Shared Environment Configuration Types
 *
 * These types are used across both the frontend (Vite) and backend (Cloudflare Workers)
 * to ensure type safety for environment variables and configuration.
 */

/**
 * Frontend Environment Variables (Vite)
 * All variables must be prefixed with VITE_ to be exposed to the client
 */
export interface ViteEnv {
  /** Cloudflare Worker API URL for KV operations */
  VITE_KV_API_URL: string

  /** Optional authentication token for Worker API */
  VITE_KV_AUTH_TOKEN?: string

  /** Environment mode (development, staging, production) */
  MODE: 'development' | 'staging' | 'production'

  /** Whether running in dev mode */
  DEV: boolean

  /** Whether running in production mode */
  PROD: boolean
}

/**
 * Cloudflare Worker Environment Bindings
 */
export interface WorkerEnv {
  /** KV Namespace for persistent storage */
  HOMEHUB_KV: KVNamespace

  /** Optional authentication token */
  AUTH_TOKEN?: string

  /** Environment name */
  ENVIRONMENT?: 'development' | 'staging' | 'production'
}

/**
 * Type-safe environment variable access for Vite
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ImportMetaEnv extends ViteEnv {}

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
