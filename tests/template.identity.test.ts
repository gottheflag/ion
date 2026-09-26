import {
	afterEach,
	expect,
	test
} from "vitest";

import { Component } from "../src/index.js";
import {
	commitTemplate,
	html
} from "../src/template/index.js";

class IdentityChild extends HTMLElement {
	internalState = 0;

	connectedCount = 0;
	disconnectedCount = 0;

	connectedCallback() {
		this.connectedCount++;
	}

	disconnectedCallback() {
		this.disconnectedCount++;
	}
}

const childTag = "ion-test-identity-child";

if (!customElements.get(childTag)) {
	customElements.define(childTag, IdentityChild);
}

afterEach(() => {
	document.body.replaceChildren();
});

test("preserves unchanged custom-element identity", () => {
	const host = document.createElement("div");
	const root = host.attachShadow({ mode: "open" });

	document.body.append(host);

	commitTemplate(
		html`
			<ion-test-identity-child></ion-test-identity-child>
			<span>${1}</span>
		`,
		root
	);

	const first =
		root.querySelector(childTag) as IdentityChild;

	first.internalState = 42;

	commitTemplate(
		html`
			<ion-test-identity-child></ion-test-identity-child>
			<span>${2}</span>
		`,
		root
	);

	const second =
		root.querySelector(childTag) as IdentityChild;

	expect(second).toBe(first);
	expect(second.internalState).toBe(42);
	expect(second.connectedCount).toBe(1);
	expect(second.disconnectedCount).toBe(0);

	expect(root.querySelector("span")?.textContent)
		.toBe("2");
});

class IdentityParent extends Component {
	count = 0;

	bump() {
		this.count++;
		this.requestRender();
	}

	protected render() {
		return html`
			<ion-test-identity-child></ion-test-identity-child>
			<span>${this.count}</span>
		`;
	}
}

const parentTag = "ion-test-identity-parent";

if (!customElements.get(parentTag)) {
	customElements.define(parentTag, IdentityParent);
}

test("unrelated parent updates preserve child components", async () => {
	const parent =
		document.createElement(parentTag) as IdentityParent;

	document.body.append(parent);
	await Promise.resolve();

	const first =
		parent.shadowRoot?.querySelector(childTag) as IdentityChild;

	first.internalState = 99;

	parent.bump();
	await Promise.resolve();

	const second =
		parent.shadowRoot?.querySelector(childTag) as IdentityChild;

	expect(second).toBe(first);
	expect(second.internalState).toBe(99);
	expect(second.connectedCount).toBe(1);
	expect(second.disconnectedCount).toBe(0);

	expect(
		parent.shadowRoot?.querySelector("span")?.textContent
	).toBe("1");
});

test("preserves focus, selection and live input state", () => {
	const host = document.createElement("div");
	const root = host.attachShadow({ mode: "open" });

	document.body.append(host);

	commitTemplate(
		html`
			<input value="abcdef">
			<span>${1}</span>
		`,
		root
	);

	const input =
		root.querySelector("input") as HTMLInputElement;

	input.value = "user changed this";
	input.focus();
	input.setSelectionRange(2, 4);

	commitTemplate(
		html`
			<input value="abcdef">
			<span>${2}</span>
		`,
		root
	);

	const after =
		root.querySelector("input") as HTMLInputElement;

	expect(after).toBe(input);
	expect(root.activeElement).toBe(input);

	expect(input.selectionStart).toBe(2);
	expect(input.selectionEnd).toBe(4);

	expect(input.value).toBe("user changed this");
});

test("patches attributes without replacing the element", () => {
	const host = document.createElement("div");
	const root = host.attachShadow({ mode: "open" });

	commitTemplate(
		html`
			<button
				disabled
				data-mode="old"
			>
				Save
			</button>
		`,
		root
	);

	const before =
		root.querySelector("button")!;

	commitTemplate(
		html`
			<button
				data-mode="new"
				aria-label="Save"
			>
				Save
			</button>
		`,
		root
	);

	const after =
		root.querySelector("button")!;

	expect(after).toBe(before);

	expect(after.hasAttribute("disabled"))
		.toBe(false);

	expect(after.getAttribute("data-mode"))
		.toBe("new");

	expect(after.getAttribute("aria-label"))
		.toBe("Save");
});

class ReplacementChild extends HTMLElement { }

const replacementTag =
	"ion-test-replacement-child";

if (!customElements.get(replacementTag)) {
	customElements.define(
		replacementTag,
		ReplacementChild
	);
}

test("replaces genuinely different custom elements", () => {
	const host = document.createElement("div");
	const root = host.attachShadow({ mode: "open" });

	document.body.append(host);

	commitTemplate(
		html`
			<ion-test-identity-child></ion-test-identity-child>
		`,
		root
	);

	const before =
		root.firstElementChild;

	commitTemplate(
		html`
			<ion-test-replacement-child></ion-test-replacement-child>
		`,
		root
	);

	const after =
		root.firstElementChild;

	expect(after).not.toBe(before);
	expect(after?.localName).toBe(replacementTag);
});