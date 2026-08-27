/**
 * NO_PROXY host matching with IPv4 CIDR support. undici's built-in
 * `EnvHttpProxyAgent` matcher handles only exact and suffix hostnames, so the
 * loopback and private-range bypass (which needs CIDR) lives here instead.
 * IPv6 is supported by exact address only; IPv6 CIDR is out of scope.
 * @module dsh-proxy/no-proxy
 */
/**
 * Compiles a list of NO_PROXY entries into a reusable matcher. Entries may be
 * `*`, an exact/suffix hostname (optionally `*.`-prefixed), an IP address, or
 * an IPv4 CIDR range.
 */
export declare class NoProxyMatcher {
    private readonly rules;
    constructor(entries: readonly string[]);
    /** True when the hostname/IP must bypass the proxy. */
    bypass(hostname: string): boolean;
}
