/**
 * HomeHub KV Worker
 *
 * Cloudflare Worker providing REST API for KV storage operations.
 * Supports GET, POST, DELETE operations with CORS and error handling.
 */

import { getAllowedOrigin, isAuthorized, type AuthEnv } from './auth'

export interface Env extends AuthEnv {
  HOMEHUB_KV: KVNamespace
  LOGS_KV: KVNamespace // Application logs
  WRITE_LIMITER?: RateLimit // Workers Rate Limiting binding for writes
  ENVIRONMENT?: string
}

interface KVResponse {
  key: string
  value?: any
  success?: boolean
  timestamp?: number
  error?: string
}

interface LogEntry {
  level: 'warn' | 'error'
  message: string
  context?: any
  timestamp: string
  userAgent?: string
  url?: string
  appVersion?: string
}

/**
 * Apply CORS headers only when the request Origin is in ALLOWED_ORIGINS.
 * Same-origin traffic (via the Pages Function) needs no CORS headers.
 */
function withCors(response: Response, request: Request, env: Env): Response {
  const origin = getAllowedOrigin(request, env)
  if (!origin) return response
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')
  headers.append('Vary', 'Origin')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Create error response
 */
function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Create success response
 */
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Validate key name (alphanumeric, dashes, underscores)
 */
function isValidKey(key: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(key)
}

/**
 * Main Worker handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return withCors(await handleRequest(request, env), request, env)
  },
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)

  // Preflight carries no credentials; answer it (CORS headers added by withCors)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  // Public health check (no data exposed)
  if (url.pathname === '/health' && request.method === 'GET') {
    return jsonResponse({
      status: 'healthy',
      environment: env.ENVIRONMENT || 'development',
      timestamp: Date.now(),
    })
  }

  // Fail closed: everything else needs a valid Access JWT or service token
  if (!(await isAuthorized(request, env))) {
    return errorResponse('Unauthorized', 401)
  }

  // Rate-limit mutating requests
  if (request.method !== 'GET' && env.WRITE_LIMITER) {
    const { success } = await env.WRITE_LIMITER.limit({
      key: request.headers.get('CF-Connecting-IP') ?? 'unknown',
    })
    if (!success) return errorResponse('Too many requests', 429)
  }

  const path = url.pathname

  try {
    // GET /kv - List all keys
    if (path === '/kv' && request.method === 'GET') {
      const list = await env.HOMEHUB_KV.list()
      return jsonResponse({
        keys: list.keys.map(k => k.name),
        count: list.keys.length,
      })
    }

    // GET /kv/:key - Get value
    if (path.startsWith('/kv/') && request.method === 'GET') {
      const key = path.substring(4)

      if (!isValidKey(key)) {
        return errorResponse('Invalid key format')
      }

      const value = await env.HOMEHUB_KV.get(key, { type: 'json' })

      if (value === null) {
        return errorResponse('Key not found', 404)
      }

      return jsonResponse({
        key,
        value,
        timestamp: Date.now(),
      } as KVResponse)
    }

    // POST /kv/:key - Set value
    if (path.startsWith('/kv/') && request.method === 'POST') {
      const key = path.substring(4)

      if (!isValidKey(key)) {
        return errorResponse('Invalid key format')
      }

      const body = (await request.json()) as { value: any }

      if (!body || body.value === undefined) {
        return errorResponse('Missing value in request body')
      }

      await env.HOMEHUB_KV.put(key, JSON.stringify(body.value))

      return jsonResponse({
        key,
        success: true,
        timestamp: Date.now(),
      } as KVResponse)
    }

    // DELETE /kv/:key - Delete key
    if (path.startsWith('/kv/') && request.method === 'DELETE') {
      const key = path.substring(4)

      if (!isValidKey(key)) {
        return errorResponse('Invalid key format')
      }

      await env.HOMEHUB_KV.delete(key)

      return jsonResponse({
        key,
        success: true,
        timestamp: Date.now(),
      } as KVResponse)
    }

    // POST /api/logs - Store application logs
    if (path === '/api/logs' && request.method === 'POST') {
      try {
        const logEntry = (await request.json()) as LogEntry

        // Validate log entry
        if (!logEntry.level || !logEntry.message || !logEntry.timestamp) {
          return errorResponse('Invalid log entry format')
        }

        // Store in LOGS_KV with timestamp-based key for easy querying
        const logKey = `log:${logEntry.timestamp}:${Math.random().toString(36).substr(2, 9)}`
        await env.LOGS_KV.put(logKey, JSON.stringify(logEntry), {
          expirationTtl: 60 * 60 * 24 * 30, // Keep logs for 30 days
        })

        // For errors, also store in a separate "recent-errors" list for quick access
        if (logEntry.level === 'error') {
          const recentErrors = (await env.LOGS_KV.get('recent-errors', { type: 'json' })) || []
          const errors = Array.isArray(recentErrors) ? recentErrors : []

          // Keep last 100 errors
          errors.unshift(logEntry)
          if (errors.length > 100) {
            errors.pop()
          }

          await env.LOGS_KV.put('recent-errors', JSON.stringify(errors))
        }

        return jsonResponse({ success: true })
      } catch (error) {
        // Don't fail the request if logging fails
        console.error('Failed to store log:', error)
        return jsonResponse({ success: false, error: 'Failed to store log' }, 500)
      }
    }

    // GET /api/logs - Retrieve recent logs (for debugging/monitoring dashboard)
    if (path === '/api/logs' && request.method === 'GET') {
      const recentErrors = (await env.LOGS_KV.get('recent-errors', { type: 'json' })) || []
      return jsonResponse({
        errors: recentErrors,
        count: Array.isArray(recentErrors) ? recentErrors.length : 0,
      })
    }

    // 404 - Route not found
    return errorResponse('Not found', 404)
  } catch (error) {
    console.error('Worker error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
}
