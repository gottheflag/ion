import type { DecoratorKey } from "../types";

/**
 * Makes a method execute at most once per instance.
 *
 * @remarks
 * - Intended for one-shot side effects such as initialization.
 * - Later calls on the same instance do nothing and emit a warning.
 * - Does not cache or retain the method result.
 * - Getters are not supported; use `@cache` for cached values.
 */
export function once(
	_target: object,
	key: DecoratorKey,
	descriptor?: PropertyDescriptor
): void {
	if (
		!descriptor ||
		descriptor.get ||
		typeof descriptor.value !== "function"
	) {
		throw new Error(
			"@once can be used only on methods."
		);
	}

	const original = descriptor.value;
	const called = new WeakSet<object>();

	descriptor.value = function (...args: unknown[]) {
		if (called.has(this)) {
			console.warn(
				`[ION::ONCE] Method "${String(key)}" has already been called; skipping.`
			);

			return;
		}

		called.add(this);

		return original.apply(this, args);
	};
}