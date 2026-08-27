/**
 * One-shot reachability probe of a proxy's host:port. Uses a raw TCP connect
 * (not a routed fetch) so it tests the proxy itself rather than a request
 * through it.
 * @module dsh-clash-proxy/probe
 */
/** One-shot reachability probe of the proxy's host:port. */
export declare function probeProxy(proxyUrl: string, timeoutMs?: number): Promise<boolean>;
