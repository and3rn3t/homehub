import { forwardWithoutPrefix, type ForwardEnv } from '../../_lib/forward'

/**
 * /api/arlo/* -> Arlo proxy worker (same-origin, behind Cloudflare Access).
 * /api/arlo/session manages the server-held token; everything else proxies to Arlo.
 */
export const onRequest = ({
  request,
  env,
}: {
  request: Request
  env: ForwardEnv
}): Promise<Response> => forwardWithoutPrefix(env.ARLO_PROXY, 'ARLO_PROXY', request, '/api/arlo')
