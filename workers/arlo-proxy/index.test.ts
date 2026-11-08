import { beforeEach, describe, expect, it, vi } from 'vitest'
import worker, { type Env, type SessionStore } from './index'

const SERVICE_TOKEN = 'service-token'
const ARLO_AUTH = `2_${'a'.repeat(120)}`
const ARLO_CLOUD_ID = 'cloud-id-1234567890'

function makeStore(): SessionStore & { dump: () => Map<string, string> } {
  const data = new Map<string, string>()
  return {
    get: vi.fn(async (key: string) => (data.has(key) ? JSON.parse(data.get(key) as string) : null)),
    put: vi.fn(async (key: string, value: string) => void data.set(key, value)),
    delete: vi.fn(async (key: string) => void data.delete(key)),
    dump: () => data,
  }
}

function makeEnv(overrides: Partial<Env> = {}): Env {
  return { ARLO_KV: makeStore(), AUTH_TOKEN: SERVICE_TOKEN, ...overrides }
}

function authed(path: string, init: RequestInit = {}): Request {
  return new Request(`https://proxy${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${SERVICE_TOKEN}`, ...(init.headers as object) },
  })
}

function putSession(body: unknown): Request {
  return authed('/session', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Arlo proxy auth (fail closed)', () => {
  it('serves /health without credentials', async () => {
    const response = await worker.fetch(new Request('https://proxy/health'), makeEnv())
    expect(response.status).toBe(200)
  })

  it.each(['/session', '/hmsweb/users/devices', '/proxy/https%3A%2F%2Fx.arlo.com%2Fa.jpg'])(
    'rejects %s without credentials',
    async path => {
      const response = await worker.fetch(new Request(`https://proxy${path}`), makeEnv())
      expect(response.status).toBe(401)
    }
  )

  it('rejects everything when no auth is configured', async () => {
    const response = await worker.fetch(authed('/session'), makeEnv({ AUTH_TOKEN: undefined }))
    expect(response.status).toBe(401)
  })
})

describe('session custody', () => {
  let env: Env
  beforeEach(() => {
    env = makeEnv()
  })

  it('stores a valid token and returns metadata only', async () => {
    const response = await worker.fetch(
      putSession({ authorization: ARLO_AUTH, xcloudid: ARLO_CLOUD_ID }),
      env
    )
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(JSON.parse(body)).toMatchObject({ exists: true, source: 'manual' })
    expect(body).not.toContain(ARLO_AUTH)
    expect(body).not.toContain(ARLO_CLOUD_ID)
  })

  it('never exposes the secret through GET /session', async () => {
    await worker.fetch(putSession({ authorization: ARLO_AUTH, xcloudid: ARLO_CLOUD_ID }), env)

    const text = await (await worker.fetch(authed('/session'), env)).text()

    expect(JSON.parse(text).exists).toBe(true)
    expect(text).not.toContain(ARLO_AUTH)
    expect(text).not.toContain('authorization')
  })

  it('rejects malformed tokens', async () => {
    const short = await worker.fetch(
      putSession({ authorization: '2_short', xcloudid: ARLO_CLOUD_ID }),
      env
    )
    const noPrefix = await worker.fetch(
      putSession({ authorization: 'x'.repeat(150), xcloudid: ARLO_CLOUD_ID }),
      env
    )
    const noCloudId = await worker.fetch(putSession({ authorization: ARLO_AUTH }), env)

    expect([short.status, noPrefix.status, noCloudId.status]).toEqual([400, 400, 400])
  })

  it('reuses the stored xcloudid when a refresh omits it', async () => {
    await worker.fetch(putSession({ authorization: ARLO_AUTH, xcloudid: ARLO_CLOUD_ID }), env)
    const refreshed = `2_${'b'.repeat(120)}`

    const response = await worker.fetch(putSession({ authorization: refreshed }), env)

    expect(response.status).toBe(200)
    const stored = JSON.parse(
      (env.ARLO_KV as ReturnType<typeof makeStore>).dump().get('session') as string
    )
    expect(stored.authorization).toBe(refreshed)
    expect(stored.xcloudid).toBe(ARLO_CLOUD_ID)
  })

  it("keeps a migrated token's real expiry but never extends past the normal window", async () => {
    const soon = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    const farFuture = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()

    const kept = await (
      await worker.fetch(
        putSession({ authorization: ARLO_AUTH, xcloudid: ARLO_CLOUD_ID, expiresAt: soon }),
        env
      )
    ).json()
    const clamped = await (
      await worker.fetch(
        putSession({ authorization: ARLO_AUTH, xcloudid: ARLO_CLOUD_ID, expiresAt: farFuture }),
        env
      )
    ).json()

    expect(kept.expiresAt).toBe(soon)
    const lifespanMs = new Date(clamped.expiresAt).getTime() - Date.now()
    expect(lifespanMs).toBeLessThanOrEqual(36 * 60 * 60 * 1000)
  })

  it('deletes the session', async () => {
    await worker.fetch(putSession({ authorization: ARLO_AUTH, xcloudid: ARLO_CLOUD_ID }), env)
    await worker.fetch(authed('/session', { method: 'DELETE' }), env)

    const meta = await (await worker.fetch(authed('/session'), env)).json()

    expect(meta).toMatchObject({ exists: false })
  })

  it('treats an expired session as missing', async () => {
    const store = makeStore()
    store.put(
      'session',
      JSON.stringify({
        authorization: ARLO_AUTH,
        xcloudid: ARLO_CLOUD_ID,
        authVersion: '2',
        capturedAt: new Date(0).toISOString(),
        expiresAt: new Date(1000).toISOString(),
        source: 'manual',
      })
    )

    const response = await worker.fetch(authed('/session'), makeEnv({ ARLO_KV: store }))

    expect(await response.json()).toMatchObject({ exists: false })
  })
})

