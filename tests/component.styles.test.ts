import {
	expect,
	test
} from "vitest";

import { Component } from "../src/index.js";

class FirstLevelStyled extends Component {
	protected static override styles = `
		${super.styles}

		:host {
			display: block;
		}
	`;

	static styleSource() {
		return this.styles;
	}
}

test("base styles compose without undefined", () => {
	expect(
		FirstLevelStyled.styleSource()
	).not.toContain("undefined");
});

class StyledBase extends Component {
	protected static override styles = `
		:host {
			display: block;
		}
	`;
}

class StyledChild extends StyledBase {
	protected static override styles = `
		${super.styles}

		span {
			font-weight: bold;
		}
	`;
}

const childTag = "ion-test-styled-child";

if (!customElements.get(childTag)) {
	customElements.define(
		childTag,
		StyledChild
	);
}

test("inherits parent style text", () => {
	const element =
		document.createElement(childTag) as StyledChild;

	const sheet =
		element.shadowRoot!
			.adoptedStyleSheets[0];

	expect(sheet.cssRules.length).toBe(2);

	expect(
		Array.from(sheet.cssRules)
			.map(rule => rule.cssText)
			.join("\n")
	).toContain("font-weight: bold");
});

test("reuses parsed stylesheets across instances", () => {
	const first =
		document.createElement(childTag) as StyledChild;

	const second =
		document.createElement(childTag) as StyledChild;

	const firstSheet =
		first.shadowRoot!
			.adoptedStyleSheets[0];

	const secondSheet =
		second.shadowRoot!
			.adoptedStyleSheets[0];

	expect(secondSheet).toBe(firstSheet);
});

test("creates document-local stylesheets after adoption", () => {
	const iframe =
		document.createElement("iframe");

	document.body.append(iframe);

	try {
		const element =
			document.createElement(
				childTag
			) as StyledChild;

		const originalSheet =
			element.shadowRoot!
				.adoptedStyleSheets[0];

		const targetDocument =
			iframe.contentDocument!;

		targetDocument.body.append(
			element
		);

		const adoptedSheet =
			element.shadowRoot!
				.adoptedStyleSheets[0];

		expect(adoptedSheet)
			.not.toBe(originalSheet);

		expect(
			Array.from(
				adoptedSheet.cssRules
			)
				.map(
					rule =>
						rule.cssText
				)
				.join("\n")
		).toContain(
			"font-weight: bold"
		);
	} finally {
		iframe.remove();
	}
});

const sharedSheet =
	new CSSStyleSheet();

sharedSheet.replaceSync(`
	:host {
		color: red;
	}
`);

class SheetStyled extends Component {
	protected static override styles =
		sharedSheet;
}

const sheetTag =
	"ion-test-sheet-styled";

if (!customElements.get(sheetTag)) {
	customElements.define(
		sheetTag,
		SheetStyled
	);
}

test("keeps compatible supplied sheets and clones them across documents", () => {
	const element =
		document.createElement(
			sheetTag
		) as SheetStyled;

	expect(
		element.shadowRoot!
			.adoptedStyleSheets[0]
	).toBe(sharedSheet);

	const iframe =
		document.createElement("iframe");

	document.body.append(iframe);

	try {
		iframe.contentDocument!
			.body
			.append(element);

		const adoptedSheet =
			element.shadowRoot!
				.adoptedStyleSheets[0];

		expect(adoptedSheet)
			.not.toBe(sharedSheet);

		expect(
			adoptedSheet.cssRules[0]
				.cssText
		).toContain(
			"color: red"
		);
	} finally {
		iframe.remove();
	}
});
