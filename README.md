# dsh-clash-proxy

Route DeepSeek Harness outbound HTTP through a local forward proxy (Clash, V2Ray, …), with automatic bypass of loopback and private networks.

When your harness needs to reach the public internet through a proxy (for example, Clash running on `127.0.0.1:7897`), this plugin makes every outbound request take that route:

- the harness's own `fetch` (web search, web fetch, LLM API calls) through an undici dispatcher
- child processes the agent's shell runs (`git`, `curl`, `npm`, `pnpm`, …) through the standard `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` env vars
- a transient web toast when the proxy is unreachable

## Requirements

- Node.js `>= 22` (matches the harness engine range)
- a DeepSeek Harness installation with a profile (for example `web`)
- a local forward proxy exposing an HTTP CONNECT ("mixed") port

## Install

```sh
dsh plugin --profile web add github:<your-org>/dsh-clash-proxy
# or, once published to npm:
dsh plugin --profile web add dsh-clash-proxy
```

Then configure the proxy in the profile's `cordis.patch.yml`:

```yaml
- id: dsh-clash-proxy
  config:
    proxy: 'http://127.0.0.1:7897'
```

Restart the harness. The proxy URL defaults to `$HTTPS_PROXY` / `$HTTP_PROXY` / `$ALL_PROXY` when `config.proxy` is omitted.

## Configuration

| key | type | default | meaning |
|---|---|---|---|
| `proxy` | string | proxy env vars | forward-proxy URL, e.g. `http://127.0.0.1:7897` |
| `enabled` | boolean | `true` | set `false` to disable the plugin entirely |
| `noProxy` | string[] | `[]` | extra hosts / IPs / CIDRs to bypass |

## Bypass (NO_PROXY)

These always bypass the proxy, so loopback and local services keep working:

`localhost`, `127.0.0.0/8`, `::1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`

plus `$NO_PROXY` and `config.noProxy`. IPv4 CIDR matching is supported.

## How it works

- installs one process-global undici dispatcher that routes each request to the proxy or direct, based on NO_PROXY (with IPv4 CIDR support)
- sets `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` / `NO_PROXY` so child processes inherit the same route
- exposes `GET /dsh-clash-proxy/status` → `{ "reachable": boolean }`, which the web client polls to show a "proxy unreachable" toast

The plugin restores the previous dispatcher and env vars when unloaded.

## Known limitations

- `git clone git@…` (SSH, port 22) is not proxied — only HTTP/HTTPS traffic.
- Node scripts the agent runs that call `fetch` directly do not read `HTTP_PROXY`; only the harness's own fetch uses the dispatcher.
- Download speed depends entirely on the proxy node's bandwidth and stability.
- Only an HTTP CONNECT proxy (Clash "mixed" port) is supported; SOCKS is out of scope.

## Development

```sh
pnpm install
pnpm build      # tsc (host) + tsdown (client)
pnpm test
```

## License

MIT