describe('upstream proxying', () => {
  const fetchMock = vi.fn()
  let env: Env

  beforeEach(async () => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response('{"ok":true}'))
    vi.stubGlobal('fetch', fetchMock)
    env = makeEnv()
    await worker.fetch(putSession({ authorization: ARLO_AUTH, xcloudid: ARLO_CLOUD_ID }), env)
  })

  function upstreamCall(): { url: string; headers: Headers } {
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    return { url, headers: new Headers(init.headers) }
  }

  it('injects the stored token and never forwards client credentials', async () => {
    await worker.fetch(
      authed('/hmsweb/users/devices?x=1', {
        headers: { Cookie: 'CF_Authorization=secret', 'Cf-Access-Jwt-Assertion': 'jwt' },
      }),
      env
    )

    const { url, headers } = upstreamCall()
    expect(url).toBe('https://myapi.arlo.com/hmsweb/users/devices?x=1')
    expect(headers.get('authorization')).toBe(ARLO_AUTH)
    expect(headers.get('xcloudid')).toBe(ARLO_CLOUD_ID)
    expect(headers.get('auth-version')).toBe('2')
    expect(headers.get('cookie')).toBeNull()
    expect(headers.get('cf-access-jwt-assertion')).toBeNull()
  })

  it('ignores a client-supplied xcloudid or auth-version header', async () => {
    await worker.fetch(
      authed('/hmsweb/users/devices', { headers: { xcloudid: 'attacker', 'auth-version': '9' } }),
      env
    )

    const { headers } = upstreamCall()
    expect(headers.get('xcloudid')).toBe(ARLO_CLOUD_ID)
    expect(headers.get('auth-version')).toBe('2')
  })

  it('returns 401 when no session is stored', async () => {
    const response = await worker.fetch(authed('/hmsweb/users/devices'), makeEnv())

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ error: 'arlo_session_missing' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('flags an upstream 401 so the client can tell it from an Access 401', async () => {
    fetchMock.mockResolvedValue(new Response('no', { status: 401 }))

    const response = await worker.fetch(authed('/hmsweb/users/devices'), env)

    expect(response.status).toBe(401)
    expect(response.headers.get('x-homehub-arlo')).toBe('token-rejected')
  })

  it('proxies Arlo media without credentials', async () => {
    await worker.fetch(
      authed(`/proxy/${encodeURIComponent('https://cdn.arlo.com/seg1.m4s?sig=abc')}`),
      env
    )

    const { url, headers } = upstreamCall()
    expect(url).toBe('https://cdn.arlo.com/seg1.m4s?sig=abc')
    expect(headers.get('authorization')).toBeNull()
    expect(headers.get('xcloudid')).toBeNull()
    expect(headers.get('accept')).toContain('video/')
  })

  it.each([
    ['non-Arlo host', 'https://evil.example.com/x'],
    ['lookalike host', 'https://notarlo.com/x'],
    ['suffix trick', 'https://arlo.com.evil.example/x'],
    ['plain http', 'http://cdn.arlo.com/x'],
  ])('rejects media proxying for %s', async (_label, target) => {
    const response = await worker.fetch(authed(`/proxy/${encodeURIComponent(target)}`), env)

    expect(response.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a malformed proxy URL', async () => {
    const response = await worker.fetch(authed('/proxy/not-a-url'), env)
    expect(response.status).toBe(400)
  })
})

describe('CORS allowlist', () => {
  function requestWithOrigin(origin: string): Request {
    const request = new Request('https://proxy/health')
    Object.defineProperty(request, 'headers', { value: new Headers({ Origin: origin }) })
    return request
  }

  it('echoes an allowed origin only', async () => {
    const env = makeEnv({ ALLOWED_ORIGINS: 'http://localhost:5173' })

    const allowed = await worker.fetch(requestWithOrigin('http://localhost:5173'), env)
    const denied = await worker.fetch(requestWithOrigin('https://evil.example'), env)

    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('never sends a wildcard', async () => {
    const response = await worker.fetch(requestWithOrigin('http://localhost:5173'), makeEnv())
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
