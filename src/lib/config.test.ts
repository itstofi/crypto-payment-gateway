import { afterEach, describe, expect, it } from 'vitest'
import { isDemoMode, trustProxyHeaders } from './config'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('runtime mode configuration', () => {
  it.each([
    ['true', true],
    ['false', false],
  ])('accepts the explicit DEMO_MODE value %s', (value, expected) => {
    process.env.DEMO_MODE = value
    expect(isDemoMode()).toBe(expected)
  })

  it.each([undefined, '', 'TRUE', 'yes', '0'])('fails closed for invalid DEMO_MODE value %s', (value) => {
    if (value === undefined) delete process.env.DEMO_MODE
    else process.env.DEMO_MODE = value
    expect(() => isDemoMode()).toThrow('DEMO_MODE must be explicitly set to true or false')
  })
})

describe('trusted proxy configuration', () => {
  it('does not trust proxy headers when TRUST_PROXY is unset or false', () => {
    delete process.env.TRUST_PROXY
    expect(trustProxyHeaders()).toBe(false)
    process.env.TRUST_PROXY = 'false'
    expect(trustProxyHeaders()).toBe(false)
  })

  it('trusts proxy headers only when TRUST_PROXY is explicitly true', () => {
    process.env.TRUST_PROXY = 'true'
    expect(trustProxyHeaders()).toBe(true)
  })

  it('fails closed when TRUST_PROXY is malformed', () => {
    process.env.TRUST_PROXY = 'yes'
    expect(() => trustProxyHeaders()).toThrow('TRUST_PROXY must be true, false, or unset')
  })
})
