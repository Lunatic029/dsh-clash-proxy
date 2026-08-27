/**
 * dsh-clash-proxy: route DeepSeek Harness outbound HTTP (LLM, web search/fetch)
 * through a local forward proxy such as Clash, while never proxying loopback
 * or private networks. Installs one process-global undici dispatcher for the
 * lifetime of this plugin, and exposes /dsh-clash-proxy/status for the web client's
 * unreachable-proxy toast.
 * @module dsh-clash-proxy
 */
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "dsh-clash-proxy";
/** Plugin configuration, overridable per profile via cordis.patch.yml. */
export interface Config {
    /** Explicit proxy URL, e.g. 'http://127.0.0.1:7897'. Defaults to env vars. */
    proxy?: string;
    /** Set `false` to disable the plugin entirely. */
    enabled?: boolean;
    /** Extra hosts, IPs, or CIDRs to bypass, beyond the built-in safe list. */
    noProxy?: string[];
}
export declare function apply(ctx: Context, config?: Config): void;
