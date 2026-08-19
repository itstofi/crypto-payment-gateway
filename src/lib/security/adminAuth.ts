import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { isDemoMode } from '@/lib/config'

export function hasAdminAccess(request: NextRequest): boolean {
  if (isDemoMode()) return true

  const expected = process.env.ADMIN_API_KEY
  const authorization = request.headers.get('authorization')
  if (!expected || !authorization?.startsWith('Bearer ')) return false

  const provided = authorization.slice('Bearer '.length)
  const expectedDigest = crypto.createHash('sha256').update(expected).digest()
  const providedDigest = crypto.createHash('sha256').update(provided).digest()
  return crypto.timingSafeEqual(expectedDigest, providedDigest)
}
