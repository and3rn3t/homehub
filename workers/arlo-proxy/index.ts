/**
 * Arlo API Proxy Worker
 *
 * Proxies browser requests to the Arlo cloud API and is the sole custodian of the Arlo
 * session token. The browser never sees the token: it uploads it once (PUT /session) and the
 * proxy injects it on upstream requests.
 *
 * Security model (fail closed):
 * - Every route except GET /health requires a valid Cloudflare Access JWT (or service token)
 * - CORS headers only for origins in ALLOWED_ORIGINS (same-origin traffic needs none)
 * - Client-supplied credentials are never forwarded upstream
 * - Media proxying is restricted to https://*.arlo.com
 * - The token lives in its own KV namespace (ARLO_KV), separate from the app-state KV
 *   the browser can read through the KV worker
 *
 * Consistency: Workers KV is eventually consistent (changes can take up to ~60s to reach every
 * location), so a PUT may not be visible everywhere at once and a DELETE may not revoke at once.
 * That is acceptable for one household using one location, but it means a "missing session"
 * answer must never be treated as authoritative: the client does not delete on it. A Durable
 * Object would give strong consistency if multi-region use or instant revocation is ever needed.
 */

import { getAllowedOrigin, isAuthorized, isOriginAllowed, type AuthEnv } from '../src/auth'

