import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const AUTHORIZATION = `2_${'a'.repeat(120)}`
const CLOUD_ID = 'cloud-id-1234567890'
const LEGACY_KEY = 'arlo-auth-token'

function sessionResponse(overrides: Record<string, unknown> = {}): Response {
  return Response.json({
    exists: true,
    capturedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    source: 'manual',
    ...overrides,
  })
}

const NO_SESSION = { exists: false, capturedAt: null, expiresAt: null, source: null }

describe('ArloTokenManager (server-side custody)', () => {
  const fetchMock = vi.fn()

  /** Fresh singleton per test: the manager holds state in module scope. */
  async function loadManager() {
    vi.resetModules()
    const module = await import('./ArloTokenManager')
    return module.arloTokenManager
  }

  beforeEach(() => {
    fetchMock.mockReset()
    localStorage.clear()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uploads the token to the proxy and keeps no secret in browser storage', async () => {
    fetchMock.mockResolvedValue(sessionResponse())
    const manager = await loadManager()

    await manager.saveToken(AUTHORIZATION, CLOUD_ID)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/arlo/session')
    expect(init.method).toBe('PUT')
    expect(init.credentials).toBe('same-origin')
    expect(JSON.parse(init.body as string)).toMatchObject({ authorization: AUTHORIZATION })

    const stored = JSON.stringify({ ...localStorage, ...sessionStorage })
    expect(stored).not.toContain(AUTHORIZATION)
    expect(stored).not.toContain(CLOUD_ID)
  })

  it('reports metadata after saving, without any token material', async () => {
    fetchMock.mockResolvedValue(sessionResponse())
    const manager = await loadManager()

    const metadata = await manager.saveToken(AUTHORIZATION, CLOUD_ID)

    expect(metadata.isValid).toBe(true)
    expect(metadata.timeUntilExpiration).toMatch(/hour/)
    expect(JSON.stringify(metadata)).not.toContain(AUTHORIZATION)
    expect(manager).not.toHaveProperty('getToken')
  })

  it('exports request headers without Arlo credentials', async () => {
    fetchMock.mockResolvedValue(sessionResponse())
    const manager = await loadManager()
    expect(manager.exportAsHeaders()).toBeNull() // not connected yet

    await manager.saveToken(AUTHORIZATION, CLOUD_ID)
    const headers = manager.exportAsHeaders() ?? {}

    expect(Object.keys(headers).map(key => key.toLowerCase())).not.toEqual(
      expect.arrayContaining(['authorization'])
    )
    expect(JSON.stringify(headers)).not.toContain(AUTHORIZATION)
    expect(JSON.stringify(headers)).not.toContain(CLOUD_ID)
  })

  it('omits xcloudid on a refresh so the server reuses the one it holds', async () => {
    fetchMock.mockResolvedValue(sessionResponse())
    const manager = await loadManager()

    await manager.saveToken(AUTHORIZATION)

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string).xcloudid).toBeUndefined()
  })

  it('surfaces the server reason when the token is rejected', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: 'Invalid authorization token format' }, { status: 400 })
    )
    const manager = await loadManager()

    await expect(manager.saveToken('bad', CLOUD_ID)).rejects.toThrow(
      'Invalid authorization token format'
    )
    expect(manager.isTokenValid()).toBe(false)
  })

  it('refresh() loads server state; concurrent calls share one request', async () => {
    fetchMock.mockResolvedValue(sessionResponse())
    const manager = await loadManager()

    await Promise.all([manager.refresh(), manager.refresh(), manager.refresh()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(manager.isTokenValid()).toBe(true)
  })

  it('keeps its last known state when a refresh fails', async () => {
    fetchMock.mockResolvedValueOnce(sessionResponse())
    const manager = await loadManager()
    await manager.refresh()

    fetchMock.mockRejectedValueOnce(new TypeError('network down'))
    await manager.refresh()

    expect(manager.isTokenValid()).toBe(true)
  })

  it('treats an expired session as invalid', async () => {
    fetchMock.mockResolvedValue(
      sessionResponse({ expiresAt: new Date(Date.now() - 1000).toISOString() })
    )
    const manager = await loadManager()

    await manager.refresh()

    expect(manager.isTokenValid()).toBe(false)
    expect(manager.getFormattedTimeUntilExpiration()).toBe('Expired')
  })

  it('flags a token that expires within two hours', async () => {
    fetchMock.mockResolvedValue(
      sessionResponse({ expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() })
    )
    const manager = await loadManager()

    await manager.refresh()

    expect(manager.isTokenExpiringSoon()).toBe(true)
  })

  it('clears the server-side token and local state', async () => {
    fetchMock.mockResolvedValueOnce(sessionResponse())
    const manager = await loadManager()
    await manager.refresh()

    fetchMock.mockResolvedValueOnce(Response.json(NO_SESSION))
    await manager.clearToken()

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(init.method).toBe('DELETE')
    expect(manager.isTokenValid()).toBe(false)
  })

  describe('legacy localStorage migration', () => {
    function storeLegacy(expiresAt: string): void {
      localStorage.setItem(
        LEGACY_KEY,
        JSON.stringify({
          authorization: AUTHORIZATION,
          xcloudid: CLOUD_ID,
          authVersion: '2',
          capturedAt: new Date().toISOString(),
          expiresAt,
        })
      )
    }

    it('uploads a still-valid legacy token with its real expiry, then deletes it locally', async () => {
      const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      storeLegacy(expiresAt)
      fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
        init.method === 'PUT'
          ? sessionResponse({ source: 'migrated', expiresAt })
          : sessionResponse({ expiresAt })
      )
      const manager = await loadManager()

      await manager.refresh()

      const put = fetchMock.mock.calls.find(([, init]) => (init as RequestInit).method === 'PUT')
      expect(JSON.parse((put?.[1] as RequestInit).body as string)).toMatchObject({
        authorization: AUTHORIZATION,
        xcloudid: CLOUD_ID,
        expiresAt,
        source: 'migrated',
      })
      expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
      expect(manager.isTokenValid()).toBe(true)
    })

    it('keeps the legacy token for a retry if the upload fails', async () => {
      storeLegacy(new Date(Date.now() + 60 * 60 * 1000).toISOString())
      fetchMock.mockResolvedValue(new Response('boom', { status: 500 }))
      const manager = await loadManager()

      await manager.refresh()

      expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull()
    })

    it('deletes an expired legacy token without uploading it', async () => {
      storeLegacy(new Date(Date.now() - 1000).toISOString())
      fetchMock.mockResolvedValue(Response.json(NO_SESSION))
      const manager = await loadManager()

      await manager.refresh()

      expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
      const methods = fetchMock.mock.calls.map(([, init]) => (init as RequestInit).method)
      expect(methods).not.toContain('PUT')
    })

    it('deletes an unreadable legacy entry', async () => {
      localStorage.setItem(LEGACY_KEY, '{not json')
      fetchMock.mockResolvedValue(Response.json(NO_SESSION))
      const manager = await loadManager()

      await manager.refresh()

      expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
    })
  })
})
