/**
 * dsh-clash-proxy client half: fetches the proxy status once on mount and shows the
 * platform Toast when the proxy is unreachable. Composed through the
 * shell.overlay slot; no hand-rolled timing or styles.
 * @module dsh-clash-proxy/client
 */

import { createElement, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Toast } from '@deepseek-ai/dsh-client-ui-primitives'

export const name = 'dsh-clash-proxy'
export const inject = ['slots']

interface SlotsService {
  inject(slot: string, register: () => unknown): void
  register(meta: { name: string; id: string; label: () => string }, component: () => unknown): unknown
}

interface ClientContext {
  slots: SlotsService
}

interface Status {
  reachable: boolean
}

const WARN_TEXT = '代理不可达：未检测到 Clash，外网请求可能失败'

function ProxyWarning(): ReactNode {
  const [show, setShow] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetch('/dsh-clash-proxy/status')
      .then((response) => response.json() as Promise<Status>)
      .then((status) => { if (!cancelled && status.reachable === false) setShow(true) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])
  if (!show) return null
  return createElement(Toast, { text: WARN_TEXT, onDone: () => setShow(false) })
}

export function apply(ctx: ClientContext): void {
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'dsh-clash-proxy-toast',
    label: () => 'dsh-clash-proxy',
  }, () => createElement(ProxyWarning)))
}
