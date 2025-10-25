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

import { ExecutionContext } from '@cloudflare/workers-types'

export type Env = {
  // Add environment variables here if needed
  // Example: ALLOWED_ORIGINS: string
  [key: string]: unknown
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
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      // Handle CORS preflight
      const corsResponse = handleCORS(request)
      if (corsResponse) {
        return corsResponse
      }

      const url = new URL(request.url)

      // Extract the target path from the worker URL
      // Expected formats:
      // 1. API: https://arlo-proxy.your-worker.workers.dev/hmsweb/users/devices
      //    Maps to: https://myapi.arlo.com/hmsweb/users/devices
      // 2. Proxy any Arlo URL: https://arlo-proxy.your-worker.workers.dev/proxy/<encoded-url>
      //    Maps to: ANY *.arlo.com domain (images, streaming, API endpoints, etc.)
      const targetPath = url.pathname.replace(/^\//, '') // Remove leading slash

      let targetUrl: string

      // Check if this is a wildcard proxy request
      if (targetPath.startsWith('proxy/')) {
        // Decode the full URL from the path
        const encodedUrl = targetPath.replace('proxy/', '')
        targetUrl = decodeURIComponent(encodedUrl)

        console.log(`[Arlo Proxy] 🔄 Wildcard proxy request`)
        console.log(`[Arlo Proxy] Encoded URL: ${encodedUrl.substring(0, 100)}...`)
        console.log(`[Arlo Proxy] Decoded URL: ${targetUrl}`)

        // Validate it's an Arlo domain for security
        const parsedUrl = new URL(targetUrl)
        const targetHost = parsedUrl.hostname

        if (!targetHost.endsWith('.arlo.com') && targetHost !== 'arlo.com') {
          console.error(`[Arlo Proxy] ⛔ Security: Rejected non-Arlo domain: ${targetHost}`)
          return new Response(
            JSON.stringify({
              error: 'Invalid domain',
              message: 'Only *.arlo.com domains are allowed through this proxy',
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          )
        }

        console.log(`[Arlo Proxy] ✅ Validated: ${targetHost}${parsedUrl.pathname}`)
      } else {
        // Standard API request (default to myapi.arlo.com)
        targetUrl = `https://myapi.arlo.com/${targetPath}${url.search}`
        console.log(`[Arlo Proxy] ${request.method} ${targetPath}`)
      }

      // Forward the request to Arlo
      // Strip problematic headers that might cause CORS or AWS S3 signed URL issues
      const forwardHeaders = new Headers()

      // For AWS S3 signed URLs (image CDN, video manifests, segments), customize headers based on content type
      // AWS validates the signature against the original request, extra headers can break it
      if (targetPath.startsWith('proxy/')) {
        const userAgent = request.headers.get('user-agent')
        if (userAgent) {
          forwardHeaders.set('user-agent', userAgent)
        }

        // Determine content type from URL
        const targetUrlLower = targetUrl.toLowerCase()
        if (targetUrlLower.includes('.mpd')) {
          // MPEG-DASH manifest - needs specific accept header
          forwardHeaders.set('accept', 'application/dash+xml,*/*;q=0.8')
          console.log('[Arlo Proxy] Proxying DASH manifest (.mpd)')
        } else if (targetUrlLower.includes('.m3u8')) {
          // HLS manifest - needs specific accept header
          forwardHeaders.set('accept', 'application/vnd.apple.mpegurl,*/*;q=0.8')
          console.log('[Arlo Proxy] Proxying HLS manifest (.m3u8)')
        } else if (targetUrlLower.includes('.m4s') || targetUrlLower.includes('.ts')) {
          // Video segments - needs video accept header
          forwardHeaders.set('accept', 'video/*,*/*;q=0.8')
          console.log('[Arlo Proxy] Proxying video segment')
        } else {
          // Images or other content - use image accept header
          forwardHeaders.set('accept', 'image/*,*/*;q=0.8')
        }
      } else {
        // For API requests, forward most headers except problematic ones
        request.headers.forEach((value, key) => {
          const lowerKey = key.toLowerCase()
          if (
            lowerKey !== 'host' &&
            lowerKey !== 'origin' &&
            lowerKey !== 'referer' &&
            !lowerKey.startsWith('sec-')
          ) {
            forwardHeaders.set(key, value)
          }
        })
      }

      const arloResponse = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      })

      console.log(`[Arlo Proxy] Response: ${arloResponse.status} ${arloResponse.statusText}`)

      // Log response headers for debugging
      if (!arloResponse.ok) {
        console.error(
          `[Arlo Proxy] Error response headers:`,
          Object.fromEntries(arloResponse.headers)
        )
        try {
          const errorBody = await arloResponse.clone().text()
          console.error(`[Arlo Proxy] Error body:`, errorBody.substring(0, 500))
        } catch (e) {
          // Ignore if can't read body
        }
      }

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
