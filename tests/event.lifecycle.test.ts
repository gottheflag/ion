import { afterEach, expect, test } from "vitest";
import { Component } from "../src/index.js";
import { on } from "../src/decorators/index.js";

declare global {
	interface HTMLElementEventMap {
		"ion:test-loaded": CustomEvent<{
			id: string;
			count: number;
		}>;
	}
}

class EventHost extends Component {
	decoratedCount = 0;
	externalCount = 0;

	@on("click")
	protected decoratedClick() {
		this.decoratedCount++;
	}

	listen(target: Window | Document | Element) {
		this.on(target, "click", () => {
			this.externalCount++;
		});
	}

	typedTargets() {
		this.on(window, "hashchange", (event, target) => {
			event.newURL;
			target.location.href;
		});

		this.on(document, "selectionchange", (event, target) => {
			event.type;
			target.getSelection();
		});
	}

	typedCustomEvents() {
		this.on("ion:test-loaded", event => {
			event.detail.id;
			event.detail.count;

			// @ts-expect-error custom event detail is strongly typed
			event.detail.missing;
		});

		this.emit("ion:test-loaded", {
			id: "abc",
			count: 3
		});

		// @ts-expect-error count must be a number
		this.emit("ion:test-loaded", { id: "abc", count: "wrong" });
	}
}

const tag = "ion-test-event-lifecycle";

if (!customElements.get(tag)) {
	customElements.define(tag, EventHost);
}

afterEach(() => {
	document.body.replaceChildren();
});

test("attaches explicit targets and cleans them up", async () => {
	const element = document.createElement(tag) as EventHost;
	const external = document.createElement("button");

	document.body.append(element, external);
	await Promise.resolve();

	element.listen(window);
	element.listen(document);
	element.listen(external);

	window.dispatchEvent(new MouseEvent("click", { bubbles: false }));
	document.dispatchEvent(new MouseEvent("click", { bubbles: false }));
	external.dispatchEvent(new MouseEvent("click", { bubbles: false }));

	expect(element.externalCount).toBe(3);

	element.remove();
	await Promise.resolve();

	window.dispatchEvent(new MouseEvent("click", { bubbles: false }));
	document.dispatchEvent(new MouseEvent("click", { bubbles: false }));
	external.dispatchEvent(new MouseEvent("click", { bubbles: false }));

	expect(element.externalCount).toBe(3);
});

test("@on restores its listener after reconnect", async () => {
	const element = document.createElement(tag) as EventHost;

	document.body.append(element);
	await Promise.resolve();

	element.click();

	expect(element.decoratedCount).toBe(1);

	element.remove();
	await Promise.resolve();

	document.body.append(element);
	await Promise.resolve();

	element.click();

	expect(element.decoratedCount).toBe(2);
});