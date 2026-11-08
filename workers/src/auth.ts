/**
 * Authentication for the HomeHub KV worker.
 *
 * Two accepted credentials (fail closed when neither is valid):
 *  1. Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`) for browser traffic
 *  2. Static service token (`Authorization: Bearer <AUTH_TOKEN>`) for scripts
 */

export interface AuthEnv {
  AUTH_TOKEN?: string
  ACCESS_TEAM_DOMAIN?: string
  ACCESS_AUD?: string
  ALLOWED_ORIGINS?: string
}

interface Jwk {
  kid: string
  kty: string
  alg?: string
  n: string
  e: string
}

interface AccessClaims {
  aud?: string | string[]
  iss?: string
  exp?: number
  nbf?: number
}

const JWKS_TTL_MS = 10 * 60 * 1000
let jwksCache: { teamDomain: string; keys: Jwk[]; fetchedAt: number } | null = null

/** Reset module-level JWKS cache (tests). */
export function resetAuthCache(): void {
  jwksCache = null
}

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function decodeJson<T>(segment: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) as T
}

/**
 * Constant-time string comparison. Hashes both inputs first so the compared
 * buffers are always the same length and length does not leak.
 */
export async function timingSafeEqualStrings(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  const viewA = new Uint8Array(hashA)
  const viewB = new Uint8Array(hashB)
  let diff = 0
  for (let i = 0; i < viewA.length; i++) diff |= viewA[i] ^ viewB[i]
  return diff === 0
}

async function getJwks(teamDomain: string, forceRefresh = false): Promise<Jwk[]> {
  const now = Date.now()
  if (
    !forceRefresh &&
    jwksCache &&
    jwksCache.teamDomain === teamDomain &&
    now - jwksCache.fetchedAt < JWKS_TTL_MS
  ) {
    return jwksCache.keys
  }
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`)
  if (!response.ok) throw new Error(`JWKS fetch failed: ${response.status}`)
  const body = (await response.json()) as { keys: Jwk[] }
  jwksCache = { teamDomain, keys: body.keys, fetchedAt: now }
  return body.keys
}

/** Verify a Cloudflare Access JWT (RS256). Returns false on any failure. */
export async function verifyAccessJwt(token: string, env: AuthEnv): Promise<boolean> {
  const { ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: audience } = env
  if (!teamDomain || !audience) return false

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const [headerB64, payloadB64, signatureB64] = parts

    const header = decodeJson<{ alg?: string; kid?: string }>(headerB64)
    if (header.alg !== 'RS256' || !header.kid) return false

    const claims = decodeJson<AccessClaims>(payloadB64)
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) return false
    if (typeof claims.nbf === 'number' && claims.nbf > nowSeconds) return false
    if (claims.iss !== `https://${teamDomain}`) return false
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    if (!audiences.includes(audience)) return false

    let jwk = (await getJwks(teamDomain)).find(key => key.kid === header.kid)
    if (!jwk) {
      // Key rotation: refresh once before giving up.
      jwk = (await getJwks(teamDomain, true)).find(key => key.kid === header.kid)
    }
    if (!jwk) return false

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk as JsonWebKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(signatureB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    )
  } catch {
    return false
  }
}

/** Fail-closed authentication: true only with a valid Access JWT or service token. */
export async function isAuthorized(request: Request, env: AuthEnv): Promise<boolean> {
  const accessJwt = request.headers.get('Cf-Access-Jwt-Assertion')
  if (accessJwt && (await verifyAccessJwt(accessJwt, env))) return true

  const authHeader = request.headers.get('Authorization')
  if (env.AUTH_TOKEN && authHeader?.startsWith('Bearer ')) {
    return timingSafeEqualStrings(authHeader.slice('Bearer '.length), env.AUTH_TOKEN)
  }
  return false
}

/** Returns the request origin only if it is in the ALLOWED_ORIGINS allowlist. */
export function getAllowedOrigin(request: Request, env: AuthEnv): string | null {
  const origin = request.headers.get('Origin')
  if (!origin || !env.ALLOWED_ORIGINS) return null
  const allowed = env.ALLOWED_ORIGINS.split(',').map(entry => entry.trim())
  return allowed.includes(origin) ? origin : null
}
