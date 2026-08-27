import { describe, expect, it } from 'vitest'
import { NoProxyMatcher } from '../src/no-proxy.js'

describe('NoProxyMatcher', () => {
  it('bypasses loopback and private ranges', () => {
    const m = new NoProxyMatcher([
      'localhost', '127.0.0.0/8', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16',
    ])
    expect(m.bypass('localhost')).toBe(true)
    expect(m.bypass('127.0.0.1')).toBe(true)
    expect(m.bypass('127.8.8.8')).toBe(true)
    expect(m.bypass('::1')).toBe(true)
    expect(m.bypass('10.1.2.3')).toBe(true)
    expect(m.bypass('172.20.0.1')).toBe(true)
    expect(m.bypass('192.168.1.5')).toBe(true)
    expect(m.bypass('169.254.1.1')).toBe(true)
  })

  it('does not bypass public hosts', () => {
    const m = new NoProxyMatcher(['localhost'])
    expect(m.bypass('google.com')).toBe(false)
    expect(m.bypass('api.deepseek.com')).toBe(false)
    expect(m.bypass('8.8.8.8')).toBe(false)
  })

  it('matches exact hostnames and their subdomains', () => {
    const m = new NoProxyMatcher(['example.com'])
    expect(m.bypass('example.com')).toBe(true)
    expect(m.bypass('www.example.com')).toBe(true)
    expect(m.bypass('notexample.com')).toBe(false)
    expect(m.bypass('example.com.evil.com')).toBe(false)
  })

  it('supports the wildcard entry', () => {
    const m = new NoProxyMatcher(['*'])
    expect(m.bypass('anything.com')).toBe(true)
    expect(m.bypass('127.0.0.1')).toBe(true)
  })

  it('supports IPv4 CIDR boundaries', () => {
    const m = new NoProxyMatcher(['10.0.0.0/8'])
    expect(m.bypass('10.0.0.0')).toBe(true)
    expect(m.bypass('10.255.255.255')).toBe(true)
    expect(m.bypass('11.0.0.1')).toBe(false)
  })
})
