import { beforeEach, describe, expect, it, vi } from 'vitest'

const tokenManager = vi.hoisted(() => ({
  exportAsHeaders: vi.fn(() => ({ accept: 'application/json' }) as Record<string, string> | null),
  clearToken: vi.fn(async () => {}),
}))

vi.mock('@/services/auth/ArloTokenManager', () => ({ arloTokenManager: tokenManager }))

import { ArloAdapter } from './ArloAdapter'

type RequestApi = { makeAuthenticatedRequest(url: string): Promise<Response> }

describe('ArloAdapter 401 handling', () => {
  const fetchMock = vi.fn()
  let adapter: ArloAdapter
  let onExpired: ReturnType<typeof vi.fn<(data: unknown) => void>>

  beforeEach(() => {
    fetchMock.mockReset()
    tokenManager.clearToken.mockReset().mockResolvedValue(undefined)
    tokenManager.exportAsHeaders.mockReturnValue({ accept: 'application/json' })
    vi.stubGlobal('fetch', fetchMock)
    adapter = new ArloAdapter({})
    onExpired = vi.fn<(data: unknown) => void>()
    adapter.on('token-expired', onExpired)
  })

  const request = (): Promise<Response> =>
    (adapter as unknown as RequestApi).makeAuthenticatedRequest('/api/arlo/hmsweb/users/devices')

  it('clears the stored token when Arlo itself rejected it', async () => {
    fetchMock.mockResolvedValue(
      new Response('no', { status: 401, headers: { 'x-homehub-arlo': 'token-rejected' } })
    )

    await expect(request()).rejects.toThrow('Authentication token expired')

    expect(tokenManager.clearToken).toHaveBeenCalledTimes(1)
    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it('never deletes anything when the proxy merely reports a missing session', async () => {
    // KV is eventually consistent: right after an upload this answer can be stale, and deleting
    // on it would undo the upload.
    fetchMock.mockResolvedValue(Response.json({ error: 'arlo_session_missing' }, { status: 401 }))

    await expect(request()).rejects.toThrow('Authentication token expired')

    expect(tokenManager.clearToken).not.toHaveBeenCalled()
    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it('still reports the expired token when the cleanup itself fails', async () => {
    fetchMock.mockResolvedValue(
      new Response('no', { status: 401, headers: { 'x-homehub-arlo': 'token-rejected' } })
    )
    tokenManager.clearToken.mockRejectedValue(new Error('delete failed'))

    await expect(request()).rejects.toThrow('Authentication token expired')
  })

  it('leaves a plain 401 (the Access session) to the normal re-login flow', async () => {
    fetchMock.mockResolvedValue(new Response('login required', { status: 401 }))

    const response = await request()

    expect(response.status).toBe(401)
    expect(tokenManager.clearToken).not.toHaveBeenCalled()
    expect(onExpired).not.toHaveBeenCalled()
  })

  it('sends same-origin credentials and no Arlo secrets', async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: true }))

    await request()

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.credentials).toBe('same-origin')
    expect(Object.keys(init.headers as object).map(key => key.toLowerCase())).not.toContain(
      'authorization'
    )
  })

  it('refuses to send a request when no token is connected', async () => {
    tokenManager.exportAsHeaders.mockReturnValue(null)

    await expect(request()).rejects.toThrow('No authentication token available')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
