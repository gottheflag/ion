import type { Plugin } from "./plugin.js";

export type State = {
	plugins: Plugin[];
	installed: Set<any>;
};

const STATE = new WeakMap<object, State>();

export function stateOf(host: object): State {
	let s = STATE.get(host);
	if (!s) {
		s = { plugins: [], installed: new Set() };
		STATE.set(host, s);
	}

	return s;
}

export function clear(host: object) {
	STATE.delete(host);
}