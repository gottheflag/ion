import { getOrInit } from "../core/collections.js";
import type {
	Entry,
	Handle,
	HookFn,
	Name,
	Id,
	Phase
} from "./types.js";
import { addTo } from "./utils.js";
import { idMap } from "./state.js";

const global =
	new Map<Name, Entry[]>();

const scoped =
	new WeakMap<
		object,
		Map<Name, Entry[]>
	>();

function scopedList(
	ctor: object,
	name: Name
): Entry[] {
	let hooks =
		scoped.get(ctor);

	if (!hooks) {
		hooks = new Map();
		scoped.set(ctor, hooks);
	}

	return getOrInit(
		hooks,
		name,
		() => []
	);
}

function componentChain(
	host: any
): object[] {
	let ctor =
		typeof host === "function"
			? host
			: host?.constructor;

	const chain: object[] = [];

	while (
		typeof ctor === "function" &&
		typeof HTMLElement !== "undefined" &&
		ctor.prototype instanceof HTMLElement
	) {
		chain.push(ctor);
		ctor = Object.getPrototypeOf(ctor);
	}

	return chain.reverse();
}

/**
 * Hook a phase of the component lifecycle.
 * 
 * @remarks
 * Hooks are called in the order they are registered.
 * 
 * ---
 * @example
 * hok.before("init", (host) => {
 *   console.log("before init");
 * });
 * 
 * hok.after("init", (host) => {
 *   console.log("after init");
 * });
 * 
 * hok.on("before:define", (host) => {
 *   console.log("before define");
 * });
 * 
 * hok.off("my-id");
 */
export class hok {
	/**
	 * Creates a new hook with full hook name.
	 * 
	 * @param name Full hook name.
	 * @param fn Hook function callback.
	 * @param id Optional hook id.
	 * @returns A handler to remove the hook.
	 */
	static on(
		name: Name,
		fn: HookFn,
		id?: Id
	): Handle {
		return addTo(
			getOrInit(
				global,
				name,
				() => []
			),
			name,
			fn,
			id
		);
	}

	/**
	 * Creates a new hook that is called for a specific component.
	 * 
	 * @param ctor Component constructor.
	 * @param name Full hook name.
	 * @param fn Hook function callback.
	 * @param id Optional hook id.
	 * @returns A handler to remove the hook.
	 */
	static for(
		ctor: object,
		name: Name,
		fn: HookFn,
		id?: Id
	): Handle {
		return addTo(
			scopedList(
				ctor,
				name
			),
			name,
			fn,
			id
		);
	}

	/**
	 * Removes a hook by id.
	 * 
	 * @param id Hook id.
	 * @returns True if the hook was found and removed, false otherwise.
	 */
	static off(id: Id): boolean {
		const found =
			idMap.get(id);

		if (!found) return false;

		const { list } = found;
		const idx =
			list.findIndex(
				entry =>
					entry.id === id
			);

		if (idx >= 0) {
			list.splice(idx, 1);
		}

		return idMap.delete(id);
	}

	/**
	 * Creates a new hook in the after stage.
	 * 
	 * @param phase Hook phase.
	 * @param fn Hook function callback.
	 * @param id Optional hook id.
	 * @returns A handler to remove the hook.
	 */
	static after(
		phase: Phase,
		fn: HookFn,
		id?: Id
	): Handle {
		return this.on(
			`after:${phase}`,
			fn,
			id
		);
	}

	/**
	 * Creates a new hook in the before stage.
	 * 
	 * @param phase Hook phase.
	 * @param fn Hook function callback.
	 * @param id Optional hook id.
	 * @returns A handler to remove the hook.
	 */
	static before(
		phase: Phase,
		fn: HookFn,
		id?: Id
	): Handle {
		return this.on(
			`before:${phase}`,
			fn,
			id
		);
	}

	/**
	 * Creates a new hook in the after stage for a specific \
	 * component.
	 * 
	 * @param ctor Component constructor.
	 * @param phase Hook phase.
	 * @param fn Hook function callback.
	 * @param id Optional hook id.
	 * @returns A handler to remove the hook.
	 */
	static afterFor(
		ctor: object,
		phase: Phase,
		fn: HookFn,
		id?: Id
	): Handle {
		return this.for(
			ctor,
			`after:${phase}`,
			fn,
			id
		);
	}

	/**
	 * Creates a new hook in the before stage for a specific \
	 * component.
	 * 
	 * @param ctor Component constructor.
	 * @param phase Hook phase.
	 * @param fn Hook function callback.
	 * @param id Optional hook id.
	 * @returns A handler to remove the hook.
	 */
	static beforeFor(
		ctor: object,
		phase: Phase,
		fn: HookFn,
		id?: Id
	): Handle {
		return this.for(
			ctor,
			`before:${phase}`,
			fn,
			id
		);
	}

	static has(id: Id): boolean {
		return idMap.has(id);
	}
}

/**
 * Runs a hook for a specific component.
 * 
 * @param host Component host.
 * @param name Full hook name.
 * @param args Hook arguments.
 * 
 * @internal
 */
export function run(
	host: any,
	name: Name,
	...args: any[]
) {
	global.get(name)?.forEach(
		entry => {
			entry.fn(
				host,
				...args
			);
		}
	);

	for (
		const ctor of
			componentChain(host)
	) {
		const list =
			scoped
				.get(ctor)
				?.get(name);

		list?.forEach(
			entry => {
				entry.fn(
					host,
					...args
				);
			}
		);
	}
}
