import { afterEach, expect, test } from "vitest";
import { Component } from "../src/index.js";
import { Plugin } from "../src/plugin/index.js";

class TestPlugin extends Plugin {
	static createdCount = 0;
	static removedCount = 0;

	protected override created() {
		TestPlugin.createdCount++;
	}

	protected override removed() {
		TestPlugin.removedCount++;
	}
}

class PluginHost extends Component {
	rerender() {
		this.requestRender();
	}
}

PluginHost.use(TestPlugin);

const tag = "ion-test-plugin-lifecycle";

if (!customElements.get(tag)) {
	customElements.define(tag, PluginHost);
}

afterEach(() => {
	document.body.replaceChildren();
	TestPlugin.createdCount = 0;
	TestPlugin.removedCount = 0;
});

test("runs plugin lifecycle exactly once per connection", async () => {
	const element = document.createElement(tag) as PluginHost;

	document.body.append(element);
	await Promise.resolve();

	expect(TestPlugin.createdCount).toBe(1);

	element.rerender();
	await Promise.resolve();

	expect(TestPlugin.createdCount).toBe(1);

	element.remove();
	await Promise.resolve();

	expect(TestPlugin.removedCount).toBe(1);

	document.body.append(element);
	await Promise.resolve();

	expect(TestPlugin.createdCount).toBe(2);
});