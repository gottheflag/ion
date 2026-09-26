import { collectClassArrays, getOrInitOwn } from "../../core/metadata.js";
import { hok } from "../../hook/hook.js";
import { toKebabCase } from "../../utils.js";
import type { DecoratorKey } from "../types.js";
import { WATCHERS } from "./meta.js";
import type { Options } from "./options.js";

/**
 * Observes a component attribute for changes.
 * 
 * @param attribute Component attribute
 * 
 * @remarks
 * - Method receives the **old** and **new** value as arguments.
 * - Multiple watchers for the same property is supported.
 * - Watchers are gathered by `observedAttributes` automatically.
 * - Safe to use with other decorators.
 * 
 * ---
 * @example
 * ```ts
 * class Clock extends Component {
 *   time = "09:00 AM";
 * 
 *   @watch("time")
 *   timeChanged(_old: string | null, _new: string | null) {
 *     console.log("Attribute changed:", _old, _new);
 *   }
 * }
 */
export function watch(attribute: string) {
	attribute = toKebabCase(attribute);

	return function (
		target: object,
		key: DecoratorKey,
	): void {
		const ctor = target.constructor as any;
		const list = getOrInitOwn<Options[]>(ctor, WATCHERS, () => []);

		const k = key as unknown as string;
		
		if (!list.some(
			watcher => watcher.attribute === attribute
			&& watcher.handler === k
		)) {
			list.push({ attribute, handler: k });
		}
	}
}

hok.before("define", (host: any) => {
	const base = host.observedAttributes ?? [];
	// console.log(base);

	// console.log(host.observedAttributes);
	Object.defineProperty(host, "observedAttributes", {
		get() {


			const watchers: Options[] = collectClassArrays<Options>(host, WATCHERS);
			const attributes = watchers.map(w => w.attribute);

			return [ ...new Set([ ...base, ...attributes ]) ];
		},
		configurable: true,
	});
});

hok.before("attribute:change", (host: any, attribute: string, oldValue: string | null, newValue: string | null) => {
	attribute = toKebabCase(attribute);

	const ctor = host.constructor as any;
	const watchers: Options[] = collectClassArrays<Options>(ctor, WATCHERS);

	for (const watcher of watchers ?? []) {
		if (watcher.attribute !== attribute) continue;

		const fn = (host as any)[ watcher.handler ];
		if (typeof fn === 'function') {
			fn.call(host, oldValue, newValue);
		}
	}
});