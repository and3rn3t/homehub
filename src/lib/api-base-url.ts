/**
 * Base URL for the KV/logging API.
 * Production: same origin (''), proxied to the worker by Pages Functions behind Cloudflare Access.
 * Development: the local worker, unless VITE_KV_API_URL overrides it.
 */
export function getKVBaseUrl(): string {
  return import.meta.env.VITE_KV_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8787' : '')
}
