/**
 * A dispatcher that routes each request to the proxy or to the direct
 * transport based on NO_PROXY. Only `dispatch` is overridden; the proxy agent
 * it delegates to owns connection teardown, closed separately on unload.
 * @module dsh-proxy/routing-dispatcher
 */
import { Dispatcher } from 'undici';
export class RoutingDispatcher extends Dispatcher {
    proxy;
    direct;
    noProxy;
    constructor(proxy, direct, noProxy) {
        super();
        this.proxy = proxy;
        this.direct = direct;
        this.noProxy = noProxy;
    }
    dispatch(options, handler) {
        const target = options.origin;
        if (target === undefined)
            return this.direct.dispatch(options, handler);
        let hostname;
        try {
            hostname = new URL(String(target)).hostname;
        }
        catch {
            return this.direct.dispatch(options, handler);
        }
        const next = this.noProxy.bypass(hostname) ? this.direct : this.proxy;
        return next.dispatch(options, handler);
    }
}
