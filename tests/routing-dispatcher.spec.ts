import { describe, expect, it } from 'vitest'
import type { Dispatcher } from 'undici'
import { NoProxyMatcher } from '../src/no-proxy.js'
import { RoutingDispatcher } from '../src/routing-dispatcher.js'

/** A dispatcher that records the origin of every dispatch it receives. */
function recordingDispatcher(name: string): { dispatcher: Dispatcher; calls: string[] } {
  const calls: string[] = []
  const dispatcher = {
    name,
    dispatch(options: { origin?: unknown }): boolean {
      calls.push(String(options.origin ?? ''))
      return true
    },
  } as unknown as Dispatcher
  return { dispatcher, calls }
}

describe('RoutingDispatcher', () => {
  it('routes NO_PROXY hosts to the direct dispatcher', () => {
    const proxy = recordingDispatcher('proxy')
    const direct = recordingDispatcher('direct')
    const routing = new RoutingDispatcher(proxy.dispatcher, direct.dispatcher, new NoProxyMatcher(['localhost', '127.0.0.1']))

    routing.dispatch({ origin: 'http://localhost:8080', path: '/', method: 'GET' }, {})

    expect(direct.calls).toEqual(['http://localhost:8080'])
    expect(proxy.calls).toEqual([])
  })

  it('routes other hosts to the proxy dispatcher', () => {
    const proxy = recordingDispatcher('proxy')
    const direct = recordingDispatcher('direct')
    const routing = new RoutingDispatcher(proxy.dispatcher, direct.dispatcher, new NoProxyMatcher(['localhost']))

    routing.dispatch({ origin: 'https://github.com', path: '/', method: 'GET' }, {})

    expect(proxy.calls).toEqual(['https://github.com'])
    expect(direct.calls).toEqual([])
  })

  it('falls back to direct when the origin is missing', () => {
    const proxy = recordingDispatcher('proxy')
    const direct = recordingDispatcher('direct')
    const routing = new RoutingDispatcher(proxy.dispatcher, direct.dispatcher, new NoProxyMatcher([]))

    routing.dispatch({ path: '/', method: 'GET' }, {})

    expect(direct.calls).toEqual([''])
    expect(proxy.calls).toEqual([])
  })
})
