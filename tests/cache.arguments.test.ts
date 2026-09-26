import {
	expect,
	test
} from "vitest";

import { cache } from "../src/decorators/index.js";

class CachedValue {
	calls = 0;

	@cache
	value() {
		this.calls++;

		return this.calls;
	}
}

test("caches zero-argument methods per instance", () => {
	const subject = new CachedValue();

	expect(subject.value()).toBe(1);
	expect(subject.value()).toBe(1);

	expect(subject.calls).toBe(1);
});

class ParameterizedCache {
	calls = 0;

	@cache
	value(input: string) {
		this.calls++;

		return input;
	}
}

test("@cache rejects parameterized method calls", () => {
	const subject =
		new ParameterizedCache();

	expect(() => subject.value("first"))
		.toThrow(
			"[ION::CACHE] @cache method \"value\" does not accept arguments."
		);

	expect(subject.calls).toBe(0);
});

test("@cache does not ignore arguments after caching", () => {
	const subject = new CachedValue();

	expect(subject.value()).toBe(1);

	const callWithArgument =
		subject.value as unknown as (
			value: string
		) => number;

	expect(() => callWithArgument("ignored"))
		.toThrow(
			"[ION::CACHE] @cache method \"value\" does not accept arguments."
		);

	expect(subject.calls).toBe(1);
});