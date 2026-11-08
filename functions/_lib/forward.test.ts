import { describe, expect, it, vi } from 'vitest'
import { forwardToKvWorker, forwardWithoutPrefix } from './forward'

describe('forwardToKvWorker', () => {
  it('passes the request, including the Access JWT header, to the service binding', async () => {
    const fetchMock = vi.fn(async (_request: Request) => new Response('ok'))
    const request = new Request('https://home.example.com/kv/devices', {
      headers: { 'Cf-Access-Jwt-Assertion': 'jwt' },
    })

    const response = await forwardToKvWorker(request, { KV_API: { fetch: fetchMock } })

    expect(await response.text()).toBe('ok')
    expect(fetchMock).toHaveBeenCalledWith(request)
    expect(fetchMock.mock.calls[0][0].headers.get('Cf-Access-Jwt-Assertion')).toBe('jwt')
  })

  it('returns 500 when the service binding is missing', async () => {
    const response = await forwardToKvWorker(new Request('https://home.example.com/kv'), {})
    expect(response.status).toBe(500)
  })
})

describe('forwardWithoutPrefix', () => {
  it('strips the prefix and keeps method, query, body and headers', async () => {
    const fetchMock = vi.fn(async (_request: Request) => new Response('ok'))
    const request = new Request('https://home.example.com/api/arlo/hmsweb/users/devices?x=1', {
      method: 'POST',
      headers: { 'Cf-Access-Jwt-Assertion': 'jwt' },
      body: 'payload',
    })

    await forwardWithoutPrefix({ fetch: fetchMock }, 'ARLO_PROXY', request, '/api/arlo')

    const forwarded = fetchMock.mock.calls[0]?.[0] as Request
    expect(new URL(forwarded.url).pathname).toBe('/hmsweb/users/devices')
    expect(new URL(forwarded.url).search).toBe('?x=1')
    expect(forwarded.method).toBe('POST')
    expect(forwarded.headers.get('Cf-Access-Jwt-Assertion')).toBe('jwt')
    expect(await forwarded.text()).toBe('payload')
  })

  it('maps the bare prefix to /', async () => {
    const fetchMock = vi.fn(async (_request: Request) => new Response('ok'))

    await forwardWithoutPrefix(
      { fetch: fetchMock },
      'ARLO_PROXY',
      new Request('https://home.example.com/api/arlo'),
      '/api/arlo'
    )

    expect(new URL((fetchMock.mock.calls[0]?.[0] as Request).url).pathname).toBe('/')
  })

  it('returns 500 when the binding is missing', async () => {
    const response = await forwardWithoutPrefix(
      undefined,
      'ARLO_PROXY',
      new Request('https://home.example.com/api/arlo/x'),
      '/api/arlo'
    )
    expect(response.status).toBe(500)
  })
})
