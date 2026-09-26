import {
	expect,
	test
} from "vitest";

import {
	Component,
	Ion
} from "../src/index.js";

function availableTag(
	base: string
): string {
	let tag = base;
	let index = 0;

	while (
		customElements.get(tag)
	) {
		tag =
			`${base}-${++index}`;
	}

	return tag;
}

test("registers a component directly", () => {
	class DirectComponent
		extends Component { }

	const tag =
		availableTag(
			"ion-test-create-direct"
		);

	const result =
		Ion.create(
			DirectComponent,
			tag
		);

	expect(result)
		.toBe(DirectComponent);

	expect(
		customElements.get(tag)
	).toBe(DirectComponent);
});

test("registers a component as a decorator", () => {
	const tag =
		availableTag(
			"ion-test-create-decorator"
		);

	@Ion.create(tag)
	class DecoratedComponent
		extends Component { }

	expect(
		customElements.get(tag)
	).toBe(DecoratedComponent);
});

test("allows the same constructor to be registered idempotently", () => {
	class SameComponent
		extends Component { }

	const tag =
		availableTag(
			"ion-test-create-same"
		);

	Ion.create(
		SameComponent,
		tag
	);

	expect(
		Ion.create(
			SameComponent,
			tag
		)
	).toBe(SameComponent);
});

test("rejects a different constructor for an existing tag", () => {
	class FirstComponent
		extends Component { }

	class SecondComponent
		extends Component { }

	const tag =
		availableTag(
			"ion-test-create-conflict"
		);

	Ion.create(
		FirstComponent,
		tag
	);

	expect(() =>
		Ion.create(
			SecondComponent,
			tag
		)
	).toThrow(
		`[ION::COMPONENT] <${tag}> is already defined with a different constructor.`
	);
});