/**
 * Arlo API Proxy Worker
 *
 * Cloudflare Worker that proxies requests to Arlo API to bypass CORS restrictions.
 * This allows browser-based apps to communicate with Arlo Cloud API.
 *
 * Security Notes:
 * - Does NOT store or log authentication tokens
 * - Passes through all headers from client (including authorization)
 * - Returns responses with CORS headers enabled
 * - Rate limiting recommended for production use
 *
 * Created: October 13, 2025 - Phase 4: Auto Token Refresh
 */

export interface Env {
  // Add environment variables here if needed
  // Example: ALLOWED_ORIGINS: string
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: Request): Response | null {
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Auth-Version, xcloudid',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    })
  }
  return null
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Auth-Version, xcloudid')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Handle CORS preflight
      const corsResponse = handleCORS(request)
      if (corsResponse) {
        return corsResponse
      }

      const url = new URL(request.url)

      // Extract the target path from the worker URL
      // Expected format: https://arlo-proxy.your-worker.workers.dev/hmsweb/users/devices
      // Maps to: https://myapi.arlo.com/hmsweb/users/devices
      const targetPath = url.pathname.replace(/^\//, '') // Remove leading slash
      const targetUrl = `https://myapi.arlo.com/${targetPath}${url.search}`

      console.log(`[Arlo Proxy] ${request.method} ${targetPath}`)

      // Forward the request to Arlo API
      const arloResponse = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      })

      console.log(`[Arlo Proxy] Response: ${arloResponse.status} ${arloResponse.statusText}`)

      // Add CORS headers and return
      return addCORSHeaders(arloResponse)
    } catch (error) {
      console.error('[Arlo Proxy] Error:', error)

      return new Response(
        JSON.stringify({
          error: 'Proxy error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  },
}
