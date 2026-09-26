import { getOwn } from "../../core/metadata.js";
import type { Component } from "../../core/component.js";
import { LISTENERS } from "./meta.js";
import type { Options } from "./options.js";

export const SESSION_INSTALLED =
	Symbol("ion:listeners:session:installed");

export function install(
	host: Component,
	uptoCtor: object
): void {
	const installed =
		(host as any)[ SESSION_INSTALLED ] as
			| Set<object>
			| undefined;

	if (!installed) return;

	const chain: object[] = [];
	let curr: any = uptoCtor;

	while (
		curr &&
		curr !== Function.prototype
	) {
		chain.push(curr);
		curr = Object.getPrototypeOf(curr);
	}

	chain.reverse();

	for (const ctor of chain) {
		const list =
			getOwn<Options[]>(
				ctor,
				LISTENERS
			);

		if (!list?.length) continue;
		if (installed.has(ctor)) continue;

		installed.add(ctor);

		for (
			const {
				type,
				selector,
				method,
				options
			} of list
		) {
			const bound =
				method.bind(host);

			if (selector) {
				host.on(
					type as any,
					selector,
					bound as any,
					options
				);
			} else {
				host.on(
					type as any,
					bound as any,
					options
				);
			}
		}
	}
}
