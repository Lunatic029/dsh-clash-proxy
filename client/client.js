window.__ModuleLoader__.load({
	id: "dsh-clash-proxy",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region src/client/index.ts
		/**
		* dsh-clash-proxy client half: fetches the proxy status once on mount and shows the
		* platform Toast when the proxy is unreachable. Composed through the
		* shell.overlay slot; no hand-rolled timing or styles.
		* @module dsh-clash-proxy/client
		*/
		const name = "dsh-clash-proxy";
		const inject = ["slots"];
		const WARN_TEXT = "代理不可达：未检测到 Clash，外网请求可能失败";
		function ProxyWarning() {
			const [show, setShow] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let cancelled = false;
				fetch("/dsh-clash-proxy/status").then((response) => response.json()).then((status) => {
					if (!cancelled && status.reachable === false) setShow(true);
				}).catch(() => {});
				return () => {
					cancelled = true;
				};
			}, []);
			if (!show) return null;
			return (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
				text: WARN_TEXT,
				onDone: () => setShow(false)
			});
		}
		function apply(ctx) {
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-clash-proxy-toast",
				label: () => "dsh-clash-proxy"
			}, () => (0, react.createElement)(ProxyWarning)));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map