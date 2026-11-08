/**
 * Base URL for the KV/logging API.
 *
 * Default is same origin (''): in production Pages Functions forward to the worker behind
 * Cloudflare Access, and in development the Vite dev server proxies to the local worker and
 * adds its service token server-side (see vite.config.ts), so no secret reaches the bundle.
 * VITE_KV_API_URL is an explicit override for development only; do not set it in production.
 */
export function getKVBaseUrl(): string {
  return import.meta.env.VITE_KV_API_URL ?? ''
}
