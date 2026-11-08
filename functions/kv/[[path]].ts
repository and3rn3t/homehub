import { forwardToKvWorker, type ForwardEnv } from '../_lib/forward'

/** /kv and /kv/:key -> KV worker (same-origin, behind Cloudflare Access). */
export const onRequest = ({
  request,
  env,
}: {
  request: Request
  env: ForwardEnv
}): Promise<Response> => forwardToKvWorker(request, env)
