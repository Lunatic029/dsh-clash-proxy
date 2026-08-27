/**
 * NO_PROXY host matching with IPv4 CIDR support. undici's built-in
 * `EnvHttpProxyAgent` matcher handles only exact and suffix hostnames, so the
 * loopback and private-range bypass (which needs CIDR) lives here instead.
 * IPv6 is supported by exact address only; IPv6 CIDR is out of scope.
 * @module dsh-proxy/no-proxy
 */

import { isIP } from 'node:net'

/** One compiled bypass rule. */
type Rule =
  | { kind: 'all' }
  | { kind: 'hostname'; value: string }
  | { kind: 'ip'; value: string }
  | { kind: 'cidr4'; base: number; bits: number }

function ipv4ToInt(ip: string): number {
  const [a, b, c, d] = ip.split('.').map(Number)
  return (((a << 24) | (b << 16) | (c << 8) | d) >>> 0)
}

function parseCidr4(cidr: string): { base: number; bits: number } | undefined {
  const [ip, bitsText] = cidr.split('/')
  const bits = Number(bitsText)
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return undefined
  if (isIP(ip) !== 4) return undefined
  return { base: ipv4ToInt(ip), bits }
}

/**
 * Compiles a list of NO_PROXY entries into a reusable matcher. Entries may be
 * `*`, an exact/suffix hostname (optionally `*.`-prefixed), an IP address, or
 * an IPv4 CIDR range.
 */
export class NoProxyMatcher {
  private readonly rules: Rule[]

  constructor(entries: readonly string[]) {
    const rules: Rule[] = []
    for (const raw of entries) {
      const entry = raw.trim().toLowerCase()
      if (entry === '') continue
      if (entry === '*') {
        rules.push({ kind: 'all' })
        continue
      }
      if (entry.includes('/')) {
        const cidr = parseCidr4(entry)
        if (cidr !== undefined) rules.push({ kind: 'cidr4', ...cidr })
        continue
      }
      if (isIP(entry) !== 0) {
        rules.push({ kind: 'ip', value: entry })
        continue
      }
      rules.push({ kind: 'hostname', value: entry.replace(/^\*?\./, '') })
    }
    this.rules = rules
  }

  /** True when the hostname/IP must bypass the proxy. */
  bypass(hostname: string): boolean {
    const host = hostname.toLowerCase()
    const family = isIP(host)
    const numeric = family === 4 ? ipv4ToInt(host) : 0
    for (const rule of this.rules) {
      if (rule.kind === 'all') return true
      if (rule.kind === 'hostname' && (host === rule.value || host.endsWith('.' + rule.value))) return true
      if (rule.kind === 'ip' && family !== 0 && host === rule.value) return true
      if (rule.kind === 'cidr4' && family === 4) {
        const mask = rule.bits === 0 ? 0 : (~0 << (32 - rule.bits)) >>> 0
        if ((numeric & mask) === (rule.base & mask)) return true
      }
    }
    return false
  }
}
