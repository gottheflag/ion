import { expect, test } from "vitest";
import {
	commitTemplate,
	html
} from "../src/template/index.js";

function render(result: ReturnType<typeof html>): ShadowRoot {
	const host = document.createElement("div");
	const root = host.attachShadow({ mode: "open" });

	commitTemplate(result, root);

	return root;
}

test("renders supported primitive values intentionally", () => {
	const root = render(html`
		${"hello"}
		${42}
		${10n}
		${true}
		${false}
		${null}
		${undefined}
	`);

	expect(root.textContent?.replace(/\s/g, ""))
		.toBe("hello4210");
});

test("supports nested templates and collections", () => {
	const root = render(html`
		<ul>
			${[
			html`<li>one</li>`,
			[
				html`<li>two</li>`,
				html`<li>three</li>`
			]
		]}
		</ul>
	`);

	expect(
		Array.from(root.querySelectorAll("li"))
			.map(element => element.textContent)
	).toEqual([
		"one",
		"two",
		"three"
	]);
});

test("rejects unsupported values at runtime", () => {
	expect(() => {
		render(html`${({ value: 1 } as any)}`);
	}).toThrow(TypeError);

	expect(() => {
		render(html`${(() => "bad") as any}`);
	}).toThrow(TypeError);

	expect(() => {
		render(html`${Symbol("bad") as any}`);
	}).toThrow(TypeError);
});

test("rejects unsupported values at compile time", () => {
	if (false) {
		// @ts-expect-error plain objects are not template values
		html`${{ value: 1 }}`;

		// @ts-expect-error functions are not template values
		html`${() => "bad"}`;

		// @ts-expect-error symbols are not template values
		html`${Symbol("bad")}`;

		// @ts-expect-error arbitrary DOM nodes are not template values
		html`${document.createElement("span")}`;
	}
});