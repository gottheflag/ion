import {
	collectClassArrays,
	getOrInitOwn
} from "../../core/metadata.js";
import { hok } from "../../hook/hook.js";
import type { Component } from "../../core/index.js";
import { QUERIES } from "./meta.js";
import {
	DEFAULTS,
	type Options
} from "./options.js";
import type { Metadata } from "./types.js";
import type { DecoratorKey } from "../types.js";

/**
 * Queries an element from the component's shadow root after each render.
 *
 * @remarks
 * - The stored reference is refreshed after every render.
 * - Accessing the property does not perform a new DOM query.
 * - Returns `null` if no matching element is found.
 * 
 * @param selector Selector to a child element.
 * @param all Whether to query all elements or just the first.
 * 
 * ---
 * @example
 * query("#btn")
 * submitBtn!: HTMLButtonElement | null;
 * 
 * method() {
 *   this.submitBtn?.click();
 * }
 */
export function query(
	selector: string,
	options: Options = {}
) /* @todo: add return type */ {
	options = {
		...DEFAULTS,
		...options
	};

	return function (
		target: object | undefined,
		key: DecoratorKey
	): void {
		const ctor =
			target?.constructor;

		if (!ctor) return;

		const list =
			getOrInitOwn<Metadata[]>(
				ctor,
				QUERIES,
				() => []
			);

		list.push({
			key,
			selector,
			all: !!options.all
		});
	}
}

hok.after(
	"render",
	(host: Component) => {
		const queries =
			collectClassArrays<Metadata>(
				host.constructor,
				QUERIES
			);

		if (!queries.length) return;

		for (const q of queries) {
			(host as any)[ q.key ] =
				q.all
					? Array.from(
						host.$$(q.selector)
					)
					: host.$(q.selector);
		}
	}
);
