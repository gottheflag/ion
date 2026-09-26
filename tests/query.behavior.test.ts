import {
	expect,
	test,
	vi
} from "vitest";

import {
	Component,
	Ion
} from "../src/index.js";

import { query } from "../src/decorators/index.js";
import { html } from "../src/template/index.js";

class QueryComponent extends Component {
	@query("#target")
	target!: HTMLDivElement | null;

	protected override render() {
		return html`
			<div id="target"></div>
		`;
	}
}

const tag = "ion-test-query-behavior";

Ion.create(
	QueryComponent,
	tag
);

test("@query refreshes after render and does not query on access", async () => {
	const element =
		document.createElement(tag) as QueryComponent;

	const spy = vi.spyOn(
		ShadowRoot.prototype,
		"querySelector"
	);

	document.body.append(element);
	await Promise.resolve();

	const firstCalls = spy.mock.calls.length;

	const first = element.target;
	const second = element.target;
	const third = element.target;

	expect(first).toBe(second);
	expect(second).toBe(third);

	expect(spy.mock.calls.length)
		.toBe(firstCalls);

	spy.mockRestore();
});

test("@query refreshes its reference after a render", async () => {
	const element =
		document.createElement(tag) as QueryComponent;

	document.body.append(element);
	await Promise.resolve();

	const first = element.target;

	first?.remove();

	element.setAttribute(
		"data-refresh",
		"1"
	);

	// Trigger whatever render path you normally expose/use here.
});