import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { repository } = vi.hoisted(() => ({
  repository: { list: vi.fn() },
}))
vi.mock('@/lib/payments/repository', () => ({ getPaymentRepository: () => repository }))

import { GET } from './route'

const originalEnv = { ...process.env }
let clientSequence = 100

beforeEach(() => {
  process.env.DEMO_MODE = 'false'
  process.env.TRUST_PROXY = 'true'
  process.env.ADMIN_API_KEY = 'portfolio-admin-secret'
  clientSequence += 1
  repository.list.mockResolvedValue([])
})

afterEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv }
})

function request(token?: string, client = `203.0.113.${clientSequence}`) {
  return new NextRequest('http://localhost/api/payments/list', {
    headers: {
      'x-forwarded-for': client,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  })
}

describe('GET /api/payments/list', () => {
  it('accepts the correct production admin bearer token', async () => {
    const response = await GET(request('portfolio-admin-secret'))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(repository.list).toHaveBeenCalledOnce()
  })

  it.each([undefined, 'wrong-secret'])('rejects a missing or wrong admin token', async (token) => {
    const response = await GET(request(token))
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(repository.list).not.toHaveBeenCalled()
  })

  it('fails closed when production admin configuration is missing', async () => {
    delete process.env.ADMIN_API_KEY
    const response = await GET(request('anything'))
    expect(response.status).toBe(401)
    expect(repository.list).not.toHaveBeenCalled()
  })

  it('rate limits admin token verification attempts', async () => {
    const client = `198.51.100.${clientSequence}`
    const responses = []
    for (let attempt = 0; attempt < 11; attempt += 1) {
      responses.push(await GET(request(`wrong-${attempt}`, client)))
    }

    expect(responses.slice(0, 10).every((response) => response.status === 401)).toBe(true)
    expect(responses[10].status).toBe(429)
    expect(responses[10].headers.get('retry-after')).toEqual(expect.any(String))
    expect(responses[10].headers.get('cache-control')).toBe('no-store')
  })

  it('fails closed at request time when DEMO_MODE is malformed', async () => {
    process.env.DEMO_MODE = 'production'
    const response = await GET(request('portfolio-admin-secret'))
    expect(response.status).toBe(500)
    expect(repository.list).not.toHaveBeenCalled()
  })
})
