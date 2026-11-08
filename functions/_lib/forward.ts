/**
 * Shared helper for Pages Functions that forward same-origin API calls to the
 * KV worker over a service binding.
 *
 * The site is protected by Cloudflare Access, which attaches
 * `Cf-Access-Jwt-Assertion` to requests reaching Pages. Passing the request
 * through unchanged lets the worker re-verify that JWT (defence in depth).
 * The worker itself is not publicly routable (`workers_dev = false`).
 */

export interface ServiceBinding {
  fetch(request: Request): Promise<Response>
}

export interface ForwardEnv {
  KV_API?: ServiceBinding
  ARLO_PROXY?: ServiceBinding
}

export async function forwardToKvWorker(request: Request, env: ForwardEnv): Promise<Response> {
  if (!env.KV_API) {
    return Response.json({ error: 'KV_API service binding is not configured' }, { status: 500 })
  }
  return env.KV_API.fetch(request)
}

/**
 * Forward to a service binding after removing a path prefix, e.g. `/api/arlo/session` becomes
 * `/session` for the Arlo proxy worker. Credentials in the request are passed through untouched.
 */
export async function forwardWithoutPrefix(
  binding: ServiceBinding | undefined,
  bindingName: string,
  request: Request,
  prefix: string
): Promise<Response> {
  if (!binding) {
    return Response.json(
      { error: `${bindingName} service binding is not configured` },
      { status: 500 }
    )
  }
  const url = new URL(request.url)
  url.pathname = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length) || '/'
    : url.pathname
  return binding.fetch(new Request(url.toString(), request))
}
