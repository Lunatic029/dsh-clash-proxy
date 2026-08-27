/**
 * A dispatcher that routes each request to the proxy or to the direct
 * transport based on NO_PROXY. Only `dispatch` is overridden; the proxy agent
 * it delegates to owns connection teardown, closed separately on unload.
 * @module dsh-proxy/routing-dispatcher
 */
import { Dispatcher } from 'undici';
import type { Dispatcher as DispatcherNS } from 'undici';
import type { NoProxyMatcher } from './no-proxy.js';
export declare class RoutingDispatcher extends Dispatcher {
    private readonly proxy;
    private readonly direct;
    private readonly noProxy;
    constructor(proxy: Dispatcher, direct: Dispatcher, noProxy: NoProxyMatcher);
    dispatch(options: DispatcherNS.DispatchOptions, handler: DispatcherNS.DispatchHandler): boolean;
}
