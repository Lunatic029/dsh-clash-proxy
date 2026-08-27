/**
 * dsh-clash-proxy: route DeepSeek Harness outbound HTTP (LLM, web search/fetch)
 * through a local forward proxy such as Clash, while never proxying loopback
 * or private networks. Installs one process-global undici dispatcher for the
 * lifetime of this plugin, and exposes /dsh-clash-proxy/status for the web client's
 * unreachable-proxy toast.
 * @module dsh-clash-proxy
 */
import { getGlobalDispatcher, ProxyAgent, setGlobalDispatcher } from 'undici';
import { NoProxyMatcher } from './no-proxy.js';
import { RoutingDispatcher } from './routing-dispatcher.js';
export const name = 'dsh-clash-proxy';
const SAFE_NO_PROXY = [
    'localhost',
    '127.0.0.0/8',
    '::1',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '169.254.0.0/16',
];
function envProxy() {
    return process.env.HTTPS_PROXY || process.env.https_proxy
        || process.env.HTTP_PROXY || process.env.http_proxy
        || process.env.ALL_PROXY || process.env.all_proxy
        || undefined;
}
/** One-shot reachability probe of the proxy's host:port. */
function probeProxy(proxyUrl, timeoutMs = 2000) {
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
export function apply(ctx, config) {
    if (config?.enabled === false)
        return;
    const proxy = config?.proxy ?? envProxy();
    if (proxy === undefined || proxy === '')
        return;
    const entries = [
        ...SAFE_NO_PROXY,
        ...(config?.noProxy ?? []),
        ...(process.env.NO_PROXY ?? '').split(/[,\s]/),
    ];
    const matcher = new NoProxyMatcher(entries);
    const direct = getGlobalDispatcher();
    const proxyAgent = new ProxyAgent({ uri: proxy });
    const routing = new RoutingDispatcher(proxyAgent, direct, matcher);
    // Expose the proxy to child processes (git/curl/pnpm/…) through the standard
    // proxy env vars, so the agent's shell routes through the same proxy. The
    // dispatcher above covers the harness's own fetch; these cover the rest.
    const previousEnv = {
        HTTP_PROXY: process.env.HTTP_PROXY,
        HTTPS_PROXY: process.env.HTTPS_PROXY,
        ALL_PROXY: process.env.ALL_PROXY,
        NO_PROXY: process.env.NO_PROXY,
    };
    process.env.HTTP_PROXY = proxy;
    process.env.HTTPS_PROXY = proxy;
    process.env.ALL_PROXY = proxy;
    process.env.NO_PROXY = entries.join(',');
    setGlobalDispatcher(routing);
    ctx.effect(() => () => {
        setGlobalDispatcher(direct);
        proxyAgent.close().catch(() => {
            // Closing the proxy sockets is best-effort on unload.
        });
        if (previousEnv.HTTP_PROXY === undefined)
            delete process.env.HTTP_PROXY;
        else
            process.env.HTTP_PROXY = previousEnv.HTTP_PROXY;
        if (previousEnv.HTTPS_PROXY === undefined)
            delete process.env.HTTPS_PROXY;
        else
            process.env.HTTPS_PROXY = previousEnv.HTTPS_PROXY;
        if (previousEnv.ALL_PROXY === undefined)
            delete process.env.ALL_PROXY;
        else
            process.env.ALL_PROXY = previousEnv.ALL_PROXY;
        if (previousEnv.NO_PROXY === undefined)
            delete process.env.NO_PROXY;
        else
            process.env.NO_PROXY = previousEnv.NO_PROXY;
    }, 'dsh-clash-proxy: global dispatcher');
    ctx.inject(['webServer'], (hostCtx) => {
        const host = hostCtx;
        host.effect(() => host.webServer.register({
            kind: 'exact',
            path: '/dsh-clash-proxy/status',
            handler: async (_request, response) => {
                const reachable = await probeProxy(proxy);
                response.writeHead(200, { 'content-type': 'application/json' });
                response.end(JSON.stringify({ reachable }));
            },
        }), 'dsh-clash-proxy: status route');
    });
    // Deferred past the synchronous boot phase: probing while the plugin tree
    // still loads can starve the event loop and fire the 2s timeout spuriously.
    setTimeout(() => {
        void probeProxy(proxy).then((reachable) => {
            if (!reachable) {
                process.stderr.write('dsh-clash-proxy: proxy ' + proxy + ' is not reachable - outbound requests may fail until it is up\n');
            }
        });
    }, 3000);
}
