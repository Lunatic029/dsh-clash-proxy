/**
 * A dispatcher that routes each request to the proxy or to the direct
 * transport based on NO_PROXY. Only `dispatch` is overridden; the proxy agent
 * it delegates to owns connection teardown, closed separately on unload.
 * @module dsh-clash-proxy/routing-dispatcher
 */

import { Dispatcher } from 'undici'
import type { Dispatcher as DispatcherNS } from 'undici'
import type { NoProxyMatcher } from './no-proxy.js'

export class RoutingDispatcher extends Dispatcher {
  constructor(
    private readonly proxy: Dispatcher,
    private readonly direct: Dispatcher,
    private readonly noProxy: NoProxyMatcher,
  ) {
    super()
  }

  dispatch(options: DispatcherNS.DispatchOptions, handler: DispatcherNS.DispatchHandler): boolean {
    const target = options.origin
    if (target === undefined) return this.direct.dispatch(options, handler)
    let hostname: string
    try {
      hostname = new URL(String(target)).hostname
    } catch {
      return this.direct.dispatch(options, handler)
    }
    const next = this.noProxy.bypass(hostname) ? this.direct : this.proxy
    return next.dispatch(options, handler)
  }
}
