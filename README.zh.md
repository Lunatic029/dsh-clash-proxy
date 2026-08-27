# dsh-proxy

让 DeepSeek Harness 的出网流量走本地代理（Clash、V2Ray 等），并自动绕过回环与内网地址。

当你需要让 Harness 通过代理访问外网（例如 Clash 跑在 `127.0.0.1:7897`）时，这个插件会让所有出网请求都走那条路：

- Harness 自己的 `fetch`（网页搜索、网页抓取、LLM 调用）→ 通过 undici dispatcher
- agent 的 shell 里跑的子进程（`git`、`curl`、`npm`、`pnpm`…）→ 通过标准的 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 环境变量
- 代理不可达时，网页里弹一个短暂的提示（toast）

## 环境要求

- Node.js `>= 22`（与 Harness 的引擎范围一致）
- 一个带 profile 的 DeepSeek Harness（例如 `web`）
- 一个暴露 HTTP CONNECT（混合）端口的本地代理

## 安装

```sh
dsh plugin --profile web add github:<你的组织>/dsh-proxy
# 或发布到 npm 后：
dsh plugin --profile web add dsh-proxy
```

然后在 profile 的 `cordis.patch.yml` 里配置代理：

```yaml
- id: dsh-proxy
  config:
    proxy: 'http://127.0.0.1:7897'
```

重启 Harness。省略 `config.proxy` 时，默认读取 `$HTTPS_PROXY` / `$HTTP_PROXY` / `$ALL_PROXY`。

## 配置

| 键 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `proxy` | string | 代理环境变量 | 代理地址，如 `http://127.0.0.1:7897` |
| `enabled` | boolean | `true` | 设为 `false` 完全禁用插件 |
| `noProxy` | string[] | `[]` | 额外要绕过的域名 / IP / CIDR |

## 绕过（NO_PROXY）

以下地址始终绕过代理，保证回环和本地服务正常：

`localhost`、`127.0.0.0/8`、`::1`、`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`、`169.254.0.0/16`

再加上 `$NO_PROXY` 和 `config.noProxy`。支持 IPv4 CIDR 匹配。

## 工作原理

- 安装一个进程级 undici dispatcher，按 NO_PROXY（含 IPv4 CIDR）把每个请求路由到代理或直连
- 设置 `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` / `NO_PROXY`，让子进程继承同样的路由
- 暴露 `GET /dsh-proxy/status` → `{ "reachable": boolean }`，网页端据此轮询并显示「代理不可达」toast

插件卸载时会恢复之前的 dispatcher 和环境变量。

## 已知限制

- `git clone git@…`（SSH，22 端口）不走代理——只覆盖 HTTP/HTTPS。
- agent 自己跑的 Node 脚本若直接调用 `fetch`，不会读 `HTTP_PROXY`；只有 Harness 自己的 fetch 走 dispatcher。
- 下载速度完全取决于代理节点的带宽和稳定性。
- 只支持 HTTP CONNECT 代理（Clash 的「混合」端口）；SOCKS 不在范围内。

## 开发

```sh
pnpm install
pnpm build      # tsc（host）+ tsdown（client）
pnpm test
```

## 许可证

MIT