/** Minimal KV surface used here (avoids a workers-types dependency in this package). */
export interface SessionStore {
  get(key: string, type: 'json'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface Env extends AuthEnv {
  ARLO_KV: SessionStore
}

interface ArloSession {
  authorization: string
  authVersion: string
  xcloudid: string
  capturedAt: string
  expiresAt: string
  source: string
}

export interface SessionMetadata {
  exists: boolean
  capturedAt: string | null
  expiresAt: string | null
  source: string | null
}

const SESSION_KEY = 'session'
const SESSION_LIFESPAN_MS = 36 * 60 * 60 * 1000
const ARLO_API_ORIGIN = 'https://myapi.arlo.com'
const ARLO_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

/** Request headers that must never be forwarded upstream (credentials, hop-by-hop, platform). */
const STRIPPED_REQUEST_HEADERS = new Set([
  'host',
  'origin',
  'referer',
  'cookie',
  'authorization',
  'xcloudid',
  'auth-version',
  'content-length',
  'connection',
  'x-real-ip',
  'x-forwarded-for',
  'x-forwarded-proto',
])

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function withCors(response: Response, request: Request, env: Env): Response {
  const origin = getAllowedOrigin(request, env)
  if (!origin) return response
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept')
  headers.set('Access-Control-Max-Age', '86400')
  headers.append('Vary', 'Origin')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function toMetadata(session: ArloSession | null): SessionMetadata {
  return {
    exists: session !== null,
    capturedAt: session?.capturedAt ?? null,
    expiresAt: session?.expiresAt ?? null,
    source: session?.source ?? null,
  }
}

function isArloSession(value: unknown): value is ArloSession {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.authorization === 'string' &&
    typeof candidate.xcloudid === 'string' &&
    typeof candidate.authVersion === 'string' &&
    typeof candidate.capturedAt === 'string' &&
    typeof candidate.expiresAt === 'string' &&
    typeof candidate.source === 'string'
  )
}

async function loadSession(env: Env): Promise<ArloSession | null> {
  const stored = await env.ARLO_KV.get(SESSION_KEY, 'json')
  if (!isArloSession(stored)) return null
  if (new Date(stored.expiresAt).getTime() <= Date.now()) return null
  return stored
}

function isValidAuthorization(value: string): boolean {
  return value.startsWith('2_') && value.length > 100
}

async function handlePutSession(request: Request, env: Env): Promise<Response> {
  let body: {
    authorization?: unknown
    xcloudid?: unknown
    authVersion?: unknown
    source?: unknown
    expiresAt?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const authorization = typeof body.authorization === 'string' ? body.authorization.trim() : ''
  if (!isValidAuthorization(authorization)) {
    return json({ error: 'Invalid authorization token format' }, 400)
  }

  // A refresh may omit xcloudid: reuse the one already stored.
  const existing = await loadSession(env)
  const xcloudid =
    typeof body.xcloudid === 'string' && body.xcloudid.trim() !== ''
      ? body.xcloudid.trim()
      : existing?.xcloudid
  if (!xcloudid || xcloudid.length <= 10) {
    return json({ error: 'Invalid or missing xcloudid' }, 400)
  }

  const now = Date.now()
  // Omitted: the normal lifetime. A migrated token supplies its real expiry, which must be in the
  // future (an expired or malformed value is rejected, never silently renewed) and is clamped so a
  // caller cannot extend the lifetime beyond the normal window.
  let expiresAtMs = now + SESSION_LIFESPAN_MS
  if (body.expiresAt !== undefined) {
    const requested = typeof body.expiresAt === 'string' ? Date.parse(body.expiresAt) : NaN
    if (!Number.isFinite(requested) || requested <= now) {
      return json({ error: 'expiresAt must be a future ISO timestamp' }, 400)
    }
    expiresAtMs = Math.min(requested, now + SESSION_LIFESPAN_MS)
  }
  const session: ArloSession = {
    authorization,
    authVersion: typeof body.authVersion === 'string' ? body.authVersion : '2',
    xcloudid,
    capturedAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    source: typeof body.source === 'string' ? body.source : 'manual',
  }

  await env.ARLO_KV.put(SESSION_KEY, JSON.stringify(session), {
    expirationTtl: Math.max(60, Math.floor((expiresAtMs - now) / 1000)),
  })
  return json(toMetadata(session))
}

/** Resolve the upstream URL, or a Response if the request must be rejected. */
function resolveTarget(url: URL): { target: URL; isMedia: boolean } | Response {
  const path = url.pathname.replace(/^\//, '')

  if (path.startsWith('proxy/')) {
    let target: URL
    try {
      target = new URL(decodeURIComponent(path.slice('proxy/'.length)))
    } catch {
      return json({ error: 'Invalid proxy URL' }, 400)
    }
    const isArloHost = target.hostname === 'arlo.com' || target.hostname.endsWith('.arlo.com')
    if (target.protocol !== 'https:' || !isArloHost) {
      return json({ error: 'Only https://*.arlo.com URLs are allowed through this proxy' }, 403)
    }
    return { target, isMedia: true }
  }

  return { target: new URL(`${ARLO_API_ORIGIN}/${path}${url.search}`), isMedia: false }
}

function mediaAcceptHeader(target: URL): string {
  const lower = target.href.toLowerCase()
  if (lower.includes('.mpd')) return 'application/dash+xml,*/*;q=0.8'
  if (lower.includes('.m3u8')) return 'application/vnd.apple.mpegurl,*/*;q=0.8'
  if (lower.includes('.m4s') || lower.includes('.ts')) return 'video/*,*/*;q=0.8'
  return 'image/*,*/*;q=0.8'
}

async function handleProxy(request: Request, env: Env, url: URL): Promise<Response> {
  const resolved = resolveTarget(url)
  if (resolved instanceof Response) return resolved
  const { target, isMedia } = resolved

  const headers = new Headers()

  if (isMedia) {
    // Signed CDN URLs: the signature covers the request, so send as little as possible and
    // never attach credentials.
    const userAgent = request.headers.get('user-agent')
    if (userAgent) headers.set('user-agent', userAgent)
    headers.set('accept', mediaAcceptHeader(target))
  } else {
    const session = await loadSession(env)
    if (!session) {
      return json({ error: 'arlo_session_missing', message: 'No Arlo session stored' }, 401)
    }
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (
        STRIPPED_REQUEST_HEADERS.has(lower) ||
        lower.startsWith('sec-') ||
        lower.startsWith('cf-')
      )
        return
      headers.set(key, value)
    })
    headers.set('authorization', session.authorization)
    headers.set('auth-version', session.authVersion)
    headers.set('xcloudid', session.xcloudid)
    headers.set('user-agent', ARLO_USER_AGENT)
    if (!headers.has('accept')) headers.set('accept', 'application/json')
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
  })

  // Log method, host and status only: paths and queries can carry signed credentials.
  console.log(`[Arlo Proxy] ${request.method} ${target.hostname} -> ${upstream.status}`)

  if (!isMedia && (upstream.status === 401 || upstream.status === 403)) {
    const response = new Response(upstream.body, upstream)
    response.headers.set('x-homehub-arlo', 'token-rejected')
    return response
  }
  return upstream
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)

  // Reject unexpected origins before anything runs, so a disallowed site cannot trigger side
  // effects (withholding CORS headers only hides the response, it does not stop the request).
  if (!isOriginAllowed(request, env)) return json({ error: 'Origin not allowed' }, 403)

  if (request.method === 'OPTIONS') return new Response(null, { status: 204 })

  if (url.pathname === '/health' && request.method === 'GET') {
    return json({ status: 'healthy', service: 'homehub-arlo-proxy', timestamp: Date.now() })
  }

  if (!(await isAuthorized(request, env))) return json({ error: 'Unauthorized' }, 401)

  if (url.pathname === '/session') {
    if (request.method === 'GET') return json(toMetadata(await loadSession(env)))
    if (request.method === 'PUT') return handlePutSession(request, env)
    if (request.method === 'DELETE') {
      await env.ARLO_KV.delete(SESSION_KEY)
      return json(toMetadata(null))
    }
    return json({ error: 'Method not allowed' }, 405)
  }

  return handleProxy(request, env, url)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return withCors(await route(request, env), request, env)
    } catch (error) {
      console.error('[Arlo Proxy] Error:', error instanceof Error ? error.message : error)
      return withCors(json({ error: 'Proxy error' }, 502), request, env)
    }
  },
}
