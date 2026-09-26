import {
	afterEach,
	expect,
	test
} from "vitest";

import { Component } from "../src/index.js";
import { state } from "../src/decorators/index.js";
import { html } from "../src/template/index.js";

class StateBase extends Component {
	@state
	parentCount = 0;

	setParentCount(value: number) {
		this.parentCount = value;
	}
}

class StateChild extends StateBase {
	@state
	childCount = 0;

	setChildCount(value: number) {
		this.childCount = value;
	}

	protected override render() {
		return html`
			<span id="parent">
				${this.parentCount}
			</span>

			<span id="child">
				${this.childCount}
			</span>
		`;
	}
}

const tag =
	"ion-test-state-inheritance";

if (!customElements.get(tag)) {
	customElements.define(
		tag,
		StateChild
	);
}

afterEach(() => {
	document.body.replaceChildren();
});

test("inherits parent state and composes subclass state", async () => {
	const element =
		document.createElement(tag) as StateChild;

	document.body.append(element);
	await Promise.resolve();

	expect(
		element.shadowRoot
			?.querySelector("#parent")
			?.textContent
			?.trim()
	).toBe("0");

	expect(
		element.shadowRoot
			?.querySelector("#child")
			?.textContent
			?.trim()
	).toBe("0");

	element.setParentCount(12);
	await Promise.resolve();

	expect(
		element.shadowRoot
			?.querySelector("#parent")
			?.textContent
			?.trim()
	).toBe("12");

	element.setChildCount(34);
	await Promise.resolve();

	expect(
		element.shadowRoot
			?.querySelector("#child")
			?.textContent
			?.trim()
	).toBe("34");

	expect(
		element.shadowRoot
			?.querySelector("#parent")
			?.textContent
			?.trim()
	).toBe("12");
});
