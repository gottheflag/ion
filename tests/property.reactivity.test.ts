import {
	afterEach,
	expect,
	test
} from "vitest";

import {
	Component,
	Ion
} from "../src/index.js";

import { property } from "../src/decorators/index.js";
import { html } from "../src/template/index.js";

afterEach(() => {
	document.body.replaceChildren();
});

class ReactiveProperty extends Component {
	@property({
		type: Number,
		reflect: false
	})
	value = 0;

	setValue(value: number) {
		this.value = value;
	}

	protected override render() {
		return html`
			<span>${this.value}</span>
		`;
	}
}

const reactiveTag =
	"ion-test-reactive-property";

Ion.create(
	ReactiveProperty,
	reactiveTag
);

test("@property renders by default", async () => {
	const element =
		document.createElement(
			reactiveTag
		) as ReactiveProperty;

	document.body.append(element);
	await Promise.resolve();

	expect(
		element.shadowRoot?.querySelector("span")
			?.textContent
	).toBe("0");

	element.setValue(42);
	await Promise.resolve();

	expect(
		element.shadowRoot?.querySelector("span")
			?.textContent
	).toBe("42");
});

class StaticProperty extends Component {
	renderCount = 0;

	@property({
		type: Number,
		reflect: false,
		render: false
	})
	value = 0;

	setValue(value: number) {
		this.value = value;
	}

	protected override render() {
		this.renderCount++;

		return html`
			<span>${this.value}</span>
		`;
	}
}

const staticTag =
	"ion-test-static-property";

Ion.create(
	StaticProperty,
	staticTag
);

test("@property can opt out of rendering", async () => {
	const element =
		document.createElement(
			staticTag
		) as StaticProperty;

	document.body.append(element);
	await Promise.resolve();

	expect(element.renderCount).toBe(1);

	element.setValue(42);
	await Promise.resolve();

	expect(element.renderCount).toBe(1);

	expect(
		element.shadowRoot?.querySelector("span")
			?.textContent
	).toBe("0");

	expect(element.value).toBe(42);
});

