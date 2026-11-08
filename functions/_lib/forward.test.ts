import { describe, expect, it, vi } from 'vitest'
import { forwardToKvWorker } from './forward'

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
