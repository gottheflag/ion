import { expect, test } from "vitest";

import {
	commitTemplate,
	html
} from "../src/template/index.js";

function render(
	result: ReturnType<typeof html>
): ShadowRoot {
	const host = document.createElement("div");
	const root = host.attachShadow({ mode: "open" });

	commitTemplate(result, root);

	return root;
}

test("renders interpolated markup as text", () => {
	const payload =
		`<img src=x onerror="alert(1)">`;

	const root = render(html`
		<p>${payload}</p>
	`);

	expect(root.querySelector("img"))
		.toBeNull();

	expect(root.querySelector("p")?.textContent)
		.toBe(payload);
});

test("does not create script elements from interpolation", () => {
	const payload =
		`<script>alert("xss")</script>`;

	const root = render(html`
		<div>${payload}</div>
	`);

	expect(root.querySelector("script"))
		.toBeNull();

	expect(root.querySelector("div")?.textContent)
		.toBe(payload);
});

test("prevents interpolation from breaking out of quoted attributes", () => {
	const payload =
		`"><img src=x onerror="alert(1)">`;

	const root = render(html`
		<div title="${payload}">
			safe
		</div>
	`);

	const element =
		root.querySelector("div")!;

	expect(root.querySelector("img"))
		.toBeNull();

	expect(element.getAttribute("title"))
		.toBe(payload);
});

test("escapes values inside nested templates", () => {
	const payload =
		`<svg onload="alert(1)"></svg>`;

	const root = render(html`
		${html`
			<section>
				${payload}
			</section>
		`}
	`);

	expect(root.querySelector("svg"))
		.toBeNull();

	expect(root.querySelector("section")?.textContent)
		.toContain(payload);
});