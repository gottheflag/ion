import { afterEach, expect, test } from "vitest";
import { Component } from "../src/index.js";
import { html } from "../src/template/index.js";

class TestComponent extends Component {
	createdCount = 0;
	readyCount = 0;

	removedCount = 0;
	clickCount = 0;

	protected override created() {
		this.createdCount++;

		this.on("click", () => {
			this.clickCount++;
		});
	}

	protected override removed() {
		this.removedCount++;
	}

	protected override ready() {
		this.readyCount++;
	}
}

const tag = "ion-test-lifecycle";

if (!customElements.get(tag)) {
	customElements.define(tag, TestComponent);
}

afterEach(() => {
	document.body.replaceChildren();
});

test("runs the basic component lifecycle", async () => {
	const element = document.createElement(tag) as TestComponent;

	document.body.append(element);

	await Promise.resolve();

	expect(element.createdCount).toBe(1);
	expect(element.readyCount).toBe(1);
});

test("treats a same-tick DOM move as one connection", async () => {
	const first = document.createElement("div");
	const second = document.createElement("div");
	const element = document.createElement(tag) as TestComponent;

	document.body.append(first, second);
	first.append(element);

	await Promise.resolve();

	second.append(element);

	await Promise.resolve();

	expect(element.createdCount).toBe(1);
	expect(element.removedCount).toBe(0);
});

test("tears down and restores owned listeners across a real reconnect", async () => {
	const element = document.createElement(tag) as TestComponent;

	document.body.append(element);
	await Promise.resolve();

	element.click();
	expect(element.clickCount).toBe(1);

	element.remove();
	await Promise.resolve();

	element.click();
	expect(element.clickCount).toBe(1);
	expect(element.removedCount).toBe(1);

	document.body.append(element);
	await Promise.resolve();

	element.click();

	expect(element.clickCount).toBe(2);
	expect(element.createdCount).toBe(2);
});

class RenderComponent extends Component {
	renderCount = 0;
	readyCount = 0;

	queueRender() {
		this.requestRender();
	}

	protected override render() {
		this.renderCount++;

		return html`
			<span>${this.renderCount}</span>
		`;
	}

	protected override ready() {
		this.readyCount++;
	}
}

const renderTag = "ion-test-render-scheduling";

if (!customElements.get(renderTag)) {
	customElements.define(
		renderTag,
		RenderComponent
	);
}

test("does not complete a queued render after detaching", async () => {
	const element =
		document.createElement(renderTag) as RenderComponent;

	document.body.append(element);

	element.remove();

	await Promise.resolve();

	expect(element.renderCount).toBe(0);
	expect(element.readyCount).toBe(0);
});

test("does not complete a queued render after detaching", async () => {
	const element =
		document.createElement(renderTag) as RenderComponent;

	document.body.append(element);

	element.remove();

	await Promise.resolve();

	expect(element.renderCount).toBe(0);
	expect(element.readyCount).toBe(0);
});

test("renders once after a real reconnect", async () => {
	const element =
		document.createElement(renderTag) as RenderComponent;

	document.body.append(element);
	await Promise.resolve();

	expect(element.renderCount).toBe(1);

	element.remove();
	await Promise.resolve();

	element.queueRender();
	element.queueRender();

	await Promise.resolve();

	expect(element.renderCount).toBe(1);

	document.body.append(element);
	await Promise.resolve();

	expect(element.renderCount).toBe(2);
});

test("performs the first render in the connection microtask", async () => {
	const element =
		document.createElement(renderTag) as RenderComponent;

	document.body.append(element);

	expect(element.renderCount).toBe(0);
	expect(element.shadowRoot?.textContent).toBe("");

	await Promise.resolve();

	expect(element.renderCount).toBe(1);

	expect(
		element.shadowRoot?.querySelector("span")?.textContent
	).toBe("1");
});