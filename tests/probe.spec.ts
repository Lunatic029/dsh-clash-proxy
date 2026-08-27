import { describe, expect, it } from 'vitest'
import { createServer } from 'node:net'
import { probeProxy } from '../src/probe.js'

describe('probeProxy', () => {
  it('returns false for an invalid proxy URL', async () => {
    await expect(probeProxy('not a url')).resolves.toBe(false)
  })

  it('returns true when the port is reachable', async () => {
    const server = createServer()
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as { port: number }).port
    await expect(probeProxy('http://127.0.0.1:' + port)).resolves.toBe(true)
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('returns false when the port is closed', async () => {
    const server = createServer()
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as { port: number }).port
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await expect(probeProxy('http://127.0.0.1:' + port)).resolves.toBe(false)
  })
})
