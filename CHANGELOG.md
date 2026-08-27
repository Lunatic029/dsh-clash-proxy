# Changelog

## [0.1.0] - 2026-08-27

Initial release.

- Route the harness's own fetch (web search, web fetch, LLM) through a local forward proxy via an undici dispatcher.
- Route child processes (git, curl, pnpm, …) through the proxy via `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`.
- Bypass loopback and private networks, with IPv4 CIDR support.
- Expose `GET /dsh-clash-proxy/status` and show a web toast when the proxy is unreachable.
