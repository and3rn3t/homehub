/**
 * HomeHub KV Worker
 * 
 * Cloudflare Worker providing REST API for KV storage operations.
 * Supports GET, POST, DELETE operations with CORS and error handling.
 */

export interface Env {
  HOMEHUB_KV: KVNamespace
  AUTH_TOKEN?: string
  ENVIRONMENT?: string
}

interface KVResponse {
  key: string
  value?: any
  success?: boolean
  timestamp?: number
  error?: string
}

/**
 * CORS headers for cross-origin requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

/**
 * Handle CORS preflight requests
 */
function handleOptions(): Response {
  return new Response(null, {
    headers: corsHeaders,
  })
}

/**
 * Create error response
 */
function errorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  )
}

/**
 * Create success response
 */
function jsonResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  )
}

/**
 * Validate key name (alphanumeric, dashes, underscores)
 */
function isValidKey(key: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(key)
}

/**
 * Optional: Check authentication
 */
function checkAuth(request: Request, env: Env): boolean {
  if (!env.AUTH_TOKEN) return true // No auth configured
  
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  return token === env.AUTH_TOKEN
}

/**
 * Main Worker handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions()
    }

    // Optional: Authentication check
    if (!checkAuth(request, env)) {
      return errorResponse('Unauthorized', 401)
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      // GET /health - Health check endpoint
      if (path === '/health' && request.method === 'GET') {
        return jsonResponse({
          status: 'healthy',
          environment: env.ENVIRONMENT || 'development',
          timestamp: Date.now(),
        })
      }

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

        const body = await request.json() as { value: any }
        
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

      // 404 - Route not found
      return errorResponse('Not found', 404)

    } catch (error) {
      console.error('Worker error:', error)
      return errorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      )
    }
  },
}
