import {
	expect,
	test,
	vi
} from "vitest";

import {
	Component,
	Ion
} from "../src/index.js";

import { hok } from "../src/hook/index.js";
import { run as runHook } from "../src/hook/hook.js";

function availableTag(base: string): string {
	let tag = base;
	let index = 0;

	while (customElements.get(tag)) {
		tag = `${base}-${++index}`;
	}

	return tag;
}

test("runs constructor-scoped define hooks for the target component", () => {
	class DefinedComponent extends Component { }

	const before = vi.fn();
	const after = vi.fn();

	const beforeHandle =
		hok.beforeFor(
			DefinedComponent,
			"define",
			before
		);

	const afterHandle =
		hok.afterFor(
			DefinedComponent,
			"define",
			after
		);

	const tag =
		availableTag("ion-test-hook-define");

	Ion.create(
		DefinedComponent,
		tag
	);

	expect(before).toHaveBeenCalledOnce();
	expect(after).toHaveBeenCalledOnce();

	expect(before).toHaveBeenCalledWith(
		DefinedComponent,
		tag
	);

	expect(after).toHaveBeenCalledWith(
		DefinedComponent,
		tag
	);

	beforeHandle.off();
	afterHandle.off();
});

test("runs inherited class-scoped hooks exactly once", async () => {
	class BaseComponent
		extends Component {}

	class ChildComponent
		extends BaseComponent {}

	const callback =
		vi.fn();

	const handle =
		hok.beforeFor(
			BaseComponent,
			"create",
			callback
		);

	const tag =
		availableTag(
			"ion-test-hook-inheritance"
		);

	Ion.create(
		ChildComponent,
		tag
	);

	const element =
		document.createElement(
			tag
		);

	document.body.append(
		element
	);

	await Promise.resolve();

	expect(callback)
		.toHaveBeenCalledOnce();

	expect(
		callback.mock.calls[0]?.[0]
	).toBe(element);

	handle.off();
	element.remove();
});

test("does not mutate native constructors while running hooks", () => {
	class HookHost extends Component { }

	const tag =
		availableTag("ion-test-hook-native-scope");

	Ion.create(
		HookHost,
		tag
	);

	const element =
		document.createElement(tag);

	const natives = [
		HTMLElement,
		Element,
		Node,
		EventTarget
	];

	const before =
		natives.map(ctor =>
			Reflect.ownKeys(ctor)
		);

	runHook(
		element,
		"before:plugin:install"
	);

	for (
		let i = 0;
		i < natives.length;
		i++
	) {
		expect(
			Reflect.ownKeys(natives[ i ]!)
		).toEqual(before[ i ]);
	}
});

