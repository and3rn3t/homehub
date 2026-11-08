import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KVClient } from './kv-client'

describe('KVClient (Cloudflare Access, same-origin)', () => {
  const fetchMock = vi.fn()
  const reloadMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    reloadMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      reload: reloadMock,
    } as Location)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('sends no Authorization header and uses same-origin credentials', async () => {
    fetchMock.mockResolvedValue(Response.json({ value: 42 }))

    const value = await new KVClient({ baseUrl: '' }).get<number>('answer')

    expect(value).toBe(42)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/kv/answer')
    expect(init.credentials).toBe('same-origin')
    expect(init.headers).not.toHaveProperty('Authorization')
  })

  it('reloads once to re-authenticate when Access returns 401', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 401, statusText: 'Unauthorized' }))
    const client = new KVClient({ baseUrl: '' })

    await expect(client.get('a')).rejects.toThrow()
    await expect(client.get('b')).rejects.toThrow()

    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})
