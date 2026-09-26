import type { DecoratorKey } from "../types";
import { assertNoArguments } from "./errors";

/**
 * Caches a property value.
 * 
 * @remarks
 * - Cached methods must not receive arguments.
 * - Use a dedicated memoization strategy for parameterized computations.
 * 
 * ---
 * @example
 * ```ts
 * class Server {
 *   @cache
 *   getData() {
 *     return fetch("/data.json").then(res => res.json());
 *   }
 * }
 * 
 * const server = new Server();
 * server.getData(); // fetches data
 * server.getData(); // no fetch (cached)
 * ```
 */
export function cache(
	_target: object,
	key: DecoratorKey,
	descriptor?: PropertyDescriptor
) {
	const original = descriptor?.get ?? descriptor?.value;

	if (typeof original !== 'function') {
		throw new Error(`@cache can be used only on methods or getters.`);
	}

	if (descriptor?.get) {
		descriptor.get = function () {
			const value = original.call(this);

			Object.defineProperty(this, key, {
				value,
				writable: false,
				configurable: false,
				enumerable: descriptor.enumerable ?? true
			});

			return value;
		};

		return;
	}

	if (descriptor?.value) {
		descriptor.value = function (...args: unknown[]) {
			assertNoArguments(key, args);

			const value = original.call(this);

			Object.defineProperty(this, key, {
				value: function (...nextArgs: unknown[]) {
					assertNoArguments(key, nextArgs);

					return value;
				},
				writable: false,
				configurable: false,
				enumerable: descriptor.enumerable ?? false
			});

			return value;
		};
	}
}