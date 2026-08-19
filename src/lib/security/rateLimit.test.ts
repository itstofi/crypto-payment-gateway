import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { InMemoryRateLimiter } from './rateLimit'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.useRealTimers()
})

function request(forwardedFor?: string) {
  return new NextRequest('http://localhost/test', {
    headers: forwardedFor ? { 'x-forwarded-for': forwardedFor, 'x-real-ip': forwardedFor } : undefined,
  })
}

describe('InMemoryRateLimiter', () => {
  it('ignores spoofable proxy headers unless TRUST_PROXY=true', () => {
    process.env.TRUST_PROXY = 'false'
    const limiter = new InMemoryRateLimiter(10)

    expect(limiter.consume(request('203.0.113.1'), 'create', 1).allowed).toBe(true)
    expect(limiter.consume(request('203.0.113.2'), 'create', 1).allowed).toBe(false)
  })

  it('uses proxy client identity only when TRUST_PROXY=true', () => {
    process.env.TRUST_PROXY = 'true'
    const limiter = new InMemoryRateLimiter(10)

    expect(limiter.consume(request('203.0.113.1'), 'create', 1).allowed).toBe(true)
    expect(limiter.consume(request('203.0.113.2'), 'create', 1).allowed).toBe(true)
  })

  it('keeps its store bounded and evicts the oldest entry', () => {
    process.env.TRUST_PROXY = 'true'
    const limiter = new InMemoryRateLimiter(2)

    limiter.consume(request('203.0.113.1'), 'create', 1)
    limiter.consume(request('203.0.113.2'), 'create', 1)
    limiter.consume(request('203.0.113.3'), 'create', 1)

    expect(limiter.entryCount).toBe(2)
    expect(limiter.consume(request('203.0.113.1'), 'create', 1).allowed).toBe(true)
  })

  it('evicts expired entries before enforcing the size bound', () => {
    process.env.TRUST_PROXY = 'true'
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const limiter = new InMemoryRateLimiter(2)

    limiter.consume(request('203.0.113.1'), 'create', 1, 1000)
    vi.advanceTimersByTime(1001)
    limiter.consume(request('203.0.113.2'), 'create', 1, 1000)

    expect(limiter.entryCount).toBe(1)
  })
})
