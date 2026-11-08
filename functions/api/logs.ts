import { forwardToKvWorker, type ForwardEnv } from '../_lib/forward'

/** /api/logs -> KV worker logging endpoint (same-origin, behind Cloudflare Access). */
export const onRequest = ({
  request,
  env,
}: {
  request: Request
  env: ForwardEnv
}): Promise<Response> => forwardToKvWorker(request, env)
