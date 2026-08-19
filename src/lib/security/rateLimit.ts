import type { NextRequest } from 'next/server'
import { trustProxyHeaders } from '@/lib/config'

interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

export class InMemoryRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>()

  constructor(private readonly maxEntries = 10_000) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) {
      throw new Error('Rate limiter maxEntries must be a positive integer')
    }
  }

  get entryCount(): number {
    return this.entries.size
  }

  consume(
    request: NextRequest,
    bucket: string,
    limit: number,
    windowMs = 60_000,
  ): RateLimitResult {
    const now = Date.now()
    this.evictExpired(now)

    const key = `${bucket}:${this.clientId(request)}`
    const current = this.entries.get(key)

    if (!current) {
      this.makeRoom()
      this.entries.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, retryAfterSeconds: 0 }
    }

    if (current.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      }
    }

    current.count += 1
    return { allowed: true, retryAfterSeconds: 0 }
  }

  private clientId(request: NextRequest): string {
    if (!trustProxyHeaders()) return 'untrusted-proxy'
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')?.trim()
      || 'unknown'
  }

  private evictExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key)
    }
  }

  private makeRoom(): void {
    while (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as string | undefined
      if (oldestKey === undefined) return
      this.entries.delete(oldestKey)
    }
  }
}

const globalRateLimitStore = globalThis as typeof globalThis & {
  __cryptoGatewayRateLimiter?: InMemoryRateLimiter
}
const limiter = globalRateLimitStore.__cryptoGatewayRateLimiter ??= new InMemoryRateLimiter()

export function consumeRateLimit(
  request: NextRequest,
  bucket: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  return limiter.consume(request, bucket, limit, windowMs)
}
