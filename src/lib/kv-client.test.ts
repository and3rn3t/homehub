import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KVClient, REAUTH_PARAM } from './kv-client'

const PAGE_URL = 'https://home.example.com/dashboard?tab=rooms'

describe('KVClient (Cloudflare Access, same-origin)', () => {
  const fetchMock = vi.fn()
  const assignMock = vi.fn()

  function mockPageUrl(href: string): void {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      href,
      assign: assignMock,
    } as unknown as Location)
  }

  beforeEach(() => {
    fetchMock.mockReset()
    assignMock.mockReset()
    sessionStorage.clear()
    vi.stubGlobal('fetch', fetchMock)
    mockPageUrl(PAGE_URL)
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

  it('navigates once with a reauth parameter when Access returns 401', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 401, statusText: 'Unauthorized' }))
    const client = new KVClient({ baseUrl: '' })

    await expect(client.get('a')).rejects.toThrow()
    await expect(client.get('b')).rejects.toThrow()

    expect(assignMock).toHaveBeenCalledTimes(1)
    const target = new URL((assignMock.mock.calls[0] as [string])[0])
    expect(target.pathname).toBe('/dashboard')
    expect(target.searchParams.get('tab')).toBe('rooms')
    expect(target.searchParams.has(REAUTH_PARAM)).toBe(true)
  })

  it('does not loop across page loads when the 401 persists', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 401 }))

    await expect(new KVClient({ baseUrl: '' }).get('a')).rejects.toThrow()
    // A reload creates a brand-new client; the attempt marker survives in sessionStorage.
    await expect(new KVClient({ baseUrl: '' }).get('a')).rejects.toThrow()

    expect(assignMock).toHaveBeenCalledTimes(1)
  })

  it('re-arms recovery after a successful authenticated response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 401 }))
    await expect(new KVClient({ baseUrl: '' }).get('a')).rejects.toThrow()

    fetchMock.mockResolvedValueOnce(Response.json({ value: 1 }))
    await new KVClient({ baseUrl: '' }).get('a')

    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 401 }))
    await expect(new KVClient({ baseUrl: '' }).get('a')).rejects.toThrow()

    expect(assignMock).toHaveBeenCalledTimes(2)
  })

  it('removes the reauth parameter from the URL once authenticated again', async () => {
    mockPageUrl(`${PAGE_URL}&${REAUTH_PARAM}=123`)
    const replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
    fetchMock.mockResolvedValue(Response.json({ value: 1 }))

    await new KVClient({ baseUrl: '' }).get('a')

    const cleaned = (replaceState.mock.calls[0] as [unknown, unknown, string])[2]
    expect(cleaned).not.toContain(REAUTH_PARAM)
    expect(cleaned).toContain('tab=rooms')
  })
})
