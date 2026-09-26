import type { Component } from "../core/component.js";
import type {
	Api,
	Ctor,
	Options
} from "./types.js";
import { keyOf } from "./utils.js";
import {
	clear,
	stateOf
} from "./state.js";
import {
	hok,
	run as runHook
} from "../hook/hook.js";

const REGISTRY =
	new WeakMap<
		object,
		Options[]
	>();

const LIVE =
	new WeakMap<
		object,
		Set<Component>
	>();

function registryOf(
	ctor: object
): Options[] {
	let list =
		REGISTRY.get(ctor);

	if (!list) {
		list = [];
		REGISTRY.set(
			ctor,
			list
		);
	}

	return list;
}

function liveOf(
	ctor: object
): Set<Component> {
	let set =
		LIVE.get(ctor);

	if (!set) {
		set = new Set();
		LIVE.set(
			ctor,
			set
		);
	}

	return set;
}

function componentClasses(
	ctor: any
): object[] {
	const classes: object[] = [];

	while (
		typeof ctor === "function" &&
		typeof HTMLElement !== "undefined" &&
		ctor.prototype instanceof HTMLElement
	) {
		classes.push(ctor);
		ctor = Object.getPrototypeOf(ctor);
	}

	return classes;
}

export class Runtime {
	/**
	 * Track a connected instance.
	 * 
	 * @param instance The component instance to attach the plugin to.
	 */
	static track(
		instance: Component
	) {
		for (
			const ctor of
				componentClasses(
					instance.constructor
				)
		) {
			liveOf(ctor)
				.add(instance);
		}
	}

	/**
	 * Untrack a connected instance.
	 *
	 * @remarks
	 * Called automatically by the component when it is disconnected.
	 * 
	 * @param instance The component instance to detach the plugin from.
	 */
	static untrack(
		instance: Component
	) {
		for (
			const ctor of
				componentClasses(
					instance.constructor
				)
		) {
			liveOf(ctor)
				.delete(instance);
		}
	}

	/**
	 * Register a plugin on a component class.
	 * 
	 * @param ctor The component constructor.
	 * @param plugin The plugin constructor
	 * @param options The plugin options.
	 * @returns 
	 */
	static register(
		ctor: object,
		plugin: Ctor,
		options?: any
	) {
		const list =
			registryOf(ctor);

		const key =
			keyOf(plugin);

		if (
			!list.some(
				option =>
					keyOf(option.plugin) === key
			)
		) {
			list.push({
				plugin,
				options
			});
		}

		for (
			const instance of
				liveOf(ctor)
		) {
			runHook(
				instance,
				"before:plugin:install",
				plugin
			);

			install(instance);

			runHook(
				instance,
				"after:plugin:install",
				plugin
			);
		}

		return ctor;
	}

	/**
	 * Walks up the component class and collects all plugins.
	 * 
	 * @param ctor The component constructor.
	 * @returns List of attached plugins.
	 */
	static collect(
		ctor: object
	): Options[] {
		const out: Options[] = [];

		let current: any = ctor;

		while (
			current &&
			current !== Function.prototype
		) {
			const own =
				REGISTRY.get(current);

			if (own?.length) {
				out.push(...own);
			}

			current =
				Object.getPrototypeOf(
					current
				);
		}

		const seen =
			new Set<any>();

		const unique: Options[] = [];

		for (const option of out) {
			const key =
				keyOf(option.plugin);

			if (seen.has(key)) {
				continue;
			}

			seen.add(key);
			unique.push(option);
		}

		return unique;
	}

	static has(
		ctor: object,
		plugin: Ctor
	) {
		const list =
			registryOf(ctor);

		const key =
			keyOf(plugin);

		return list.some(
			option =>
				keyOf(option.plugin) === key
		);
	}

	static get<
		P extends Ctor<any, any>
	>(
		host: Component,
		plugin: P
	): Api<P> {
		const key =
			keyOf(plugin);

		const instance =
			stateOf(host)
				.plugins
				.find(
					current =>
						keyOf(
							current.constructor as any
						) === key
				) as
					| InstanceType<P>
					| undefined;

		if (!instance) {
			throw new Error(
				`Plugin <${plugin.name}> not registered.`
			);
		}

		return instance as unknown as Api<P>;
	}
}

function install(
	host: Component
) {
	const options =
		Runtime.collect(
			host.constructor
		);

	const state =
		stateOf(host);

	for (const option of options) {
		const key =
			keyOf(option.plugin);

		if (
			state.installed.has(key)
		) {
			continue;
		}

		state.installed.add(key);

		const instance =
			new option.plugin(
				host,
				option.options
			);

		state.plugins.push(
			instance
		);

		(instance as any)
			.created?.();
	}
}

hok.after(
	"create",
	(c) => {
		Runtime.track(c);
		install(c);
	},
	"plugin:install"
);

hok.before(
	"render",
	(c) => {
		stateOf(c)
			.plugins
			.forEach(
				plugin =>
					(plugin as any)
						.beforeRender?.()
			);
	},
	"plugin:before:render"
);

hok.after(
	"render",
	(c) => {
		stateOf(c)
			.plugins
			.forEach(
				plugin =>
					(plugin as any)
						.afterRender?.()
			);
	},
	"plugin:after:render"
);

hok.after(
	"ready",
	(c) => {
		stateOf(c)
			.plugins
			.forEach(
				plugin =>
					(plugin as any)
						.ready?.()
			);
	},
	"plugin:after:ready"
);

hok.before(
	"remove",
	(c) => {
		Runtime.untrack(c);

		const state =
			stateOf(c);

		state.plugins.forEach(
			plugin =>
				(plugin as any)
					.removed?.()
		);

		state.plugins.length = 0;
		state.installed.clear();

		clear(c);
	},
	"plugin:before:remove"
);

hok.after(
	"adopted",
	(
		c,
		oldDoc,
		newDoc
	) => {
		stateOf(c)
			.plugins
			.forEach(
				plugin =>
					(plugin as any)
						.adopted?.(
							oldDoc,
							newDoc
						)
			);
	},
	"plugin:after:adopted"
);

/**
 * Hooked into the `before:attribute:change` hook,
 * so the plugin can deal with attribute changes.
 */
hok.before(
	"attribute:change",
	(
		c,
		name,
		oldValue,
		newValue
	) => {
		stateOf(c)
			.plugins
			.forEach(
				plugin =>
					(plugin as any)
						.attributeChanged?.(
							name,
							oldValue,
							newValue
						)
			);
	},
	"plugin:after:attribute:change"
);
