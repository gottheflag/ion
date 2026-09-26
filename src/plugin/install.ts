import type { Component } from "../core/component.js";

import {
	installPluginRuntime
} from "../core/plugin-bridge.js";

import { Runtime } from "./runtime.js";

import type {
	Ctor
} from "./types.js";

installPluginRuntime({
	has(
		ctor,
		plugin
	) {
		return Runtime.has(
			ctor,
			plugin as Ctor
		);
	},

	register(
		ctor,
		plugin,
		options
	) {
		return Runtime.register(
			ctor,
			plugin as Ctor,
			options
		);
	},

	get(
		host,
		plugin
	) {
		return Runtime.get(
			host as Component,
			plugin as Ctor
		);
	},

	collect(ctor) {
		return Runtime.collect(ctor);
	}
});