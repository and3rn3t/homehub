import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAuthCache } from './auth'
import worker, { type Env } from './index'

const TEAM_DOMAIN = 'team.cloudflareaccess.com'
const AUDIENCE = 'test-aud'
const KID = 'test-kid'

let privateKey: CryptoKey
let publicJwk: JsonWebKey

function base64Url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function signJwt(claims: Record<string, unknown>): Promise<string> {
  const header = base64Url(JSON.stringify({ alg: 'RS256', kid: KID, typ: 'JWT' }))
  const payload = base64Url(JSON.stringify(claims))
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(`${header}.${payload}`)
  )
  return `${header}.${payload}.${base64Url(signature)}`
}

function validClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    aud: [AUDIENCE],
    iss: `https://${TEAM_DOMAIN}`,
    exp: Math.floor(Date.now() / 1000) + 300,
    ...overrides,
  }
}

function makeEnv(overrides: Partial<Env> = {}): Env {
  const kvStore = new Map<string, string>()
  const kv = {
    get: vi.fn(async (key: string) => {
      const value = kvStore.get(key)
      return value === undefined ? null : JSON.parse(value)
    }),
    put: vi.fn(async (key: string, value: string) => void kvStore.set(key, value)),
    delete: vi.fn(async (key: string) => void kvStore.delete(key)),
    list: vi.fn(async () => ({ keys: [...kvStore.keys()].map(name => ({ name })) })),
  }
  return {
    HOMEHUB_KV: kv as unknown as KVNamespace,
    LOGS_KV: kv as unknown as KVNamespace,
    ACCESS_TEAM_DOMAIN: TEAM_DOMAIN,
    ACCESS_AUD: AUDIENCE,
    ...overrides,
  }
}

beforeAll(async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  )
  privateKey = keyPair.privateKey
  publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
})

beforeEach(() => {
  resetAuthCache()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ keys: [{ ...publicJwk, kid: KID, alg: 'RS256' }] }))
  )
})

describe('KV worker auth (fail closed)', () => {
  it('serves /health without credentials', async () => {
    const response = await worker.fetch(new Request('https://w/health'), makeEnv())
    expect(response.status).toBe(200)
  })

  it('rejects /kv when no auth is configured at all', async () => {
    const env = makeEnv({ ACCESS_TEAM_DOMAIN: undefined, ACCESS_AUD: undefined })
    const response = await worker.fetch(new Request('https://w/kv'), env)
    expect(response.status).toBe(401)
  })

  it('rejects writes and deletes without credentials', async () => {
    const env = makeEnv()
    const post = await worker.fetch(
      new Request('https://w/kv/devices', { method: 'POST', body: JSON.stringify({ value: 1 }) }),
      env
    )
    const del = await worker.fetch(new Request('https://w/kv/devices', { method: 'DELETE' }), env)
    expect(post.status).toBe(401)
    expect(del.status).toBe(401)
  })

  it('accepts a valid Access JWT', async () => {
    const token = await signJwt(validClaims())
    const response = await worker.fetch(
      new Request('https://w/kv', { headers: { 'Cf-Access-Jwt-Assertion': token } }),
      makeEnv()
    )
    expect(response.status).toBe(200)
  })

  it('rejects an expired JWT', async () => {
    const token = await signJwt(validClaims({ exp: Math.floor(Date.now() / 1000) - 10 }))
    const response = await worker.fetch(
      new Request('https://w/kv', { headers: { 'Cf-Access-Jwt-Assertion': token } }),
      makeEnv()
    )
    expect(response.status).toBe(401)
  })

  it('rejects a JWT with the wrong audience', async () => {
    const token = await signJwt(validClaims({ aud: ['someone-else'] }))
    const response = await worker.fetch(
      new Request('https://w/kv', { headers: { 'Cf-Access-Jwt-Assertion': token } }),
      makeEnv()
    )
    expect(response.status).toBe(401)
  })

  it('rejects a JWT with a tampered signature', async () => {
    const token = await signJwt(validClaims())
    const [header, payload] = token.split('.')
    const forged = `${header}.${payload}.${base64Url('not-the-signature')}`
    const response = await worker.fetch(
      new Request('https://w/kv', { headers: { 'Cf-Access-Jwt-Assertion': forged } }),
      makeEnv()
    )
    expect(response.status).toBe(401)
  })

  it('accepts the service token and rejects a wrong one', async () => {
    const env = makeEnv({ AUTH_TOKEN: 'secret-token' })
    const ok = await worker.fetch(
      new Request('https://w/kv', { headers: { Authorization: 'Bearer secret-token' } }),
      env
    )
    const bad = await worker.fetch(
      new Request('https://w/kv', { headers: { Authorization: 'Bearer wrong' } }),
      env
    )
    expect(ok.status).toBe(200)
    expect(bad.status).toBe(401)
  })

  it('rate-limits writes when the limiter rejects', async () => {
    const env = makeEnv({
      AUTH_TOKEN: 'secret-token',
      WRITE_LIMITER: { limit: vi.fn(async () => ({ success: false })) } as unknown as RateLimit,
    })
    const response = await worker.fetch(
      new Request('https://w/kv/devices', {
        method: 'POST',
        headers: { Authorization: 'Bearer secret-token' },
        body: JSON.stringify({ value: 1 }),
      }),
      env
    )
    expect(response.status).toBe(429)
  })
})

/** happy-dom's Request drops the forbidden `Origin` header; Workers keep it. */
function requestWithOrigin(url: string, origin: string): Request {
  const request = new Request(url)
  Object.defineProperty(request, 'headers', { value: new Headers({ Origin: origin }) })
  return request
}

describe('KV worker CORS allowlist', () => {
  const env = makeEnv({ ALLOWED_ORIGINS: 'http://localhost:5173, https://home.example.com' })

  it('echoes an allowed origin', async () => {
    const response = await worker.fetch(
      requestWithOrigin('https://w/health', 'http://localhost:5173'),
      env
    )
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })

  it('omits CORS headers for a disallowed origin', async () => {
    const response = await worker.fetch(
      requestWithOrigin('https://w/health', 'https://evil.example'),
      env
    )
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('omits CORS headers when ALLOWED_ORIGINS is unset', async () => {
    const response = await worker.fetch(
      requestWithOrigin('https://w/health', 'http://localhost:5173'),
      makeEnv()
    )
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
