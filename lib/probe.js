/**
 * One-shot reachability probe of a proxy's host:port. Uses a raw TCP connect
 * (not a routed fetch) so it tests the proxy itself rather than a request
 * through it.
 * @module dsh-clash-proxy/probe
 */
/** One-shot reachability probe of the proxy's host:port. */
export function probeProxy(proxyUrl, timeoutMs = 2000) {
    return import('node:net').then((net) => new Promise((resolve) => {
        let url;
        try {
            url = new URL(proxyUrl);
        }
        catch {
            resolve(false);
            return;
        }
        const socket = net.connect({ host: url.hostname, port: Number(url.port) || 80 });
        socket.setTimeout(timeoutMs);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
    }));
}
