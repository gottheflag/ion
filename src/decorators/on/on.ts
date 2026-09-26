import { getOrInitOwn } from "../../core/metadata.js";
import type {
	EventName,
	ListenerOptions
} from "../../event/types.js";
import type { Options } from "./options.js";
import { LISTENERS } from "./meta.js";
import type { Component } from "../../core/component.js";
import {
	install,
	SESSION_INSTALLED
} from "./install.js";
import { hok } from "../../hook/hook.js";

/**
 * Adds an event listener to the component or a child element.
 * 
 * @param type Event type.
 * @param selector Selector to a child element.
 * @param options Options for the event listener.
 * 
 */
export function on<K extends EventName>(
	type: K,
	selectorOrOptions?: string | ListenerOptions,
	options?: ListenerOptions
) {
	return function (
		target: object,
		_key: PropertyKey,
		descriptor?: PropertyDescriptor
	): void {
		const method = descriptor?.value;

		if (typeof method !== "function") {
			throw new Error(
				"@on decorator can only be used on methods."
			);
		}

		const isDelegated =
			typeof selectorOrOptions === "string";

		const selector = isDelegated
			? selectorOrOptions
			: undefined;

		const opts = isDelegated
			? options
			: selectorOrOptions;

		const ctor = target.constructor;
		const list = getOrInitOwn<Options[]>(
			ctor,
			LISTENERS,
			() => []
		);

		list.push({
			type,
			selector,
			method,
			options: opts
		});
	}
}

hok.after(
	"create",
	(host: Component) => {
		(host as any)[ SESSION_INSTALLED ] =
			new Set<object>();

		install(
			host,
			host.constructor
		);
	}
);
