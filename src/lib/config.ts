export function isDemoMode(): boolean {
  const value = process.env.DEMO_MODE
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error('DEMO_MODE must be explicitly set to true or false')
}

export function trustProxyHeaders(): boolean {
  const value = process.env.TRUST_PROXY
  if (value === undefined || value === 'false') return false
  if (value === 'true') return true
  throw new Error('TRUST_PROXY must be true, false, or unset')
}
