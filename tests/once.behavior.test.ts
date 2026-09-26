import {
	expect,
	test,
	vi
} from "vitest";

import { once } from "../src/decorators/index.js";

class OnceMethod {
	calls = 0;

	@once
	initialize() {
		this.calls++;
	}
}

test("@once executes a method only once per instance", () => {
	const subject = new OnceMethod();

	subject.initialize();
	subject.initialize();

	expect(subject.calls).toBe(1);
});

test("@once warns when called again", () => {
	const warn = vi
		.spyOn(console, "warn")
		.mockImplementation(() => { });

	const subject = new OnceMethod();

	subject.initialize();
	subject.initialize();

	expect(warn).toHaveBeenCalledOnce();

	expect(warn).toHaveBeenCalledWith(
		'[ION::ONCE] Method "initialize" has already been called; skipping.'
	);

	warn.mockRestore();
});

test("@once tracks each instance independently", () => {
	const first = new OnceMethod();
	const second = new OnceMethod();

	first.initialize();
	second.initialize();

	expect(first.calls).toBe(1);
	expect(second.calls).toBe(1);
});

test("@once rejects getters", () => {
	expect(() => {
		class Invalid {
			@once
			get value() {
				return 1;
			}
		}

		return Invalid;
	}).toThrow(
		"@once can be used only on methods."
	);
});